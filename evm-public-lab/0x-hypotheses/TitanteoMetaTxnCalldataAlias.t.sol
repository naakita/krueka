// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Titanteo Security Lab: real Permit2 bytecode at its canonical address in a
// disposable, isolated EVM. No RPC, no deployed-chain calls, no real tokens.
import {Test} from "@forge-std/Test.sol";
import {MockERC20} from "@solmate/test/utils/mocks/MockERC20.sol";
import {IERC20} from "@forge-std/interfaces/IERC20.sol";
import {ISignatureTransfer} from "@permit2/interfaces/ISignatureTransfer.sol";
import {BaseSettlerMetaTxn} from "src/chains/Base/MetaTxn.sol";
import {ISettlerActions} from "src/ISettlerActions.sol";
import {ISettlerBase} from "src/interfaces/ISettlerBase.sol";

interface ITitanteoPermit2State {
    function DOMAIN_SEPARATOR() external view returns (bytes32);
    function nonceBitmap(address owner, uint256 wordPos) external view returns (uint256);
}

contract TitanteoMetaTxnCalldataAliasTest is Test {
    address private constant PERMIT2_ADDR = 0x000000000022D473030F116dDEE9F6B43aC78BA3;
    uint256 private constant OWNER_PK = 0xA11CE;
    uint256 private constant NONCE = 17;
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
    address private owner;

    function setUp() public {
        vm.chainId(31337); // Settler's explicit local-constructor exception
        address template = deployCode("Permit2.sol:Permit2");
        vm.etch(PERMIT2_ADDR, template.code);
        settler = new BaseSettlerMetaTxn(bytes20(0));
        token = new MockERC20("Titanteo Local", "TLOC", 18);
        owner = vm.addr(OWNER_PK);
        token.mint(owner, AMOUNT * 4);
        vm.prank(owner);
        token.approve(PERMIT2_ADDR, type(uint256).max);
        // Permit2's 0.8.17 EIP712 implementation caches the template address
        // in an immutable. Changing chainId forces DOMAIN_SEPARATOR() to
        // recompute using the canonical address where we etched the bytecode.
        vm.chainId(31338);
        assertTrue(PERMIT2_ADDR.code.length > 0, "missing real Permit2 runtime");
        assertTrue(address(settler).code.length > 0, "missing Settler runtime");
    }

    function testValidSignatureConsumesNonceAndCannotReplay() public {
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        bytes memory sig = _sign(permit, actions, slippage, address(settler));
        uint256 beforeBalance = token.balanceOf(owner);
        _exec(actions, slippage, owner, sig, bytes32(0));
        assertEq(token.balanceOf(owner), beforeBalance, "round-trip changed owner balance");
        assertEq(_bitmap(owner), uint256(1) << NONCE, "nonce not consumed");
        vm.expectRevert();
        _exec(actions, slippage, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), uint256(1) << NONCE, "replay altered bitmap");
    }

    function testChangedSlippageRecipientRejectedBeforeNonceUse() public {
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        bytes memory sig = _sign(permit, actions, slippage, address(settler));
        // Solidity memory structs alias on assignment; make a true independent copy.
        ISettlerBase.AllowedSlippage memory forged = ISettlerBase.AllowedSlippage({
            recipient: payable(makeAddr("unapproved-recipient")),
            buyToken: slippage.buyToken,
            minAmountOut: slippage.minAmountOut
        });
        vm.expectRevert();
        _exec(actions, forged, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), 0, "bad witness burned nonce");
        assertEq(token.balanceOf(forged.recipient), 0, "unapproved recipient got funds");
        _exec(actions, slippage, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), uint256(1) << NONCE);
    }

    function testDifferentSettlerContractCannotReuseSignature() public {
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        bytes memory sig = _sign(permit, actions, slippage, address(settler));
        vm.chainId(31337); // deployment-only local exception in SettlerBase
        BaseSettlerMetaTxn other = new BaseSettlerMetaTxn(bytes20(0));
        vm.chainId(31338); // restore Permit2 EIP712 domain for the test
        vm.expectRevert();
        other.executeMetaTxn(slippage, actions, bytes32(0), owner, sig);
        assertEq(_bitmap(owner), 0, "wrong spender burned nonce");
        _exec(actions, slippage, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), uint256(1) << NONCE);
    }

    function testDifferentSignerCannotUseSignature() public {
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        bytes memory sig = _sign(permit, actions, slippage, address(settler));
        vm.expectRevert();
        _exec(actions, slippage, makeAddr("not-owner"), sig, bytes32(0));
        assertEq(_bitmap(owner), 0, "wrong signer burned owner's nonce");
        _exec(actions, slippage, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), uint256(1) << NONCE);
    }

    function testRevertedFinalSlippageRollsBackPermit2Nonce() public {
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        uint256 beforeBalance = token.balanceOf(owner);
        slippage.minAmountOut = AMOUNT + 1;
        bytes memory sigForFailingSlippage = _sign(permit, actions, slippage, address(settler));
        vm.expectRevert();
        _exec(actions, slippage, owner, sigForFailingSlippage, bytes32(0));
        assertEq(_bitmap(owner), 0, "reverted transaction consumed nonce");
        assertEq(token.balanceOf(owner), beforeBalance, "reverted transfer changed balance");
        slippage.minAmountOut = AMOUNT;
        bytes memory validSig = _sign(permit, actions, slippage, address(settler));
        _exec(actions, slippage, owner, validSig, bytes32(0));
        assertEq(_bitmap(owner), uint256(1) << NONCE);
    }

    function testChangedChainIdCannotReplaySignature() public {
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        bytes memory sig = _sign(permit, actions, slippage, address(settler));
        vm.chainId(31339);
        vm.expectRevert();
        _exec(actions, slippage, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), 0, "cross-chain replay consumed nonce");
        vm.chainId(31338);
        _exec(actions, slippage, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), uint256(1) << NONCE);
    }

    function testFuzz_ChangedActionsCannotReuseWitness(bytes4 selector) public {
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        bytes memory sig = _sign(permit, actions, slippage, address(settler));
        bytes[] memory forged = new bytes[](2);
        forged[0] = actions[0];
        forged[1] = abi.encodePacked(selector);
        vm.expectRevert();
        _exec(forged, slippage, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), 0, "changed actions consumed nonce");
        _exec(actions, slippage, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), uint256(1) << NONCE);
    }

    function testFuzz_ChangedPermitNonceCannotReuseSignature(uint8 alternate) public {
        vm.assume(alternate != NONCE);
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        bytes memory sig = _sign(permit, actions, slippage, address(settler));
        permit.nonce = alternate;
        bytes[] memory forged = new bytes[](1);
        forged[0] = abi.encodeCall(ISettlerActions.METATXN_TRANSFER_FROM, (address(settler), permit));
        vm.expectRevert();
        _exec(forged, slippage, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), 0, "altered nonce consumed original nonce");
        _exec(actions, slippage, owner, sig, bytes32(0));
        assertEq(_bitmap(owner), uint256(1) << NONCE);
    }


    // Phase 27: unsigned ABI offset aliasing should never bypass a Permit2 witness.
    // The only mutations are made to the caller's calldata; upstream source is untouched.
    function testMalformedArrayOffsetCannotConsumeNonce() public {
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        bytes memory sig = _sign(permit, actions, slippage, address(settler));
        bytes memory original = _raw(actions, slippage, sig);
        bytes memory forged = _raw(actions, slippage, sig);
        uint256 arrayStart = 4 + _word(forged, 4 + 3 * 32);
        // bytes[] head offset zero aliases its own offset word (not the signed bytes).
        _putWord(forged, arrayStart + 32, 0);
        (bool ok,) = address(settler).call(forged);
        assertFalse(ok, "unsigned offset alias accepted");
        assertEq(_bitmap(owner), 0, "bad offset consumed nonce");
        assertEq(token.balanceOf(owner), AMOUNT * 4, "bad offset spent funds");
        (ok,) = address(settler).call(original);
        assertTrue(ok, "valid signed control failed");
        assertEq(_bitmap(owner), uint256(1) << NONCE);
    }

    function testTruncatedActionLengthCannotConsumeNonce() public {
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        bytes memory sig = _sign(permit, actions, slippage, address(settler));
        bytes memory forged = _raw(actions, slippage, sig);
        uint256 arrayStart = 4 + _word(forged, 4 + 3 * 32);
        uint256 firstOffset = _word(forged, arrayStart + 32);
        uint256 elementLengthAt = arrayStart + 32 + firstOffset;
        _putWord(forged, elementLengthAt, 3); // shorter than a 4-byte selector
        (bool ok,) = address(settler).call(forged);
        assertFalse(ok, "short unsigned action accepted");
        assertEq(_bitmap(owner), 0, "short action consumed nonce");
        (ok,) = address(settler).call(_raw(actions, slippage, sig));
        assertTrue(ok, "valid control failed");
        assertEq(_bitmap(owner), uint256(1) << NONCE);
    }

    function testSecondActionAliasedToFirstCannotBypassWitness() public {
        (ISignatureTransfer.PermitTransferFrom memory permit, bytes[] memory actions,
            ISettlerBase.AllowedSlippage memory slippage) = _case();
        bytes[] memory signedActions = new bytes[](2);
        signedActions[0] = actions[0];
        signedActions[1] = abi.encodeCall(
            ISettlerActions.POSITIVE_SLIPPAGE, (payable(owner), address(token), AMOUNT, 0, 0)
        );
        bytes memory sig = _sign(permit, signedActions, slippage, address(settler));
        bytes memory forged = _raw(signedActions, slippage, sig);
        uint256 arrayStart = 4 + _word(forged, 4 + 3 * 32);
        uint256 firstOffset = _word(forged, arrayStart + 32);
        // Point second bytes[] member to first; a relayer must not replace signed action #2.
        _putWord(forged, arrayStart + 64, firstOffset);
        (bool ok,) = address(settler).call(forged);
        assertFalse(ok, "aliased action bypassed witness");
        assertEq(_bitmap(owner), 0, "aliased action consumed nonce");
        (ok,) = address(settler).call(_raw(signedActions, slippage, sig));
        assertTrue(ok, "valid two-action signed control failed");
        assertEq(_bitmap(owner), uint256(1) << NONCE);
    }

    function _raw(bytes[] memory actions, ISettlerBase.AllowedSlippage memory slippage,
        bytes memory sig) private view returns (bytes memory) {
        return abi.encodeWithSelector(
            settler.executeMetaTxn.selector, slippage, actions, bytes32(0), owner, sig
        );
    }

    function _word(bytes memory data, uint256 offset) private pure returns (uint256 result) {
        require(offset + 32 <= data.length, "bad test offset");
        assembly ("memory-safe") { result := mload(add(add(data, 0x20), offset)) }
    }

    function _putWord(bytes memory data, uint256 offset, uint256 value) private pure {
        require(offset + 32 <= data.length, "bad test offset");
        assembly ("memory-safe") { mstore(add(add(data, 0x20), offset), value) }
    }
    function _case() private view returns (
        ISignatureTransfer.PermitTransferFrom memory permit,
        bytes[] memory actions,
        ISettlerBase.AllowedSlippage memory slippage
    ) {
        permit = ISignatureTransfer.PermitTransferFrom({
            permitted: ISignatureTransfer.TokenPermissions({token: address(token), amount: AMOUNT}),
            nonce: NONCE,
            deadline: block.timestamp + 1 days
        });
        actions = new bytes[](1);
        actions[0] = abi.encodeCall(ISettlerActions.METATXN_TRANSFER_FROM, (address(settler), permit));
        slippage = ISettlerBase.AllowedSlippage({
            recipient: payable(owner), buyToken: IERC20(address(token)), minAmountOut: AMOUNT
        });
    }

    function _sign(
        ISignatureTransfer.PermitTransferFrom memory permit,
        bytes[] memory actions,
        ISettlerBase.AllowedSlippage memory slippage,
        address spender
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
            FULL_WITNESS_TYPEHASH, tokenHash, spender, permit.nonce, permit.deadline, witness
        ));
        bytes32 digest = keccak256(abi.encodePacked(
            bytes2(0x1901), ITitanteoPermit2State(PERMIT2_ADDR).DOMAIN_SEPARATOR(), structHash
        ));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(OWNER_PK, digest);
        return bytes.concat(r, s, bytes1(v));
    }

    function _exec(
        bytes[] memory actions,
        ISettlerBase.AllowedSlippage memory slippage,
        address signer,
        bytes memory sig,
        bytes32 zid
    ) private {
        settler.executeMetaTxn(slippage, actions, zid, signer, sig);
    }

    function _bitmap(address who) private view returns (uint256) {
        return ITitanteoPermit2State(PERMIT2_ADDR).nonceBitmap(who, 0);
    }
}
