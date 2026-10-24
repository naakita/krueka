// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Titanteo Security Lab phase 29. Original 0x Tempo Settler, local Foundry EVM only.
// Synthetic TIP-20, address registry and receive-policy responses; no RPC or live calls.
import {Test} from "@forge-std/Test.sol";
import {IERC20} from "@forge-std/interfaces/IERC20.sol";
import {MockERC20} from "@solmate/test/utils/mocks/MockERC20.sol";
import {TempoSettler} from "src/chains/Tempo/TakerSubmitted.sol";
import {ITempoAddressRegistry, ITempoReceivePolicy} from "src/chains/Tempo/BlockTempoSystemContracts.sol";
import {ISettlerBase} from "src/interfaces/ISettlerBase.sol";
import {ReceivePolicyBlocked} from "src/core/SettlerErrors.sol";

contract TitanteoTempoResolvedAliasPolicyTest is Test {
    address constant TIP20 = 0x20c0000000000000000000000000000000000029;
    address constant ADDRESS_REGISTRY = 0xfDC0000000000000000000000000000000000000;
    address constant POLICY_REGISTRY = 0x403c000000000000000000000000000000000000;
    TempoSettler internal settler;
    MockERC20 internal tip20;
    address internal recipient;
    address internal resolved;

    function setUp() public {
        vm.chainId(31337);
        settler = new TempoSettler(bytes20(0));
        MockERC20 template = new MockERC20("Local TIP20", "TIP", 18);
        vm.etch(TIP20, address(template).code);
        tip20 = MockERC20(TIP20);
        recipient = makeAddr("alias-original");
        resolved = makeAddr("alias-resolved");
        // Keep all system behavior strictly synthetic and inside this ephemeral EVM.
        vm.etch(ADDRESS_REGISTRY, hex"60006000fd");
        vm.etch(POLICY_REGISTRY, hex"60006000fd");
        tip20.mint(address(settler), 1 ether);
    }

    function _resolve(address destination) internal {
        vm.mockCall(
            ADDRESS_REGISTRY,
            abi.encodeCall(ITempoAddressRegistry.resolveRecipient, (recipient)),
            abi.encode(destination)
        );
    }

    function _policy(address destination, bool allowed) internal {
        vm.mockCall(
            POLICY_REGISTRY,
            abi.encodeCall(ITempoReceivePolicy.validateReceivePolicy,
                (IERC20(TIP20), address(settler), destination)),
            abi.encode(allowed, uint8(allowed ? 0 : 1))
        );
    }

    function _settle(address destination, IERC20 token) internal {
        settler.execute(
            ISettlerBase.AllowedSlippage(payable(destination), token, 1 ether),
            new bytes[](0),
            bytes32(0)
        );
    }

    function testRejectsResolvedAliasEvenWhenOriginalAllowed() public {
        _resolve(resolved);
        _policy(recipient, true);
        _policy(resolved, false);
        vm.expectCall(
            POLICY_REGISTRY,
            abi.encodeCall(ITempoReceivePolicy.validateReceivePolicy,
                (IERC20(TIP20), address(settler), resolved))
        );
        vm.expectRevert(abi.encodeWithSelector(ReceivePolicyBlocked.selector, recipient));
        _settle(recipient, IERC20(TIP20));
        assertEq(tip20.balanceOf(recipient), 0, "alias incorrectly paid");
        assertEq(tip20.balanceOf(address(settler)), 1 ether, "failed transfer not atomic");
    }

    function testAllowsAliasOnlyWhenResolvedPolicyAllows() public {
        _resolve(resolved);
        _policy(recipient, false);
        _policy(resolved, true);
        vm.expectCall(
            POLICY_REGISTRY,
            abi.encodeCall(ITempoReceivePolicy.validateReceivePolicy,
                (IERC20(TIP20), address(settler), resolved))
        );
        _settle(recipient, IERC20(TIP20));
        assertEq(tip20.balanceOf(recipient), 1 ether, "authorized alias did not receive payout");
        assertEq(tip20.balanceOf(address(settler)), 0);
    }

    function testNonTIP20PayoutSkipsTIP1028Policy() public {
        MockERC20 ordinary = new MockERC20("ordinary", "ORD", 18);
        ordinary.mint(address(settler), 1 ether);
        _settle(recipient, IERC20(address(ordinary)));
        assertEq(ordinary.balanceOf(recipient), 1 ether);
    }

    function testSelfTIP20PayoutSkipsTIP1028Policy() public {
        _settle(address(settler), IERC20(TIP20));
        assertEq(tip20.balanceOf(address(settler)), 1 ether);
    }

    function testFuzz_ResolvedAliasDenied(address alternate) public {
        vm.assume(alternate != address(0) && alternate != recipient && alternate != address(settler));
        _resolve(alternate);
        _policy(recipient, true);
        _policy(alternate, false);
        vm.expectRevert(abi.encodeWithSelector(ReceivePolicyBlocked.selector, recipient));
        _settle(recipient, IERC20(TIP20));
        assertEq(tip20.balanceOf(recipient), 0);
    }
}
