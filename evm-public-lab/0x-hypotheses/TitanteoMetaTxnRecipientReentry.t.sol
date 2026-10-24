// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Titanteo: an isolated, authorized EVM regression test. No RPC or live assets.
// Hypothesis: an ETH recipient callback reenters executeMetaTxn with a second,
// independently signed Permit2 authorization while the first payer is active.
import {Test} from "@forge-std/Test.sol";
import {MockERC20} from "@solmate/test/utils/mocks/MockERC20.sol";
import {IERC20} from "@forge-std/interfaces/IERC20.sol";
import {ISignatureTransfer} from "@permit2/interfaces/ISignatureTransfer.sol";
import {BaseSettlerMetaTxn} from "src/chains/Base/MetaTxn.sol";
import {ISettlerActions} from "src/ISettlerActions.sol";
import {ISettlerBase} from "src/interfaces/ISettlerBase.sol";

interface ITitanteoPermit2Read {
    function DOMAIN_SEPARATOR() external view returns (bytes32);
    function nonceBitmap(address owner, uint256 wordPos) external view returns (uint256);
}

contract TitanteoReentryRecipient {
    address public target;
    bytes private payload;
    bool public nestedSucceeded;
    bytes4 public nestedError;
    uint256 public calls;

    function arm(address target_, bytes calldata payload_) external {
        target = target_;
        payload = payload_;
    }

    receive() external payable {
        calls++;
        (bool ok, bytes memory result) = target.call(payload);
        nestedSucceeded = ok;
        if (result.length >= 4) {
            nestedError = bytes4(result);
        }
    }
}

