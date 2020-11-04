pragma solidity ^0.5.0;


contract IVega_Bridge_Payable {

    event Asset_Withdrawn(uint256 nonce);
    event Asset_Deposited(bytes32 vega_public_key);
    event Asset_Deposit_Minimum_Set(uint256 new_minimum, uint256 nonce);
    event Asset_Whitelisted(bytes32 indexed vega_id, uint256 nonce);
    event Asset_Blacklisted(uint256 nonce);
    event Multisig_Control_Set(address indexed multisig_control_source);

    function set_deposit_minimum(uint256 nonce, uint256 minimum_amount, bytes memory signatures) public;
    function withdraw_asset(uint256 amount, uint256 expiry, uint256 nonce, bytes memory signatures) public;
    function deposit_asset(uint256 amount, bytes32 vega_public_key) public payable;
    function set_multisig_control(address new_multisig_contract_address) public;

    // VIEWS /////////////////
    function get_deposit_minimum() public view returns(uint256);
    function get_multisig_control_address() public view returns(address);
    function get_vega_id() public view returns(bytes32);

}