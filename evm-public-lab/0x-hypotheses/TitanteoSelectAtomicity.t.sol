// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Independent offline regression using the project's published fixtures.
// This is NOT an exploit of a deployed contract.
import {IERC20} from "@forge-std/interfaces/IERC20.sol";
import {BaseSettler} from "src/chains/Base/TakerSubmitted.sol";
import {ISettlerBase} from "src/interfaces/ISettlerBase.sol";
import {SelectUnitTest} from "test/unit/core/SelectUnitTest.t.sol";

contract TitanteoSameTransactionExecutor {
    function twoExecutions(
        BaseSettler settler,
        IERC20 buyToken,
        address payable recipient,
        bytes memory first,
        bytes memory second,
        uint256 firstMinOut,
        uint256 secondMinOut
    ) external {
        bytes[] memory actions = new bytes[](1);
        actions[0] = first;
        settler.execute(
            ISettlerBase.AllowedSlippage({
                recipient: recipient, buyToken: buyToken, minAmountOut: firstMinOut
            }),
            actions, bytes32(0)
        );
        actions[0] = second;
        settler.execute(
            ISettlerBase.AllowedSlippage({
                recipient: recipient, buyToken: buyToken, minAmountOut: secondMinOut
            }),
            actions, bytes32(0)
        );
    }
}

contract TitanteoSelectTransactionalAtomicityTest is SelectUnitTest {
    function _proveSameTxFailedPermitThenReuse(uint256 fallbackOutput, uint256 nonce) internal {
        TitanteoSameTransactionExecutor batch = new TitanteoSameTransactionExecutor();
        // The new batch caller is the counterparty authorized by the maker's RFQ signature.
        taker = address(batch);
        _fundRfq(7 ether);
        p0.set(fallbackOutput, false);

        bytes[][] memory firstOptions = _candidatePair(
            _rfqCandidate(7 ether, nonce),
            _candidate(address(p0))
        );
        uint256[] memory firstTargets = new uint256[](2);
        firstTargets[0] = 8 ether; // The signed first trial returns only 7 ether; must roll back.
        firstTargets[1] = fallbackOutput;

        bytes[][] memory secondOptions = new bytes[][](1);
        secondOptions[0] = _rfqCandidate(7 ether, nonce);
        uint256[] memory secondTargets = new uint256[](1);
        secondTargets[0] = 7 ether;

        batch.twoExecutions(
            settler, IERC20(address(buy)), payable(recipient),
            _selectAction(TEST_GAS_CAP, address(buy), firstTargets, firstOptions),
            _selectAction(TEST_GAS_CAP, address(buy), secondTargets, secondOptions),
            fallbackOutput, 7 ether
        );

        assertEq(buy.balanceOf(recipient), fallbackOutput + 7 ether, "total output mismatch");
        assertEq(p0.callCount(), 1, "fallback executed unexpected number of times");
        assertTrue(_nonceUsed(maker, nonce), "winning RFQ must spend permit exactly once");
        assertEq(buy.balanceOf(maker), 0, "maker bought token not transferred as planned");
        assertEq(sell.balanceOf(maker), 1 ether, "maker didn't receive settled input");
        assertEq(sell.balanceOf(address(settler)), 0, "unconsumed input remains");
    }

    function test_Independent_SameTransactionFailedSignedRouteIsReusable() public {
        _proveSameTxFailedPermitThenReuse(9 ether, 246);
    }

    function testFuzz_Independent_SameTransactionFailedSignedRouteIsReusable(uint8 extra) public {
        _proveSameTxFailedPermitThenReuse(9 ether + uint256(extra) * 1e12, 10_000 + uint256(extra));
    }
}
