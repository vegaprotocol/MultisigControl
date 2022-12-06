const ERC20_Asset_Pool = artifacts.require("ERC20_Asset_Pool");
const ERC20_Bridge_Logic = artifacts.require("ERC20_Bridge_Logic_Restricted");
const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");
const MultisigControl = artifacts.require("MultisigControl");
const Nonstandard_ERC20 = artifacts.require("Nonstandard_ERC20")
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
const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");

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

function to_signature_string(sig) {
  return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') + "" + sig.v.toString(16);
}
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let new_asset_id = crypto.randomBytes(32);

let bridge_addresses = require(root_path + "bridge_addresses.json");


async function deposit_asset(bridge_logic_instance, test_token_instance, account, token_balance, skip_faucet) {
  let wallet_pubkey = crypto.randomBytes(32);

  if(!skip_faucet){
    await test_token_instance.faucet();
  }

  if (token_balance === undefined || token_balance === null) {
    token_balance = await test_token_instance.balanceOf(account);
  }

  await test_token_instance.approve(ERC20_Bridge_Logic.address, token_balance);
  await bridge_logic_instance.deposit_asset(test_token_instance.address, token_balance, wallet_pubkey);
  return token_balance;
}

async function withdraw_asset(bridge_logic_instance, test_token_instance, account, bad_params, expire, to_withdraw) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));

  if(to_withdraw === undefined || to_withdraw === null){
    to_withdraw = (await test_token_instance.balanceOf(ERC20_Asset_Pool.address)).toString();
  }

  let now = creation = await latest();

  let target = account;

  let expiry = now.toString();
  if(expire){
    let expiry = now.sub(await duration.minutes(1));
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
    to_withdraw = "543"
  }
  await bridge_logic_instance.withdraw_asset(test_token_instance.address, to_withdraw, target, creation, nonce, sig_string);
}


async function withdraw_asset_with_creation(bridge_logic_instance, test_token_instance, account, creation, bad_params) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));

  let to_withdraw = (await test_token_instance.balanceOf(ERC20_Asset_Pool.address)).toString();

  let target = account;

  //create signature
  let encoded_message = get_message_to_sign(
    ["address", "uint256", "address", "uint256"],
    [test_token_instance.address, to_withdraw, target, creation.toString()],
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
  await bridge_logic_instance.withdraw_asset(test_token_instance.address, to_withdraw, target, creation, nonce, sig_string);
}


async function set_bridge_address(bridge_logic_instance, asset_pool_instance, account, bad_sigs=false) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  //create signature
  let encoded_message = get_message_to_sign(
    ["address"],
    [bridge_logic_instance.address],
    nonce,
    "set_bridge_address",
    asset_pool_instance.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  if (bad_sigs) {
    // replace 1 char with 0 id that char is not 0 already in which case change it to 1
    if(sig_string[2] == "0") {
      sig_string = "0x1" + sig_string.slice(3);
    } else {
      sig_string = "0x0" + sig_string.slice(3);
    }    
  }
  await asset_pool_instance.set_bridge_address(bridge_logic_instance.address, nonce, sig_string);
}


async function set_exemption_lister(bridge_logic_instance, account, listerAccount) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  //create signature
  let encoded_message = get_message_to_sign(
    ["address"],
    [listerAccount],
    nonce,
    "set_exemption_lister",
    ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.set_exemption_lister(listerAccount, nonce, sig_string);
  //console.log(receipt.logs)
  return [nonce, receipt]
}


async function list_asset(bridge_logic_instance, from_address, _withdraw_threshold, target = bridge_addresses.test_token_address) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  let lifetime_limit = parseEther("1000");
  let withdraw_threshold = parseEther("100");
  if (_withdraw_threshold) {
    withdraw_threshold = _withdraw_threshold;
  }
  //create signature
  let encoded_message = get_message_to_sign(
    ["address", "bytes32", "uint256", "uint256"],
    [target, new_asset_id, lifetime_limit.toString(), withdraw_threshold.toString()],
    nonce,
    "list_asset",
    ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.list_asset(target, new_asset_id, lifetime_limit, withdraw_threshold, nonce, sig_string);
  //console.log(receipt.logs)
  return [nonce, receipt]
}


