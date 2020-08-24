pragma solidity ^0.4.0;


import "./Ownable.sol";

import "./MultisigControl.sol";
contract Vega_Oracle_Out {



    address multisig_control_address;

    function set_multisig_control(address new_multisig_contract_address) public onlyOwner {
        multisig_control_address = new_multisig_contract_address;
        emit Multisig_Control_Set(new_multisig_contract_address);
    }


    //key => value
    mapping(uint16 => bytes) values;
    //key => owner
    mapping(uint16 => address) owners;
    //report_key => template_id
    mapping(uint256 => uint32) templates;
    //template_id => keys
    mapping(uint32 => uint16[keys]) data_templates;

    function publish_value(uint256 report_key, uint32 template_id, uint16[] values, uint256 timestamp, uint256 nonce, bytes memory signatures) public {
        //validate
        //save
        emit Values_Published(report_key, template_id, timestamp);
    }

    function get_value(uint256 report_key) public payable returns(bytes){

        return values();
        emit Values_Served(msg.sender);
    }


    event Values_Published(uint256 indexed report_key, uint32 indexed template_id, uint32 indexed timestamp);
    event Values_Served(uint256 indexed report_key);
    event Bounty_Posted(uint256 indexed template_id, uint256 indexed timestamp);
    event Bounty_Filled(uint256 indexed template_id, uint256 indexed timestamp);

}
