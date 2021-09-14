const path = require('path')

const MultisigControl = artifacts.require("MultisigControl");
const ERC20_Asset_Pool = artifacts.require("ERC20_Asset_Pool");
const ERC20_Bridge_Logic = artifacts.require("ERC20_Bridge_Logic");
const ETH_Asset_Pool = artifacts.require("ETH_Asset_Pool");
const ETH_Bridge_Logic = artifacts.require("ETH_Bridge_Logic");

console.log(__dirname);
console.log();
const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");
const fs = require('fs');

let copy = require('recursive-copy');

let root_path =  'ropsten_deploy_details/';

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
                throw ("Bad network choice, -network ropsten --vega [test|stag|dev]");
        }
    }
}
if(!is_ganache && net === "local"){
    throw ("Bad network choice, truffle migrate --network ropsten --vega [test|stag|dev] OR truffle migrate");
}
root_path += net + "/";




let test_token_address;
///https://ethereum.stackexchange.com/questions/17551/how-to-upgrade-solidity-compiler-in-truffle
module.exports = async function(deployer) {

    if(net === "local") {
      await deployer.deploy(Base_Faucet_Token, "Test", "TEST", 5, "0","10000000000");
      test_token_address = Base_Faucet_Token.address;
    }
    await deployer.deploy(MultisigControl);
    await deployer.deploy(ERC20_Asset_Pool, MultisigControl.address);
    let logic_1 = await deployer.deploy(ERC20_Bridge_Logic, ERC20_Asset_Pool.address, MultisigControl.address);
    let logic_2 = await deployer.deploy(ERC20_Bridge_Logic, ERC20_Asset_Pool.address, MultisigControl.address);

    console.log(logic_1.address);
    console.log(logic_2.address);

    let erc20_asset_pool_instance = await ERC20_Asset_Pool.deployed();
    let erc20_bridge_logic_instance = await ERC20_Bridge_Logic.deployed();

    /****** ETH Bridge*/
    await deployer.deploy(ETH_Asset_Pool, MultisigControl.address);
    await deployer.deploy(ETH_Bridge_Logic, ETH_Asset_Pool.address, MultisigControl.address);

    /*********/

    //save logic addresses and ABIs
    let bridge_addresses = {
        multisig_control: MultisigControl.address,
        asset_pool: ERC20_Asset_Pool.address,
        logic_1:logic_1.address,
        logic_2:logic_2.address,
        test_token_address:test_token_address,
        eth_asset_pool: ETH_Asset_Pool.address,
        eth_bridge_logic: ETH_Bridge_Logic.address
    };


    console.log("Saving files for " + net + " net");
    fs.writeFileSync(root_path +'bridge_addresses.json',  JSON.stringify(bridge_addresses));
    //fs.writeFileSync(root_path + 'MultisigControl_ABI.json',  JSON.stringify(MultisigControl.abi));
    //fs.writeFileSync(root_path + 'ERC20_Asset_Pool_ABI.json',  JSON.stringify(ERC20_Asset_Pool.abi));
    //fs.writeFileSync(root_path + 'ERC20_Bridge_Logic_ABI.json',  JSON.stringify(ERC20_Bridge_Logic.abi));

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
