const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');
const HDWalletProvider = require("@truffle/hdwallet-provider");
const fetch = require('node-fetch');

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
                throw ("Bad network choice, -network ropsten --vega [test|stag|dev]");
        }
    }
}
if(!is_ganache && net === "local"){
    throw ("Bad network choice, truffle migrate --network ropsten --vega [test|stag|dev] OR truffle migrate");
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

//let bridge_abi = require("abis/ERC20_Bridge_Logic_ABI.js");
let bridge_abi = require(root_path + "ERC20_Bridge_Logic_ABI.json");
let token_abi = require(root_path + "Base_Faucet_Token_ABI.json");
let bridge_address_file = require(root_path +"bridge_addresses.json");

let token_addresses = require(root_path+"token_addresses.json");


let bridge_address = bridge_address_file.logic_1;

let chunk_size = 15;

let payouts = {};

payouts[token_addresses.tdai_contract] = "10000000000000";
payouts[token_addresses.tusdc_contract] = "10000000000000";
payouts[token_addresses.teuro_contract] = "10000000000000";
payouts[token_addresses.tbtc_contract] = "100000000000";
payouts[token_addresses.tvote_contract] = "1000000000";
/*
payouts[token_addresses.tdai_contract] = "1";
payouts[token_addresses.tusdc_contract] = "1";
payouts[token_addresses.teuro_contract] = "1";
payouts[token_addresses.tbtc_contract] = "1";
payouts[token_addresses.tvote_contract] = "1";
*/


let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;
async function run_deposit() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();

    //TODO: fix this:
    let bot_configs_url = "https://bots.vegaprotocol.io/devnet/traders-settlement";
    if(net !== "local"){
        bot_configs_url = "https://bots.vegaprotocol.io/"+net+"net/traders-settlement";
    }

    let bot_configs = await (await fetch(bot_configs_url, {method:"Get"})).json();
    console.log(bot_configs)
    let bundled_bots = {};

    for(let bot_idx = 0; bot_idx < bot_configs.length; bot_idx++){
        let this_bot = bot_configs[bot_idx];

        ////// NOTE this is a hack that will do nothing once the bot_configs picks up the new addresses, for now I'm using this to test
        //TODO remove hack
        switch(this_bot.settlementEthereumContractAddress) {
            case "0xBe3304136265290BDdBc0930CB6F26c3428929e2":
                this_bot.settlementEthereumContractAddress = token_addresses.tdai_contract;
                break;
            case "0x7778F85d0Ceb51950cD9AE24086af723069865fC":
                this_bot.settlementEthereumContractAddress = token_addresses.tbtc_contract;
                break;
            case "0x2c6984bff4f8a3e13f071112085773D78B28F1F2":
                this_bot.settlementEthereumContractAddress = token_addresses.tusdc_contract;
                break;
            case "0x0f4c414fe20C998023A14207FA6E1176D4D4F4fb":
                this_bot.settlementEthereumContractAddress = token_addresses.teuro_contract;
                break;
            default:
                break;
        }
        //////////////////////END HACK



        if(bundled_bots[this_bot.settlementEthereumContractAddress ] === undefined){
            bundled_bots[this_bot.settlementEthereumContractAddress ] = {
                bots : []
            };
        }
        bundled_bots[this_bot.settlementEthereumContractAddress ].bots.push("0x" + this_bot.pubKey);
    }

    //console.log("here")
    //console.log(bundled_bots)

    for(let contract in token_addresses){

        let token_instance = new web3_instance.eth.Contract(token_abi, token_addresses[contract]);


        console.log(token_addresses[contract])

        if(bundled_bots[token_addresses[contract]] !== undefined){
            let this_bundle = bundled_bots[token_addresses[contract]];

            //console.log("Bot Bundle:")
            //console.log(this_bundle)
            let chunk = [];
            let idx = 0;
            console.log("starting loop")
            do {

                chunk = this_bundle.bots.slice(idx, idx+chunk_size);
                idx += chunk_size;
                //console.log("CHUNK:")
                console.log(chunk)
                console.log("Chunk Length: " + chunk.length)
                if(chunk.length > 0){

                    console.log(token_addresses[contract], payouts[token_addresses[contract]]);

                    try{
                        //submit chunk to mass_dump
                        await token_instance.methods.admin_deposit_bulk(payouts[token_addresses[contract]], bridge_address, chunk).send({
                            from: wallet_address,
                            gasPrice:"150000000000",
                            gas:"3000000"
                        });
                    }catch (e) {
                        console.log(e.data)
                    }

                }

            } while(chunk.length > 0);

        }

    }

}


run_deposit()