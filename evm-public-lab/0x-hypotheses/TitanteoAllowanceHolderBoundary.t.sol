// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;
// Titanteo Security Lab: independent checks of the actual transient AllowanceHolder.
// Educational local-EVM tests only. No mainnet, no credentials, no real assets.
import {Test} from "@forge-std/Test.sol";
import {MockERC20} from "@solmate/test/utils/mocks/MockERC20.sol";
import {IAllowanceHolder} from "src/allowanceholder/IAllowanceHolder.sol";
import {AllowanceHolder} from "src/allowanceholder/AllowanceHolder.sol";
import {ConfusedDeputy} from "src/allowanceholder/AllowanceHolderBase.sol";

contract TitanteoLocalOperator {
    IAllowanceHolder internal immutable holder;
    constructor(IAllowanceHolder _holder) { holder = _holder; }
    function pull(address token, address owner, address recipient, uint256 amount) external {
        require(holder.transferFrom(token, owner, recipient, amount), "transfer was not acknowledged");
    }
    function pullAndRevert(address token, address owner, address recipient, uint256 amount) external {
        require(holder.transferFrom(token, owner, recipient, amount), "transfer failed");
        revert("SYNTHETIC_OPERATOR_ROLLBACK");
    }
    // Probe the ABI parser with an AUTHORIZED temporary grant active.
    // Rejected calls must not transfer any tokens.
    function probeDirtyActiveGrant(
        uint8 field, address token, address owner, address recipient, uint256 amount
    ) external {
        uint256 rawToken = uint256(uint160(token));
        uint256 rawOwner = uint256(uint160(owner));
        uint256 rawRecipient = uint256(uint160(recipient));
        if (field == 0) rawToken |= uint256(1) << 160;
        else if (field == 1) rawOwner |= uint256(1) << 160;
        else if (field == 2) rawRecipient |= uint256(1) << 160;
        else revert("invalid field");
        bytes memory malformed = abi.encodeWithSelector(
            IAllowanceHolder.transferFrom.selector, rawToken, rawOwner, rawRecipient, amount
        );
        (bool ok,) = address(holder).call(malformed);
        require(!ok, "DIRTY_ADDRESS_ACCEPTED_WITH_ACTIVE_GRANT");
    }
    function pullViaOther(TitanteoLocalOperator other, address token, address owner, address recipient, uint256 amount) external {
        other.pull(token, owner, recipient, amount);
    }
}

/// @notice Calls AllowanceHolder and probes residual authorization in the SAME EVM transaction.
contract TitanteoAHBatchOwner {
    function executeAndProbe(
        IAllowanceHolder holder,
        TitanteoLocalOperator operator_,
        MockERC20 token,
        address recipient,
        uint256 amount,
        uint256 spend
    ) external returns (bool leaked) {
        token.approve(address(holder), type(uint256).max);
        holder.exec(
            address(operator_),
            address(token),
            amount,
            payable(address(operator_)),
            abi.encodeCall(TitanteoLocalOperator.pull, (address(token), address(this), recipient, spend))
        );
        // This second call occurs inside one transaction, without a VM cheatcode boundary.
        try operator_.pull(address(token), address(this), recipient, amount - spend) {
            leaked = true;
        } catch {
            leaked = false;
        }
    }
}

