const MultisigControl = artifacts.require("MultisigControl");



///https://ethereum.stackexchange.com/questions/17551/how-to-upgrade-solidity-compiler-in-truffle
module.exports = function(deployer) {
    deployer.deploy(MultisigControl);
};
