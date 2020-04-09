const MultisigControl = artifacts.require("MultisigControl");
const Vega_Bridge_ERC20 = artifacts.require("Vega_Bridge_ERC20");
const VUSD_TEST = artifacts.require("VUSD_TEST");


///https://ethereum.stackexchange.com/questions/17551/how-to-upgrade-solidity-compiler-in-truffle
module.exports = function(deployer) {
    deployer.deploy(MultisigControl);
    deployer.deploy(Vega_Bridge_ERC20);
    deployer.deploy(VUSD_TEST, "VUSD_TEST", "VUSD", 18, 1000000);

};

