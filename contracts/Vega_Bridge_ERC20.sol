pragma solidity ^0.5.0;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./IERC20.sol";
import "./IVega_Bridge.sol";
import "./MultisigControl.sol";

contract Vega_Bridge_ERC20 is IVega_Bridge, Ownable {
    //stops overflow
    using SafeMath for uint256;

    address multisig_control_address;
    mapping(address => bool) whitelisted_tokens;
    mapping(address => uint256) minimum_deposits;

    /**********************ADMIN REMOVE BEFORE MAINNET*******************************/
    function whitelist_asset_admin(address asset_source, uint256 asset_id) public onlyOwner {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(!whitelisted_tokens[asset_source], "asset already whitelisted");
        whitelisted_tokens[asset_source] = true;
        emit Asset_Whitelisted(asset_source, 0);
    }
    function blacklist_asset_admin(address asset_source, uint256 asset_id) public onlyOwner {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");
        whitelisted_tokens[asset_source] = false;
        emit Asset_Blacklisted(asset_source, 0);
    }
    /**********************END ADMIN*******************************/


    function whitelist_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(!whitelisted_tokens[asset_source], "asset already whitelisted");
        bytes memory message = abi.encode(asset_source, nonce, 'whitelist_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        whitelisted_tokens[asset_source] = true;
        emit Asset_Whitelisted(asset_source, 0);
    }
    function blacklist_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");
        bytes memory message = abi.encode(asset_source, nonce, 'blacklist_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        whitelisted_tokens[asset_source] = false;
        emit Asset_Blacklisted(asset_source, 0);
    }
    function set_deposit_minimum(address asset_source, uint256 asset_id, uint256 nonce, uint256 minimum_amount, bytes memory signatures) public{
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");

        bytes memory message = abi.encode(asset_source, minimum_amount, nonce, 'set_deposit_minimum');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        minimum_deposits[asset_source] = minimum_amount;
        emit Asset_Deposit_Minimum_Set(asset_source, 0, minimum_amount);

    }
    function withdraw_asset(address asset_source, uint256 asset_id, uint256 amount, uint256 nonce, bytes memory signatures) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");

        bytes memory message = abi.encode(msg.sender, asset_source, amount, nonce, 'withdraw_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));

        require(IERC20(asset_source).transfer(msg.sender, amount));

        emit Asset_Withdrawn(msg.sender, asset_source, 0, amount);
    }
    function deposit_asset(address asset_source, uint256 asset_id, uint256 amount, bytes32 vega_public_key) public {
        require(asset_id == 0, "only root asset (0) allowed for ERC20");
        require(whitelisted_tokens[asset_source], "asset not whitelisted");
        //User must run approve before deposit
        require(amount >= minimum_deposits[asset_source]);
        require(IERC20(asset_source).transferFrom(msg.sender, address(this), amount));
        emit Asset_Deposited(msg.sender, asset_source, 0, amount, vega_public_key);
    }
    function set_multisig_control(address new_multisig_contract_address) public onlyOwner {
        multisig_control_address = new_multisig_contract_address;
        emit Multisig_Control_Set(new_multisig_contract_address);
    }

    // VIEWS /////////////////
    function is_asset_whitelisted(address asset_source, uint256 asset_id) public view returns(bool){
        return whitelisted_tokens[asset_source] && asset_id == 0;
    }
    function get_deposit_minimum(address asset_source, uint256 asset_id) public view returns(uint256){
        if(asset_id != 0){
            return 0;
        } else {
            return minimum_deposits[asset_source];
        }
    }



}
    /*
    //NOTE: making properties of a contract public only makes them publicly viewable, nothing can be changed w/o code in this contract
    
    //cuts down on spammers
    mapping(address=> uint256) public token_deposit_minimums;
    mapping(address=> bool) public valid_token_addresses;

    function set_token_address_status(address token_address, bool new_status) public onlyOwner {
        valid_token_addresses[token_address] = new_status;
        emit Token_Contract_Address_Changed(token_address, new_status, now);
    }

    //balances available for withdraw
    mapping(address => mapping(address => uint256)) public tokens_available;
    mapping(address => uint256) public tokens_promised;

    function get_asset_available_for_user(address user, address asset_source, uint256 asset_id) public view returns(uint256) {
        require(asset_id == 0);
        return tokens_available[asset_source][user];
    }
    function get_asset_promised_total(address asset_source, uint256 asset_id) public view returns(uint256) {
        require(asset_id == 0);
        return tokens_promised[asset_source];
    }

    function set_token_deposit_minimum(address token_address, uint256 new_minimum) public onlyOwner {
        require(valid_token_addresses[token_address]);
        token_deposit_minimums[token_address] = new_minimum;
        emit Asset_Deposit_Minimum_Set(token_address, 0, new_minimum);
    }
    function get_deposit_minimum(address asset_source, uint256 asset_id) public view returns(uint256){
        require(asset_id == 0);
        return token_deposit_minimums[asset_source];
    }
    // 2 choices: use token_fallback pattern like ERC223
    // or use the approve function of the ERC20 before calling this method
    //user calls this with a wei value to deposit funds to the system
    //funds are held on-contract
    function deposit_asset(address token_address, uint256 token_bits, bytes memory vega_public_address) public {
        require(valid_token_addresses[token_address]);
        require(token_bits >= token_deposit_minimums[token_address]);
        require(IERC20(token_address).transferFrom(msg.sender, address(this), token_bits));
        emit Asset_Deposited(msg.sender, token_address, 0, token_bits, vega_public_address);
    }

    mapping(bytes32=> bool) public used_unique_ids;
    function is_unique_id_used(bytes32 unique_id) public view returns(bool) {
        return used_unique_ids[unique_id];
    }
    //once the private chain determines the user needs funds available on mainnet
    //the server will call approve(this_token_address, token_bits)
    //this creates a balance available to the user to withdraw
    function make_asset_available(address user_address, address asset_source, uint256 asset_id, uint256 amount, bytes32 unique_id) public onlyOwner {
        require(!used_unique_ids[unique_id], "unique_id used");
        require(asset_id == 0);
        require(valid_token_addresses[asset_source]);
        require(tokens_promised[asset_source].add(amount) <= IERC20(asset_source).balanceOf(address(this)));
        tokens_promised[asset_source] = tokens_promised[asset_source].add(amount);
        tokens_available[asset_source][user_address] = tokens_available[asset_source][user_address].add(amount);
        used_unique_ids[unique_id] = true;
        emit Asset_Available(user_address, asset_source, asset_id, amount, unique_id);
    }
    
    //once a user gets the notice (from the Wei_Available event)
    //they will run this function to receive their wei
    //the pull mechanism used here (rather than pushing directly to the user)
    //is to avoid any sort of reentry attack or other problems related to sending 
    //directly to a malicious smart contract
    function withdraw_asset(address token_address, uint256 amt) public {
        require(valid_token_addresses[token_address]);
        require(tokens_available[token_address][msg.sender] >= amt);
        require(IERC20(token_address).transfer(msg.sender, amt));
        tokens_promised[token_address] = tokens_promised[token_address].sub(amt);
        tokens_available[token_address][msg.sender] = tokens_available[token_address][msg.sender].sub(amt);
        emit Asset_Withdrawn(msg.sender, token_address, 0, amt);
    }
    
    //Events
    //note: blocktime included to cut down on RPC calls
    event Asset_Available(address indexed user_address, address indexed asset_source, uint256 indexed asset_id, uint256 amount, bytes32 unique_id);
    event Asset_Withdrawn(address indexed user_address, address indexed asset_source, uint256 indexed asset_id, uint256 amount);
    event Asset_Deposited(address indexed user_address, address indexed asset_source, uint256 indexed asset_id, uint256 amount);
    event Asset_Deposit_Minimum_Set(address indexed asset_source, uint256 indexed asset_id, uint256 new_minimum);

    //These events use the same format: address, amt, blocktime
    //this will be the initial format for an even queue for the server/side chain to process

    event Deposit_Address_Set(address indexed token_address, address indexed new_address, uint256 blocktime);
    event Token_Contract_Address_Changed(address indexed token_address, bool new_status, uint256 blocktime);
    //NOTE in this model, we have no way of removing tokens off this contract, so if a user loses their keys,
    //the tokens are locked to their address is stuck on this contract
    //this can be dealt with by making an onlyOwner function of "pull_tokens" but then it gives us the opprotunity
    //to be malicious, so I didn't add that function. This is advisarial thinking^3: even we are the enemy
}*/