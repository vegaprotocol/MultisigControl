const ERC20_Asset_Pool = artifacts.require("ERC20_Asset_Pool");
const MultisigControl = artifacts.require("MultisigControl");
const ERC20_Bridge_Logic = artifacts.require("ERC20_Bridge_Logic_Restricted");
const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");

const {shouldFailWithMessage, formatEther, parseEther, latest} = require("../helpers/utils");
const {expect} = require("../helpers/index");


var abi = require('ethereumjs-abi');
var crypto = require("crypto");
var ethUtil = require('ethereumjs-util');


let new_asset_id = crypto.randomBytes(32);

let root_path = "../ropsten_deploy_details/local/";

let bridge_addresses = require(root_path + "bridge_addresses.json");


/*The following will generate 10 addresses from the mnemonic located in the .secret file*/
const fs = require("fs");
//TODO: ganache-cli -m "contents of .secret"
const mnemonic = fs.readFileSync(".secret").toString().trim();

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const wallet = require('ethereumjs-wallet');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const { findEventInTransaction } = require('../helpers/events');
const { expectBignumberEqual } = require("../helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

let private_keys = {};
async function init_private_keys() {
  private_keys = {};
  for (let key_idx = 0; key_idx < 10; key_idx++) {
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

/****** note, add:
beforeEach(async()=>{
  await init_private_keys()
});
*** to each "contract" section before tests */



//sender for MultisigControl itself is submitting user
//sender for all consuming contracts is the address of that contract
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
async function list_asset(bridge_logic_instance, from_address) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  let lifetime_limit = parseEther("1000");
  let withdraw_threshold = parseEther("100");
  //create signature
  let encoded_message = get_message_to_sign(
    ["address", "bytes32", "uint256", "uint256"],
    [bridge_addresses.test_token_address, new_asset_id, lifetime_limit.toString(), withdraw_threshold.toString()],
    nonce,
    "list_asset",
    ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.list_asset(bridge_addresses.test_token_address, new_asset_id, lifetime_limit, withdraw_threshold, nonce, sig_string);
  return receipt
}

function to_signature_string(sig) {
  return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') + "" + sig.v.toString(16);
}

async function set_multisig_control(asset_pool_instance, multisig_control_address, account) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  //create signature
  let encoded_message = get_message_to_sign(
    ["address"],
    [multisig_control_address],
    nonce,
    "set_multisig_control",
    asset_pool_instance.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  let receipt = await asset_pool_instance.set_multisig_control(multisig_control_address, nonce, sig_string);
  return receipt;
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
  await test_token_instance.approve(ERC20_Bridge_Logic.address, token_balance);
  await bridge_logic_instance.deposit_asset(bridge_addresses.test_token_address, token_balance, wallet_pubkey);
  return token_balance;
}

async function withdraw_asset(bridge_logic_instance, test_token_instance, account, bad_params, bad_user) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  let to_withdraw = (await test_token_instance.balanceOf(ERC20_Asset_Pool.address)).toString();
  let now = creation = await latest();

  let target = account;

  if (bad_user !== undefined) {
    target = bad_user;
  }

  //create signature
  let encoded_message = get_message_to_sign(
    ["address", "uint256", "address", "uint256"],
    [test_token_instance.address, to_withdraw, target, now.toString()],
    nonce,
    "withdraw_asset",
    ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);
  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);

  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  if (bad_params) {
    to_withdraw = "1"
  }

  let receipt = await bridge_logic_instance.withdraw_asset(test_token_instance.address, to_withdraw, target, creation, nonce, sig_string);
  return receipt;
}





////FUNCTIONS
contract("Asset_Pool Function: set_multisig_control", (accounts) => {
  beforeEach(async () => {
    await init_private_keys()

  });

  it("should revert if new address is address(0)", async () => {
    let multisig_control_instance = await MultisigControl.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();
    //set new multisig_control_address
    assert.equal(
      await asset_pool_instance.multisig_control_address(),
      multisig_control_instance.address,
      "unexpected initial multisig_control_address"
    );

    //set multisig control address should fail
    let nonce = new ethUtil.BN(crypto.randomBytes(32));

    //await set_multisig_control(asset_pool_instance, accounts[1], accounts[0]);

    await shouldFailWithMessage(
      asset_pool_instance.set_multisig_control(
        ZERO_ADDRESS,
        nonce,
        "0x"
      ),
      "invalid MultisigControl address"
    );

    assert.equal(
      await asset_pool_instance.multisig_control_address(),
      multisig_control_instance.address, // should remain unchanged
      "unexpected multisig_control_address"
    );
  });

  it("should revert if new address is not a contract", async () => {
    let multisig_control_instance = await MultisigControl.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();
    //set new multisig_control_address
    assert.equal(
      await asset_pool_instance.multisig_control_address(),
      multisig_control_instance.address,
      "unexpected initial multisig_control_address"
    );

    //set multisig control address should fail
    let nonce = new ethUtil.BN(crypto.randomBytes(32));

    //await set_multisig_control(asset_pool_instance, accounts[1], accounts[0]);

    await shouldFailWithMessage(
      asset_pool_instance.set_multisig_control(
        accounts[1],
        nonce,
        "0x"
      ),
      "new address must be contract"
    );

    assert.equal(
      await asset_pool_instance.multisig_control_address(),
      multisig_control_instance.address, // should remain unchanged
      "unexpected multisig_control_address"
    );
  });

  it("should trigger bad signatures with invalid signature string", async () => {
    let multisig_control_instance = await MultisigControl.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    //set new multisig_control_address
    assert.equal(
      await asset_pool_instance.multisig_control_address(),
      multisig_control_instance.address,
      "unexpected initial multisig_control_address"
    );

    //set multisig control address should fail
    let nonce = new ethUtil.BN(crypto.randomBytes(32));

    //await set_multisig_control(asset_pool_instance, accounts[1], accounts[0]);

    await shouldFailWithMessage(
      asset_pool_instance.set_multisig_control(
        bridge_logic_instance.address,
        nonce,
        "0x"
      ),
      "must contain at least 1 sig"
    );

    assert.equal(
      await asset_pool_instance.multisig_control_address(),
      multisig_control_instance.address, // should remain unchanged
      "unexpected multisig_control_address"
    );
  });

  //function set_multisig_control(address new_address, uint256 nonce, bytes memory signatures) public {
  it("should change multisig control address", async () => {
    let multisig_control_instance = await MultisigControl.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    //set new multisig_control_address
    assert.equal(
      await asset_pool_instance.multisig_control_address(),
      multisig_control_instance.address,
      "unexpected initial multisig_control_address"
    );

    let receipt = await set_multisig_control(asset_pool_instance, bridge_logic_instance.address, accounts[0]);

    // should emit correct event and parameters
    const {args} = await findEventInTransaction(receipt, 'Multisig_Control_Set');
    expect(args.new_address).to.not.equal(ZERO_ADDRESS);

    assert.equal(
      await asset_pool_instance.multisig_control_address(),
      bridge_logic_instance.address,
      "unexpected multisig_control_address"
    );

  });
  //NOTE signature tests are in MultisigControl tests
});

contract("Asset_Pool Function: set_bridge_address", (accounts) => {
  //function set_bridge_address(address new_address, uint256 nonce, bytes memory signatures) public {
  beforeEach(async () => {
    await init_private_keys()
  });

  it("should trigger bad signatures with invalid signature string", async () => {
    let multisig_control_instance = await MultisigControl.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();

    assert.equal(
      await asset_pool_instance.erc20_bridge_address(),
      "0x0000000000000000000000000000000000000000",
      "unexpected initial erc20_bridge_address"
    );

    //set bridge address should fail
    let nonce = new ethUtil.BN(crypto.randomBytes(32));

    await shouldFailWithMessage(
      asset_pool_instance.set_bridge_address(
        bridge_addresses.logic_1,
        nonce,
        "0x"
      ),
      "must contain at least 1 sig"
    );

    // await set_bridge_address(asset_pool_instance, bridge_addresses.logic_1, accounts[0]);

    assert.equal(
      await asset_pool_instance.erc20_bridge_address(),
      //bridge_addresses.logic_1,
      ZERO_ADDRESS,
      "unexpected erc20_bridge_address"
    );
  });

  it("should change the bridge address to a new address, should now ignore old address", async () => {
    let multisig_control_instance = await MultisigControl.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();

    assert.equal(
      await asset_pool_instance.erc20_bridge_address(),
      "0x0000000000000000000000000000000000000000",
      "unexpected initial erc20_bridge_address"
    );

    let receipt = await set_bridge_address(asset_pool_instance, bridge_addresses.logic_1, accounts[0]);

    // should emit correct event and parameters
    const {args} = await findEventInTransaction(receipt, "Bridge_Address_Set");
    expect(args.new_address).to.not.equal(ZERO_ADDRESS);

    assert.equal(
      await asset_pool_instance.erc20_bridge_address(),
      bridge_addresses.logic_1,
      "unexpected erc20_bridge_address"
    );
  });
});

contract("Asset_Pool Function: withdraw", (accounts) => {
  //function withdraw(address token_address, address target, uint256 amount) public returns(bool){
  beforeEach(async () => {
    await init_private_keys()
  });

  it("asset pool contract should revert upon receiving ether", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();

    //send eth
    const depositAmount = web3.utils.toWei('5', 'ether')

    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.greaterThanOrEqual(parseInt(formatEther(depositAmount))
      );

    expectBignumberEqual(
      await web3.eth.getBalance(asset_pool_instance.address),
      0
    );

    await shouldFailWithMessage(
      web3.eth.sendTransaction({from: accounts[0], to: asset_pool_instance.address, value: depositAmount}),
      "this contract does not accept ETH"
    );
  });


  it("should allow bridge to withdraw target asset", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();
    //list asset
    try {
      await list_asset(bridge_logic_instance, accounts[0]);
    } catch (e) {/*ignore if already listed*/ }

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      true,
      "token isn't listed, should be"
    );

    await set_bridge_address(asset_pool_instance, bridge_logic_instance.address, accounts[0]);

    //deposit asset
    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    let account_bal_before = await test_token_instance.balanceOf(accounts[0]);
    let pool_bal_before = await test_token_instance.balanceOf(asset_pool_instance.address);

    //withdraw asset
    await withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0], false);

    let account_bal_after = await test_token_instance.balanceOf(accounts[0]);
    let pool_bal_after = await test_token_instance.balanceOf(asset_pool_instance.address);

    assert.equal(
      account_bal_before.add(pool_bal_before).toString(),
      account_bal_after.toString(),
      "account balance didn't go up"
    );

    assert.equal(
      pool_bal_after.toString(),
      "0",
      "pool should be empty, isn't"
    );
  });


  it("should fail to withdraw target asset without deposit", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();
    //list asset
    try {
      await list_asset(bridge_logic_instance, accounts[0]);
    } catch (e) {/*ignore if already listed*/ }

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      true,
      "token isn't listed, should be"
    );

    await set_bridge_address(asset_pool_instance, bridge_logic_instance.address, accounts[0]);

    // deposit asset
    // await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    let account_bal_before = await test_token_instance.balanceOf(accounts[0]);
    let pool_bal_before = await test_token_instance.balanceOf(asset_pool_instance.address);

    //withdraw asset
    let receipt = await withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0], false);

    // should emit correct event and parameters from ERC20_Bridge_Logic
    const {args} = await findEventInTransaction(receipt, 'Asset_Withdrawn');
    expect(args.user_address).to.be.equal(accounts[0])
    expect(args.asset_source).to.be.equal(test_token_instance.address)
    expectBignumberEqual(args.amount, 0)

    let account_bal_after = await test_token_instance.balanceOf(accounts[0]);
    let pool_bal_after = await test_token_instance.balanceOf(asset_pool_instance.address);

    assert.equal(
      account_bal_before.sub(pool_bal_before).toString(),
      account_bal_after.toString(),
      "account balance increased, but should not have as no deposit was made"
    );

    assert.equal(
      pool_bal_after.toString(),
      "0",
      "pool should be empty, isn't"
    );
  });

  it("withdraw function should fail to run from any address but the current bridge", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();
    //list asset
    try {
      await list_asset(bridge_logic_instance, accounts[0]);
    } catch (e) {/*ignore if already listed*/ }

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      true,
      "token isn't listed, should be"
    );

    await set_bridge_address(asset_pool_instance, bridge_logic_instance.address, accounts[0]);

    //deposit asset
    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    let account_bal_before = await test_token_instance.balanceOf(accounts[0]);
    let pool_bal_before = await test_token_instance.balanceOf(asset_pool_instance.address);

    //withdraw asset
    try {
      await asset_pool_instance.withdraw(test_token_instance.address, accounts[0], await test_token_instance.balanceOf(asset_pool_instance.address));
      assert.equal(true, false, "Withdrawal worked from unauthorized bridge address")
    } catch (e) { }

  });
});


//NOTE views are public getters, don't need to_signature_string
