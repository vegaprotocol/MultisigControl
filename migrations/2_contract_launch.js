const MultisigControl = artifacts.require("MultisigControl");
const Vega_Bridge_ERC20 = artifacts.require("Vega_Bridge_ERC20");
const Vega_Bridge_ETH = artifacts.require("Vega_Bridge_ETH");
const VUSD_TEST = artifacts.require("VUSD_TEST");
const VUSD5_TEST = artifacts.require("VUSD5_TEST");


///https://ethereum.stackexchange.com/questions/17551/how-to-upgrade-solidity-compiler-in-truffle
module.exports = async function(deployer) {
    await deployer.deploy(MultisigControl);
    await deployer.deploy(Vega_Bridge_ERC20);

    await deployer.deploy(VUSD_TEST, "VUSD_TEST", "VUSD", 18, 1000000);
    await deployer.deploy(VUSD5_TEST, "VUSD5_TEST", "VUSD5", 5, 1000000);

    
    //TODO: remove this to vote it in properly
    //NOTE this will break the test
    let vega_bridge_erc20_instance = await Vega_Bridge_ERC20.deployed();
    let vega_bridge_eth_instance = await Vega_Bridge_ETH.deployed();
    await vega_bridge_erc20_instance.set_multisig_control(MultisigControl.address);

    //await vega_bridge_eth_instance.set_multisig_control(MultisigControl.address);
 //   await vega_bridge_erc20_instance.whitelist_asset_admin(VUSD_TEST.address, 0);

};
