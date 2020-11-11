//ganache-cli -m "cherry manage trip absorb logic half number test shed logic purpose rifle"
const Web3            = require('web3'),
    contract        = require("truffle-contract"),
    path            = require('path'),
    crypto          = require("crypto"),
    abi             = require('ethereumjs-abi');
let Wallet = require('ethereumjs-wallet');
let erc20_asset_pool_json  = require(path.join(__dirname, '../build/contracts/ERC20_Asset_Pool.json'));
let erc20_bridge_json  = require(path.join(__dirname, '../build/contracts/ERC20_Bridge_Logic.json'));
let multisig_control_json  = require(path.join(__dirname, '../build/contracts/MultisigControl.json'));
let erc20_token_json = require(path.join(__dirname, '../build/contracts/VUSD5_TEST.json'));
const ethUtil = require('ethereumjs-util');

function get_message_to_sign(param_types, params, nonce, function_name, sender){
    //generate nonce

    params.push(nonce);
    param_types.push("uint256");
    params.push(function_name);
    param_types.push("string");
    //var encoded_a = abi.rawEncode([ "address","uint256", "string"], [ wallet2, nonce, "add_signer" ]);
    let encoded_a = abi.rawEncode(param_types, params);
    //let encoded = abi.rawEncode(["bytes", "address"], [encoded_a, wallet1]);
    let final_encoded = abi.rawEncode(["bytes", "address"], [encoded_a, sender]);

    return final_encoded;
}
let validator_private_keys =
{
    "0xa3e6cceb9e110899c4fd57b0b9c06e775b2fd151":Buffer.from("19b5ba06a6643761dd87e0786c740acffed35b5879c90c7c3b269e03c3afec72",'hex'),
    //"0xb89a165ea8b619c14312db316baaa80d2a98b493":Buffer.from("adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b",'hex'),
};

let private_key = Buffer.from(
    'adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b',
    'hex',
) ;

let main_erc20_bridge_logic_address = "0x0858D9BD11A4F6Bae8b979402550CA6c6ddB8332";
let backup_erc20_bridge_logic_address = "0x846087f262859fe6604e2e9f787a9F3f39296Ff8";

let validator_private_key = "0x19b5ba06a6643761dd87e0786c740acffed35b5879c90c7c3b269e03c3afec72";
let validator_public_address = "0xa3e6cceb9e110899c4fd57b0b9c06e775b2fd151";

let provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");


let erc20_asset_pool_contract = contract(erc20_asset_pool_json);
erc20_asset_pool_contract.setProvider(provider);

let multisig_control_contract = contract(multisig_control_json)
multisig_control_contract.setProvider(provider);

let main_erc20_bridge_logic_contract = contract(erc20_bridge_json);
let backup_erc20_bridge_logic_contract = contract(erc20_bridge_json);

main_erc20_bridge_logic_contract.setProvider(provider);
backup_erc20_bridge_logic_contract.setProvider(provider);



let erc20_token_contract = contract(erc20_token_json);
erc20_token_contract.setProvider(provider);

async function configure_validators(multisig_control_instance){
    console.log();
    console.log("CONFIG VALIDATOR:")
    console.log("Configuring Validator");
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    try {
        await multisig_control_instance.remove_signer_admin(wallet_address, {from:wallet_address});
    } catch (e) {}
    try {
        await multisig_control_instance.add_signer_admin(validator_public_address, {from:wallet_address});
    }catch (e) {}


    console.log("Validator Configured");
}

async function list_asset(bridge_logic_instance, asset_contract_instance){


    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    try {
        //TODO: pick better asset ID?
       await bridge_logic_instance.list_asset_admin(asset_contract_instance.address, 0, "0x460be4264be2d8e3d7a85696ec66d5c5a86e19617f7dc4ddfe127e30b3bfd620", {from:wallet_address});
    }catch (e) {

    }

}

async function faucet(asset_contract_instance){
    console.log();
    console.log("FAUCET:")
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    console.log("running faucet on "+ asset_contract_instance.address);
    await asset_contract_instance.faucet({from:wallet_address});
    console.log("Faucet complete, balance: "+ (await asset_contract_instance.balanceOf(wallet_address)))

}

