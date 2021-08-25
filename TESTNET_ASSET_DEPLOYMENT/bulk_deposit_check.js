const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');
const HDWalletProvider = require("@truffle/hdwallet-provider");

var abi = require('ethereumjs-abi');
var crypto = require("crypto");

let root_path =  "../ropsten_deploy_details/";

//sender for MultisigControl itself is submitting user
//sender for all consuming contracts is the address of that contract
function get_message_to_sign(param_types, params, nonce, function_name, sender){
    params.push(nonce);
    param_types.push("uint256");
    params.push(function_name);
    param_types.push("string");
    //var encoded_a = abi.rawEncode([ "address","uint256", "string"], [ wallet2, nonce, "add_signer" ]);
    let encoded_a = abi.rawEncode(param_types, params);
    //let encoded = abi.rawEncode(["bytes", "address"], [encoded_a, wallet1]);

    return abi.rawEncode(["bytes", "address"], [encoded_a, sender]);
}

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
                throw ("Bad network choice, --network ropsten --vega [test|stag|dev]");
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

let Base_Faucet_Token_ABI = require(root_path + "Base_Faucet_Token_ABI.json");
let pool_abi = require(root_path + "ERC20_Asset_Pool_ABI.json");
let bridge_abi = require(root_path + "ERC20_Bridge_Logic_ABI.json");
let multisig_control_abi = require(root_path + "MultisigControl_ABI.json");
let bulk_deposit_abi = require(root_path + "Bulk_Deposit_ABI.json");
let bridge_address_file = require(root_path + "bridge_addresses.json");
let token_addresses = require(root_path + "token_addresses.json");


let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;

const eth_wallet = Wallet.fromPrivateKey(private_key);
let wallet_address = eth_wallet.getAddressString();

async function list_asset(bridge_logic_instance, asset_address, new_asset_id){
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  //create signature
  let encoded_message = get_message_to_sign(
      ["address", "bytes32"],
      [asset_address, new_asset_id],
      nonce,
      "list_asset",
      bridge_logic_instance._address);

  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_key);
  let sig_string = to_signature_string(signature);
  //console.log(sig_string)
  //NOTE Sig tests are in MultisigControl
  await bridge_logic_instance.methods.list_asset(asset_address, new_asset_id, nonce, sig_string).send({from:wallet_address,
    gasPrice:"150000000000", gas: "2000000"});
}
function to_signature_string(sig){
    return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') +""+ sig.v.toString(16);
}



async function bulk_deposit() {
    let bridge_logic_instance = new web3_instance.eth.Contract(bridge_abi, bridge_address_file.logic_1);
    let tdai_instance = new web3_instance.eth.Contract(Base_Faucet_Token_ABI, token_addresses.tdai_contract)
    let bulk_deposit_instance = new web3_instance.eth.Contract(bulk_deposit_abi, token_addresses.bulk_deposit_contract)

    try{
      await list_asset(bridge_logic_instance, token_addresses.tdai_contract, crypto.randomBytes(32));
      //in case it's already listed
    }catch(e){}

    //faucet
    await tdai_instance.methods.faucet().send({from:wallet_address, gasPrice:"150000000000", gas: "2000000"});
    //approve bridge
    await tdai_instance.methods.approve(token_addresses.bulk_deposit_contract, "100000000000000000").send({from:wallet_address, gasPrice:"150000000000", gas: "2000000"});

    let vega_public_keys = [];
    let values = [];

    let deposit_count = 10;

    for(let deposit_idx = 0; deposit_idx < deposit_count; deposit_idx++){
      vega_public_keys.push(crypto.randomBytes(32));
      values.push("1");
    }

    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    let bulk_deposit_results = await bulk_deposit_instance.methods.bulk_deposit(bridge_address_file.logic_1, token_addresses.tdai_contract, vega_public_keys, values).send({from:wallet_address, gasPrice:"150000000000", gas: "2000000"});

    let past_logs = await bridge_logic_instance.getPastEvents("allEvents");

    console.log(past_logs)
    //get

}


bulk_deposit()
