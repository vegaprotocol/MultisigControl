pragma solidity ^0.5.16;

import "./IMultisigControl.sol";
import "./IERC20.sol";

//TODO remove before mainnet
import "./Ownable.sol";
import "./Killable.sol";

contract ERC20_Asset_Pool is Ownable, Killable  /*TODO Remove Owner and Killable before Mainnet*/{
    event Multisig_Control_Set(address indexed new_address);
    event Bridge_Address_Set(address indexed new_address);
    address public multisig_control_address;
    address public erc20_bridge_address;

    /////////////////TODO: Remove before flight
    function set_bridge_address_admin(address new_address) public onlyOwner{
        erc20_bridge_address = new_address;
    }
    ////////////////////TODO end remove before flight

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
        require(msg.sender == erc20_bridge_address, string(abi.encodePacked("bad sender: ",toAsciiString(msg.sender))));
        require(IERC20(token_address).transfer(target, amount), "token transfer failed");
        return true;
    }





    function toAsciiString(address x) public returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            byte b = byte(uint8(uint(x) / (2**(8*(19 - i)))));
            byte hi = byte(uint8(b) / 16);
            byte lo = byte(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);
        }
        return string(s);
    }

    function char(byte b) public returns (byte c) {
        if (uint8(b) < 10) return byte(uint8(b) + 0x30);
        else return byte(uint8(b) + 0x57);
    }
}