async function remove_asset(bridge_logic_instance, from_address, bad_sigs = false) {
  //bridge_addresses.test_token_address
  let nonce = new ethUtil.BN(crypto.randomBytes(32));

  //create signature
  let encoded_message = get_message_to_sign(
    ["address"],
    [bridge_addresses.test_token_address],
    nonce,
    "remove_asset",
    ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  if (bad_sigs) {
    // replace 1 char with 0 id that char is not 0 already in which case change it to 1
    if(sig_string[2] == "0") {
      sig_string = "0x1" + sig_string.slice(3);
    } else {
      sig_string = "0x0" + sig_string.slice(3);
    }    
  }

  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.remove_asset(bridge_addresses.test_token_address, nonce, sig_string);
  return [nonce, receipt];
}


async function global_stop(bridge_logic_instance, from_address, bad_sigs = false) {
  //bridge_addresses.test_token_address
  let nonce = new ethUtil.BN(crypto.randomBytes(32));

  //create signature
  let encoded_message = get_message_to_sign(
    [],
    [],
    nonce,
    "global_stop",
    ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);
  if (bad_sigs) {
    // replace 1 char with 0 id that char is not 0 already in which case change it to 1
    if(sig_string[2] == "0") {
      sig_string = "0x1" + sig_string.slice(3);
    } else {
      sig_string = "0x0" + sig_string.slice(3);
    }
  }
  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.global_stop(nonce, sig_string);
  return [nonce, receipt];
}


async function global_resume(bridge_logic_instance, from_address, bad_sigs = false) {
  //bridge_addresses.test_token_address
  let nonce = new ethUtil.BN(crypto.randomBytes(32));

  //create signature
  let encoded_message = get_message_to_sign(
    [],
    [],
    nonce,
    "global_resume",
    ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);
  if (bad_sigs) {
    // replace 1 char with 0 id that char is not 0 already in which case change it to 1
    if(sig_string[2] == "0") {
      sig_string = "0x1" + sig_string.slice(3);
    } else {
      sig_string = "0x0" + sig_string.slice(3);
    }
  }
  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.global_resume(nonce, sig_string);
  return [nonce, receipt];
}



async function set_asset_limits(bridge_logic_instance, lifetime_limit, withdraw_threshold, from_address, bad_sigs=false) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));

  //create signature
  let encoded_message = get_message_to_sign(
    ["address", "uint256", "uint256"],
    [bridge_addresses.test_token_address, lifetime_limit.toString(), withdraw_threshold.toString()],
    nonce,
    "set_asset_limits",
    ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);
  if (bad_sigs) {
    // replace 1 char with 0 id that char is not 0 already in which case change it to 1
    if(sig_string[2] == "0") {
      sig_string = "0x1" + sig_string.slice(3);
    } else {
      sig_string = "0x0" + sig_string.slice(3);
    }    
  }
  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.set_asset_limits(bridge_addresses.test_token_address, lifetime_limit, withdraw_threshold, nonce, sig_string);
  //console.log(receipt.logs)
  return [nonce, receipt]
}


async function set_withdraw_delay(bridge_logic_instance, delay, from_address, bad_sigs=false) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));

  //create signature
  let encoded_message = get_message_to_sign(
    ["uint256",],
    [delay.toString()],
    nonce,
    "set_withdraw_delay",
    ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);
  if (bad_sigs) {
    // replace 1 char with 0 id that char is not 0 already in which case change it to 1
    if(sig_string[2] == "0") {
      sig_string = "0x1" + sig_string.slice(3);
    } else {
      sig_string = "0x0" + sig_string.slice(3);
    }
  }
  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.set_withdraw_delay(delay.toString(), nonce, sig_string);
  //console.log(receipt.logs)
  return [nonce, receipt]
}


async function set_withdraw_threshold(bridge_logic_instance, withdraw_threshold, from_address, bad_sigs=false) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));

  //create signature
  let encoded_message = get_message_to_sign(
    ["address", "uint256",],
    [bridge_addresses.test_token_address, withdraw_threshold.toString()],
    nonce,
    "set_withdraw_threshold",
    ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);
  if (bad_sigs) {
    // replace 1 char with 0 id that char is not 0 already in which case change it to 1
    if(sig_string[2] == "0") {
      sig_string = "0x1" + sig_string.slice(3);
    } else {
      sig_string = "0x0" + sig_string.slice(3);
    }    
  }
  //NOTE Sig tests are in MultisigControl
  let receipt = await bridge_logic_instance.set_withdraw_threshold(bridge_addresses.test_token_address, withdraw_threshold, nonce, sig_string);
  //console.log(receipt.logs)
  return [nonce, receipt]
}

skip_it = ()=> {}

////FUNCTIONS

contract("ERC20_Bridge_Logic Function: set_asset_limits", (accounts) => {
  //function set_withdraw_threshold(address asset_source, uint256 threshold, uint256 nonce, bytes calldata signatures) public
  beforeEach(async () => {
    await init_private_keys()
  });

  it("should fail to set_asset_limits if bad sigs (0031-ETHB-030)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();

    await list_asset(bridge_logic_instance, accounts[0]);

    let current_withdraw_threshold = parseEther("100");
    // let faucetAmount = "10000000000";
    expectBignumberEqual(await bridge_logic_instance.get_withdraw_threshold(test_token_instance.address), current_withdraw_threshold);

    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

    // set threshold to lower than deposit and withdraw amounts of "10000000000"
    let lifetime_limit = "10";
    let withdraw_threshold = "1000";
    
    await shouldFailWithMessage(
      set_asset_limits(bridge_logic_instance, lifetime_limit, withdraw_threshold, accounts[0], true),
      "bad signatures"
    );
    
    await remove_asset(bridge_logic_instance, accounts[0]);
  })

  it("should fail to set_asset_limits if asset not listed (0031-ETHB-031)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();

    await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

    // set threshold to lower than deposit and withdraw amounts of "10000000000"
    let lifetime_limit = "10";
    let withdraw_threshold = "1000";
    
    await shouldFailWithMessage(
      set_asset_limits(bridge_logic_instance, lifetime_limit, withdraw_threshold, accounts[0], true),
      "asset not listed"
    );    
  })

  it("withdraw_asset should throw large withdraw is not old enough (0031-ETHB-033, 0031-ETHB-083)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();

    await list_asset(bridge_logic_instance, accounts[0]);

    let current_withdraw_threshold = parseEther("100");
    // let faucetAmount = "10000000000";
    expectBignumberEqual(await bridge_logic_instance.get_withdraw_threshold(test_token_instance.address), current_withdraw_threshold);

    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    let amountToWithdraw = (await test_token_instance.balanceOf(ERC20_Asset_Pool.address)).toString();

    await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

    // set threshold to lower than deposit and withdraw amounts of "10000000000"
    let lifetime_limit = "10";
    let withdraw_threshold = "1000";
    await set_asset_limits(bridge_logic_instance, lifetime_limit, withdraw_threshold, accounts[0]);
    // but do not increase time
    // let withdraw_delay = await bridge_logic_instance.default_withdraw_delay();
    // await increase(withdraw_delay + 1);

    await shouldFailWithMessage(
      withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0]),
      "large withdraw is not old enough"
    );

  })


  it("set_asset_limits should allow large deposit and withdrawal if creation + default_withdraw_delay <= block.timestamp (0031-ETHB-029, 0031-ETHB-026)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();

    let withdraw_threshold = "1000000000";
    let lifetime_limit = parseEther("100");
    await set_asset_limits(bridge_logic_instance, lifetime_limit, withdraw_threshold, accounts[0]);

    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

    expectBignumberEqual(await bridge_logic_instance.default_withdraw_delay(), 432000);

    // valid withdraw with amount > withdraw threshold
    let account_bal_before = await test_token_instance.balanceOf(accounts[0]);
    let pool_bal_before = await test_token_instance.balanceOf(asset_pool_instance.address);

    //withdraw should work if creation + default_withdraw_delay <= block.timestamp
    let creation = (await latest()).sub(toBN(432000));

    await withdraw_asset_with_creation(bridge_logic_instance, test_token_instance, accounts[0], creation);

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


  })

})

