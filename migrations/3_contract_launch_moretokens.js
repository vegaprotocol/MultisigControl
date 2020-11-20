const fs = require('fs');
const path = require('path');

const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");
const mass_dump = artifacts.require("mass_dump");
const Bridge = artifacts.require("IVega_Bridge");

module.exports = async function(deployer) {
    let bridge_addresses = [
        // "0x220091406A379cebfD0590fe234e23Efb6d0CBb2",
        // "0xbE39479b1fE065Fdd3510E8997738eb22DfA3357",
        // "0xf6C9d3e937fb2dA4995272C1aC3f3D466B7c23fC"
        "0x3EA59801698c6820328597F26d29fC3EaAa17AcA",  // Vega_Bridge_ERC20 (cherry manage ... rifle)
    ];
    let bridge_instances = [];

    for(let bridge_idx = 0; bridge_idx < bridge_addresses.length; bridge_idx++){
        bridge_instances.push(await Bridge.at(bridge_addresses[bridge_idx]));
    }

    await deployer.deploy(mass_dump, bridge_addresses[0]);

    let tdai_contract = await deployer.deploy(Base_Faucet_Token, "Dai (test)", "tDAI", 5, "100000000000", "10000000000");
    let tbtc_contract = await deployer.deploy(Base_Faucet_Token, "BTC (test)", "tBTC", 5, "10000000000", "1000000");
    let tusdc_contract = await deployer.deploy(Base_Faucet_Token, "USDC (test)", "tUSDC", 5, "100000000000", "10000000000");
    let teuro_contract = await deployer.deploy(Base_Faucet_Token, "EURO (test)", "tEURO", 5, "100000000000", "10000000000");
    let tvote_contract = await deployer.deploy(Base_Faucet_Token, "VOTE (test)", "tVOTE", 5, "6400000", "1");

    let output_details = {
        "mass_dump": mass_dump.address,
        "tdai_contract": tdai_contract.address,
        "tbtc_contract": tbtc_contract.address,
        "tusdc_contract": tusdc_contract.address,
        "teuro_contract": teuro_contract.address,
        "tvote_contract": tvote_contract.address
    };

    console.log(output_details);

    fs.writeFileSync('token_contracts.js', "module.exports = " + JSON.stringify(output_details) + ";");
};
