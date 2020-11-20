pragma solidity ^0.5.0;

import "./ERC20Detailed.sol";
import "./Ownable.sol";
import "./ERC20.sol";

/**
 * @dev creates totalSupply and holds on contract until issue is called
 */
contract VUSD_TEST is ERC20Detailed, Ownable, ERC20 {

    using SafeMath for uint256;

    constructor (string memory name, string memory symbol, uint8 decimals, uint256 total_supply_whole_tokens) ERC20Detailed(name, symbol, decimals) public {
        uint256 to_mint = total_supply_whole_tokens * (10**uint256(decimals));

        _totalSupply = to_mint;
        _balances[address(this)] = to_mint;
        emit Transfer(address(0), address(this), to_mint);
    }

    // mints and transfers 1000 VUSD to the sender
    function faucet() public {
        uint256 new_tokens = 1000 * (10**uint256(decimals()));
        _totalSupply = _totalSupply.add(new_tokens);
        _balances[address(msg.sender)] = _balances[address(msg.sender)].add(new_tokens);
        emit Transfer(address(0), address(msg.sender), new_tokens);
    }

    function issue(address account, uint256 value) public onlyOwner {
        _transfer(address(this), account, value);
    }
}
