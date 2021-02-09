const ERC20_Asset_Pool = artifacts.require("ERC20_Asset_Pool");
const MultisigControl = artifacts.require("MultisigControl");
const ERC20_Bridge_Logic = artifacts.require("ERC20_Bridge_Logic");
const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");

var abi = require('ethereumjs-abi');
var crypto = require("crypto");
var ethUtil = require('ethereumjs-util');


let new_asset_id = crypto.randomBytes(32);

let root_path = "../ropsten_deploy_details/local/";

let bridge_addresses = require(root_path + "bridge_addresses.json");
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
async function list_asset(bridge_logic_instance, from_address){
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  //create signature
  let encoded_message = get_message_to_sign(
      ["address", "bytes32"],
      [bridge_addresses.test_token_address, new_asset_id],
      nonce,
      "list_asset",
      ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  await bridge_logic_instance.list_asset(bridge_addresses.test_token_address, new_asset_id, nonce, sig_string);
}

function to_signature_string(sig){
    return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') +""+ sig.v.toString(16);
}

async function set_multisig_control(asset_pool_instance, multisig_control_address, account){
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
  await asset_pool_instance.set_multisig_control(multisig_control_address, nonce, sig_string);
}

async function set_bridge_address( asset_pool_instance, bridge_logic_address, account){
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
  await asset_pool_instance.set_bridge_address(bridge_logic_address, nonce, sig_string);
}



async function deposit_asset(bridge_logic_instance, test_token_instance, account, token_balance){
  let wallet_pubkey = crypto.randomBytes(32);
  await test_token_instance.faucet();
  if(token_balance === undefined || token_balance === null){
    token_balance = await test_token_instance.balanceOf(account);
  }
  await test_token_instance.approve(ERC20_Bridge_Logic.address, token_balance);
  await bridge_logic_instance.deposit_asset(bridge_addresses.test_token_address, token_balance, wallet_pubkey);
  return token_balance;
}

async function withdraw_asset(bridge_logic_instance, test_token_instance, account, expire, bad_params, bad_user){
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  let expiry = Math.floor(Date.now()/1000) + 2; // 2 seconds
  let to_withdraw = (await test_token_instance.balanceOf(ERC20_Asset_Pool.address)).toString();

  let target = account;
  if(bad_user !== undefined){
    target = bad_user;
  }
  //create signature
  let encoded_message = get_message_to_sign(
      ["address", "uint256", "uint256", "address"],
      [test_token_instance.address, to_withdraw, expiry, target],
      nonce,
      "withdraw_asset",
      ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);
  let signature = ethUtil.ecsign(encoded_hash, private_keys[account.toLowerCase()]);

  let sig_string = to_signature_string(signature);
  if(expire){
    //wait 3 seconds
    await timeout(3000);
  }
  //NOTE Sig tests are in MultisigControl
  if(bad_params){
    to_withdraw = "1"
  }
  await bridge_logic_instance.withdraw_asset(test_token_instance.address, to_withdraw, expiry, target, nonce, sig_string);
}




////FUNCTIONS
contract("Asset_Pool Function: set_multisig_control",  (accounts) => {
    //function set_multisig_control(address new_address, uint256 nonce, bytes memory signatures) public {
    it("should change multisig control address", async () => {
      let multisig_control_instance = await MultisigControl.deployed();
      let asset_pool_instance = await ERC20_Asset_Pool.deployed();
      //set new multisig_control_address
      assert.equal(
          await asset_pool_instance.multisig_control_address(),
          multisig_control_instance.address,
          "unexpected initial multisig_control_address"
      );

      await set_multisig_control(asset_pool_instance, accounts[1], accounts[0]);

      assert.equal(
          await asset_pool_instance.multisig_control_address(),
          accounts[1],
          "unexpected multisig_control_address"
      );

    });
    //NOTE signature tests are in MultisigControl tests
});

contract("Asset_Pool Function: set_bridge_address",  (accounts) => {
    //function set_bridge_address(address new_address, uint256 nonce, bytes memory signatures) public {
    it("should change the bridge address to a new address, should now ignore old address", async () => {
      let multisig_control_instance = await MultisigControl.deployed();
      let asset_pool_instance = await ERC20_Asset_Pool.deployed();

      assert.equal(
          await asset_pool_instance.erc20_bridge_address(),
          "0x0000000000000000000000000000000000000000",
          "unexpected initial erc20_bridge_address"
      );

      await set_bridge_address(asset_pool_instance, bridge_addresses.logic_1, accounts[0]);

      assert.equal(
          await asset_pool_instance.erc20_bridge_address(),
          bridge_addresses.logic_1,
          "unexpected erc20_bridge_address"
      );
    });
});
contract("Asset_Pool Function: withdraw",  (accounts) => {
    //function withdraw(address token_address, address target, uint256 amount) public returns(bool){
    it("should allow bridge to withdraw target asset", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      let asset_pool_instance = await ERC20_Asset_Pool.deployed();
      //list asset
      try {
        await list_asset(bridge_logic_instance, accounts[0]);
      } catch(e){/*ignore if already listed*/}

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
      await withdraw_asset(bridge_logic_instance, test_token_instance, accounts[0], false, false);

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
    it("withdraw function should fail to run from any address but the current bridge", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      let asset_pool_instance = await ERC20_Asset_Pool.deployed();
      //list asset
      try {
        await list_asset(bridge_logic_instance, accounts[0]);
      } catch(e){/*ignore if already listed*/}

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
      }catch(e){}



    });
});


//NOTE views are public getters, don't need to_signature_string