contract("ERC20_Bridge_Logic Function: erc20_asset_pool_address", (accounts) => {
  beforeEach(async () => {
    await init_private_keys()
  });

  it("erc20_asset_pool_address should return correct address (0031-ETHB-018)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();

    expect(await bridge_logic_instance.erc20_asset_pool_address()).to.be.equal(asset_pool_instance.address);
  })
})

contract("ERC20_Bridge_Logic Function: revoke_exempt_depositor", (accounts) => {
  //function revoke_exempt_depositor(address depositor) public override
  beforeEach(async () => {
    await init_private_keys()

  });

  it("revoke_exempt_depositor should revoke exempted depositor", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    let lister = accounts[1];
    // await set_exemption_lister(bridge_logic_instance, accounts[0], lister);
    // expect(await bridge_logic_instance.get_exemption_lister()).to.be.equal(accounts[1]);
    await bridge_logic_instance.exempt_depositor({from: accounts[2]});
    expect(await bridge_logic_instance.is_exempt_depositor(accounts[2])).to.be.equal(true);

    await bridge_logic_instance.revoke_exempt_depositor({from: accounts[2]});
    expect(await bridge_logic_instance.is_exempt_depositor(accounts[2])).to.be.equal(false);
  })

  it("any ETH address can call revoke_exempt_depositor to remove itself (own ETH address) from the exemption list - (0003-NP-LIMI-002, 0031-ETHB-049, 0031-ETHB-051)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    await bridge_logic_instance.exempt_depositor({from: accounts[5]});
    expect(await bridge_logic_instance.is_exempt_depositor(accounts[5])).to.be.equal(true);

    // expect(await bridge_logic_instance.get_exemption_lister()).to.be.equal(accounts[1]);
    await bridge_logic_instance.revoke_exempt_depositor({from: accounts[5]});

    expect(await bridge_logic_instance.is_exempt_depositor(accounts[5])).to.be.equal(false);
  })

  it("revoke_exempt_depositor should fail if not already exempted (0031-ETHB-050)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();

    await shouldFailWithMessage(
      bridge_logic_instance.revoke_exempt_depositor({from: accounts[2]}),
      "sender not exempt"
    );
  })

  it("revoke_exempt_depositor should emit correct event and params", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    let lister = accounts[1];
    // await set_exemption_lister(bridge_logic_instance, accounts[0], lister);
    await bridge_logic_instance.exempt_depositor({from: accounts[1]});
    const tx = await bridge_logic_instance.revoke_exempt_depositor({from: accounts[1]});
    const {args} = await findEventInTransaction(tx, "Depositor_Exemption_Revoked");
    expect(args.depositor).to.be.equal(accounts[1]);
  })

});


