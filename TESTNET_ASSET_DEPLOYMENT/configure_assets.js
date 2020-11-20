let erc20_token_abi = require("./abis/erc20_token_abi.js");
let bridge_abi = require("./abis/Vega_Bridge_ERC20.js");

const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');


//////////////////////////////////////////////ROPSTEN
const HDWalletProvider = require("@truffle/hdwallet-provider");
let ropsten_infura = "https://ropsten.infura.io/v3/d98154612ecd408ca30d9756a9add9fd";
let mnemonic = "cherry manage trip absorb logic half number test shed logic purpose rifle";
let provider = new HDWalletProvider({
    mnemonic: {
        phrase: mnemonic
    },
    providerOrUrl: ropsten_infura
});

let web3_instance = new Web3(provider);
/////////////////////////////////////////////END ROPSTEN


let token_contracts = require("./token_contracts");


let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;
async function configure_assets() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();

    let tdai_vega_id = "0x6d9d35f657589e40ddfb448b7ad4a7463b66efb307527fedd2aa7df1bbd5ea61";
    let tbtc_vega_id = "0x5cfa87844724df6069b94e4c8a6f03af21907d7bc251593d08e4251043ee9f7c";
    let tusdc_vega_id = "0x993ed98f4f770d91a796faab1738551193ba45c62341d20597df70fea6704ede";
    let teuro_vega_id = "0x460be4264be2d8e3d7a85696ec66d5c5a86e19617f7dc4ddfe127e30b3bfd620";
    let tvote_vega_id = "0xf11862be7fc37c47372439f982a8f09912c4f995434120ff43ff51d9c34ef71a"

    let bridge_addresses = ["0x220091406A379cebfD0590fe234e23Efb6d0CBb2", "0xbE39479b1fE065Fdd3510E8997738eb22DfA3357", "0xf6C9d3e937fb2dA4995272C1aC3f3D466B7c23fC"];
    for(let bridge_idx = 0; bridge_idx < bridge_addresses.length; bridge_idx++){
        let bridge_instance = new web3_instance.eth.Contract(bridge_abi, bridge_addresses[bridge_idx]);
        try {
            await bridge_instance.methods.whitelist_asset_admin(token_contracts.tdai_contract, 0, tdai_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) {console.log(e) }
        try {
            await bridge_instance.methods.whitelist_asset_admin(token_contracts.tbtc_contract, 0, tbtc_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) {console.log(e) }
        try {
            await bridge_instance.methods.whitelist_asset_admin(token_contracts.tusdc_contract, 0, tusdc_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) {console.log(e) }
        try {
            await bridge_instance.methods.whitelist_asset_admin(token_contracts.teuro_contract, 0, teuro_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) {console.log(e) }
        try {
            await bridge_instance.methods.whitelist_asset_admin(token_contracts.tvote_contract, 0, tvote_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) {console.log(e) }
    }


    let tdai_instance = new web3_instance.eth.Contract(erc20_token_abi, token_contracts.tdai_contract);
    let tbtc_instance = new web3_instance.eth.Contract(erc20_token_abi, token_contracts.tbtc_contract);
    let tusdc_instance = new web3_instance.eth.Contract(erc20_token_abi, token_contracts.tusdc_contract);
    let teuro_instance = new web3_instance.eth.Contract(erc20_token_abi, token_contracts.teuro_contract);
    let tvote_instance = new web3_instance.eth.Contract(erc20_token_abi, token_contracts.tvote_contract);

    //issue each to wallet_address
    console.log("issuing tdai...");
    try {
        await tdai_instance.methods.issue(token_contracts.mass_dump_address, await tdai_instance.methods.balanceOf(token_contracts.tdai_contract).call()).send({from:wallet_address, gasPrice:"150000000000" });
    }catch (e) { console.log(e) }
    console.log("issuing tbtc...");
    try {
        await tbtc_instance.methods.issue(token_contracts.mass_dump_address, await tbtc_instance.methods.balanceOf(token_contracts.tbtc_contract).call()).send({from:wallet_address, gasPrice:"150000000000" });
    }catch (e) { console.log(e)  }
    console.log("issuing tusdc...");
    try {
        await tusdc_instance.methods.issue(token_contracts.mass_dump_address, await tusdc_instance.methods.balanceOf(token_contracts.tusdc_contract).call()).send({from:wallet_address, gasPrice:"150000000000" });
    }catch (e) {  console.log(e) }
    console.log("issuing teuro...");
    try {
        await teuro_instance.methods.issue(token_contracts.mass_dump_address, await teuro_instance.methods.balanceOf( token_contracts.teuro_contract).call()).send({from:wallet_address, gasPrice:"150000000000" });
    }catch (e) { console.log(e)  }
    console.log("issuing tvote...");
    try {
        await tvote_instance.methods.issue(token_contracts.mass_dump_address, await tvote_instance.methods.balanceOf(token_contracts.tvote_contract).call()).send({from:wallet_address, gasPrice:"150000000000" });
    }catch (e) { console.log(e)  }
}


configure_assets()