contract TitanteoMetaTxnRecipientReentryTest is Test {
    address private constant PERMIT2_ADDR = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    address private constant NATIVE = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    uint256 private constant ALICE_PK = 0xA11CE;
    uint256 private constant BOB_PK = 0xB0B;
    uint256 private constant AMOUNT = 5 ether;
    bytes32 private constant TOKEN_PERMISSIONS_TYPEHASH =
        keccak256("TokenPermissions(address token,uint256 amount)");
    bytes32 private constant FULL_WITNESS_TYPEHASH = keccak256(
        "PermitWitnessTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline,SlippageAndActions slippageAndActions)SlippageAndActions(address recipient,address buyToken,uint256 minAmountOut,bytes[] actions)TokenPermissions(address token,uint256 amount)"
    );
    bytes32 private constant SLIPPAGE_ACTIONS_TYPEHASH =
        keccak256("SlippageAndActions(address recipient,address buyToken,uint256 minAmountOut,bytes[] actions)");

    BaseSettlerMetaTxn private settler;
    MockERC20 private token;
    TitanteoReentryRecipient private receiver;
    address private alice;
    address private bob;

    function setUp() public {
        vm.chainId(31337);
        address template = deployCode("Permit2.sol:Permit2");
        vm.etch(PERMIT2_ADDR, template.code);
        settler = new BaseSettlerMetaTxn(bytes20(0));
        token = new MockERC20("Titanteo local", "TLOC", 18);
        receiver = new TitanteoReentryRecipient();
        alice = vm.addr(ALICE_PK);
        bob = vm.addr(BOB_PK);
        token.mint(alice, AMOUNT * 2);
        token.mint(bob, AMOUNT * 2);
        vm.prank(alice);
        token.approve(PERMIT2_ADDR, type(uint256).max);
        vm.prank(bob);
        token.approve(PERMIT2_ADDR, type(uint256).max);
        // Force Permit2 to recompute its EIP712 domain for the canonical
        // address after vm.etch of the original runtime.
        vm.chainId(31338);
    }

    function testRecipientReentryCannotSpendSecondSignersNonceOrChangePayer() public {
        (ISignatureTransfer.PermitTransferFrom memory alicePermit,
            bytes[] memory aliceActions) = _case(alice, 17, alice);
        (ISignatureTransfer.PermitTransferFrom memory bobPermit,
            bytes[] memory bobActions) = _case(bob, 29, address(settler));

        ISettlerBase.AllowedSlippage memory aliceSlippage = ISettlerBase.AllowedSlippage({
            recipient: payable(address(receiver)), buyToken: IERC20(NATIVE), minAmountOut: 1 ether
        });
        ISettlerBase.AllowedSlippage memory bobSlippage = ISettlerBase.AllowedSlippage({
            recipient: payable(bob), buyToken: IERC20(address(token)), minAmountOut: AMOUNT
        });

        bytes memory aliceSig = _sign(ALICE_PK, alicePermit, aliceActions, aliceSlippage);
        bytes memory bobSig = _sign(BOB_PK, bobPermit, bobActions, bobSlippage);
        bytes memory nested = abi.encodeCall(
            BaseSettlerMetaTxn.executeMetaTxn,
            (bobSlippage, bobActions, bytes32(0), bob, bobSig)
        );
        receiver.arm(address(settler), nested);
        vm.deal(address(settler), 1 ether);

        uint256 bobBefore = token.balanceOf(bob);
        settler.executeMetaTxn(aliceSlippage, aliceActions, bytes32(0), alice, aliceSig);

        assertEq(receiver.calls(), 1, "ETH recipient callback not exercised");
        assertFalse(receiver.nestedSucceeded(), "nested metaTx unexpectedly succeeded");
        assertEq(receiver.nestedError(), bytes4(0x7407c0f8), "not ReentrantPayer");
        assertEq(address(receiver).balance, 1 ether, "outer ETH payment failed");
        assertEq(_bitmap(alice), uint256(1) << 17, "outer nonce not consumed");
        assertEq(_bitmap(bob), 0, "nested call consumed unrelated nonce");
        assertEq(token.balanceOf(bob), bobBefore, "nested call moved unrelated tokens");
        assertEq(token.balanceOf(address(settler)), 0, "outer action stranded tokens");

        // Positive control: the second valid signature works after the
        // first execution has exited and the transient payer is cleared.
        settler.executeMetaTxn(bobSlippage, bobActions, bytes32(0), bob, bobSig);
        assertEq(_bitmap(bob), uint256(1) << 29, "valid follow-up did not consume nonce");
        assertEq(token.balanceOf(bob), bobBefore, "valid follow-up roundtrip failed");
    }

    function _case(address signer, uint256 nonce, address recipient) private view returns (
        ISignatureTransfer.PermitTransferFrom memory permit,
        bytes[] memory actions
    ) {
        signer; // Explicitly identify whose signature the caller will generate.
        permit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({token: address(token), amount: AMOUNT}),
            nonce: nonce,
            deadline: block.timestamp + 1 days
        });
        actions = new bytes[](1);
        actions[0] = abi.encodeCall(ISettlerActions.METATXN_TRANSFER_FROM, (recipient, permit));
    }

    function _sign(
        uint256 pk,
        ISignatureTransfer.PermitTransferFrom memory permit,
        bytes[] memory actions,
        ISettlerBase.AllowedSlippage memory slippage
    ) private returns (bytes memory) {
        bytes32[] memory hashes = new bytes32[](actions.length);
        for (uint256 i; i < actions.length; i++) hashes[i] = keccak256(actions[i]);
        bytes32 witness = keccak256(abi.encode(
            SLIPPAGE_ACTIONS_TYPEHASH, slippage.recipient, slippage.buyToken,
            slippage.minAmountOut, keccak256(abi.encodePacked(hashes))
        ));
        bytes32 tokenHash = keccak256(abi.encode(
            TOKEN_PERMISSIONS_TYPEHASH, permit.permitted.token, permit.permitted.amount
        ));
        bytes32 structHash = keccak256(abi.encode(
            FULL_WITNESS_TYPEHASH, tokenHash, address(settler), permit.nonce, permit.deadline, witness
        ));
        bytes32 digest = keccak256(abi.encodePacked(
            bytes2(0x1901), ITitanteoPermit2Read(PERMIT2_ADDR).DOMAIN_SEPARATOR(), structHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return bytes.concat(r, s, bytes1(v));
    }

    function _bitmap(address who) private view returns (uint256) {
        return ITitanteoPermit2Read(PERMIT2_ADDR).nonceBitmap(who, 0);
    }
}