contract("ERC20_Bridge_Logic Function: exempt_depositor", (accounts) => {
  //function exempt_depositor(address depositor) public override
  beforeEach(async () => {
    await init_private_keys()

  });

  /*
  it("exempt_depositor should revert if not lister", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    //let lister = accounts[1];
    // expect(await bridge_logic_instance.get_exemption_lister()).to.be.equal(ZERO_ADDRESS);
    //// await set_exemption_lister(bridge_logic_instance, accounts[0], lister);

    await shouldFailWithMessage(
      bridge_logic_instance.exempt_depositor({from: accounts[1]}),
      "unauthorized exemption lister"
    );

    expect(await bridge_logic_instance.get_exemption_lister()).to.be.equal(ZERO_ADDRESS);

  })*/

  it("any ETH address can call exempt_depositor to add itself (own ETH address) to the exemption list - 0003-NP-LIMI-002", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    await bridge_logic_instance.exempt_depositor({from: accounts[5]});

    expect(await bridge_logic_instance.is_exempt_depositor(accounts[5])).to.be.equal(true);

  })

  it("exempt_depositor should emit correct event and params", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    let lister = accounts[1];
    // await set_exemption_lister(bridge_logic_instance, accounts[0], lister);

    const tx = await bridge_logic_instance.exempt_depositor({from: accounts[1]});

    const {args} = await findEventInTransaction(tx, 'Depositor_Exempted');
    expect(args.depositor).to.be.equal(accounts[1]);
  })

  /*it("exempt_depositor should revert for zero address", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    expect(await bridge_logic_instance.is_exempt_depositor(ZERO_ADDRESS)).to.be.equal(false);

    let lister = accounts[1];
    // await set_exemption_lister(bridge_logic_instance, accounts[0], lister);

    await shouldFailWithMessage(
      bridge_logic_instance.exempt_depositor(ZERO_ADDRESS, {from: accounts[1]}),
      "cannot exempt zero address"
    );

    expect(await bridge_logic_instance.is_exempt_depositor(ZERO_ADDRESS)).to.be.equal(false);
  })*/

  it("is_exempt_depositor should return true if exempted", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    let lister = accounts[1];
    // await set_exemption_lister(bridge_logic_instance, accounts[0], lister);

    expect(await bridge_logic_instance.is_exempt_depositor(accounts[2])).to.be.equal(false);
  })

  it("is_exempt_depositor should return false if not exempted", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    expect(await bridge_logic_instance.is_exempt_depositor(accounts[8])).to.be.equal(false);
  })

  it("exempt_depositor should not be callable multiple time for the same depositor (0031-ETHB-048)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    let lister = accounts[1];
    // await set_exemption_lister(bridge_logic_instance, accounts[0], lister);

    await bridge_logic_instance.exempt_depositor({from: accounts[2]});
    expect(await bridge_logic_instance.is_exempt_depositor(accounts[2])).to.be.equal(true);

    await shouldFailWithMessage(
      bridge_logic_instance.exempt_depositor({from: accounts[2]}),
      "sender already exempt"
    );
    expect(await bridge_logic_instance.is_exempt_depositor(accounts[2])).to.be.equal(true);
  })

})

contract("ERC20_Bridge_Logic Function: set_withdraw_delay", (accounts) => {
  //function set_withdraw_delay(uint256 delay, uint256 nonce, bytes calldata signatures) public
  beforeEach(async () => {
    await init_private_keys()

  });

  it("set_withdraw_delay should update delay in contract and emit correct event and parameters (0031-ETHB-034)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();

    let delay = 432001;

    expectBignumberEqual(await bridge_logic_instance.default_withdraw_delay(), 432000);

    [nonce, receipt] = await set_withdraw_delay(bridge_logic_instance, delay, accounts[0]);
    const { args } = await findEventInTransaction(receipt, "Bridge_Withdraw_Delay_Set");
      expectBignumberEqual(delay, args.withdraw_delay);

    expectBignumberEqual(await bridge_logic_instance.default_withdraw_delay(), 432001);

  })

  it("set_withdraw_delay should revert if bad sigs (0031-ETHB-036)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    
    await shouldFailWithMessage(
      set_withdraw_delay(bridge_logic_instance, 1234, accounts[0], true),
      "bad signatures"
    ); 
  })

})


contract("ERC20_Bridge_Logic Function: set_asset_limits", (accounts) => {
  //function set_asset_limits(address asset_source, uint256 lifetime_limit, uint256 withdraw_threshold, uint256 nonce, bytes calldata signatures) public;
  beforeEach(async () => {
    await init_private_keys()

  });

  it("set_asset_limits reverts if asset not listed", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    let lifetime_limit = parseEther("100");
    let withdraw_threshold = parseEther("1000");

    //new asset ID is not listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      false,
      "token is listed, shouldn't be"
    );

    await shouldFailWithMessage(
      set_asset_limits(bridge_logic_instance, lifetime_limit, withdraw_threshold, accounts[0]),
      "asset not listed"
    )
  })

  it("set_asset_limits should not revert if asset is listed and emit correct event and parameters (0031-ETHB-032)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    let lifetime_limit = parseEther("100");
    let withdraw_threshold = parseEther("1000");

    //new asset ID is not listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      false,
      "token is listed, shouldn't be"
    );

    //list new asset
    await list_asset(bridge_logic_instance, accounts[0]);

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      true,
      "token isn't listed, should be"
    );

    [nonce, receipt] = await set_asset_limits(bridge_logic_instance, lifetime_limit, withdraw_threshold, accounts[0]);
    const { args } = await findEventInTransaction(receipt, "Asset_Limits_Updated");
      expect(bridge_addresses.test_token_address).to.be.equal(args.asset_source);
      expectBignumberEqual(lifetime_limit, args.lifetime_limit);
      expectBignumberEqual(withdraw_threshold, args.withdraw_threshold);


    //get_asset_deposit_lifetime_limit for asset source should return correct limit set
    expectBignumberEqual(await bridge_logic_instance.get_asset_deposit_lifetime_limit(test_token_instance.address), lifetime_limit);

  })

  it("deposit asset should revert if total deposited by user is > maximum lifetime deposit (0031-ETHB-058)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    let faucetAmount = "10000000000"; // 5 decimals
    let lifetime_limit = parseInt(faucetAmount) / 2;
    let withdraw_threshold = parseEther("1000");

    await set_asset_limits(bridge_logic_instance, lifetime_limit, withdraw_threshold, accounts[0]);

    expectBignumberEqual(await bridge_logic_instance.get_asset_deposit_lifetime_limit(test_token_instance.address), lifetime_limit);

    await shouldFailWithMessage(
      deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]),
      "deposit over lifetime limit"
    );
  })


  it("deposit asset should not revert if depositor is exempted and total deposited by user is > maximum lifetime deposit (0031-ETHB-047, 0031-ETHB-057, 0031-ETHB-055)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    let faucetAmount = "10000000000"; // 100 thousand in 5 decimals
    let lifetime_limit = parseInt(faucetAmount) / 2;
    let withdraw_threshold = parseEther("1000");

    await set_asset_limits(bridge_logic_instance, lifetime_limit, withdraw_threshold, accounts[0]);

    expectBignumberEqual(await bridge_logic_instance.get_asset_deposit_lifetime_limit(test_token_instance.address), lifetime_limit);

    await shouldFailWithMessage(
      deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]),
      "deposit over lifetime limit"
    );

    let lister = accounts[1];
    // // await set_exemption_lister(bridge_logic_instance, accounts[0], lister);
    await bridge_logic_instance.exempt_depositor({from: accounts[0]});

    // balance before deposit
    let balanceBefore = await test_token_instance.balanceOf(accounts[0]);
    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);
    // balance after deposit
    let balanceAfter = await test_token_instance.balanceOf(accounts[0]);
    expect(balanceAfter).to.be.bignumber.lessThan(balanceBefore);
  })
})


