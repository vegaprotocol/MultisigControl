pragma solidity ^0.5.0;


contract IERC20_Bridge_Logic {

    event Asset_Withdrawn(address indexed user_address, address indexed asset_source, uint256 indexed asset_id, uint256 amount, uint256 nonce);
    event Asset_Deposited(address indexed user_address, address indexed asset_source, uint256 indexed asset_id, uint256 amount, bytes32 vega_public_key);
    event Asset_Deposit_Minimum_Set(address indexed asset_source, uint256 indexed asset_id, uint256 new_minimum, uint256 nonce);
    event Asset_Listed(address indexed asset_source, uint256 indexed asset_id, bytes32 indexed vega_id, uint256 nonce);
    event Asset_Removed(address indexed asset_source, uint256 indexed asset_id, uint256 nonce);
    event Multisig_Control_Set(address indexed multisig_control_source);

    function list_asset(address asset_source, uint256 asset_id, bytes32 vega_id, uint256 nonce, bytes memory signatures) public;
    function remove_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public;
    function set_deposit_minimum(address asset_source, uint256 asset_id, uint256 nonce, uint256 minimum_amount, bytes memory signatures) public;
    function withdraw_asset(address asset_source, uint256 asset_id, uint256 amount, uint256 expiry, uint256 nonce, bytes memory signatures) public;
    function deposit_asset(address asset_source, uint256 asset_id, uint256 amount, bytes32 vega_public_key) public;

    // VIEWS /////////////////
    function is_asset_listed(address asset_source, uint256 asset_id) public view returns(bool);
    function get_deposit_minimum(address asset_source, uint256 asset_id) public view returns(uint256);
    function get_multisig_control_address() public view returns(address);
    function get_vega_id(address asset_source, uint256 asset_id) public view returns(bytes32);
    function get_asset_source_and_asset_id(bytes32 vega_id) public view returns(address, uint256);

}
