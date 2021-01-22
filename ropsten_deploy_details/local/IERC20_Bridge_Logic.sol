//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

/// @title ERC20 Bridge Logic Interface
/// @author Vega Protocol
/// @notice Implementations of this interface are used by Vega network users to deposit and withdraw ERC20 tokens to/from Vega.
/// @notice All funds deposited/withdrawn are to/from the ERC20_Asset_Pool
abstract contract IERC20_Bridge_Logic {

    event Asset_Withdrawn(address indexed user_address, address indexed asset_source, uint256 amount, uint256 nonce);
    event Asset_Deposited(address indexed user_address, address indexed asset_source, uint256 amount, bytes32 vega_public_key);
    event Asset_Deposit_Minimum_Set(address indexed asset_source,  uint256 new_minimum, uint256 nonce);
    event Asset_Listed(address indexed asset_source,  bytes32 indexed vega_id, uint256 nonce);
    event Asset_Removed(address indexed asset_source,  uint256 nonce);

    function list_asset(address asset_source, bytes32 vega_id, uint256 nonce, bytes memory signatures) public virtual;
    function remove_asset(address asset_source, uint256 nonce, bytes memory signatures) public virtual;
    function set_deposit_minimum(address asset_source, uint256 minimum_amount, uint256 nonce, bytes memory signatures) public virtual;
    function withdraw_asset(address asset_source, uint256 amount, uint256 expiry, uint256 nonce, bytes memory signatures) public virtual;
    function deposit_asset(address asset_source,uint256 amount, bytes32 vega_public_key) public virtual;

    // VIEWS /////////////////
    function is_asset_listed(address asset_source) public virtual view returns(bool);
    function get_deposit_minimum(address asset_source) public virtual view returns(uint256);
    function get_multisig_control_address() public virtual view returns(address);
    function get_vega_id(address asset_source) public virtual view returns(bytes32);
    function get_asset_source(bytes32 vega_id) public virtual view returns(address);

}