contract("ERC20_Bridge_Logic Function: get_asset_deposit_lifetime_limit", (accounts) => {
  beforeEach(async () => {
    await init_private_keys()
  });

  it("get_asset_deposit_lifetime_limit for non existing asset returns 0", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    expectBignumberEqual(await bridge_logic_instance.get_asset_deposit_lifetime_limit(accounts[1]), 0);

  })
})

contract("ERC20_Bridge_Logic Function: global_stop", (accounts) => {
  //function global_stop(uint256 nonce, bytes calldata signatures) public;
  beforeEach(async () => {
    await init_private_keys()

  });

  it("global_stop should revert if bad signature (0031-ETHB-041)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();

    await shouldFailWithMessage(
      global_stop(bridge_logic_instance, accounts[0], true),
      "bad signatures"
    )
  })

  it("global_stop throws bridge already stopped (0031-ETHB-040)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(false);
    await global_stop(bridge_logic_instance, accounts[0]);
    expect(await bridge_logic_instance.is_stopped()).to.be.equal(true);

    await shouldFailWithMessage(
      global_stop(bridge_logic_instance, accounts[0]),
      "bridge already stopped"
    );
    expect(await bridge_logic_instance.is_stopped()).to.be.equal(true);
  })

  it("global_stop should set is_stopped to true and emit correct event (0031-ETHB-027, 0031-ETHB-028, 0031-ETHB-037)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    await global_resume(bridge_logic_instance, accounts[0]);

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(false);
    let [nonce, receipt] = await global_stop(bridge_logic_instance, accounts[0]);

    const { args } = await findEventInTransaction(receipt, "Bridge_Stopped");

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(true);
  })

  it("deposit asset should revert when is_stopped (0031-ETHB-038)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(true);

    //new asset ID is not listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      false,
      "token is listed, shouldn't be"
    );

    //list new asset
    await list_asset(bridge_logic_instance, accounts[0]);

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      true,
      "token isn't listed, should be"
    );

    await shouldFailWithMessage(
      deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]),
      "bridge stopped"
    )

  })


  it("withdraw asset should revert when is_stopped (0031-ETHB-039)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(true);

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      true,
      "token isn't listed, should be"
    );

    await global_resume(bridge_logic_instance, accounts[0]);

    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    //user balance deducted
    assert.equal(
      await test_token_instance.balanceOf(accounts[0]),
      0,
      "token balance was not deposited, balance should be zero"
    );

    await global_stop(bridge_logic_instance, accounts[0]);

    await shouldFailWithMessage(
      withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0]),
      "bridge stopped"
    )
  })

})


contract("ERC20_Bridge_Logic Function: global_resume", (accounts) => {
  //function global_stop(uint256 nonce, bytes calldata signatures) public;
  beforeEach(async () => {
    await init_private_keys()

  });

  it("global_resume should set is_stopped to false and emit correct event (0031-ETHB-042)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(false);

    await global_stop(bridge_logic_instance, accounts[0]);
    expect(await bridge_logic_instance.is_stopped()).to.be.equal(true);

    let [nonce, receipt] = await global_resume(bridge_logic_instance, accounts[0]);
    const { args } = await findEventInTransaction(receipt, "Bridge_Resumed");

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(false);
  })

  it("global_resume throws bridge not stopped if it is not stopped (0031-ETHB-045)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(false);

    await shouldFailWithMessage(
      global_resume(bridge_logic_instance, accounts[0]),
      "bridge not stopped"
    );

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(false);
  })

  it("global_resume must resume deposits (0031-ETHB-043)", async()=>{
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    await list_asset(bridge_logic_instance, accounts[0]);

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(false);

    await global_stop(bridge_logic_instance, accounts[0]);
    expect(await bridge_logic_instance.is_stopped()).to.be.equal(true);
    await global_resume(bridge_logic_instance, accounts[0]);

    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);
  })

  it("global_resume must resume withdrawals (0031-ETHB-044)", async()=>{
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();

    await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(false);

    await global_stop(bridge_logic_instance, accounts[0]);
    expect(await bridge_logic_instance.is_stopped()).to.be.equal(true);
    await global_resume(bridge_logic_instance, accounts[0]);

    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);
    await withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0], false);
  })

  it("global_resume fails with bad signatures (0031-ETHB-046)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    await global_stop(bridge_logic_instance, accounts[0]);
    expect(await bridge_logic_instance.is_stopped()).to.be.equal(true);

    await shouldFailWithMessage(
      global_resume(bridge_logic_instance, accounts[1], true),
      "bad signatures"
    );

    expect(await bridge_logic_instance.is_stopped()).to.be.equal(true);
  })


})