async function deposit_into_bridge(asset_contract_instance, bridge_logic_contract_instance, erc20_asset_pool_instance){
    console.log();
    console.log("DEPOSIT:")
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    let to_deposit = await asset_contract_instance.balanceOf(wallet_address);

    console.log("approving deposit");
    await asset_contract_instance.approve(bridge_logic_contract_instance.address, to_deposit, {from: wallet_address});
    console.log("approval complete");

    console.log("wallet balance before deposit: " + (await asset_contract_instance.balanceOf(wallet_address)));
    console.log("bridge balance before deposit: " + (await asset_contract_instance.balanceOf(erc20_asset_pool_instance.address)));

    console.log("depositing tokens");
    await bridge_logic_contract_instance.deposit_asset(asset_contract_instance.address, 0, to_deposit, "0x6a6e3b19d1fe880a702fcda3dda25bd23d800e09dbafca1252ec7a98d6bca230", {from:wallet_address});
    console.log("deposit complete");

    console.log("wallet balance after deposit: " + (await asset_contract_instance.balanceOf(wallet_address)));
    console.log("bridge balance after deposit: " + (await asset_contract_instance.balanceOf(erc20_asset_pool_instance.address)));

}
async function withdraw_from_bridge(asset_contract_instance, bridge_logic_contract_instance, multisig_control_instance, erc20_asset_pool_instance){
    console.log();
    console.log("WITHDRAW:")
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();

    let to_withdraw = await asset_contract_instance.balanceOf(erc20_asset_pool_instance.address);
    console.log("available to withdraw: " + to_withdraw)
    console.log("Configuring validators...");
    await configure_validators(multisig_control_instance);
    console.log("validator configured");
    console.log("assembling withdrawal order");
    let withdraw_nonce = new ethUtil.BN(crypto.randomBytes(32));
    let expiry = Math.floor(Date.now()/1000) + 60; // 1 min
    let token_address = asset_contract_instance.address;
    let token_amount = to_withdraw;
    let bridge_address = bridge_logic_contract_instance.address;

    let encoded = get_message_to_sign(
        ["address", "uint256", "uint256", "uint256", "address"],
        [token_address, 0, token_amount, expiry, wallet_address],
        withdraw_nonce, "withdraw_asset", bridge_address);

    let msg_hash = ethUtil.keccak256(encoded);
    let all_sigs = [];
    let concat_string =  "0x";
    for(let key_addr in validator_private_keys){
        let key = validator_private_keys[key_addr];
        let sig = ethUtil.ecsign(msg_hash,  key);
        let sig_string = sig.r.toString('hex') + "" + sig.s.toString('hex') +""+ sig.v.toString(16);
        concat_string = concat_string+ sig_string;
        all_sigs.push("0x" + sig_string);
    }

    console.log("withdrawal order assembled");

    console.log("wallet balance before withdrawal: " + (await asset_contract_instance.balanceOf(wallet_address)));
    console.log("bridge balance before withdrawal: " + (await asset_contract_instance.balanceOf(erc20_asset_pool_instance.address)));


    let withdrawal_recipt = await bridge_logic_contract_instance.withdraw_asset(token_address, 0, token_amount, expiry, withdraw_nonce, concat_string, {from:wallet_address});


    console.log("tokens withdrawn");

    console.log("wallet balance after withdrawal: " + (await asset_contract_instance.balanceOf(wallet_address)));
    console.log("bridge balance after withdrawal: " + (await asset_contract_instance.balanceOf(erc20_asset_pool_instance.address)));
}
async function change_pool_bridge(erc20_asset_pool_instance, new_bridge_logic_contract_instance){
    console.log();
    console.log("CHANGE BRIDGE:")
    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    //TODO multisig rather than admin:
    console.log("setting new bridge address")
    await erc20_asset_pool_instance.set_bridge_address_admin(new_bridge_logic_contract_instance.address, {from: wallet_address})
    console.log("new bridge set")
}

