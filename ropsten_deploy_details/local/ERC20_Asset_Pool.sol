pragma solidity 0.7.6;

import "./IMultisigControl.sol";
import "./IERC20.sol";

contract ERC20_Asset_Pool {
    event Multisig_Control_Set(address indexed new_address);
    event Bridge_Address_Set(address indexed new_address);
    address public multisig_control_address;
    address public erc20_bridge_address;

    constructor(address multisig_control) public{
        multisig_control_address = multisig_control;
    }
    function set_multisig_control(address new_address, uint256 nonce, bytes memory signatures) public {
        bytes memory message = abi.encode(new_address, nonce, 'set_multisig_control');
        require(IMultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        multisig_control_address = new_address;
        emit Multisig_Control_Set(new_address);
    }

    function set_bridge_address(address new_address, uint256 nonce, bytes memory signatures) public {
        bytes memory message = abi.encode(new_address, nonce, 'set_bridge_address');
        require(IMultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        erc20_bridge_address = new_address;
        emit Bridge_Address_Set(new_address);
    }

    //NOTE: To deposit, simply send to this contract, all funds will be part of the pool

    function withdraw(address token_address, address target, uint256 amount) public returns(bool){
        require(msg.sender == erc20_bridge_address, "msg.sender not authorized bridge");
        require(IERC20(token_address).transfer(target, amount), "token transfer failed");
        return true;
    }
}
