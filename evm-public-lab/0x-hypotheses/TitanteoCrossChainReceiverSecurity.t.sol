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
        assertEq(block.chainid, originalChain, "Foundry chain id restoration failed");
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
    function testFuzz_NewMerkleSignatureCannotAuthorizeDifferentAction(bytes32 action, bytes32 other) public {
        vm.assume(action != other);
        (ICrossChainReceiverFactory proxy, address owner) = _deployProxy(action);
        bytes32[] memory emptyProof = new bytes32[](0);
        bytes memory signature = abi.encode(owner, emptyProof);
        assertEq(proxy.isValidSignature(action, signature), VALID, "positive action rejected");
        assertEq(proxy.isValidSignature(other, signature), INVALID, "different action unexpectedly authorized");
    }

    function testFuzz_NewOnlyProxyFunctionsCannotBeCalledOnFactory(uint64 amount) public {
        address caller = makeAddr("external-proxy-attacker");
        vm.prank(caller);
        vm.expectRevert();
        factory.approvePermit2(WETH, 1 + uint256(amount));
        vm.prank(caller);
        vm.expectRevert();
        factory.setOwner(caller);
    }

    // Two-step ownership: pending authority must not become spending authority
    // until acceptance; afterwards, the previous owner loses spending rights.
    function testFuzz_NewPendingOwnerCannotSpendBeforeAcceptance(uint80 raw) public {
        uint256 amount = 1 + uint256(raw) % 1e15;
        (ICrossChainReceiverFactory proxy, address initialOwner) = _deployProxy(keccak256(abi.encode(raw, "transfer")));
        address successor = makeAddr("titanteo-successor");
        address outsider = makeAddr("titanteo-outsider");
        vm.deal(address(proxy), amount);
        vm.prank(initialOwner);
        assertTrue(proxy.transferOwnership(successor), "owner could not schedule transfer");

        vm.prank(successor);
        vm.expectRevert();
        proxy.call(payable(successor), amount, "");
        assertEq(address(proxy).balance, amount, "pending owner spent funds");

        vm.prank(outsider);
        (bool outsiderAccepted,) = address(proxy).call(abi.encodeWithSignature("acceptOwnership()"));
        assertFalse(outsiderAccepted, "outsider accepted ownership");

        vm.prank(successor);
        (bool accepted,) = address(proxy).call(abi.encodeWithSignature("acceptOwnership()"));
        assertTrue(accepted, "pending owner could not accept");
        assertEq(proxy.owner(), successor, "owner was not updated");

        vm.prank(initialOwner);
        vm.expectRevert();
        proxy.call(payable(initialOwner), amount, "");
        assertEq(address(proxy).balance, amount, "former owner spent funds");

        vm.prank(successor);
        proxy.call(payable(successor), amount, "");
        assertEq(successor.balance, amount, "new owner did not receive balance");
        assertEq(address(proxy).balance, 0, "proxy funds not moved");
    }

    function testFuzz_NewMerkleProofCannotCrossProxyOwners(bytes32 action) public {
        uint256 firstKey = uint256(keccak256(abi.encode("titanteo-first-owner")));
        uint256 secondKey = uint256(keccak256(abi.encode("titanteo-second-owner")));
        (ICrossChainReceiverFactory one, address ownerOne) = _deployProxy(action, firstKey);
        (ICrossChainReceiverFactory two, address ownerTwo) = _deployProxy(action, secondKey);
        assertTrue(ownerOne != ownerTwo);
        bytes32[] memory noProof = new bytes32[](0);
        bytes memory firstProof = abi.encode(ownerOne, noProof);
        bytes memory secondProof = abi.encode(ownerTwo, noProof);
        assertEq(one.isValidSignature(action, firstProof), VALID, "first proxy rejected own leaf");
        assertEq(two.isValidSignature(action, secondProof), VALID, "second proxy rejected own leaf");
        assertEq(two.isValidSignature(action, firstProof), INVALID, "replayed owner leaf in second proxy");
        assertEq(one.isValidSignature(action, secondProof), INVALID, "replayed owner leaf in first proxy");
    }

    function testFuzz_NewRestrainedRelayerCannotBeReplaced(uint96 deadlineLowBits) public {
        (ICrossChainReceiverFactory proxy,) = _deployProxy(keccak256(abi.encode(deadlineLowBits, "relayer")));
        address authorizedRelayer = makeAddr("titanteo-listed-relayer");
        address unrelatedRelayer = makeAddr("titanteo-foreign-relayer");
        // Deadline's upper 160 bits bind the designated relayer.
        uint256 timestampPart = block.timestamp + 365 days + (uint256(deadlineLowBits) % 1 days);
        uint256 encodedDeadline = (uint256(uint160(authorizedRelayer)) << 96) | timestampPart;
        IMultiCall.Call[] memory empty = new IMultiCall.Call[](0);
        vm.prank(unrelatedRelayer);
        vm.expectRevert(bytes4(0x1e092104)); // PermissionDenied
        proxy.metaTx(empty, 0, 0, encodedDeadline, hex"");
    }


}
