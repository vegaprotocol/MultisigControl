//let bridge_abi = require("abis/ERC20_Bridge_Logic_ABI.js");
let bridge_abi = require("./abis/Vega_Bridge_ERC20.js");
let token_abi = require("./abis/erc20_token_abi");
let mass_dump_abi = require("./abis/mass_dump_abi");

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


let bridge_address = "0xbE39479b1fE065Fdd3510E8997738eb22DfA3357";
let mass_dump_address = token_contracts.mass_dump_address;
let chunk_size = 15;
let bot_configs = require("./bot_configs.json");

let payouts = {};
/*
payouts[token_contracts.tdai_contract] = "10000000000000";
payouts[token_contracts.tusdc_contract] = "10000000000000";
payouts[token_contracts.teuro_contract] = "10000000000000";
payouts[token_contracts.tbtc_contract] = "100000000000";
*/
payouts[token_contracts.tdai_contract] = "1";
payouts[token_contracts.tusdc_contract] = "1";
payouts[token_contracts.teuro_contract] = "1";
payouts[token_contracts.tbtc_contract] = "1";



let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;
async function run_deposit() {
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();


    let mass_dump_instance = new web3_instance.eth.Contract(mass_dump_abi, mass_dump_address);

    let bundled_bots = {};

    for(let bot_idx = 0; bot_idx < bot_configs.length; bot_idx++){
        let this_bot = bot_configs[bot_idx];
        console.log(this_bot)
        if(bundled_bots[this_bot.settlementAsset] === undefined){
            bundled_bots[this_bot.settlementAsset] = {
                bots : []
            };
        }
        bundled_bots[this_bot.settlementAsset].bots.push("0x" + this_bot.pubKey);
    }

    console.log("here")
    console.log(bundled_bots)

    for(let contract in token_contracts){
        console.log(contract)
        console.log(token_contracts[contract])

        if(bundled_bots[token_contracts[contract]] !== undefined){
            let this_bundle = bundled_bots[token_contracts[contract]];

            console.log("Bot Bundle:")
            console.log(this_bundle)


            let chunk = [];
            let idx = 0;
            console.log("starting loop")
            do {

                chunk = this_bundle.bots.slice(idx, idx+chunk_size);
                idx += chunk_size;
                console.log("CHUNK:")
                console.log(chunk)
                console.log("Chunk Length: " + chunk.length)
                if(chunk.length > 0){

                    //submit chunk to mass_dump
                    mass_dump_instance.methods.bot_topup(token_contracts[contract], payouts[token_contracts[contract]], chunk).send({
                        from: wallet_address,
                        gasPrice:"150000000000"
                    }).then((rcpt)=>{
                        console.log(contract + " complete")
                    });
                }

            } while(chunk.length > 0);



        }

    }

}


run_deposit()