const MultisigControl = artifacts.require("MultisigControl");
const ERC20_Asset_Pool = artifacts.require("ERC20_Asset_Pool");
const ERC20_Bridge_Logic = artifacts.require("ERC20_Bridge_Logic");

const VUSD5_TEST = artifacts.require("VUSD5_TEST");


///https://ethereum.stackexchange.com/questions/17551/how-to-upgrade-solidity-compiler-in-truffle
module.exports = async function(deployer) {
    await deployer.deploy(MultisigControl);
    await deployer.deploy(ERC20_Asset_Pool, MultisigControl.address);
    let logic_1 = await deployer.deploy(ERC20_Bridge_Logic, ERC20_Asset_Pool.address, MultisigControl.address);
    let logic_2 = await deployer.deploy(ERC20_Bridge_Logic, ERC20_Asset_Pool.address, MultisigControl.address);

    console.log(logic_1.address);
    console.log(logic_2.address);

    await deployer.deploy(VUSD5_TEST, "VUSD5_TEST", "VUSD5", 5, 1000000);
    
    //TODO: remove this to vote it in properly
    //NOTE this will break the test
    let erc20_asset_pool_instance = await ERC20_Asset_Pool.deployed();
    let erc20_bridge_logic_instance = await ERC20_Bridge_Logic.deployed();


    await erc20_asset_pool_instance.set_bridge_address_admin(logic_1.address);

    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    console.log(logic_1.address)
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
};

