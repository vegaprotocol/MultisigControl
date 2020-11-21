let Base_Faucet_Token_ABI = require("./abis_and_addresses/Base_Faucet_Token_ABI.json");
let pool_abi = require("../abis_and_addresses/ERC20_Asset_Pool_ABI.json");
let bridge_abi = require("../abis_and_addresses/ERC20_Bridge_Logic_ABI.json");
let bridge_address_file = require("../abis_and_addresses/bridge_addresses.json");

const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');


//////////////////////////////////////////////ROPSTEN
/*
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
*/
/////////////////////////////////////////////END ROPSTEN
let web3_instance = new Web3('http://localhost:8545');

let token_contracts = require("./abis_and_addresses/token_contracts.json");


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


    let bridge_addresses = [bridge_address_file.logic_1, bridge_address_file.logic_2];

    for(let bridge_idx = 0; bridge_idx < bridge_addresses.length; bridge_idx++){
        let bridge_instance = new web3_instance.eth.Contract(bridge_abi, bridge_addresses[bridge_idx]);
        try {
            await bridge_instance.methods.list_asset_admin(token_contracts.tdai_contract, 0, tdai_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) {console.log(e) }
        try {
            await bridge_instance.methods.list_asset_admin(token_contracts.tbtc_contract, 0, tbtc_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) {console.log(e) }
        try {
            await bridge_instance.methods.list_asset_admin(token_contracts.tusdc_contract, 0, tusdc_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) {console.log(e) }
        try {
            await bridge_instance.methods.list_asset_admin(token_contracts.teuro_contract, 0, teuro_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) {console.log(e) }
        try {
            await bridge_instance.methods.list_asset_admin(token_contracts.tvote_contract, 0, tvote_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) {console.log(e) }
    }


    let tdai_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_contracts.tdai_contract);
    let tbtc_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_contracts.tbtc_contract);
    let tusdc_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_contracts.tusdc_contract);
    let teuro_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_contracts.teuro_contract);
    let tvote_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_contracts.tvote_contract);


}


configure_assets()