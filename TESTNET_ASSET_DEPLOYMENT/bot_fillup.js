//let bridge_abi = require("abis/ERC20_Bridge_Logic_ABI.js");
let bridge_abi = require("../abis_and_addresses/ERC20_Bridge_Logic_ABI.json");
let token_abi = require("./abis_and_addresses/Base_Faucet_Token_ABI.json");

const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');
let bridge_address_file = require("../abis_and_addresses/bridge_addresses.json");

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

//////////GANACHE

let web3_instance = new Web3('http://localhost:8545');
//////////////////////


let token_contracts = require("./abis_and_addresses/token_contracts.json");


let bridge_address = bridge_address_file.logic_1;

let chunk_size = 15;

let payouts = {};

payouts[token_contracts.tdai_contract] = "10000000000000";
payouts[token_contracts.tusdc_contract] = "10000000000000";
payouts[token_contracts.teuro_contract] = "10000000000000";
payouts[token_contracts.tbtc_contract] = "100000000000";
payouts[token_contracts.tvote_contract] = "1000000000";
/*
payouts[token_contracts.tdai_contract] = "1";
payouts[token_contracts.tusdc_contract] = "1";
payouts[token_contracts.teuro_contract] = "1";
payouts[token_contracts.tbtc_contract] = "1";
payouts[token_contracts.tvote_contract] = "1";
*/


let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;
async function run_deposit() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();

    let bot_configs = require("./bot_configs.json");
    //console.log(bot_configs)


    let bundled_bots = {};

    for(let bot_idx = 0; bot_idx < bot_configs.length; bot_idx++){
        let this_bot = bot_configs[bot_idx];

        //TODO REMOVE BEFORE ROPSTEN
        switch(this_bot.settlementEthereumContractAddress){
            case "0xBe3304136265290BDdBc0930CB6F26c3428929e2":
                this_bot.settlementEthereumContractAddress = token_contracts.tdai_contract;
                break;
            case "0x7778F85d0Ceb51950cD9AE24086af723069865fC":
                this_bot.settlementEthereumContractAddress = token_contracts.tbtc_contract;
                break;
            case "0x2c6984bff4f8a3e13f071112085773D78B28F1F2":
                this_bot.settlementEthereumContractAddress = token_contracts.tusdc_contract;
                break;
            case "0x0f4c414fe20C998023A14207FA6E1176D4D4F4fb":
                this_bot.settlementEthereumContractAddress = token_contracts.teuro_contract;
                break;
            case "0xBab9201f25642e9917C3CDFb0d491A5ea13Df8A0":
                this_bot.settlementEthereumContractAddress = token_contracts.tvote_contract;
                break;
            default:
                break;
        }
        ////TODO END REMOVE

        if(bundled_bots[this_bot.settlementEthereumContractAddress ] === undefined){
            bundled_bots[this_bot.settlementEthereumContractAddress ] = {
                bots : []
            };
        }
        bundled_bots[this_bot.settlementEthereumContractAddress ].bots.push("0x" + this_bot.pubKey);
    }

    //console.log("here")
    //console.log(bundled_bots)

    for(let contract in token_contracts){

        let token_instance = new web3_instance.eth.Contract(token_abi, token_contracts[contract]);


        console.log(token_contracts[contract])

        if(bundled_bots[token_contracts[contract]] !== undefined){
            let this_bundle = bundled_bots[token_contracts[contract]];

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

                    console.log(token_contracts[contract], payouts[token_contracts[contract]]);

                    try{
                        //submit chunk to mass_dump
                        await token_instance.methods.admin_deposit_bulk(payouts[token_contracts[contract]], bridge_address, chunk).send({
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