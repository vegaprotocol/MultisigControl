const ETH_Asset_Pool = artifacts.require("ETH_Asset_Pool");
const MultisigControl = artifacts.require("MultisigControl");
const ETH_Bridge_Logic = artifacts.require("ETH_Bridge_Logic");

const { shouldFailWithMessage, parseEther, duration, latest } = require("../helpers/utils");

const abi = require('ethereumjs-abi');
const crypto = require("crypto");
const ethUtil = require('ethereumjs-util');

let root_path = "../ropsten_deploy_details/local/";

let bridge_addresses = require(root_path + "bridge_addresses.json");
// {"eth_asset_pool":"0xc6a6000d740707edc35f75f42447320B60450c04","eth_bridge_logic":"0xE25F12E386Cd7F84c41B5210504d9743A35Badda"}

/*The following will generate 10 addresses from the mnemonic located in the .secret file*/
const fs = require("fs");
//TODO: ganache-cli -m "contents of .secret"
const mnemonic = fs.readFileSync(".secret").toString().trim();

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const wallet = require('ethereumjs-wallet');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const { findEventInTransaction } = require('../helpers/events');
const { expectBignumberEqual, expect } = require("../helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { formatEther } = require("@ethersproject/units");
const exp = require("constants");

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

// (0031-ETHM-004)
async function deposit_asset(bridge_logic_instance, account, amount) {
  let wallet_pubkey = crypto.randomBytes(32);
  let receipt = await bridge_logic_instance.deposit_asset(wallet_pubkey, { from: account, value: amount });
  return receipt;
}

async function withdraw_asset(bridge_logic_instance, account, expiry, bad_params, bad_user) {
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  let to_withdraw = (await web3.eth.getBalance(ETH_Asset_Pool.address)).toString();
  let target = account;

  if (bad_user !== undefined) {
    target = bad_user;
  }

  //create signature
  let encoded_message = get_message_to_sign(
    ["uint256", "uint256", "address"],
    [to_withdraw, expiry, account],
    nonce,
    "withdraw_asset",
    ETH_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);
  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);

  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  if (bad_params) {
    to_withdraw = "1"
  }

  let receipt = await bridge_logic_instance.withdraw_asset(to_withdraw, expiry, target, nonce, sig_string, { from: account });
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



////FUNCTIONS
contract("ETH_Bridge_Logic Function: set_deposit_minimum (0031-ETHM-002)", (accounts) => {
  // function set_deposit_minimum(uint256 minimum_amount, uint256 nonce, bytes memory signatures) public override{

  beforeEach(async () => {
    await init_private_keys()

  });
  it("deposit minimum changes and is enforced by running set_deposit_minimum", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();

    //Get minimum deposit
    let deposit_minimum = (await bridge_logic_instance.get_deposit_minimum()).toString();
    assert.equal(deposit_minimum, "0", "deposit min should be zero, isn't");

    //Set minimum deposit
    //NOTE signature tests are in MultisigControl
    let nonce = new ethUtil.BN(crypto.randomBytes(32));
    let encoded_message = get_message_to_sign(
      ["uint256"],
      [(5 * Math.pow(10, 18)).toString()],
      nonce,
      "set_deposit_minimum",
      ETH_Bridge_Logic.address);
    let encoded_hash = ethUtil.keccak256(encoded_message);

    let signature = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
    let sig_string = to_signature_string(signature);

    const tx = await bridge_logic_instance.set_deposit_minimum(parseEther('5'), nonce, sig_string);

    const { args } = await findEventInTransaction(tx, "ETH_Deposit_Minimum_Set");

    expectBignumberEqual(args.new_minimum, web3.utils.toWei('5', 'ether'));
    expectBignumberEqual(args.nonce, nonce);

    // Get minimum deposit, should be updated
    deposit_minimum = (await bridge_logic_instance.get_deposit_minimum()).toString();
    assert.equal(deposit_minimum, web3.utils.toWei('5', 'ether'), "deposit min should be 5 eth, isn't");

    // deposit less than min should fail (0031-ETHM-003)
    const depositAmount = web3.utils.toWei('2', 'ether');
    // check user has enough ETH in wallet to cover deposit amount
    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.greaterThanOrEqual(parseInt(formatEther(depositAmount))
      );

    try {
      await deposit_asset(bridge_logic_instance, accounts[0], depositAmount);
      assert.equal(
        true,
        false,
        "token deposit worked, shouldn't have"
      );
    } catch (e) { }

    //deposit more than min should work
    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.greaterThanOrEqual(parseInt(formatEther(web3.utils.toWei('10', 'ether')))
      );

    await deposit_asset(bridge_logic_instance, accounts[0], web3.utils.toWei('10', 'ether'));

    // todo check deposited amount in contract
  });
})


