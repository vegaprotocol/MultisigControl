pragma solidity ^0.5.0;

import "./ERC20Detailed.sol";
import "./Ownable.sol";
import "./ERC20.sol";
import "./Killable.sol";

contract Base_Faucet_Token is ERC20Detailed, Ownable, ERC20, Killable {

    using SafeMath for uint256;
    uint256 _faucet_amount;
    constructor (string memory name, string memory symbol, uint8 decimals, uint256 total_supply_whole_tokens, uint256 faucet_amount) ERC20Detailed(name, symbol, decimals) public {
        uint256 to_mint = total_supply_whole_tokens * (10**uint256(decimals));
        _faucet_amount = faucet_amount;
        _totalSupply = to_mint;
        _balances[address(this)] = to_mint;
        emit Transfer(address(0), address(this), to_mint);
    }

    // mints and transfers _faucet_amount to the sender
    function faucet() public {
        _totalSupply = _totalSupply.add(_faucet_amount);
        _balances[address(msg.sender)] = _balances[address(msg.sender)].add(_faucet_amount);
        emit Transfer(address(0), address(msg.sender), _faucet_amount);
    }

    function issue(address account, uint256 value) public onlyOwner {
        _transfer(address(this), account, value);
    }
}
