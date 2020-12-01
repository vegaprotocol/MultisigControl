const Migrations = artifacts.require("Migrations");
const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");
const IERC20_Bridge_Logic = artifacts.require("IERC20_Bridge_Logic");


const fs = require('fs');
const path = require('path');

//ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"

let copy = require('recursive-copy');
let root_path =  '../ropsten_deploy_details/';

let is_ganache = true;
let net = "local";
for(let arg_idx = 0; arg_idx < process.argv.length; arg_idx++){

    if(process.argv[arg_idx] === 'ropsten'){
        console.log("Ropsten deploy, updating artifacts...");
        is_ganache = false;
    }

    if(process.argv[arg_idx] === '--vega'){
        net = process.argv[arg_idx + 1];

        switch(net){
            case "test":
                break;
            case "stag":
                break;
            case "dev":
                break;
            default:
                throw ("Bad network choice, -network ropsen --vega [test|stag|dev]");
        }
    }
}
if(!is_ganache && net === "local"){
    throw ("Bad network choice, truffle migrate --network ropsen --vega [test|stag|dev] OR truffle migrate");
}
root_path += net + "/";

let bridge_address_file = require("../" + root_path+"bridge_addresses.json");

module.exports = async function(deployer) {
    await deployer.deploy(Migrations);
    let is_ganache = true;
    for(let arg_idx = 0; arg_idx < process.argv.length; arg_idx++){

        if(process.argv[arg_idx] === 'ropsten'){
            console.log("Ropsten deploy, updating artifacts...");
            is_ganache = false;
        }
    }

    let bridge_addresses = [bridge_address_file.logic_1, bridge_address_file.logic_2];
    let bridge_instances = [];
    console.log(bridge_addresses)

    for(let bridge_idx = 0; bridge_idx < bridge_addresses.length; bridge_idx++){
        bridge_instances.push(await IERC20_Bridge_Logic.at(bridge_addresses[bridge_idx]));
    }

    let tdai_contract = await deployer.deploy(Base_Faucet_Token, "Dai ("+net+")", "tDAI", 5, "0", "10000000000");
    let tbtc_contract = await deployer.deploy(Base_Faucet_Token, "BTC ("+net+")", "tBTC", 5, "0", "1000000");
    let tusdc_contract = await deployer.deploy(Base_Faucet_Token, "USDC ("+net+")", "tUSDC", 5, "0", "10000000000");
    let teuro_contract = await deployer.deploy(Base_Faucet_Token, "EURO ("+net+")", "tEURO", 5, "0", "10000000000");
    let tvote_contract = await deployer.deploy(Base_Faucet_Token, "VOTE ("+net+")", "tVOTE", 5, "6400000", "1");

    let output_details = {
        tdai_contract: tdai_contract.address,
        tbtc_contract:tbtc_contract.address,
        tusdc_contract: tusdc_contract.address,
        teuro_contract: teuro_contract.address,
        tvote_contract: tvote_contract.address
    };


    console.log("Saving files for " + net + " net");
    fs.writeFileSync(root_path + 'token_addresses.json', JSON.stringify(output_details));


    copy("./contracts", root_path, {overwrite: true}, function(error, results) {
        if (error) {
            console.error('Copy failed: ' + error);
        } else {
            console.info('Copied ' + results.length + ' files');
        }
    });

    let abi_path = "./build/contracts/";
    const files = await fs.promises.readdir(  abi_path);
    // Loop them all with the new for...of
    for( const file of files ) {
        let split_name = file.split('.');
        if(split_name[1] === "json"){
            try {
                let json_file = require("../" + abi_path + file);
                let new_path = root_path + split_name[0] + "_ABI." + split_name[1]
                console.log("New Path: " + new_path);

                fs.writeFileSync(new_path,  JSON.stringify(json_file.abi));
            }catch (e) {
                console.log("Error: ")
                console.log(e);
            }
        }
    }
};
