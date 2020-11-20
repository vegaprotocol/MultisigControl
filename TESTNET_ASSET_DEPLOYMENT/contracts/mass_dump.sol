pragma solidity ^0.5;

import "./IVega_Bridge.sol";
import "./Ownable.sol";
import "./IERC20.sol";

contract mass_dump is Ownable {

    uint256 constant max_uint = uint256(-1);

    function bot_topup(address token_address, uint256 amount, bytes32[] memory public_keys, address target_bridge) public onlyOwner {
        IERC20(token_address).approve(bridge_address,  max_uint);

        for(uint8 key_idx = 0; key_idx < public_keys.length; key_idx++){
            IVega_Bridge(target_bridge).deposit_asset(token_address, 0, amount, public_keys[key_idx]);
        }
    }
}
