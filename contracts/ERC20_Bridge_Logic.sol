//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

import "./SafeMath.sol";
import "./IERC20.sol";
import "./IERC20_Bridge_Logic.sol";
import "./MultisigControl.sol";
import "./ERC20_Asset_Pool.sol";

contract ERC20_Bridge_Logic is IERC20_Bridge_Logic {
    //stops overflow
    using SafeMath for uint256;

    address multisig_control_address;
    address erc20_asset_pool_address;
    mapping(address => bool) listed_tokens;
    mapping(address => uint256) minimum_deposits;

    constructor(address erc20_asset_pool, address multisig_control) {
        erc20_asset_pool_address = erc20_asset_pool;
        multisig_control_address = multisig_control;
    }

    //vega_id => asset_source
    mapping(bytes32 => address) vega_ids_to_source;
    mapping(address => bytes32) asset_source_to_vega_id;

    function list_asset(address asset_source, bytes32 vega_id, uint256 nonce, bytes memory signatures) public override {
        require(!listed_tokens[asset_source], "asset already listed");
        bytes memory message = abi.encode(asset_source, vega_id, nonce, 'list_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        listed_tokens[asset_source] = true;
        vega_ids_to_source[vega_id] = asset_source;
        asset_source_to_vega_id[asset_source] = vega_id;
        emit Asset_Listed(asset_source, vega_id, nonce);
    }
    function remove_asset(address asset_source, uint256 nonce, bytes memory signatures) public override {
        require(listed_tokens[asset_source], "asset not listed");
        bytes memory message = abi.encode(asset_source, nonce, 'remove_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        listed_tokens[asset_source] = false;
        emit Asset_Removed(asset_source, nonce);
    }
    function set_deposit_minimum(address asset_source, uint256 minimum_amount, uint256 nonce, bytes memory signatures) public override{
        require(listed_tokens[asset_source], "asset not listed");

        bytes memory message = abi.encode(asset_source, minimum_amount, nonce, 'set_deposit_minimum');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce));
        minimum_deposits[asset_source] = minimum_amount;
        emit Asset_Deposit_Minimum_Set(asset_source, minimum_amount, nonce);

    }
    function withdraw_asset(address asset_source, uint256 amount, uint256 expiry, uint256 nonce, bytes memory signatures) public  override{
        require(expiry > block.timestamp, "withdrawal has expired");

        bytes memory message = abi.encode(asset_source, amount, expiry, msg.sender,  nonce, 'withdraw_asset');
        require(MultisigControl(multisig_control_address).verify_signatures(signatures, message, nonce), "bad signatures");

        require(ERC20_Asset_Pool(erc20_asset_pool_address).withdraw(asset_source, msg.sender, amount), "token didn't transfer, rejected by asset pool.");

        emit Asset_Withdrawn(msg.sender, asset_source, amount, nonce);
    }
    function deposit_asset(address asset_source, uint256 amount, bytes32 vega_public_key) public override {
        require(listed_tokens[asset_source], "asset not listed");
        //User must run approve before deposit

        require(amount >= minimum_deposits[asset_source], "deposit below minimum");
        require(IERC20(asset_source).transferFrom(msg.sender, erc20_asset_pool_address, amount), "transfer failed in deposit");

        emit Asset_Deposited(msg.sender, asset_source, amount, vega_public_key);
    }

    // VIEWS /////////////////
    function is_asset_listed(address asset_source) public override view returns(bool){
        return listed_tokens[asset_source];
    }
    function get_deposit_minimum(address asset_source) public override view returns(uint256){
        return minimum_deposits[asset_source];
    }
    function get_multisig_control_address() public override view returns(address) {
        return multisig_control_address;
    }
    function get_vega_id(address asset_source) public override view returns(bytes32){
        return asset_source_to_vega_id[asset_source];
    }
    function get_asset_source(bytes32 vega_id) public override view returns(address){
        return vega_ids_to_source[vega_id];
    }


}
