const Migrations = artifacts.require("Migrations");
const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");
const IERC20_Bridge_Logic = artifacts.require("IERC20_Bridge_Logic");

let bridge_address_file = require("../../abis_and_addresses/bridge_addresses.json");
const fs = require('fs');
const path = require('path');

//ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"


module.exports = async function(deployer) {
    await deployer.deploy(Migrations);
    let is_ganache = true;
    for(let arg_idx = 0; arg_idx < process.argv.length; arg_idx++){

        if(process.argv[arg_idx] === 'ropsten'){
            console.log("Ropsten deploy, updating artifacts...");
            is_ganache = false;
        }
    }

    let tdai_vega_id = "0x6d9d35f657589e40ddfb448b7ad4a7463b66efb307527fedd2aa7df1bbd5ea61";
    let tbtc_vega_id = "0x5cfa87844724df6069b94e4c8a6f03af21907d7bc251593d08e4251043ee9f7c";
    let tusdc_vega_id = "0x993ed98f4f770d91a796faab1738551193ba45c62341d20597df70fea6704ede";
    let teuro_vega_id = "0x460be4264be2d8e3d7a85696ec66d5c5a86e19617f7dc4ddfe127e30b3bfd620";
    let tvote_vega_id = "0xf11862be7fc37c47372439f982a8f09912c4f995434120ff43ff51d9c34ef71a";


    let bridge_addresses = [bridge_address_file.logic_1, bridge_address_file.logic_2];
    let bridge_instances = [];
    console.log(bridge_addresses)

    for(let bridge_idx = 0; bridge_idx < bridge_addresses.length; bridge_idx++){
        bridge_instances.push(await IERC20_Bridge_Logic.at(bridge_addresses[bridge_idx]));
    }

    let tdai_contract = await deployer.deploy(Base_Faucet_Token, "Dai (test)", "tDAI", 5, "100000000000", "10000000000");
    let tbtc_contract = await deployer.deploy(Base_Faucet_Token, "BTC (test)", "tBTC", 5, "10000000000", "1000000");
    let tusdc_contract = await deployer.deploy(Base_Faucet_Token, "USDC (test)", "tUSDC", 5, "100000000000", "10000000000");
    let teuro_contract = await deployer.deploy(Base_Faucet_Token, "EURO (test)", "tEURO", 5, "100000000000", "10000000000");
    let tvote_contract = await deployer.deploy(Base_Faucet_Token, "VOTE (test)", "tVOTE", 5, "6400000", "1");

    let output_details = {
        tdai_contract: tdai_contract.address,
        tbtc_contract:tbtc_contract.address,
        tusdc_contract: tusdc_contract.address,
        teuro_contract: teuro_contract.address,
        tvote_contract: tvote_contract.address
    };

    console.log(output_details);
    //add to local directory for asset scripts
    fs.writeFileSync('./abis_and_addresses/token_contracts.json', JSON.stringify(output_details));
    fs.writeFileSync('./abis_and_addresses/Base_Faucet_Token_ABI.json', JSON.stringify(Base_Faucet_Token.abi));

    //add to parent directory for bridge scripts/convenient location
    fs.writeFileSync('../abis_and_addresses/token_contracts.json', JSON.stringify(output_details));
    fs.writeFileSync('../abis_and_addresses/Base_Faucet_Token_ABI.json', JSON.stringify(Base_Faucet_Token.abi));


    if(!is_ganache){
        fs.writeFileSync('../ropsten_deploy_details/token_contracts.json', JSON.stringify(output_details));
        fs.writeFileSync('../ropsten_deploy_details/Base_Faucet_Token_ABI.json', JSON.stringify(Base_Faucet_Token.abi));
    }

};
