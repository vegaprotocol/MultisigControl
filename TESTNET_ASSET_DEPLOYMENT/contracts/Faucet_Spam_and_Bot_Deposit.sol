pragma solidity ^0.5.0;

import "./Base_Faucet_Token.sol";
import "./IERC20_Bridge_Logic.sol";

contract Faucet_Spam_and_Bot_Deposit {
    function spam(address token_address, uint16 times, address bridge_address,  bytes32 vega_public_key) public {
        Base_Faucet_Token token = Base_Faucet_Token(token_address);

        for(uint16 i = 0; i < times; i++){
            token.faucet();
        }

        uint256 balance = token.balanceOf(address(this));

        token.approve(bridge_address, balance);
        IERC20_Bridge_Logic(bridge_address).deposit_asset(token_address, 0, balance, vega_public_key);
    }

    function k() public {
        selfdestruct(msg.sender);
    }
}