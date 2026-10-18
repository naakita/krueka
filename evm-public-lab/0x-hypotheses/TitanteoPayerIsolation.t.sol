// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;
import {Test} from "@forge-std/Test.sol";
import {IERC20} from "@forge-std/interfaces/IERC20.sol";
import {BaseSettler} from "src/chains/Base/TakerSubmitted.sol";
import {ISettlerActions} from "src/ISettlerActions.sol";
import {ISettlerBase} from "src/interfaces/ISettlerBase.sol";
import {IMsgSender} from "src/interfaces/IMsgSender.sol";
import {ALLOWANCE_HOLDER} from "src/allowanceholder/IAllowanceHolder.sol";
import {PERMIT2} from "src/core/Permit2Payment.sol";

contract TitanteoLocalCallback {
    address public recordedPayer;
    uint256 public successfulCalls;
    bool public attemptNestedExecute;
    bool public nestedExecuteSucceeded;
    function setNested(bool enabled) external { attemptNestedExecute = enabled; }
    function observe(address target) external {
        recordedPayer = IMsgSender(target).msgSender();
        successfulCalls++;
        if (attemptNestedExecute) {
            bytes[] memory emptyActions = new bytes[](0);
            ISettlerBase.AllowedSlippage memory slip = ISettlerBase.AllowedSlippage({
                recipient: payable(address(0)), buyToken: IERC20(address(0)), minAmountOut: 0
            });
            try BaseSettler(payable(target)).execute(slip, emptyActions, bytes32(0)) returns (bool ok) {
                nestedExecuteSucceeded = ok;
            } catch {
                nestedExecuteSucceeded = false;
            }
        }
    }
    function observeThenRevert(address target) external {
        recordedPayer = IMsgSender(target).msgSender();
        successfulCalls++;
        revert("deliberate rollback");
    }
}


/**
 * @notice Two Settler calls in ONE EVM transaction, avoiding any top-level
 * cheatcode transaction reset between calls. This is intentionally separate
 * from the test contract.
 */
contract TitanteoBatchCaller {
    function executeTwice(BaseSettler settler, TitanteoLocalCallback observer) external {
        bytes[] memory actions = new bytes[](1);
        actions[0] = abi.encodeCall(
            ISettlerActions.BASIC,
            (address(0), 0, address(observer), 0, abi.encodeCall(TitanteoLocalCallback.observe, (address(settler))))
        );
        ISettlerBase.AllowedSlippage memory slip = ISettlerBase.AllowedSlippage({
            recipient: payable(address(0)), buyToken: IERC20(address(0)), minAmountOut: 0
        });
        settler.execute(slip, actions, bytes32(0));
        settler.execute(slip, actions, bytes32(0));
    }
}

contract TitanteoPayerIsolationTest is Test {
    BaseSettler internal settler;
    TitanteoLocalCallback internal observer;
    function setUp() public {
        settler = new BaseSettler(bytes20(0));
        observer = new TitanteoLocalCallback();
    }
    function _invoke(address payer, bool mustRevert) internal returns (bool) {
        bytes[] memory actions = new bytes[](1);
        bytes memory payload = mustRevert
            ? abi.encodeCall(TitanteoLocalCallback.observeThenRevert, (address(settler)))
            : abi.encodeCall(TitanteoLocalCallback.observe, (address(settler)));
        actions[0] = abi.encodeCall(ISettlerActions.BASIC, (address(0), 0, address(observer), 0, payload));
        vm.prank(payer, payer);
        try settler.execute(
            ISettlerBase.AllowedSlippage({
                recipient: payable(address(0)), buyToken: IERC20(address(0)), minAmountOut: 0
            }),
            actions,
            bytes32(0)
        ) returns (bool success) { return success; } catch { return false; }
    }
    function _noExternalPayer() internal {
        (bool ok,) = address(settler).call(abi.encodeWithSelector(IMsgSender.msgSender.selector));
        assertFalse(ok, "payer persisted beyond execution");
    }
    function test_New_TwoExecutionsInsideOneTransactionClearPayer() public {
        TitanteoBatchCaller batch = new TitanteoBatchCaller();
        batch.executeTwice(settler, observer);
        assertEq(observer.successfulCalls(), 2, "second Settler call must be allowed");
        assertEq(observer.recordedPayer(), address(batch), "incorrect batch payer");
        _noExternalPayer();
    }

    function test_New_SequentialPayersAreIsolatedAndSlotCleared() public {
        address alice = makeAddr("t-a"); address bob = makeAddr("t-b");
        assertTrue(_invoke(alice, false), "alice failed");
        assertEq(observer.recordedPayer(), alice);
        _noExternalPayer();
        assertTrue(_invoke(bob, false), "bob failed");
        assertEq(observer.recordedPayer(), bob);
        assertEq(observer.successfulCalls(), 2);
        _noExternalPayer();
    }
    function test_New_RollbackAlsoRevertsObserverEffectsAndPayerContext() public {
        address alice = makeAddr("t-alice");
        assertFalse(_invoke(alice, true), "deliberate revert should fail");
        assertEq(observer.successfulCalls(), 0);
        assertEq(observer.recordedPayer(), address(0));
        _noExternalPayer();
        assertTrue(_invoke(alice, false), "payer slot locked after revert");
        assertEq(observer.recordedPayer(), alice);
        _noExternalPayer();
    }
    function test_New_NestedExecutionCannotReuseActivePayer() public {
        observer.setNested(true);
        address alice = makeAddr("t-nested");
        assertTrue(_invoke(alice, false), "outer call failed");
        assertFalse(observer.nestedExecuteSucceeded(), "unexpected nested execute success");
        assertEq(observer.recordedPayer(), alice);
        _noExternalPayer();
    }
    function testFuzz_New_AppendedAddressCannotSpoofPayer(address forged) public {
        bytes memory invalid = abi.encodePacked(IMsgSender.msgSender.selector, bytes20(forged));
        (bool ok,) = address(settler).call(invalid);
        assertFalse(ok, "address suffix spoofed authentication");
    }
    function testFuzz_New_IndependentPayersRemainIsolated(address first, address second) public {
        vm.assume(first != address(0) && second != address(0) && first != second);
        vm.assume(first.code.length == 0 && second.code.length == 0);
        vm.assume(first != address(ALLOWANCE_HOLDER) && second != address(ALLOWANCE_HOLDER));
        vm.assume(first != address(PERMIT2) && second != address(PERMIT2));
        assertTrue(_invoke(first, false), "first call failed");
        assertEq(observer.recordedPayer(), first);
        assertTrue(_invoke(second, false), "second call failed");
        assertEq(observer.recordedPayer(), second);
        _noExternalPayer();
    }
}