contract("ETH_Bridge_Logic Function: set_deposit_maximum", (accounts) => {
  //    function set_deposit_maximum(uint256 maximum_amount, uint256 nonce, bytes memory signatures) public override {

  beforeEach(async () => {
    await init_private_keys()

  });

  it("deposit maximum changes and is enforced by running set_deposit_maximum", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();

    //Get maximum deposit
    let deposit_maximum = (await bridge_logic_instance.get_deposit_maximum()).toString();
    assert.equal(deposit_maximum, "0", "deposit max should be zero, isn't");

    //Set maximum deposit
    //NOTE signature tests are in MultisigControl
    let nonce = new ethUtil.BN(crypto.randomBytes(32));
    let encoded_message = get_message_to_sign(
      ["uint256"],
      [(5 * Math.pow(10, 18)).toString()],
      nonce,
      "set_deposit_maximum",
      ETH_Bridge_Logic.address);
    let encoded_hash = ethUtil.keccak256(encoded_message);

    let signature = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
    let sig_string = to_signature_string(signature);

    const tx = await bridge_logic_instance.set_deposit_maximum(parseEther('5'), nonce, sig_string);

    const { args } = await findEventInTransaction(tx, "ETH_Deposit_Maximum_Set");

    expectBignumberEqual(args.new_maximum, web3.utils.toWei('5', 'ether'));
    expectBignumberEqual(args.nonce, nonce);

    //Get maximum deposit, should be updated
    deposit_maximum = (await bridge_logic_instance.get_deposit_maximum()).toString();
    assert.equal(deposit_maximum, web3.utils.toWei('5', 'ether'), "deposit max should be 5 eth, isn't");

    const depositAmount = web3.utils.toWei('4', 'ether')

    //deposit less than max should work
    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.greaterThanOrEqual(parseInt(formatEther(depositAmount))
      );


    await deposit_asset(bridge_logic_instance, accounts[0], depositAmount);

    // depositing max should work
    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.greaterThanOrEqual(parseInt(formatEther(web3.utils.toWei('5', 'ether')))
      );


    await deposit_asset(bridge_logic_instance, accounts[0], web3.utils.toWei('5', 'ether'));

    //deposit more than max should fail
    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.greaterThanOrEqual(parseInt(formatEther(web3.utils.toWei('6', 'ether')))
      );

    try {
      await deposit_asset(bridge_logic_instance, accounts[0], web3.utils.toWei('6', 'ether'));
      assert.equal(
        true,
        false,
        "token deposit worked, shouldn't have"
      );
    } catch (e) { }
  });
});


