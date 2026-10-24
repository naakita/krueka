// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Titanteo: local-only regression for NEW fork IDs 49 (Nami) and 50 (Aero).
// The protocol source is never edited in the positive/negative baseline.
import {Test} from "@forge-std/Test.sol";
import {MockERC20} from "@solmate/test/utils/mocks/MockERC20.sol";
import {IERC20} from "@forge-std/interfaces/IERC20.sol";
import {BaseSettler} from "src/chains/Base/TakerSubmitted.sol";
import {ISettlerBase} from "src/interfaces/ISettlerBase.sol";
import {ISettlerActions} from "src/ISettlerActions.sol";
import {AddressDerivation} from "src/utils/AddressDerivation.sol";
import {IUniswapV3Callback} from "src/core/univ3forks/UniswapV3.sol";
import {IAlgebraCallback} from "src/core/univ3forks/Algebra.sol";
import {aeroBaseFactory, aeroInitHash, aeroForkId} from "src/core/univ3forks/Aero.sol";
import {namiBaseFactory, namiInitHash, namiForkId} from "src/core/univ3forks/Nami.sol";

contract TitanteoBaseForkHarness is BaseSettler {
    constructor() BaseSettler(bytes20(0)) {}
    function forkInfo(uint8 id) external view returns (address, bytes32, uint32) {
        return _uniV3ForkInfo(id);
    }
}

// The mock pool exists ONLY in the local EVM at a deterministic address.
// It never asserts that the third-party factory has deployed this code.
contract TitanteoMockForkPool {
    MockERC20 public output;
    bytes4 public callbackSelector;
    function configure(MockERC20 out, bytes4 selector) external {
        output = out;
        callbackSelector = selector;
    }
    function swap(address recipient, bool zeroForOne, int256 amountSpecified, uint160, bytes calldata data)
        external returns (int256 amount0, int256 amount1)
    {
        require(amountSpecified > 0, "only exact input");
        amount0 = zeroForOne ? amountSpecified : -amountSpecified;
        amount1 = zeroForOne ? -amountSpecified : amountSpecified;
        (bool ok,) = msg.sender.call(abi.encodeWithSelector(callbackSelector, amount0, amount1, data));
        require(ok, "callback rejected");
        require(output.transfer(recipient, uint256(amountSpecified)), "output transfer");
    }
}

contract TitanteoNewForkCallbacksTest is Test {
    TitanteoBaseForkHarness private settler;
    TitanteoMockForkPool private poolTemplate;
    MockERC20 private input;
    MockERC20 private output;
    address private recipient;
    uint256 private constant AMOUNT = 7 ether;

    function setUp() public {
        settler = new TitanteoBaseForkHarness();
        poolTemplate = new TitanteoMockForkPool();
        MockERC20 a = new MockERC20("A", "A", 18);
        MockERC20 b = new MockERC20("B", "B", 18);
        (input, output) = address(a) < address(b) ? (a, b) : (b, a);
        recipient = makeAddr("local-recipient");
    }

    function testAeroValidPoolCallbackSucceeds() public {
        (bytes memory path, address pool) =
            _prepare(aeroForkId, 500, IUniswapV3Callback.uniswapV3SwapCallback.selector);
        _execute(path);
        assertEq(input.balanceOf(pool), AMOUNT, "pool input not paid");
        assertEq(output.balanceOf(recipient), AMOUNT, "recipient output not received");
    }

    function testNamiValidAlgebraCallbackSucceeds() public {
        (bytes memory path, address pool) =
            _prepare(namiForkId, 0, IAlgebraCallback.algebraSwapCallback.selector);
        _execute(path);
        assertEq(input.balanceOf(pool), AMOUNT, "pool input not paid");
        assertEq(output.balanceOf(recipient), AMOUNT, "recipient output not received");
    }

    function testNamiRejectsWrongUniswapCallback() public {
        (bytes memory path, address pool) =
            _prepare(namiForkId, 0, IUniswapV3Callback.uniswapV3SwapCallback.selector);
        vm.expectRevert();
        _execute(path);
        assertEq(input.balanceOf(address(settler)), AMOUNT, "input was spent on reverted callback");
        assertEq(input.balanceOf(pool), 0, "pool got tokens on reverted callback");
        assertEq(output.balanceOf(recipient), 0, "recipient got output on reverted callback");
    }

    function testDirectForgedCallbackOutsideSwapRejected() public {
        input.mint(address(settler), AMOUNT);
        bytes memory data = abi.encodePacked(address(settler), address(input));
        (bool ok,) = address(settler).call(
            abi.encodeWithSelector(
                IUniswapV3Callback.uniswapV3SwapCallback.selector, int256(AMOUNT), int256(-int256(AMOUNT)), data
            )
        );
        assertFalse(ok, "unauthorized external callback accepted");
        assertEq(input.balanceOf(address(settler)), AMOUNT, "unauthorized callback spent tokens");
    }

    function _prepare(uint8 forkId, uint24 poolId, bytes4 selector)
        private returns (bytes memory path, address pool)
    {
        (address factory, bytes32 initHash, uint32 actualSelector) = settler.forkInfo(forkId);
        if (forkId == aeroForkId) {
            assertEq(factory, aeroBaseFactory);
            assertEq(initHash, aeroInitHash);
            assertEq(actualSelector, uint32(IUniswapV3Callback.uniswapV3SwapCallback.selector));
        } else {
            assertEq(forkId, namiForkId);
            assertEq(factory, namiBaseFactory);
            assertEq(initHash, namiInitHash);
            if (selector == IAlgebraCallback.algebraSwapCallback.selector) {
                assertEq(actualSelector, uint32(IAlgebraCallback.algebraSwapCallback.selector));
            }
        }
        bytes32 salt = poolId == 0
            ? keccak256(abi.encode(address(input), address(output)))
            : keccak256(abi.encode(address(input), address(output), poolId));
        pool = AddressDerivation.deriveDeterministicContract(factory, salt, initHash);
        vm.etch(pool, address(poolTemplate).code);
        TitanteoMockForkPool(pool).configure(output, selector);
        input.mint(address(settler), AMOUNT);
        output.mint(pool, AMOUNT);
        path = abi.encodePacked(address(input), forkId, poolId, uint160(4295128740), address(output));
    }

    function _execute(bytes memory path) private {
        bytes[] memory actions = new bytes[](1);
        actions[0] = abi.encodeCall(ISettlerActions.UNISWAPV3, (recipient, 1_000_000, path, AMOUNT));
        ISettlerBase.AllowedSlippage memory slippage =
            ISettlerBase.AllowedSlippage(payable(address(0)), IERC20(address(0)), 0);
        settler.execute(slippage, actions, bytes32(0));
    }
}
