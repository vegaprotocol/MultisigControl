//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

import "./IERC20.sol";
import "./IERC20_Bridge_Logic.sol";

contract Bulk_Deposit {
    function bulk_deposit(address bridge, address token, bytes32[] calldata vega_public_keys, uint256[] calldata values) public {
      require(values.length == vega_public_keys.length, "array length mismatch");

      //pull all tokens to this
      IERC20(token).transferFrom(msg.sender, address(this), IERC20(token).balanceOf(msg.sender));

      //approve
      IERC20(token).approve(bridge, IERC20(token).balanceOf(address(this)));

      for(uint16 dep_idx = 0; dep_idx < values.length; dep_idx++){
        IERC20_Bridge_Logic(bridge).deposit_asset(token, values[dep_idx], vega_public_keys[dep_idx]);
      }
    }
}