contract("ETH_Bridge_Logic Function: deposit_asset", (accounts) => {
  //    function withdraw_asset(uint256 amount, uint256 expiry, address payable target, uint256 nonce, bytes memory signatures) public  override {
  beforeEach(async () => {
    await init_private_keys()

  });
  it("happy path - should allow deposit from a wallet with sufficient eth balance", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();
    let asset_pool_instance = await ETH_Asset_Pool.deployed();
    //console.log(await bridge_logic_instance.ETH_asset_pool_address())

    expect(bridge_logic_instance.address).to.be.equal(bridge_addresses.eth_bridge_logic);
    // console.log(bridge_logic_instance.address, bridge_addresses.eth_bridge_logic)

    await set_bridge_address(asset_pool_instance, bridge_logic_instance.address, accounts[0]);


    //deposit asset
    const depositAmount = web3.utils.toWei('5', 'ether')

    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.greaterThanOrEqual(parseInt(formatEther(depositAmount))
      );

    await deposit_asset(bridge_logic_instance, accounts[0], depositAmount);
    let pool_bal_after = await web3.eth.getBalance(asset_pool_instance.address);


    assert.equal(
      pool_bal_after.toString(),
      depositAmount.toString(),
      "pool should not be empty, it is"
    );

  });

  it("should fail to deposit eth with insufficient balance", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();
    let asset_pool_instance = await ETH_Asset_Pool.deployed();
    //console.log(await bridge_logic_instance.ETH_asset_pool_address())

    expect(bridge_logic_instance.address).to.be.equal(bridge_addresses.eth_bridge_logic);
    // console.log(bridge_logic_instance.address, bridge_addresses.eth_bridge_logic)

    await set_bridge_address(asset_pool_instance, bridge_logic_instance.address, accounts[0]);


    //deposit asset
    const depositAmount = web3.utils.toWei('500', 'ether')

    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.lessThanOrEqual(parseInt(formatEther(depositAmount))
      );

    let wallet_balance_before = await web3.eth.getBalance(accounts[0]);

    let now = await latest();
    let expiry = now.add(await duration.minutes(1));
    try {
      await deposit_asset(bridge_logic_instance, accounts[0], depositAmount);
      assert.equal(
        true,
        false,
        "deposit worked without sufficient balance, shouldn't have"
      );
    } catch (e) { }

    let pool_bal_after = await web3.eth.getBalance(asset_pool_instance.address);
    let wallet_balance_after = await web3.eth.getBalance(accounts[0]);

    assert.equal(
      pool_bal_after.toString(),
      web3.utils.toWei('5', 'ether'),
      "pool should be empty, isn't"
    );

    expect(parseInt(pool_bal_after)).to.be.bignumber.lessThanOrEqual(parseInt(depositAmount));

    expect(parseInt(wallet_balance_after)).to.be.bignumber.lessThanOrEqual(parseInt(wallet_balance_before));
  })


  /* it("should fail to deposit eth above max deposit", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();
        let asset_pool_instance = await ETH_Asset_Pool.deployed();
        //console.log(await bridge_logic_instance.ETH_asset_pool_address())

        expect(bridge_logic_instance.address).to.be.equal(bridge_addresses.eth_bridge_logic);
        // console.log(bridge_logic_instance.address, bridge_addresses.eth_bridge_logic)

    await set_bridge_address(asset_pool_instance, bridge_logic_instance.address, accounts[0]);

    
    //deposit asset
     console.log(await bridge_logic_instance.get_deposit_maximum())
  }) */

  //NOTE signature tests are covered in MultisigControl
});



