// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Titanteo Security Lab Phase 26. Only ephemeral Foundry EVM; no RPC.
// Target: original 0x HyperEVM Settler SELECT nested-candidate authorization.
// The target 0x333... is an etch'd synthetic observer, NOT the deployed system contract.
import {Test} from "@forge-std/Test.sol";
import {IERC20} from "@forge-std/interfaces/IERC20.sol";
import {MockERC20} from "@solmate/test/utils/mocks/MockERC20.sol";
import {HyperEvmSettler} from "src/chains/HyperEvm/TakerSubmitted.sol";
import {ISettlerActions} from "src/ISettlerActions.sol";
import {ISettlerBase} from "src/interfaces/ISettlerBase.sol";
import {ConfusedDeputy} from "src/core/SettlerErrors.sol";

contract TitanteoHyperCoreWriterObserver {
    uint256 public calls;
    function ping() external { ++calls; }
}

contract TitanteoAllowedLocalPool {
    MockERC20 public immutable token;
    uint256 public calls;
    constructor(MockERC20 token_) { token = token_; }
    function release() external {
        ++calls;
        require(token.transfer(msg.sender, 2 ether), "local pool transfer");
    }
}

contract TitanteoHyperEvmNestedSelectTest is Test {
    address internal constant CORE_WRITER = 0x3333333333333333333333333333333333333333;
    HyperEvmSettler internal settler;
    MockERC20 internal buy;
    TitanteoAllowedLocalPool internal allowedPool;
    address internal taker;

    function setUp() public {
        vm.chainId(31337);
        settler = new HyperEvmSettler(bytes20(0));
        buy = new MockERC20("Titanteo Local Buy", "TLB", 18);
        allowedPool = new TitanteoAllowedLocalPool(buy);
        buy.mint(address(allowedPool), 10 ether);
        taker = makeAddr("local-taker");
        TitanteoHyperCoreWriterObserver template = new TitanteoHyperCoreWriterObserver();
        vm.etch(CORE_WRITER, address(template).code);
        assertTrue(CORE_WRITER.code.length > 0, "missing observer");
        assertTrue(address(settler).code.length > 0, "missing official settler");
    }

    function testNestedSelectCannotCallHyperCoreWriter() public {
        bytes[][] memory inner = new bytes[][](1);
        inner[0] = _single(_coreWriterAction());
        bytes[] memory outer = _single(_select(inner, _targets(1, 0)));
        vm.expectRevert(ConfusedDeputy.selector);
        _run(_select(_wrap(outer), _targets(1, 0)), 0);
        assertEq(TitanteoHyperCoreWriterObserver(CORE_WRITER).calls(), 0, "system writer invoked");
    }

    function testRejectedCoreWriterTrialThenAllowedPoolCommitsWithoutLeak() public {
        bytes[][] memory candidates = new bytes[][](2);
        candidates[0] = _single(_coreWriterAction());
        candidates[1] = _single(abi.encodeCall(
            ISettlerActions.BASIC,
            (address(0), 0, address(allowedPool), 0, abi.encodeCall(TitanteoAllowedLocalPool.release, ()))
        ));
        uint256[] memory targets = new uint256[](2);
        targets[0] = 1 ether;
        targets[1] = 1 ether;
        _run(_select(candidates, targets), 1 ether);
        assertEq(TitanteoHyperCoreWriterObserver(CORE_WRITER).calls(), 0, "blocked target called");
        assertEq(allowedPool.calls(), 1, "allowed fallback not committed");
        assertEq(buy.balanceOf(taker), 2 ether, "unexpected final settlement");
    }

    function _coreWriterAction() internal pure returns (bytes memory) {
        return abi.encodeCall(
            ISettlerActions.BASIC,
            (address(0), 0, CORE_WRITER, 0, abi.encodeCall(TitanteoHyperCoreWriterObserver.ping, ()))
        );
    }

    function _single(bytes memory action) internal pure returns (bytes[] memory actions) {
        actions = new bytes[](1);
        actions[0] = action;
    }

    function _wrap(bytes[] memory actions) internal pure returns (bytes[][] memory candidates) {
        candidates = new bytes[][](1);
        candidates[0] = actions;
    }

    function _targets(uint256 count, uint256 target) internal pure returns (uint256[] memory targets) {
        targets = new uint256[](count);
        for (uint256 i; i < count; ++i) targets[i] = target;
    }

    function _select(bytes[][] memory candidates, uint256[] memory targets) internal view returns (bytes memory) {
        return abi.encodeCall(ISettlerActions.SELECT, (uint256(400000), address(buy), targets, candidates));
    }

    function _run(bytes memory action, uint256 minOut) internal {
        vm.prank(taker);
        settler.execute(
            ISettlerBase.AllowedSlippage({
                recipient: payable(taker), buyToken: IERC20(address(buy)), minAmountOut: minOut
            }),
            _single(action),
            bytes32(0)
        );
    }
}