contract("ERC20_Bridge_Logic Function: list_asset", (accounts) => {
  //function list_asset(address asset_source, uint256 asset_id, bytes32 vega_id, uint256 nonce, bytes memory signatures) public;
  beforeEach(async () => {
    await init_private_keys()

  });

  it("list_asset should trigger bad signatures with invalid signature string (0031-ETHB-021)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    //new asset ID is not listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      false,
      "token is listed, shouldn't be"
    );

    //unlisted asset cannot be deposited
    try {
      await deposit_asset(bridge_logic_instance, test_token_instance, account[0]);
      assert.equal(
        true,
        false,
        "token deposit worked, shouldn't have"
      );
    } catch (e) { }

    //list new asset should fail
    let nonce = new ethUtil.BN(crypto.randomBytes(32));

    await shouldFailWithMessage(
      bridge_logic_instance.list_asset(
        bridge_addresses.test_token_address,
        new_asset_id,
        parseEther("100"),
        parseEther("100"),
        nonce,
        "0x"
      ),
      "must contain at least 1 sig"
    );

  });

  it("asset that was not listed is listed after running list_asset (0031-ETHB-020, 0031-ETHB-056, 0031-ETHB-060, 0031-ETHB-061, 0031-ETHB-062, 0031-ETHB-063, 0031-ETHB-019, 0031-ETHB-022)", async () => {

    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    //new asset ID is not listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      false,
      "token is listed, shouldn't be"
    );
    //unlisted asset cannot be deposited
    try {
      await deposit_asset(bridge_logic_instance, test_token_instance, account[0]);
      assert.equal(
        true,
        false,
        "token deposit worked, shouldn't have"
      );
    } catch (e) { }

    //list new asset
    const [nonce, receipt] = await list_asset(bridge_logic_instance, accounts[0]);

    // check event parameters
    const { args } = await findEventInTransaction(receipt, "Asset_Listed");
    expectBignumberEqual(args.nonce, nonce);
    expect(args.asset_source).to.be.equal(bridge_addresses.test_token_address);
    expect(args.vega_asset_id).to.be.equal(bytesToHex(new_asset_id));

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      true,
      "token isn't listed, should be"
    );

    await shouldFailWithMessage(
      list_asset(bridge_logic_instance, accounts[0]),
      "asset already listed"
    )

    //deposit new asset
    let amount_deposited = await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    //user balance deducted
    assert.equal(
      await test_token_instance.balanceOf(accounts[0]),
      0,
      "token balance was not deposited, balance should be zero"
    );


  });

  it("list_asset fails to list an already listed asset (0031-ETHB-020)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      true,
      "token isn't listed, should be"
    );

    //list new asset fails
    try {
      await list_asset(bridge_logic_instance, accounts[0]);
      assert.equal(
        false,
        true,
        "attempting to relist token succeded, shouldn't have"
      );
    } catch (e) { }

  });

  //NOTE signature tests are covered in MultisigControl
});

contract("ERC20_Bridge_Logic Function: remove_asset", (accounts) => {
  beforeEach(async () => {
    await init_private_keys()

  });
  //function remove_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public;
  it("listed asset is not listed after running remove_asset and no longer able to deposited (0031-ETHB-023)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    try {
      await list_asset(bridge_logic_instance, accounts[0]);
    } catch (e) {/*ignore if already listed*/ }

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      true,
      "token isn't listed, should be"
    );
    //deposit new asset, should work
    let amount_deposited = await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    //remove new asset
    const [nonce, receipt] = await remove_asset(bridge_logic_instance, accounts[0]);

    // check event parameters
    const { args } = await findEventInTransaction(receipt, "Asset_Removed");

    expectBignumberEqual(args.nonce, nonce);
    expect(args.asset_source).to.be.equal(bridge_addresses.test_token_address);

    //deposit fails
    try {
      await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);
      assert.equal(true, false, "deposit of removed asset succedded, shouldn't have")
    } catch (e) { }

  });
  it("should fail to remove asset if asset is not listed (0031-ETHB-024)", async() => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    //new asset ID is not listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      false,
      "token is listed, shouldn't be"
    );
    bridge_logic_instance.test_token_address = test_token_instance.address;
    //remove new asset fails
    await shouldFailWithMessage(remove_asset(bridge_logic_instance, accounts[0]), "asset not listed");
    
  })

  it("should fail to remove asset if signature is bad (0031-ETHB-025)", async() => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    try {
      await list_asset(bridge_logic_instance, accounts[0]);
    } catch (e) {/*ignore if already listed*/ }

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      true,
      "token isn't listed, should be"
    );

    //remove new asset fails
    await shouldFailWithMessage(remove_asset(bridge_logic_instance, accounts[0], true), 
    "bad signatures");
  })
});

