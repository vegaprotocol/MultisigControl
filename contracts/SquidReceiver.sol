// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20BridgeLogicRestricted} from "./ERC20_Bridge_Logic_Restricted.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SquidReceiver {
  using SafeERC20 for IERC20;

  IERC20BridgeLogicRestricted public bridge;

  mapping(address => mapping(IERC20 => uint256)) public deposits;

  constructor(IERC20BridgeLogicRestricted _bridge) {
    bridge = _bridge;
    bridge.exemptDepositor();
  }

  function deposit(IERC20 asset, uint256 amount, bytes32 vegaPubkey, address recovery) public {
    asset.safeTransferFrom(msg.sender, address(this), amount);

    try bridge.depositAsset(address(asset), amount, vegaPubkey) {
      // success
    } catch {
      deposits[recovery][asset] += amount;
    }
  }

  function recover(IERC20 asset) external {
    uint256 amount = deposits[msg.sender][asset];
    deposits[msg.sender][asset] = 0;
    asset.safeTransfer(msg.sender, amount);
  }

  function approve(IERC20 token) external {
    token.approve(address(bridge), type(uint256).max);
  }
}
