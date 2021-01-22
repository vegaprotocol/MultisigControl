const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path');
let Wallet = require('ethereumjs-wallet');
const ethUtil = require('ethereumjs-util');
const HDWalletProvider = require("@truffle/hdwallet-provider");

var abi = require('ethereumjs-abi');
var crypto = require("crypto");

let root_path =  "../ropsten_deploy_details/";
//TODO: ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"
let private_keys =
    {
        "0xb89a165ea8b619c14312db316baaa80d2a98b493":Buffer.from("adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b",'hex'),
        "0x4ac2efe06b867213698ab317e9569872f8a5e85a":Buffer.from("cb5a94687bda25561b2574ce062f0b055f9525c930b3fc9183c019c562b9c404",'hex'),
        "0xbeec72c697e54598271ac242bf82cde87d5632e0":Buffer.from("c6a7cd6aa1eafe65c0703162b9128331558fa2f34bcee3a4276953a1acc6ae4e",'hex'),
        "0x4a03ccfbd091354723b9d46043f7cb194d94331b":Buffer.from("708392fa9b47f476ab7a03a76139ff472eb1b4acafafcbe8eb17c15933df8a71",'hex'),
        "0x56a16eb54698324304e29a23d65d2ff7f0b7170b":Buffer.from("9c23f288f45587c615bbecc0924e5708c7b27ce36f9dc9d242d8f3fd7aab389e",'hex'),
        "0x97166b688c609495c203df28cd2e6d5281f9f71f":Buffer.from("de935dc05c5b7cce5e1c27aa4d945b9d820536ee334d4a1c89debd333ae8d866",'hex'),
        "0x9c0b2939538b45b72adb3ec7c52e271f2560c27f":Buffer.from("2773543f4def90c5cef0d48d80465e40c8fc22675c7353d114e47fe0847e7683",'hex'),
        "0x13d6d873b31de82ae6724d3e5894b2b40fb968b2":Buffer.from("14e47f717c9005c60aa41f1a09b2b6bf8af3870f24de107692ac3aaa87686690",'hex'),
        "0x8447913d48723cbabdcead3377f49e82a3d494a3":Buffer.from("5d2b4629b4b06c8d6991d419126270741425c7a784c61179597098521f91afc5",'hex'),
        "0x32321e10a8a0e95f261591520c134d4a6d1743c1":Buffer.from("0ff107281c32f8940cb2a0c85bd0627bc427331ad2c9dd2811f1f01d1edb124a",'hex')
    };

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
let bridge_address_file = require(root_path + "bridge_addresses.json");
let token_addresses = require(root_path + "token_addresses.json");


let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;

const eth_wallet = Wallet.fromPrivateKey(private_key);
let wallet_address = eth_wallet.getAddressString();

async function list_asset(bridge_logic_instance, asset_address, new_asset_id, bridge_address){
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
async function add_signer(multisigControl_instance, new_signer) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  let encoded_message = get_message_to_sign(
      ["address"],
      [new_signer],
      nonce.toString(),
      "add_signer",
      "0xb89a165ea8b619c14312db316baaa80d2a98b493");
    let encoded_hash = ethUtil.keccak256(encoded_message);
    let signature = ethUtil.ecsign(encoded_hash, private_keys[wallet_address.toLowerCase()]);
    let sig_string = to_signature_string(signature);

    await multisigControl_instance.methods.add_signer(new_signer, nonce, sig_string).send({from:wallet_address,
      gasPrice:"150000000000", gas: "2000000"});
}

async function remove_signer(multisigControl_instance, old_signer){
  let nonce_valid = new ethUtil.BN(crypto.randomBytes(32));
  let encoded_message_valid = get_message_to_sign(
      ["address"],
      [old_signer],
      nonce_valid,
      "remove_signer",
      "0xb89a165ea8b619c14312db316baaa80d2a98b493");
  let encoded_hash_valid = ethUtil.keccak256(encoded_message_valid);

  let signature_0_valid = ethUtil.ecsign(encoded_hash_valid, private_keys[wallet_address.toLowerCase()]);
  let sig_string_0_valid = to_signature_string(signature_0_valid);

  await multisigControl_instance.methods.remove_signer(old_signer, nonce_valid, sig_string_0_valid).send({from:wallet_address,
    gasPrice:"150000000000", gas: "2000000"});
}

async function set_threshold(multisigControl_instance, new_threshold){
  let nonce_300 = new ethUtil.BN(crypto.randomBytes(32));
  let encoded_message_300 = get_message_to_sign(
      ["uint16"],
      [new_threshold],
      nonce_300,
      "set_threshold",
      "0xb89a165ea8b619c14312db316baaa80d2a98b493");
  let encoded_hash_300 = ethUtil.keccak256(encoded_message_300);

  let signature_0_300 = ethUtil.ecsign(encoded_hash_300, private_keys[wallet_address.toLowerCase()]);
  let sig_string_0_300 = to_signature_string(signature_0_300);


  // set threshold to 300 (30%) with 2 signers
  await multisigControl_instance.methods.set_threshold(new_threshold, nonce_300, sig_string_0_300).send({from:wallet_address,
    gasPrice:"150000000000", gas: "2000000"});
}

async function configure_signers() {


    //check if signer is valid
    let multisig_instance = new web3_instance.eth.Contract(multisig_control_abi, bridge_address_file.multisig_control);
    await set_threshold(multisig_instance, 1);
    await add_signer(multisig_instance, "0xE8a3Ee358B578a0f1CDB2Fd10D56fBb133926360");
    await remove_signer(multisig_instance, "0xb89a165ea8b619c14312db316baaa80d2a98b493");
    

}


configure_signers()
