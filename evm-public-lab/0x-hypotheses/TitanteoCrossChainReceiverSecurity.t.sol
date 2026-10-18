// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Titanteo — independent offline authorization checks on original 0x source.
// No deployed contracts, no keys, no external RPC, no user assets.
import {CrossChainReceiverFactoryTest} from "test/unit/CrossChainReceiverFactory.t.sol";
import {ICrossChainReceiverFactory} from "src/interfaces/ICrossChainReceiverFactory.sol";
import {IMultiCall} from "src/multicall/MultiCallContext.sol";

contract TitanteoCrossChainReceiverSecurity is CrossChainReceiverFactoryTest {
    bytes4 private constant VALID = 0x1626ba7e;
    bytes4 private constant INVALID = 0xffffffff;

    // Signature leaves must commit to both owner and chain context.
    function testFuzz_NewWrongOwnerCannotClaimMerkleRoot(bytes32 action) public {
        (ICrossChainReceiverFactory proxy, address owner) = _deployProxy(action);
        bytes32[] memory emptyProof = new bytes32[](0);
        assertEq(proxy.isValidSignature(action, abi.encode(owner, emptyProof)), VALID);
        address foreign = makeAddr("unrelated-signer");
        assertTrue(foreign != owner);
        assertEq(proxy.isValidSignature(action, abi.encode(foreign, emptyProof)), INVALID);
    }

    function testFuzz_NewMerkleSignatureIsChainBound(bytes32 action) public {
        (ICrossChainReceiverFactory proxy, address owner) = _deployProxy(action);
        bytes32[] memory emptyProof = new bytes32[](0);
        bytes memory signature = abi.encode(owner, emptyProof);
        assertEq(proxy.isValidSignature(action, signature), VALID, "baseline owner proof rejected");
        uint256 originalChain = block.chainid;
        vm.chainId(originalChain + 1);
        assertEq(proxy.isValidSignature(action, signature), INVALID, "proof was accepted on a different chain");
        vm.chainId(originalChain);
        assertEq(proxy.isValidSignature(action, signature), VALID, "restored chain proof unexpectedly rejected");
    }

    function testFuzz_NewNonOwnerCannotTakeProxyEther(uint64 amountRaw) public {
        uint256 amount = 1 + uint256(amountRaw) % 1e15;
        (ICrossChainReceiverFactory proxy, address owner) = _deployProxy(bytes32(amount));
        vm.deal(address(proxy), amount);
        address attacker = makeAddr("unrelated-recipient");
        uint256 attackerBefore = attacker.balance;
        vm.prank(attacker);
        vm.expectRevert();
        proxy.call(payable(attacker), amount, "");
        assertEq(attacker.balance, attackerBefore);
        assertEq(address(proxy).balance, amount, "unauthorized debit");
        // Positive control: the recognized owner is allowed to call a payable receiver.
        vm.prank(owner);
        proxy.call(payable(address(this)), amount, "");
        assertEq(address(proxy).balance, 0, "owner unable to move owned funds");
    }

    function testFuzz_NewNonOwnerCannotCleanupProxy(uint64 amountRaw) public {
        uint256 amount = 1 + uint256(amountRaw) % 1e15;
        (ICrossChainReceiverFactory proxy, address owner) = _deployProxy(bytes32(amount));
        vm.deal(address(proxy), amount);
        address attacker = makeAddr("unrelated-cleanup-beneficiary");
        vm.prank(attacker);
        vm.expectRevert();
        proxy.cleanup(payable(attacker));
        assertEq(address(proxy).balance, amount, "unauthorized cleanup drained proxy");
        assertEq(attacker.balance, 0);
        assertEq(proxy.owner(), owner, "attacker changed owner");
    }

    function testFuzz_NewExpiredMetaTxRejectedBeforeExecution(uint64 expiredBy) public {
        (ICrossChainReceiverFactory proxy,) = _deployProxy(bytes32(uint256(expiredBy)));
        vm.warp(1_800_000_000);
        IMultiCall.Call[] memory empty = new IMultiCall.Call[](0);
        vm.expectRevert();
        proxy.metaTx(empty, 0, 0, block.timestamp - 1 - uint256(expiredBy % 1000), "");
        assertEq(proxy.owner() != address(0), true);
    }
}