contract("ETH_Bridge_Logic Function: withdraw_asset", (accounts) => {
  //    function withdraw_asset(uint256 amount, uint256 expiry, address payable target, uint256 nonce, bytes memory signatures) public  override {
  beforeEach(async () => {
    await init_private_keys()

  });
  it("happy path - should allow withdrawal from a generated withdraw ticket signed by MultisigControl", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();
    let asset_pool_instance = await ETH_Asset_Pool.deployed();
    //console.log(await bridge_logic_instance.ETH_asset_pool_address())

    expect(bridge_logic_instance.address).to.be.equal(bridge_addresses.eth_bridge_logic);
    // console.log(bridge_logic_instance.address, bridge_addresses.eth_bridge_logic)

    await set_bridge_address(asset_pool_instance, bridge_logic_instance.address, accounts[0]);


    //deposit asset
    const depositAmount = web3.utils.toWei('5', 'ether')

    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.greaterThanOrEqual(parseInt(formatEther(depositAmount))
      );

    await deposit_asset(bridge_logic_instance, accounts[0], depositAmount);

    //withdraw asset
    let account_bal_before = await web3.eth.getBalance(accounts[0]);
    let pool_bal_before = await web3.eth.getBalance(asset_pool_instance.address);

    let now = await latest();
    let expiry = now.add(await duration.minutes(1));
    await withdraw_asset(bridge_logic_instance, accounts[0], expiry.toString(), false);

    let account_bal_after = await web3.eth.getBalance(accounts[0]);
    let pool_bal_after = await web3.eth.getBalance(asset_pool_instance.address);

    expect(account_bal_after).to.be.bignumber.greaterThan(account_bal_before);

    expectBignumberEqual(pool_bal_before, depositAmount);

    assert.equal(
      pool_bal_after.toString(),
      "0",
      "pool should be empty, isn't"
    );

  });

  it("should fail to withdraw eth asset without deposit", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();
    let asset_pool_instance = await ETH_Asset_Pool.deployed();
    //console.log(await bridge_logic_instance.ETH_asset_pool_address())

    expect(bridge_logic_instance.address).to.be.equal(bridge_addresses.eth_bridge_logic);
    // console.log(bridge_logic_instance.address, bridge_addresses.eth_bridge_logic)

    await set_bridge_address(asset_pool_instance, bridge_logic_instance.address, accounts[0]);


    //deposit asset
    /* const depositAmount = web3.utils.toWei('5', 'ether')

    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.greaterThanOrEqual(parseInt(formatEther(depositAmount))
      );

    await deposit_asset(bridge_logic_instance, accounts[0], depositAmount);
 */
    //withdraw asset
    let account_bal_before = await web3.eth.getBalance(accounts[0]);
    let pool_bal_before = await web3.eth.getBalance(asset_pool_instance.address);

    let now = await latest();
    let expiry = now.add(await duration.minutes(1));
    try {
      await withdraw_asset(bridge_logic_instance, accounts[0], expiry.toString(), false);
      assert.equal(
        true,
        false,
        "withdrawal worked without deposit, shouldn't have"
      );
    } catch (e) { }


    let account_bal_after = await web3.eth.getBalance(accounts[0]);
    let pool_bal_after = await web3.eth.getBalance(asset_pool_instance.address);

    // should be less after gas fees
    expect(parseInt(account_bal_after)).to.be.bignumber.lessThanOrEqual(parseInt(account_bal_before));

    expectBignumberEqual(pool_bal_before, "0");

    assert.equal(
      pool_bal_after.toString(),
      "0",
      "pool should be empty, isn't"
    );

  })

  it("withdraw_asset fails due to amount mismatch between signature and function params", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();
    let asset_pool_instance = await ETH_Asset_Pool.deployed();
    //console.log(await bridge_logic_instance.ETH_asset_pool_address())

    expect(bridge_logic_instance.address).to.be.equal(bridge_addresses.eth_bridge_logic);
    // console.log(bridge_logic_instance.address, bridge_addresses.eth_bridge_logic)

    await set_bridge_address(asset_pool_instance, bridge_logic_instance.address, accounts[0]);


    //deposit asset
    /* const depositAmount = web3.utils.toWei('5', 'ether')

    expect(
      parseInt(formatEther(await web3.eth.getBalance(accounts[0]))))
      .to.be.greaterThanOrEqual(parseInt(formatEther(depositAmount))
      );

    await deposit_asset(bridge_logic_instance, accounts[0], depositAmount);
 */
    //withdraw asset
    let account_bal_before = await web3.eth.getBalance(accounts[0]);
    let pool_bal_before = await web3.eth.getBalance(asset_pool_instance.address);

    let now = await latest();
    let expiry = now.add(await duration.minutes(1));


    // bad params true
    try {
      await withdraw_asset(bridge_logic_instance, accounts[0], expiry.toString(), true);

      assert.equal(
        true,
        false,
        "pad params withdrawal worked, shouldn't have"
      );
    } catch (e) { }


    let account_bal_after = await web3.eth.getBalance(accounts[0]);
    let pool_bal_after = await web3.eth.getBalance(asset_pool_instance.address);

    // should be less after gas fees
    expect(parseInt(account_bal_after)).to.be.bignumber.lessThanOrEqual(parseInt(account_bal_before));

    expectBignumberEqual(pool_bal_before, "0");

    assert.equal(
      pool_bal_after.toString(),
      "0",
      "pool should be empty, isn't"
    );
  });
  //NOTE signature tests are covered in MultisigControl
});


/////VIEWS