contract TitanteoAllowanceHolderBoundaryTest is Test {
    IAllowanceHolder holder;
    MockERC20 token;
    MockERC20 token2;
    TitanteoLocalOperator operatorA;
    TitanteoLocalOperator operatorB;
    address alice;
    address bob;
    address recipient;
    address origin;

    function setUp() public {
        vm.chainId(31337);
        holder = IAllowanceHolder(address(new AllowanceHolder()));
        token = new MockERC20("Primary", "P", 18);
        token2 = new MockERC20("Secondary", "S", 18);
        operatorA = new TitanteoLocalOperator(holder);
        operatorB = new TitanteoLocalOperator(holder);
        alice = makeAddr("titanteo-alice");
        bob = makeAddr("titanteo-bob");
        recipient = makeAddr("titanteo-recipient");
        origin = makeAddr("titanteo-origin");
        token.mint(alice, 1_000_000 ether);
        token.mint(bob, 1_000_000 ether);
        token2.mint(alice, 1_000_000 ether);
        vm.prank(alice);
        token.approve(address(holder), type(uint256).max);
        vm.prank(bob);
        token.approve(address(holder), type(uint256).max);
        vm.prank(alice);
        token2.approve(address(holder), type(uint256).max);
    }

    function _exec(address operator_, address token_, uint256 grant, address target, bytes memory data) internal {
        vm.prank(alice, origin); // ensure caller != tx.origin, so cleanup is required
        holder.exec(operator_, token_, grant, payable(target), data);
    }

    function _pull(address token_, address owner_, uint256 n) internal view returns (bytes memory) {
        return abi.encodeCall(TitanteoLocalOperator.pull, (token_, owner_, recipient, n));
    }

    function testFuzz_AuthorizedSpendThenNoLeftoverAllowance(uint96 amountRaw) public {
        uint256 amount = 2 + uint256(amountRaw) % 1e24;
        uint256 spend = amount / 2;
        assertGt(amount - spend, 0, "must probe positive leftover");
        TitanteoAHBatchOwner batch = new TitanteoAHBatchOwner();
        token.mint(address(batch), amount);
        bool leaked = batch.executeAndProbe(holder, operatorA, token, recipient, amount, spend);
        assertFalse(leaked, "transient allowance remains usable after exec");
        assertEq(token.balanceOf(recipient), spend);
        assertEq(token.balanceOf(address(batch)), amount - spend);
    }

    function testFuzz_CannotSpendMoreThanGranted(uint96 amountRaw) public {
        uint256 amount = 1 + uint256(amountRaw) % 1e24;
        uint256 beforeAlice = token.balanceOf(alice);
        vm.expectRevert();
        _exec(address(operatorA), address(token), amount, address(operatorA),
            _pull(address(token), alice, amount + 1));
        assertEq(token.balanceOf(alice), beforeAlice);
        assertEq(token.balanceOf(recipient), 0);
    }

    function testFuzz_AnotherOwnerCannotBeDebited(uint96 amountRaw) public {
        uint256 amount = 1 + uint256(amountRaw) % 1e24;
        uint256 beforeBob = token.balanceOf(bob);
        vm.expectRevert();
        _exec(address(operatorA), address(token), amount, address(operatorA),
            _pull(address(token), bob, amount));
        assertEq(token.balanceOf(bob), beforeBob, "cross-owner spending");
        assertEq(token.balanceOf(recipient), 0);
    }

    function testFuzz_AnotherTokenCannotBeDebited(uint96 amountRaw) public {
        uint256 amount = 1 + uint256(amountRaw) % 1e24;
        uint256 beforeAlice = token2.balanceOf(alice);
        vm.expectRevert();
        _exec(address(operatorA), address(token), amount, address(operatorA),
            _pull(address(token2), alice, amount));
        assertEq(token2.balanceOf(alice), beforeAlice, "cross-token spending");
        assertEq(token2.balanceOf(recipient), 0);
    }

    function testFuzz_OtherOperatorCannotBorrowAllowance(uint96 amountRaw) public {
        uint256 amount = 1 + uint256(amountRaw) % 1e24;
        bytes memory forwarded = abi.encodeCall(
            TitanteoLocalOperator.pullViaOther,
            (operatorB, address(token), alice, recipient, amount)
        );
        vm.expectRevert();
        _exec(address(operatorA), address(token), amount, address(operatorA), forwarded);
        assertEq(token.balanceOf(recipient), 0, "operator B borrowed A's grant");
    }

    function testFuzz_RevertedOperatorTransferIsAtomic(uint96 amountRaw) public {
        uint256 amount = 1 + uint256(amountRaw) % 1e24;
        uint256 beforeAlice = token.balanceOf(alice);
        bytes memory attempt = abi.encodeCall(TitanteoLocalOperator.pullAndRevert,
            (address(token), alice, recipient, amount));
        vm.expectRevert("SYNTHETIC_OPERATOR_ROLLBACK");
        _exec(address(operatorA), address(token), amount, address(operatorA), attempt);
        assertEq(token.balanceOf(alice), beforeAlice, "rollback did not restore owner");
        assertEq(token.balanceOf(recipient), 0, "rollback did not restore recipient");
    }

    function test_AllowanceHolderCannotBeConfusedIntoCallingERC20AsTarget() public {
        vm.prank(alice, origin);
        vm.expectRevert(ConfusedDeputy.selector);
        holder.exec(address(operatorA), address(token), 1, payable(address(token2)), "");
    }
    // Adversarial checks designed for the real AllowanceHolder fallback.
    // All recipients/accounts/assets are synthetic and reside in the local EVM.
    function testFuzz_UntrustedOperatorCannotPullWithoutGrant(uint96 raw) public {
        uint256 amount = 1 + uint256(raw) % 1e24;
        uint256 aliceBefore = token.balanceOf(alice);
        vm.prank(address(operatorB), origin);
        vm.expectRevert();
        holder.transferFrom(address(token), alice, recipient, amount);
        assertEq(token.balanceOf(alice), aliceBefore);
        assertEq(token.balanceOf(recipient), 0);
    }

    function testFuzz_DirtyTokenAddressABIMustFail(uint96 raw) public {
        uint256 amount = 1 + uint256(raw) % 1e24;
        uint256 dirty = uint256(uint160(address(token))) | (uint256(1) << 160);
        bytes memory invalid = abi.encodeWithSelector(
            IAllowanceHolder.transferFrom.selector,
            dirty, alice, recipient, amount
        );
        vm.prank(address(operatorA), origin);
        (bool ok,) = address(holder).call(invalid);
        assertFalse(ok, "dirty upper bits of token accepted");
        assertEq(token.balanceOf(recipient), 0);
    }

    function testFuzz_DirtyOwnerAddressABIMustFail(uint96 raw) public {
        uint256 amount = 1 + uint256(raw) % 1e24;
        uint256 dirty = uint256(uint160(alice)) | (uint256(1) << 160);
        bytes memory invalid = abi.encodeWithSelector(
            IAllowanceHolder.transferFrom.selector,
            address(token), dirty, recipient, amount
        );
        vm.prank(address(operatorA), origin);
        (bool ok,) = address(holder).call(invalid);
        assertFalse(ok, "dirty upper bits of owner accepted");
        assertEq(token.balanceOf(recipient), 0);
    }

    function testFuzz_DirtyRecipientAddressABIMustFail(uint96 raw) public {
        uint256 amount = 1 + uint256(raw) % 1e24;
        uint256 dirty = uint256(uint160(recipient)) | (uint256(1) << 160);
        bytes memory invalid = abi.encodeWithSelector(
            IAllowanceHolder.transferFrom.selector,
            address(token), alice, dirty, amount
        );
        vm.prank(address(operatorA), origin);
        (bool ok,) = address(holder).call(invalid);
        assertFalse(ok, "dirty upper bits of recipient accepted");
        assertEq(token.balanceOf(recipient), 0);
    }


    function testFuzz_ActiveGrantRejectsDirtyTokenAddress(uint96 raw) public {
        uint256 amount = 1 + uint256(raw) % 1e24;
        uint256 beforeAlice = token.balanceOf(alice);
        _exec(address(operatorA), address(token), amount, address(operatorA),
            abi.encodeCall(TitanteoLocalOperator.probeDirtyActiveGrant,
                (0, address(token), alice, recipient, amount)));
        assertEq(token.balanceOf(alice), beforeAlice);
        assertEq(token.balanceOf(recipient), 0);
    }

    function testFuzz_ActiveGrantRejectsDirtyOwnerAddress(uint96 raw) public {
        uint256 amount = 1 + uint256(raw) % 1e24;
        uint256 beforeAlice = token.balanceOf(alice);
        _exec(address(operatorA), address(token), amount, address(operatorA),
            abi.encodeCall(TitanteoLocalOperator.probeDirtyActiveGrant,
                (1, address(token), alice, recipient, amount)));
        assertEq(token.balanceOf(alice), beforeAlice);
        assertEq(token.balanceOf(recipient), 0);
    }

    function testFuzz_ActiveGrantRejectsDirtyRecipientAddress(uint96 raw) public {
        uint256 amount = 1 + uint256(raw) % 1e24;
        uint256 beforeAlice = token.balanceOf(alice);
        _exec(address(operatorA), address(token), amount, address(operatorA),
            abi.encodeCall(TitanteoLocalOperator.probeDirtyActiveGrant,
                (2, address(token), alice, recipient, amount)));
        assertEq(token.balanceOf(alice), beforeAlice);
        assertEq(token.balanceOf(recipient), 0);
    }

    function testFuzz_ETHValueOnTransferFromMustFail(uint64 raw) public {
        uint256 amount = 1 + uint256(raw);
        vm.deal(address(operatorA), 1 ether);
        bytes memory invalid = abi.encodeWithSelector(
            IAllowanceHolder.transferFrom.selector, address(token), alice, recipient, amount
        );
        vm.prank(address(operatorA), origin);
        (bool ok,) = address(holder).call{value: 1}(invalid);
        assertFalse(ok, "payable transferFrom accepted ETH");
        assertEq(address(holder).balance, 0);
        assertEq(token.balanceOf(recipient), 0);
    }

}
