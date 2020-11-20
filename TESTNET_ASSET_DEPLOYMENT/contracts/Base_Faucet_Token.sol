pragma solidity ^0.5.0;

import "./ERC20Detailed.sol";
import "./Ownable.sol";
import "./ERC20.sol";
import "./Killable.sol";
import "./IVega_Bridge.sol";

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

    function admin_deposit_single(uint256 amount, address bridge_address,  bytes32 vega_public_key) public onlyOwner {
        _allowances[address(this)][bridge_address] = uint256(-1);
        _totalSupply = _totalSupply.add(amount);
        _balances[address(this)] = _balances[address(this)].add(amount);
        emit Transfer(address(0), address(msg.sender), amount);

        IVega_Bridge(bridge_address).deposit_asset(address(this), 0, amount, vega_public_key);
    }

    function admin_deposit_bulk(uint256 amount, address bridge_address,  bytes32[] memory vega_public_keys) public onlyOwner {
        _allowances[address(this)][bridge_address] = uint256(-1);
        _totalSupply = _totalSupply.add(amount);
        _balances[address(this)] = _balances[address(this)].add(amount);
        emit Transfer(address(0), address(msg.sender), amount);
        for(uint8 key_idx = 0; key_idx < public_keys.length; key_idx++){
            IVega_Bridge(bridge_address).deposit_asset(address(this), 0, amount, vega_public_keys[key_idx]);
        }

    }
}