contract("ETH_Bridge_Logic Function: get_deposit_minimum", (accounts) => {
  //    function get_deposit_minimum() public override view returns(uint256){
  beforeEach(async () => {
    await init_private_keys()

  });
  it("minimum deposit updates after set_deposit_minimum", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();

    //Get minimum deposit
    deposit_minimum = (await bridge_logic_instance.get_deposit_minimum()).toString();
    assert.equal(deposit_minimum, '0', "deposit min should be 5 eth, isn't");

    //Set minimum deposit
    //NOTE signature tests are in MultisigControl
    let nonce = new ethUtil.BN(crypto.randomBytes(32));
    let encoded_message = get_message_to_sign(
      ["uint256"],
      [(1 * Math.pow(10, 18)).toString()],
      nonce,
      "set_deposit_minimum",
      ETH_Bridge_Logic.address);
    let encoded_hash = ethUtil.keccak256(encoded_message);

    let signature = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
    let sig_string = to_signature_string(signature);

    const tx = await bridge_logic_instance.set_deposit_minimum(parseEther('1'), nonce, sig_string);

    const { args } = await findEventInTransaction(tx, "ETH_Deposit_Minimum_Set");

    expectBignumberEqual(args.new_minimum, web3.utils.toWei('1', 'ether'));
    expectBignumberEqual(args.nonce, nonce);

    //Get minimum deposit, should be updated
    deposit_minimum = (await bridge_logic_instance.get_deposit_minimum()).toString();
    assert.equal(deposit_minimum, web3.utils.toWei('1', 'ether'), "deposit min should be 1 eth, isn't");

  });
});


contract("ETH_Bridge_Logic Function: get_deposit_maximum", (accounts) => {
  //    function get_deposit_maximum() public override view returns(uint256){

  beforeEach(async () => {
    await init_private_keys()

  });
  it("maximum deposit updates after set_deposit_maximum", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();

    //Get minimum deposit
    deposit_maximum = (await bridge_logic_instance.get_deposit_maximum()).toString();
    assert.equal(deposit_maximum, '0', "deposit max should be 5 eth, isn't");

    //Set maximum deposit
    //NOTE signature tests are in MultisigControl
    let nonce = new ethUtil.BN(crypto.randomBytes(32));
    let encoded_message = get_message_to_sign(
      ["uint256"],
      [(10 * Math.pow(10, 18)).toString()],
      nonce,
      "set_deposit_maximum",
      ETH_Bridge_Logic.address);
    let encoded_hash = ethUtil.keccak256(encoded_message);

    let signature = ethUtil.ecsign(encoded_hash, private_keys[accounts[0].toLowerCase()]);
    let sig_string = to_signature_string(signature);

    const tx = await bridge_logic_instance.set_deposit_maximum(parseEther('10'), nonce, sig_string);

    const { args } = await findEventInTransaction(tx, "ETH_Deposit_Maximum_Set");

    expectBignumberEqual(args.new_maximum, web3.utils.toWei('10', 'ether'));
    expectBignumberEqual(args.nonce, nonce);

    //Get minimum deposit, should be updated
    deposit_maximum = (await bridge_logic_instance.get_deposit_maximum()).toString();
    assert.equal(deposit_maximum, web3.utils.toWei('10', 'ether'), "deposit max should be 10 eth, isn't");

  });
});

contract("ETH_Bridge_Logic Function: get_multisig_control_address", (accounts) => {
  //    function get_multisig_control_address() public override view returns(address) {

  beforeEach(async () => {
    await init_private_keys()

  });
  //function get_multisig_control_address() public view returns(address);
  it("get_multisig_control_address returns the address it was initialized with", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();
    let asset_pool_instance = await ETH_Asset_Pool.deployed();

    let multisig_control_address = await bridge_logic_instance.get_multisig_control_address();
    assert.equal(multisig_control_address, MultisigControl.address, "Multisig control shows the wrong address");
  });
});

contract("ETH_Bridge_Logic Function: get_vega_asset_id", (accounts) => {
  //    function get_vega_asset_id() public override view returns(bytes32){

  beforeEach(async () => {
    await init_private_keys()

  });
  //function get_vega_asset_id(address asset_source) public view returns(bytes32);
  it("get_vega_asset_id returns proper vega id for newly listed assets", async () => {
    let bridge_logic_instance = await ETH_Bridge_Logic.deployed();

    let vega_asset_id = await bridge_logic_instance.get_vega_asset_id();

    assert.equal(vega_asset_id, "0x0000000000000000000000000000000000000000000000000000000000000000", "incorrect vega asset id")

  });

});