//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.6;

unit tests
abstract contract IERC20_Bridge_Logic {

    event Asset_Withdrawn(address indexed user_address, address indexed asset_source, uint256 amount, uint256 nonce);
    event Asset_Deposited(address indexed user_address, address indexed asset_source, uint256 amount, bytes32 vega_public_key);
    event Asset_Deposit_Minimum_Set(address indexed asset_source,  uint256 new_minimum, uint256 nonce);
    event Asset_Deposit_Maximum_Set(address indexed asset_source,  uint256 new_maximum, uint256 nonce);
    event Asset_Listed(address indexed asset_source,  bytes32 indexed vega_asset_id, uint256 nonce);
    event Asset_Removed(address indexed asset_source,  uint256 nonce);

    function list_asset(address asset_source, bytes32 vega_asset_id, uint256 nonce, bytes memory signatures) public virtual;
    function remove_asset(address asset_source, uint256 nonce, bytes memory signatures) public virtual;
    function set_deposit_minimum(address asset_source, uint256 minimum_amount, uint256 nonce, bytes memory signatures) public virtual;
    function set_deposit_maximum(address asset_source, uint256 maximum_amount, uint256 nonce, bytes memory signatures) public virtual;
    function withdraw_asset(address asset_source, uint256 amount, uint256 expiry, address target, uint256 nonce, bytes memory signatures) public virtual;
    function deposit_asset(address asset_source,uint256 amount, bytes32 vega_public_key) public virtual;

    // VIEWS /////////////////
    function is_asset_listed(address asset_source) public virtual view returns(bool);
    function get_deposit_minimum(address asset_source) public virtual view returns(uint256);
    function get_deposit_maximum(address asset_source) public virtual view returns(uint256);
    function get_multisig_control_address() public virtual view returns(address);
    function get_vega_asset_id(address asset_source) public virtual view returns(bytes32);
    function get_asset_source(bytes32 vega_asset_id) public virtual view returns(address);

}

/*MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM...............MMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM...............MMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMM....................MMMMMNNMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMM....................MMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMM88=........................+MMMMMMMMMM
MMMMMMMMMMMMMMMMM....................MMMMM...MMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMM....................MMMMM...MMMMMMMMMMMMMMM
MMMMMMMMMMMM.........................MM+..MMM....+MMMMMMMMMM
MMMMMMMMMNMM...................... ..MM?..MMM.. .+MMMMMMMMMM
MMMMNDDMM+........................+MM........MM..+MMMMMMMMMM
MMMMZ.............................+MM....................MMM
MMMMZ.............................+MM....................MMM
MMMMZ.............................+MM....................DDD
MMMMZ.............................+MM..ZMMMMMMMMMMMMMMMMMMMM
MMMMZ.............................+MM..ZMMMMMMMMMMMMMMMMMMMM
MM..............................MMZ....ZMMMMMMMMMMMMMMMMMMMM
MM............................MM.......ZMMMMMMMMMMMMMMMMMMMM
MM............................MM.......ZMMMMMMMMMMMMMMMMMMMM
MM......................ZMMMMM.......MMMMMMMMMMMMMMMMMMMMMMM
MM............... ......ZMMMMM.... ..MMMMMMMMMMMMMMMMMMMMMMM
MM...............MMMMM88~.........+MM..ZMMMMMMMMMMMMMMMMMMMM
MM.......$DDDDDDD.......$DDDDD..DDNMM..ZMMMMMMMMMMMMMMMMMMMM
MM.......$DDDDDDD.......$DDDDD..DDNMM..ZMMMMMMMMMMMMMMMMMMMM
MM.......ZMMMMMMM.......ZMMMMM..MMMMM..ZMMMMMMMMMMMMMMMMMMMM
MMMMMMMMM+.......MMMMM88NMMMMM..MMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMM+.......MMMMM88NMMMMM..MMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM*/
