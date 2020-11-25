const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');
const HDWalletProvider = require("@truffle/hdwallet-provider");


let root_path =  "../ropsten_deploy_details/";

let is_ganache = true;
let net = "local";
for(let arg_idx = 0; arg_idx < process.argv.length; arg_idx++){

    if(process.argv[arg_idx] === 'ropsten'){
        console.log("Ropsten detected");
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
                throw ("Bad network choice, -network ropsen --vega [test|stag|dev]");
        }
    }
}
if(!is_ganache && net === "local"){
    throw ("Bad network choice, truffle migrate --network ropsen --vega [test|stag|dev] OR truffle migrate");
}
root_path += net + "/";

let web3_instance;
if(is_ganache){
    console.log("using ganache...")
    web3_instance = new Web3("http://localhost:8545");
} else {
    console.log("using ropsten...")
    let ropsten_infura = "https://ropsten.infura.io/v3/d98154612ecd408ca30d9756a9add9fd";

    web3_instance = new Web3(new HDWalletProvider({
        mnemonic: {
            phrase: "cherry manage trip absorb logic half number test shed logic purpose rifle"
        },
        providerOrUrl: ropsten_infura
    }));
}

let Base_Faucet_Token_ABI = require(root_path + "Base_Faucet_Token_ABI.json");
let pool_abi = require(root_path + "ERC20_Asset_Pool_ABI.json");
let bridge_abi = require(root_path + "ERC20_Bridge_Logic_ABI.json");
let bridge_address_file = require(root_path + "bridge_addresses.json");
let token_addresses = require(root_path + "token_addresses.json");


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
    let teuro_vega_id = "0x8b52d4a3a4b0ffe733cddbc2b67be273816cfeb6ca4c8b339bac03ffba08e4e4";
    let tvote_vega_id = "0xf11862be7fc37c47372439f982a8f09912c4f995434120ff43ff51d9c34ef71a";


    let bridge_addresses = [bridge_address_file.logic_1, bridge_address_file.logic_2];

    for(let bridge_idx = 0; bridge_idx < bridge_addresses.length; bridge_idx++){
        let bridge_instance = new web3_instance.eth.Contract(bridge_abi, bridge_addresses[bridge_idx]);
        try {
            console.log("listing tdai on bridge:"+bridge_addresses[bridge_idx]+"...");
            await bridge_instance.methods.list_asset_admin(token_addresses.tdai_contract, 0, tdai_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) { }
        try {
            console.log("listing tbtc on bridge:"+bridge_addresses[bridge_idx]+"...");
            await bridge_instance.methods.list_asset_admin(token_addresses.tbtc_contract, 0, tbtc_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) { }
        try {
            console.log("listing tusdc on bridge:"+bridge_addresses[bridge_idx]+"...");
            await bridge_instance.methods.list_asset_admin(token_addresses.tusdc_contract, 0, tusdc_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) { }
        try {
            console.log("listing teuro on bridge:"+bridge_addresses[bridge_idx]+"...");
            await bridge_instance.methods.list_asset_admin(token_addresses.teuro_contract, 0, teuro_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) { }
        try {
            console.log("listing tvote on bridge:"+bridge_addresses[bridge_idx]+"...");
            await bridge_instance.methods.list_asset_admin(token_addresses.tvote_contract, 0, tvote_vega_id).send({from:wallet_address, gasPrice:"150000000000"});
        } catch (e) { }
    }


    let tdai_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_addresses.tdai_contract);
    let tbtc_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_addresses.tbtc_contract);
    let tusdc_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_addresses.tusdc_contract);
    let teuro_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_addresses.teuro_contract);
    let tvote_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_addresses.tvote_contract);


}


configure_assets()