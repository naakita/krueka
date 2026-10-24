// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Titanteo phase 30: HyperEVM recipient-credit boundary for POSITIVE_SLIPPAGE.
// Runs only against unmodified pinned 0x Settler source in a disposable Foundry EVM.
// System addresses are synthetic local destinations, NOT deployed contracts.
import {Test} from "@forge-std/Test.sol";
import {IERC20} from "@forge-std/interfaces/IERC20.sol";
import {MockERC20} from "@solmate/test/utils/mocks/MockERC20.sol";
import {HyperEvmSettler} from "src/chains/HyperEvm/TakerSubmitted.sol";
import {ISettlerBase} from "src/interfaces/ISettlerBase.sol";
import {ISettlerActions} from "src/ISettlerActions.sol";
import {HyperCoreSystemAddress} from "src/core/SettlerErrors.sol";
import {ETH_ADDRESS} from "src/core/Constants.sol";

contract TitanteoHyperEvmSystemCreditTest is Test {
    address constant HYPE_CREDIT = 0x2222222222222222222222222222222222222222;
    uint160 constant TOKEN_CREDIT_PREFIX = 0x200000000000000000000000;
    HyperEvmSettler private settler;
    MockERC20 private token;
    address private taker;
    address private regularRecipient;

    function setUp() public {
        vm.chainId(31337);
        settler = new HyperEvmSettler(bytes20(0));
        token = new MockERC20("local-only token", "LOCAL", 18);
        taker = makeAddr("taker");
        regularRecipient = makeAddr("regular-recipient");
    }

    function _tokenCredit(uint64 index) private pure returns (address) {
        return address((TOKEN_CREDIT_PREFIX << 64) | uint160(index));
    }

    function _positiveSlippage(address destination, IERC20 asset) private {
        bytes[] memory actions = new bytes[](1);
        actions[0] = abi.encodeCall(
            ISettlerActions.POSITIVE_SLIPPAGE,
            (payable(destination), asset, uint256(0), uint256(1_000_000), uint256(1_000_000))
        );
        vm.prank(taker);
        settler.execute(
            ISettlerBase.AllowedSlippage(payable(taker), IERC20(address(0)), 0),
            actions,
            bytes32(0)
        );
    }

    function testRejectsNativeSystemCreditFundedBySettler() public {
        vm.deal(address(settler), 2 ether);
        vm.expectRevert(abi.encodeWithSelector(HyperCoreSystemAddress.selector, HYPE_CREDIT));
        _positiveSlippage(HYPE_CREDIT, IERC20(ETH_ADDRESS));
        assertEq(address(settler).balance, 2 ether, "revert must preserve original funds");
        assertEq(HYPE_CREDIT.balance, 0, "system destination must receive nothing");
    }

    function testRejectsTokenSystemCreditFundedBySettler() public {
        address destination = _tokenCredit(77);
        token.mint(address(settler), 2 ether);
        vm.expectRevert(abi.encodeWithSelector(HyperCoreSystemAddress.selector, destination));
        _positiveSlippage(destination, IERC20(address(token)));
        assertEq(token.balanceOf(address(settler)), 2 ether, "funds escaped on revert");
        assertEq(token.balanceOf(destination), 0, "system address credited");
    }

    function testAllowsOrdinaryRecipientAsControl() public {
        token.mint(address(settler), 2 ether);
        _positiveSlippage(regularRecipient, IERC20(address(token)));
        assertEq(token.balanceOf(regularRecipient), 2 ether, "legitimate payout blocked");
        assertEq(token.balanceOf(address(settler)), 0);
    }

    function testFuzz_RejectsTokenCreditForEveryIndex(uint64 index) public {
        address destination = _tokenCredit(index);
        token.mint(address(settler), 1 ether);
        vm.expectRevert(abi.encodeWithSelector(HyperCoreSystemAddress.selector, destination));
        _positiveSlippage(destination, IERC20(address(token)));
        assertEq(token.balanceOf(destination), 0);
    }
}
