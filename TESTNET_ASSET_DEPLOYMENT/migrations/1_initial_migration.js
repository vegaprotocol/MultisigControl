const Migrations = artifacts.require("Migrations");
const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");
const mass_dump = artifacts.require("mass_dump");
const Bridge = artifacts.require("IVega_Bridge");

const fs = require('fs');
const path = require('path');

//ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"

module.exports = async function(deployer) {
    await deployer.deploy(Migrations);

    let tdai_vega_id = "0x6d9d35f657589e40ddfb448b7ad4a7463b66efb307527fedd2aa7df1bbd5ea61";
    let tbtc_vega_id = "0x5cfa87844724df6069b94e4c8a6f03af21907d7bc251593d08e4251043ee9f7c";
    let tusdc_vega_id = "0x993ed98f4f770d91a796faab1738551193ba45c62341d20597df70fea6704ede";
    let teuro_vega_id = "0x460be4264be2d8e3d7a85696ec66d5c5a86e19617f7dc4ddfe127e30b3bfd620";

    let bridge_addresses = ["0x220091406A379cebfD0590fe234e23Efb6d0CBb2", "0xbE39479b1fE065Fdd3510E8997738eb22DfA3357", "0xf6C9d3e937fb2dA4995272C1aC3f3D466B7c23fC"];
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
        tdai_contract: tdai_contract.address,
        tbtc_contract:tbtc_contract.address,
        tusdc_contract: tusdc_contract.address,
        teuro_contract: teuro_contract.address,
        tvote_contract: tvote_contract.address,
        mass_dump_address: mass_dump.address
    };

    console.log(output_details);

    fs.writeFileSync('token_contracts.js', "module.exports = " + JSON.stringify(output_details) + ";");



};