contract("ERC20_Bridge_Logic Function: deposit_asset", (accounts) => {
  //function deposit_asset(address asset_source, uint256 asset_id, uint256 amount, bytes32 vega_public_key) public;
  beforeEach(async () => {
    await init_private_keys()

  });
  it("deposit_asset with nonstandard ERC20", async () => {
    let nonstandard_token_instance = await Nonstandard_ERC20.new("x", "x")
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    await list_asset(bridge_logic_instance, accounts[0], undefined, nonstandard_token_instance.address);
    assert.equal(
      await bridge_logic_instance.is_asset_listed(nonstandard_token_instance.address),
      true,
      "token isn't listed, should be"
    );

    await shouldFailWithMessage(
      deposit_asset(bridge_logic_instance, nonstandard_token_instance, accounts[0], "1", true),
      "token transfer failed"
    );

    await deposit_asset(bridge_logic_instance, nonstandard_token_instance, accounts[0], "1");
    assert.equal(
      (await nonstandard_token_instance.balanceOf(ERC20_Asset_Pool.address)).toString(),
      "1",
      "deposit failed"
    );
  })
  it("deposit_asset with nonstandard ERC20 fails due to token transfer fail", async () => {
    let nonstandard_token_instance = await Nonstandard_ERC20.new("x", "x")
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    await list_asset(bridge_logic_instance, accounts[0], undefined, nonstandard_token_instance.address);
    assert.equal(
      await bridge_logic_instance.is_asset_listed(nonstandard_token_instance.address),
      true,
      "token isn't listed, should be"
    );

    await shouldFailWithMessage(
      deposit_asset(bridge_logic_instance, nonstandard_token_instance, accounts[0], "1", true),
      "token transfer failed"
    );

  })
  it("deposit_asset should fail due to asset not being listed", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    //try to deposit asset, fails
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      false,
      "token is listed, shouldn't be"
    );

    try {
      await deposit_asset(bridge_logic_instance, test_token_instance, "1");
      assert.equal(
        true,
        false,
        "token deposit worked, shouldn't have"
      );
    } catch (e) { }

  });
  it("happy path - should allow listed asset to be deposited", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    //list asset
    await list_asset(bridge_logic_instance, accounts[0]);

    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      true,
      "token isn't listed, should be"
    );

    //deposit asset
    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);
  });
});

contract("ERC20_Bridge_Logic Function: withdraw_asset", (accounts) => {
  //function withdraw_asset(address asset_source, uint256 asset_id, uint256 amount, uint256 expiry, uint256 nonce, bytes memory signatures) public;
  beforeEach(async () => {
    await init_private_keys()

  });


  it("happy path - should allow withdrawal from a generated withdraw ticket signed by MultisigControl (0031-ETHB-052)", async () => {
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

    await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

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

  it("withdraw_asset with nonstandard ERC20", async () => {
    let nonstandard_token_instance = await Nonstandard_ERC20.new("x", "x")
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    await list_asset(bridge_logic_instance, accounts[0], undefined, nonstandard_token_instance.address);
    assert.equal(
      await bridge_logic_instance.is_asset_listed(nonstandard_token_instance.address),
      true,
      "token isn't listed, should be"
    );


    await shouldFailWithMessage(
      withdraw_asset(bridge_logic_instance, nonstandard_token_instance, accounts[0], false, false, "1"),
      "token transfer failed"
    );

    await shouldFailWithMessage(
      deposit_asset(bridge_logic_instance, nonstandard_token_instance, accounts[0], "1", true),
      "token transfer failed"
    );

    await deposit_asset(bridge_logic_instance, nonstandard_token_instance, accounts[0], "1");
    await withdraw_asset(bridge_logic_instance, nonstandard_token_instance, accounts[0], false, false, "1")
  })

  it("withdraw_asset with nonstandard ERC20 fails due to token not transferring", async () => {
    let nonstandard_token_instance = await Nonstandard_ERC20.new("x", "x")
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    await list_asset(bridge_logic_instance, accounts[0], undefined, nonstandard_token_instance.address);

    assert.equal(
      await bridge_logic_instance.is_asset_listed(nonstandard_token_instance.address),
      true,
      "token isn't listed, should be"
    );


    await shouldFailWithMessage(
      withdraw_asset(bridge_logic_instance, nonstandard_token_instance, accounts[0], false, false, "1"),
      "token transfer failed"
    );
  })


  it("withdraw_asset fails due to amount mismatch between signature and function params (0031-ETHB-053, 0031-ETHB-054)", async () => {
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

    await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

    //deposit asset
    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    //withdraw asset
    try {
      await withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0], true);
      assert.equal(
        true,
        false,
        "pad params withdrawal worked, shouldn't have"
      );
    } catch (e) { }
  });
  //NOTE signature tests are covered in MultisigControl

  it("withdraw_asset fails to withdraw asset if expiry timestamp has elapsed (0031-ETHB-082)", async () => {

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

    await set_bridge_address(bridge_logic_instance, asset_pool_instance, accounts[0]);

    //deposit asset
    await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

    //withdraw asset

    try {
      await withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0], false, true);
      assert.equal(
        true,
        false,
        "expired withdrawal worked, shouldn't have"
      );
    } catch (e) { }
  });
});




/////VIEWS
contract("ERC20_Bridge_Logic Function: is_asset_listed", (accounts) => {
  //function is_asset_listed(address asset_source, uint256 asset_id) public view returns(bool);
  beforeEach(async () => {
    await init_private_keys()

  });

  it("asset is listed after 'list_asset'", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();
    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      false,
      "token listed, shouldn't be"
    );
    //list asset
    await list_asset(bridge_logic_instance, accounts[0]);

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      true,
      "token isn't listed, should be"
    );
  });

  it("asset is not listed after 'remove_asset'", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();
    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      true,
      "token not listed, should be"
    );
    //list asset
    await remove_asset(bridge_logic_instance, accounts[0]);

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      false,
      "token is listed, shouldn't be"
    );
  });
});