async function switch_logic(){
    let erc20_asset_pool_instance = await  erc20_asset_pool_contract.deployed();
    let multisig_control_instance = await multisig_control_contract.deployed();
    let main_erc20_bridge_logic_instance = await main_erc20_bridge_logic_contract.at(main_erc20_bridge_logic_address);
    let backup_erc20_bridge_logic_instance = await backup_erc20_bridge_logic_contract.at(backup_erc20_bridge_logic_address);
    let vusd5_instance = await erc20_token_contract.deployed();

    const eth_wallet = Wallet.fromPrivateKey(private_key);
    let wallet_address = eth_wallet.getAddressString();
    console.log("Wallet Address");
    console.log(wallet_address);

    await list_asset(main_erc20_bridge_logic_instance, vusd5_instance);
    await list_asset(backup_erc20_bridge_logic_instance, vusd5_instance);
    console.log();
    console.log("1///////////////////////////////////////////////////////////////////////")
    //faucet
    await faucet(vusd5_instance);
    //switch contract to backup
    await change_pool_bridge(erc20_asset_pool_instance, main_erc20_bridge_logic_instance);
    console.log();
    console.log("2///////////////////////////////////////////////////////////////////////")
    //deposit into main
    await deposit_into_bridge(vusd5_instance, main_erc20_bridge_logic_instance,erc20_asset_pool_instance);
    console.log();
    console.log("3///////////////////////////////////////////////////////////////////////")
    //withdrawaw from main
    await withdraw_from_bridge(vusd5_instance, main_erc20_bridge_logic_instance, multisig_control_instance, erc20_asset_pool_instance);
    console.log();
    console.log("4///////////////////////////////////////////////////////////////////////")
    //deposit into main
    await deposit_into_bridge(vusd5_instance, main_erc20_bridge_logic_instance,erc20_asset_pool_instance);

    console.log();
    console.log("5///////////////////////////////////////////////////////////////////////")
    //fail to withdraw from backup
    try {
        await withdraw_from_bridge(vusd5_instance, backup_erc20_bridge_logic_instance, multisig_control_instance, erc20_asset_pool_instance);
        console.error("Error: unauthorized bridge logic successfully withdrew funds from bridge");
        return;
    }catch (e) {
        console.log()
        console.log("unauthorised withdrawal successfully blocked")
        console.log()
    }
    //TODO require backup_withdraw_did_fail

    console.log();
    console.log("6///////////////////////////////////////////////////////////////////////")
    //deposit into main
    await deposit_into_bridge(vusd5_instance, main_erc20_bridge_logic_instance, erc20_asset_pool_instance);

    //switch contract to backup
    await change_pool_bridge(erc20_asset_pool_instance, backup_erc20_bridge_logic_instance);
    console.log();
    console.log("7///////////////////////////////////////////////////////////////////////")
    //fail to withdraw from main
    try {
        await withdraw_from_bridge(vusd5_instance, main_erc20_bridge_logic_instance, multisig_control_instance, erc20_asset_pool_instance);
        console.error("Error: unauthorized bridge logic successfully withdrew funds from bridge");
        return;
    }catch (e) {
        console.log()
        console.log("unauthorised withdrawal successfully blocked")
        console.log()
    }

    console.log();
    console.log("8///////////////////////////////////////////////////////////////////////")
    //withdraw from backup
    await withdraw_from_bridge(vusd5_instance, backup_erc20_bridge_logic_instance, multisig_control_instance, erc20_asset_pool_instance);
    console.log();
    console.log("9///////////////////////////////////////////////////////////////////////")
    //deposit into backup
    await deposit_into_bridge(vusd5_instance, backup_erc20_bridge_logic_instance, erc20_asset_pool_instance);
    console.log();
    console.log("10///////////////////////////////////////////////////////////////////////")
    //withdraw from backup
    await withdraw_from_bridge(vusd5_instance, backup_erc20_bridge_logic_instance, multisig_control_instance, erc20_asset_pool_instance);

}



switch_logic();
console.log('Press any key to exit');

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on('data', process.exit.bind(process, 0));
