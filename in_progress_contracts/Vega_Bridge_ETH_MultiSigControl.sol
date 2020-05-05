pragma solidity ^0.5.0;

import "./Ownable.sol";
import "./SafeMath.sol";
import "./IVega_Bridge.sol";
import "./MultisigControl.sol";

contract Vega_Bridge_ETH is IVega_Bridge, Ownable {
    //stops overflow
    using SafeMath for uint256;

    //NOTE all signed hashes must include the target bridge contract address and the function name

    address multisig_contract_address;
    uint deposit_minimum;

    constructor(){
        //ETH is automatically whitelisted
        Asset_Whitelisted(address(0), 0);
    }

    function whitelist_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public {
        //unneeded for this asset must be implemented to meet interface requirement, does nothing
        require(false);
    }

    function blacklist_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public {
        //unneeded for this asset must be implemented to meet interface requirement, does nothing
        require(false);
    }

    function set_deposit_minimum(address asset_source, uint256 asset_id, uint256 nonce, uint256 minimum_amount) public {
        require(asset_source == address(0) && asset_id == 0, "wrong asset, only (address(0),0) allowed for ETH");
        bytes memory msg = abi.encode(minimum_amount, nonce, 'set_deposit_minimum');
        require(MultisigControl(multisig_contract_address).verify_signatures(signatures, msg, nonce));
        deposit_minimum = minimum_amount;

        emit Asset_Deposit_Minimum_Set(0, 0, minimum_amount);
    }

    function withdraw_asset(address asset_source, uint256 asset_id, uint256 amount, uint256 nonce, bytes memory signatures) public {
        require(asset_source == address(0) && asset_id == 0, "wrong asset, only (address(0),0) allowed for ETH");
        bytes memory msg = abi.encode(msg.sender, amount, nonce, 'withdraw_asset');
        require(MultisigControl(multisig_contract_address).verify_signatures(signatures, msg, nonce));

        address payable this_balance = address(uint160(address(this)));
        require(amount <= this_balance.balance);
        address(msg.sender).transfer(amount);

        emit Asset_Withdrawn(msg.sender, address(0), 0, amount);
    }

    function deposit_asset(address asset_source, uint256 asset_id, uint256 amount, byte32 vega_public_key) public payable {
        require(asset_source == address(0) && asset_id == 0, "wrong asset, only (address(0),0) allowed for ETH");
        require(msg.value >= asset_deposit_minimum);

        emit Asset_Deposited(msg.sender, address(0), 0, msg.value, vega_public_key);
    }

    function set_multisig_control(address new_multisig_contract_address) public onlyOwner {
        multisig_contract_address = new_multisig_contract_address;

        emit Multisig_Control_Set(new_multisig_contract_address);
    }

    function is_asset_whitelisted(address asset_source, uint256 asset_id) public view returns(uint256) {
        return asset_source == address(0) && asset_id == 0;
    }

    function get_deposit_minimum(address asset_source, uint256 asset_id) public view returns(uint256) {
        require(asset_source == address(0) && asset_id == 0, "wrong asset, only (address(0),0) allowed for ETH");
        return deposit_minimum;
    }

}
    /*
    //cuts down on spammers
    uint256 public asset_deposit_minimum;
    function get_deposit_minimum(address asset_source, uint256 asset_id) public view returns(uint256) {
        require(asset_source == address(0));
        require(asset_id == 0);
        return asset_deposit_minimum;
    }


    function withdraw(address asset_source, uint256 asset_id, uint256 amount, uint256 nonce, bytes memory signatures) {
        bytes32 msg_hash = get_message_hash(abi.encode(user, amt, nonce));
        require(MultisigControl(multisig_contract_address).verify_signatures(signatures, msg_hash));
        //TODO: process withdrawal

    }

    function set_asset_deposit_minimum(uint256 new_minimum) public onlyOwner {
        asset_deposit_minimum = new_minimum;
        emit Asset_Deposit_Minimum_Set(address(0), 0, new_minimum);
    }
    
    //user calls this with a wei value to deposit funds to the system
    //funds are held on contract
    function deposit_asset(bytes memory vega_public_key) public payable {
        require(msg.value >= asset_deposit_minimum);
        emit Asset_Deposited(msg.sender, address(0), 0, msg.value, vega_public_key);
    }

    mapping(bytes32=> bool) public used_unique_ids;
    function is_unique_id_used(bytes32 unique_id) public view returns(bool) {
        return used_unique_ids[unique_id];
    }

    //Events
    event Asset_Withdrawn(address indexed user_address, address indexed asset_source, uint256 indexed asset_id, uint256 amount);
    event Asset_Deposited(address indexed user_address, address indexed asset_source, uint256 indexed asset_id, uint256 amount);
    //These events use the same format: address, amount, blocktime
    //this will be the initial format for an even queue for the server/side chain to process
    

    event Asset_Deposit_Minimum_Set(address indexed asset_source, uint256 indexed asset_id, uint256 new_minimum);
    
    //NOTE in this model, we have no way of removing ETH off this contract, so if a user loses their keys, 
    //the eth locked to their address is stuck on this contract
    //this can be dealt with by making an onlyOwner function of "pull_eth" but then it gives us the opprotunity 
    //to be malicious, so I didn't add that function. This is advisarial thinking^3: even we are the enemy
}*/