/* contract("ERC20_Bridge_Logic Function: get_deposit_minimum", (accounts) => {
  //function get_deposit_minimum(address asset_source, uint256 asset_id) public view returns(uint256);
  beforeEach(async () => {
    await init_private_keys()

  });
  it("minimum deposit updates after set_deposit_minimum", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();

    //Get minimum deposit
    let deposit_minimum = (await bridge_logic_instance.get_deposit_minimum(test_token_instance.address)).toString();
    assert.equal(deposit_minimum, "0", "deposit min should be zero, isn't");

    try {
      await list_asset(bridge_logic_instance, accounts[0]);
    } catch (e) {//ignore if already listed }

    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      true,
      "token isn't listed, should be"
    );

    //Set minimum deposit
    //NOTE signature tests are in MultisigControl
    let nonce = new ethUtil.BN(crypto.randomBytes(32));
    let encoded_message = get_message_to_sign(
      ["address", "uint256"],
      [test_token_instance.address, "500"],
      nonce,
      "set_deposit_minimum",
      ERC20_Bridge_Logic.address);
    let encoded_hash = ethUtil.keccak256(encoded_message);

    let signature = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
    let sig_string = to_signature_string(signature);

    await bridge_logic_instance.set_deposit_minimum(test_token_instance.address, "500", nonce, sig_string);

    //Get minimum deposit, should be updated
    deposit_minimum = (await bridge_logic_instance.get_deposit_minimum(test_token_instance.address)).toString();
    assert.equal(deposit_minimum, "500", "deposit min should be 500, isn't");
  });
}); */

contract("ERC20_Bridge_Logic Function: get_multisig_control_address", (accounts) => {
  beforeEach(async () => {
    await init_private_keys()

  });
  //function get_multisig_control_address() public view returns(address);
  it("get_multisig_control_address returns the address it was initialized with (0031-ETHB-064)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let asset_pool_instance = await ERC20_Asset_Pool.deployed();

    let multisig_control_address = await bridge_logic_instance.get_multisig_control_address();
    assert.equal(multisig_control_address, MultisigControl.address, "Multisig control shows the wrong address");
  });
});

contract("ERC20_Bridge_Logic Function: get_vega_asset_id", (accounts) => {
  beforeEach(async () => {
    await init_private_keys()

  });
  //function get_vega_asset_id(address asset_source) public view returns(bytes32);
  it("get_vega_asset_id returns proper vega id for newly listed assets (0031-ETHB-065)", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    //new asset ID is not listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      false,
      "token is listed, shouldn't be"
    );

    //non listed asset should fail vega_asset_id
    let vega_asset_id = await bridge_logic_instance.get_vega_asset_id(test_token_instance.address);

    assert.equal(vega_asset_id, "0x0000000000000000000000000000000000000000000000000000000000000000", "Asset has already been listed, shouldn't be")
    await list_asset(bridge_logic_instance, accounts[0]);
    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      true,
      "token isn't listed, should be"
    );
    vega_asset_id = await bridge_logic_instance.get_vega_asset_id(test_token_instance.address);
    assert.equal(vega_asset_id, ("0x" + new_asset_id.toString("hex")), "listed asset returns incorrect address")

  });

  it("get_vega_asset_id returns vega id 0x00... for unknown assets", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();

    assert.equal(
      await bridge_logic_instance.is_asset_listed(accounts[3]),
      false,
      "token is listed, shouldn't be"
    );

    //non listed asset should fail vega_asset_id
    let vega_asset_id = await bridge_logic_instance.get_vega_asset_id(accounts[3]);

    assert.equal(vega_asset_id, "0x0000000000000000000000000000000000000000000000000000000000000000", "Asset has already been listed, shouldn't be")

  });
});

contract("ERC20_Bridge_Logic Function: get_asset_source (0031-ETHB-066)", (accounts) => {
  beforeEach(async () => {
    await init_private_keys()

  });
  it("get_asset_source returns proper values for newly listed asset", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    //new asset ID is not listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address),
      false,
      "token is listed, shouldn't be"
    );

    //non listed asset should fail get_asset_source
    let asset_source = await bridge_logic_instance.get_asset_source("0x" + new_asset_id.toString("hex"));
    assert.equal(asset_source, "0x0000000000000000000000000000000000000000", "Asset has already been listed, shouldn't be")
    await list_asset(bridge_logic_instance, accounts[0]);
    //new asset ID is listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(test_token_instance.address),
      true,
      "token isn't listed, should be"
    );
    asset_source = await bridge_logic_instance.get_asset_source("0x" + new_asset_id.toString("hex"));
    assert.equal(asset_source, test_token_instance.address, "listed asset returns incorrect address")
  });

  it("get_asset_source_and_asset_id fails to return for unknown assets", async () => {
    let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
    let test_token_instance = await Base_Faucet_Token.deployed();
    let bad_asset = crypto.randomBytes(32);
    //new asset ID is not listed
    assert.equal(
      await bridge_logic_instance.is_asset_listed(accounts[0]),
      false,
      "token is listed, shouldn't be"
    );

    //non listed asset should fail get_asset_source
    let asset_source = await bridge_logic_instance.get_asset_source("0x" + bad_asset.toString("hex"));
    assert.equal(asset_source, "0x0000000000000000000000000000000000000000", "Asset has already been listed, shouldn't be");

  });




});
