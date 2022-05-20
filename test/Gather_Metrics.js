const ERC20_Asset_Pool = artifacts.require("ERC20_Asset_Pool");
const ERC20_Bridge_Logic = artifacts.require("ERC20_Bridge_Logic_Restricted");
const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");
const MultisigControl = artifacts.require("MultisigControl");

const { shouldFailWithMessage, bytesToHex, formatEther, parseEther, latest, increase, toBN } = require("../helpers/utils");
const { expectBignumberEqual } = require("../helpers/index");
const { findEventInTransaction } = require("../helpers/events");

var abi = require('ethereumjs-abi');
var crypto = require("crypto");
var ethUtil = require('ethereumjs-util');

let root_path = "../ropsten_deploy_details/local/";

/*The following will generate 10 addresses from the mnemonic located in the .secret file*/
const fs = require("fs");
//TODO: ganache-cli -m "contents of .secret"
const mnemonic = fs.readFileSync(".secret").toString().trim();

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const wallet = require('ethereumjs-wallet');
const { expect } = require("chai");
const { find } = require("lodash");
const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");

let private_keys = {};
async function init_private_keys() {
  private_keys = {};
  for (let key_idx = 0; key_idx < 20; key_idx++) {
    const seed = await bip39.mnemonicToSeed(mnemonic); // mnemonic is the string containing the words

    const hdk = hdkey.fromMasterSeed(seed);
    const addr_node = hdk.derivePath("m/44'/60'/0'/0/" + key_idx); //m/44'/60'/0'/0/0 is derivation path for the first account. m/44'/60'/0'/0/1 is the derivation path for the second account and so on
    const addr = addr_node.getWallet().getAddressString(); //check that this is the same with the address that ganache list for the first account to make sure the derivation is correct
    const private_key = addr_node.getWallet().getPrivateKey();
    //console.log(private_key)
    //console.log(addr.toString("hex"))
    //console.log(private_key.toString("hex"))
    private_keys[addr.toString("hex")] = private_key;
  }
}

function get_message_to_sign(param_types, params, nonce, function_name, sender) {
  params.push(nonce);
  param_types.push("uint256");
  params.push(function_name);
  param_types.push("string");
  //var encoded_a = abi.rawEncode([ "address","uint256", "string"], [ wallet2, nonce, "add_signer" ]);
  let encoded_a = abi.rawEncode(param_types, params);
  //let encoded = abi.rawEncode(["bytes", "address"], [encoded_a, wallet1]);
  return abi.rawEncode(["bytes", "address"], [encoded_a, sender]);
}

function to_signature_string(sig) {
  return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') + "" + sig.v.toString(16);
}
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let new_asset_id = crypto.randomBytes(32);

let bridge_addresses = require(root_path + "bridge_addresses.json");

async function set_threshold(multisigControl_instance, new_threshold, sender) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  let encoded_message = get_message_to_sign(
      ["uint16"],
      [new_threshold],
      nonce.toString(),
      "set_threshold",
      sender);
  let encoded_hash = ethUtil.keccak256(encoded_message);
  let signature = ethUtil.ecsign(encoded_hash, private_keys[sender.toLowerCase()]);
  let sig_string = to_signature_string(signature);
  await multisigControl_instance.set_threshold(new_threshold, nonce, sig_string);
}

async function add_signer(multisigControl_instance, new_signer, sender) {
    let nonce = new ethUtil.BN(crypto.randomBytes(32));
    let encoded_message = get_message_to_sign(
        ["address"],
        [new_signer],
        nonce.toString(),
        "add_signer",
        sender);
    let encoded_hash = ethUtil.keccak256(encoded_message);
    let signature = ethUtil.ecsign(encoded_hash, private_keys[sender.toLowerCase()]);
    let sig_string = to_signature_string(signature);

    await multisigControl_instance.add_signer(new_signer, nonce, sig_string);
}

async function set_bridge_address(asset_pool_instance, bridge_logic_address, account) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  //create signature
  let encoded_message = get_message_to_sign(
    ["address"],
    [bridge_logic_address],
    nonce,
    "set_bridge_address",
    asset_pool_instance.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  let receipt = await asset_pool_instance.set_bridge_address(bridge_logic_address, nonce, sig_string);
  return receipt;
}


