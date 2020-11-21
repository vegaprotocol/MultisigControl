const MultisigControl = artifacts.require("MultisigControl");
const ERC20_Asset_Pool = artifacts.require("ERC20_Asset_Pool");
const ERC20_Bridge_Logic = artifacts.require("ERC20_Bridge_Logic");
const fs = require('fs');

///https://ethereum.stackexchange.com/questions/17551/how-to-upgrade-solidity-compiler-in-truffle
module.exports = async function(deployer) {
    await deployer.deploy(MultisigControl);
    await deployer.deploy(ERC20_Asset_Pool, MultisigControl.address);
    let logic_1 = await deployer.deploy(ERC20_Bridge_Logic, ERC20_Asset_Pool.address, MultisigControl.address);
    let logic_2 = await deployer.deploy(ERC20_Bridge_Logic, ERC20_Asset_Pool.address, MultisigControl.address);

    console.log(logic_1.address);
    console.log(logic_2.address);

    let erc20_asset_pool_instance = await ERC20_Asset_Pool.deployed();
    let erc20_bridge_logic_instance = await ERC20_Bridge_Logic.deployed();

    await erc20_asset_pool_instance.set_bridge_address_admin(logic_1.address);

    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    console.log(logic_1.address)
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")


    //save logic addresses and ABIs
    console.log(MultisigControl.abi)
    console.log(MultisigControl.address)
    let bridge_addresses = {
        multisig_control: MultisigControl.address,
        asset_pool: ERC20_Asset_Pool.address,
        logic_1:logic_1.address,
        logic_2:logic_2.address
    };

    console.log("Saving files")
    fs.writeFileSync('abis_and_addresses/bridge_addresses.json',  JSON.stringify(bridge_addresses));
    fs.writeFileSync('abis_and_addresses/MultisigControl_ABI.json',  JSON.stringify(MultisigControl.abi));
    fs.writeFileSync('abis_and_addresses/ERC20_Asset_Pool_ABI.json',  JSON.stringify(ERC20_Asset_Pool.abi));
    fs.writeFileSync('abis_and_addresses/ERC20_Bridge_Logic_ABI.json',  JSON.stringify(ERC20_Bridge_Logic.abi));
};