async function deposit_asset(bridge_logic_instance, test_token_instance, account, token_balance) {
  let wallet_pubkey = crypto.randomBytes(32);
  await test_token_instance.faucet();
  if (token_balance === undefined || token_balance === null) {
    token_balance = await test_token_instance.balanceOf(account);
  }
  await test_token_instance.approve(bridge_logic_instance.address, token_balance);
  await bridge_logic_instance.deposit_asset(test_token_instance.address, token_balance, wallet_pubkey);
  return token_balance;
}

async function withdraw_asset(bridge_logic_instance, test_token_instance, to_withdraw, target, signers) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));

  let now = creation = await latest();


  //create signature
  let encoded_message = get_message_to_sign(
    ["address", "uint256", "address", "uint256"],
    [test_token_instance.address, to_withdraw, target, now.toString()],
    nonce,
    "withdraw_asset",
    bridge_logic_instance.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);


  let final_sig_string = "0x"
  for(let account_idx = 0; account_idx < signers.length; account_idx++){
    let signature = ethUtil.ecsign(encoded_hash, private_keys[signers[account_idx].toLowerCase()]);
    let sig_string = to_signature_string(signature);
    final_sig_string += sig_string.substr(2)
  }

  let receipt = await bridge_logic_instance.withdraw_asset(test_token_instance.address, to_withdraw, target, creation, nonce, final_sig_string);
  return receipt;
}

async function list_asset(bridge_logic_instance, test_token_instance, from_address) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  let lifetime_limit = parseEther("1000");
  let withdraw_threshold = parseEther("100");

  let new_asset_id ="0x01";

  //create signature
  let encoded_message = get_message_to_sign(
    ["address", "bytes32", "uint256", "uint256"],
    [test_token_instance.address, new_asset_id, lifetime_limit.toString(), withdraw_threshold.toString()],
    nonce,
    "list_asset",
    bridge_logic_instance.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.list_asset(test_token_instance.address, new_asset_id, lifetime_limit, withdraw_threshold, nonce, sig_string);
  //console.log(receipt.logs)
  return [nonce, receipt]
}



contract("Gather Metrics", (accounts) => {
  //function revoke_exempt_depositor(address depositor) public override
  beforeEach(async () => {
    await init_private_keys()
    multisigControl_instance = await MultisigControl.new();
    asset_pool_instance = await ERC20_Asset_Pool.new(multisigControl_instance.address);
    test_token_instance = await Base_Faucet_Token.new("TEST", "TEST", 18, 0, "1000000000000000000");
    bridge_logic_instance = await ERC20_Bridge_Logic.new(asset_pool_instance.address);

    await set_bridge_address(asset_pool_instance, bridge_logic_instance.address, accounts[0])
  });

  it("2-20 signers, see metrics_output.json for results", async () => {
      let gas_runs = []

      // set threshold to 1
      await set_threshold(multisigControl_instance, 1, accounts[0]);

      // list asset
      await list_asset(bridge_logic_instance, test_token_instance, accounts[0])

      // faucet
      await test_token_instance.faucet();

      console.log("---------------------------------------------------")
      console.log("Gas Results:")

      let signer_list = [accounts[0]]
      for(let signer_count = 1; signer_count < 20; signer_count++){

        signer_list.push(accounts[signer_count])
        // add signer
        await add_signer(multisigControl_instance, accounts[signer_count], accounts[0]);

        // deposit asset
        await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0], "1");

        // do withdrawal
        let withdrawal_receipt = await withdraw_asset(bridge_logic_instance, test_token_instance, "1", accounts[0], signer_list)

        // get gas

        console.log("Signers: " + (signer_count+1) + "  Gas: " + withdrawal_receipt.receipt.gasUsed);
        gas_runs.push({
          gas_used: withdrawal_receipt.receipt.gasUsed,
          signer_count: signer_count+1
        })
      }
      console.log("---------------------------------------------------")

      fs.writeFileSync('metrics_output.json', JSON.stringify(gas_runs));
      // save to file
  });

});
