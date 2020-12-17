const ERC20_Asset_Pool = artifacts.require("ERC20_Asset_Pool");
const ERC20_Bridge_Logic = artifacts.require("ERC20_Bridge_Logic");
const Base_Faucet_Token = artifacts.require("Base_Faucet_Token");


var abi = require('ethereumjs-abi');
var crypto = require("crypto");
var ethUtil = require('ethereumjs-util');

let root_path = "../ropsten_deploy_details/local/";

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


function to_signature_string(sig){
    return "0x" + sig.r.toString('hex') + "" + sig.s.toString('hex') +""+ sig.v.toString(16);
}


let new_asset_id = crypto.randomBytes(32);

let bridge_addresses = require(root_path + "bridge_addresses.json");


async function deposit_asset(bridge_logic_instance, test_token_instance, account){
  let wallet_pubkey = crypto.randomBytes(32);
  await test_token_instance.faucet();
  let token_balance = await test_token_instance.balanceOf(account);
  await test_token_instance.approve(ERC20_Bridge_Logic.address, token_balance);
  await bridge_logic_instance.deposit_asset(bridge_addresses.test_token_address, 0, token_balance, wallet_pubkey);
  return token_balance;
}

async function list_asset(bridge_logic_instance, from_address){
  //bridge_addresses.test_token_address

  let nonce = new ethUtil.BN(crypto.randomBytes(32));


  //create signature
  let encoded_message = get_message_to_sign(
      ["address", "uint256", "bytes32"],
      [bridge_addresses.test_token_address, 0, new_asset_id],
      nonce,
      "list_asset",
      ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  await bridge_logic_instance.list_asset(bridge_addresses.test_token_address, 0, new_asset_id, nonce, sig_string);
}


async function remove_asset(bridge_logic_instance, from_address){
  //bridge_addresses.test_token_address

  let nonce = new ethUtil.BN(crypto.randomBytes(32));


  //create signature
  let encoded_message = get_message_to_sign(
      ["address", "uint256"],
      [bridge_addresses.test_token_address, 0],
      nonce,
      "remove_asset",
      ERC20_Bridge_Logic.address);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_keys[from_address.toLowerCase()]);
  let sig_string = to_signature_string(signature);

  //NOTE Sig tests are in MultisigControl
  await bridge_logic_instance.remove_asset(bridge_addresses.test_token_address, 0, nonce, sig_string);
}

////FUNCTIONS
contract("ERC20_Bridge_Logic Function: list_asset",  (accounts) => {
  //function list_asset(address asset_source, uint256 asset_id, bytes32 vega_id, uint256 nonce, bytes memory signatures) public;


    it("asset that was not listed is listed after running list_asset", async () => {

      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();

      //new asset ID is not listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address, 0),
          false,
          "token is listed, shouldn't be"
      );
      //unlisted asset cannot be deposited
      try{
        await deposit_asset(bridge_logic_instance, test_token_instance, account[0]);
        assert.equal(
            true,
            false,
            "token deposit worked, shouldn't have"
        );
      } catch(e){}

      //list new asset
      list_asset(bridge_logic_instance, accounts[0]);

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address, 0),
          true,
          "token isn't listed, should be"
      );
      //deposit new asset
      let amount_deposited = await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

      //user balance deducted
      assert.equal(
          await test_token_instance.balanceOf(accounts[0]),
          0,
          "token balance was not deposited, balance should be zero"
      );


    });

    it("list_asset fails to list an already listed asset", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address, 0),
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
      }catch(e){}

    });

    //NOTE signature tests are covered in MultisigControl
});
contract("ERC20_Bridge_Logic Function: remove_asset",   (accounts) => {
    //function remove_asset(address asset_source, uint256 asset_id, uint256 nonce, bytes memory signatures) public;
    it("listed asset is not listed after running remove_asset and no longer able to deposited", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let test_token_instance = await Base_Faucet_Token.deployed();
      let new_asset_id = new ethUtil.BN(crypto.randomBytes(32));

      try {
        await list_asset(bridge_logic_instance, accounts[0]);
      } catch(e){/*ignore if already listed*/}

      //new asset ID is listed
      assert.equal(
          await bridge_logic_instance.is_asset_listed(bridge_addresses.test_token_address, 0),
          true,
          "token isn't listed, should be"
      );
      //deposit new asset, should work
      let amount_deposited = await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);

      //remove new asset
      await remove_asset(bridge_logic_instance, accounts[0]);

      //deposit fails
      try {
        await deposit_asset(bridge_logic_instance, test_token_instance, accounts[0]);
        assert.equal(true, false, "deposit of removed asset succedded, shouldn't have")
      }catch(e){}

    });

});
contract("ERC20_Bridge_Logic Function: set_deposit_minimum",   (accounts) => {
    //function set_deposit_minimum(address asset_source, uint256 asset_id, uint256 nonce, uint256 minimum_amount, bytes memory signatures) public;


    it("deposit minimum changes and is enforced by running set_deposit_minimum", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //Get minimum deposit
      //deposit less that min should fail
      //deposit more that min should work
      //Set minimum deposit
      //Get minimum deposit, should be updated
      //deposit less that min should fail
      //deposit more that min should work
    });

});
contract("ERC20_Bridge_Logic Function: deposit_asset",   (accounts) => {
    //function deposit_asset(address asset_source, uint256 asset_id, uint256 amount, bytes32 vega_public_key) public;

    it("deposit_asset should fail due to asset not being listed", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //try to deposit asset, fails
    });
    it("happy path - should allow listed asset to be deposited", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      let new_asset_id = new ethUtil.BN(crypto.randomBytes(32));
      //list asset
      //approve allowance
      //deposit asset
    });
});
contract("ERC20_Bridge_Logic Function: withdraw_asset",   (accounts) => {
    //function withdraw_asset(address asset_source, uint256 asset_id, uint256 amount, uint256 expiry, uint256 nonce, bytes memory signatures) public;

    let new_asset_id = new ethUtil.BN(crypto.randomBytes(32));
    it("happy path - should allow withdrawal from a generated withdraw ticket signed by MultisigControl", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //list asset
      //deposit asset
      //create withdraw ticket
      //get balance
      //submit withdraw
      //wallet balance updated
      //contract balance updated
    });
    it("withdraw_asset fails due to expired withdrawal order", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //create withdraw ticket
      //wait past expiry
      // withdraw should fail
    });
    it("withdraw_asset fails due to amount mismatch between signature and function params", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //create withdraw ticket
      //submit with bad expiry, should fail
      //submit with bad withdraw amount, should fail
      //submit correct params, should work
    });
    it("withdraw_asset fails due to being submitted by the wrong Ethereum address", async () =>{
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //create withdraw ticket
      //submit from wrong eth address, should fail
      //submit from correct eth address, should work
    });
    //NOTE signature tests are covered in MultisigControl
});


/////VIEWS
contract("ERC20_Bridge_Logic Function: is_asset_listed",   (accounts) => {
    //function is_asset_listed(address asset_source, uint256 asset_id) public view returns(bool);

    let new_asset_id = new ethUtil.BN(crypto.randomBytes(32));
    it("asset is listed after 'list_asset'", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //get asset status, should be no
      //list new asset
      //get asset status, should be yes
    });
    it("asset is not listed after 'remove_asset'", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //get asset status, should be yes
      //remove new asset
      //get asset status, should be no
    });
});
contract("ERC20_Bridge_Logic Function: get_deposit_minimum",   (accounts) => {
    //function get_deposit_minimum(address asset_source, uint256 asset_id) public view returns(uint256);

    it("minimum deposit updates after set_deposit_minimum", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //set minimum deposit
      //should be updated
    });
});
contract("ERC20_Bridge_Logic Function: get_multisig_control_address",   (accounts) => {
    //function get_multisig_control_address() public view returns(address);
    it("get_multisig_control_address returns the address it was initialized with", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //address returs correct embedded address
    });
});
contract("ERC20_Bridge_Logic Function: get_vega_id",   (accounts) => {
    //function get_vega_id(address asset_source, uint256 asset_id) public view returns(bytes32);

    let new_asset_id = new ethUtil.BN(crypto.randomBytes(32));
    it("get_vega_id returns proper id for newly listed assets", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //get_vega_id should fail
      //list asset
      //get_vega_id, should show saved id
    });
    it("get_vega_id fails to return id unknown or removed assets", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //get_vega_id, should show saved id
      //remove asset
      //get_vega_id should fail
    });
});
contract("ERC20_Bridge_Logic Function: get_asset_source_and_asset_id",  (accounts) => {
    //function get_asset_source_and_asset_id(bytes32 vega_id) public view returns(address, uint256);

    let new_asset_id = new ethUtil.BN(crypto.randomBytes(32));
    it("get_asset_source_and_asset_id returns proper values for newly listed asset", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //get_asset_source_and_asset_id should fail
      //list asset
      //get_asset_source_and_asset_id, should show details
    });
    it("get_asset_source_and_asset_id fails to return for unknown or removed assets", async () => {
      let bridge_logic_instance = await ERC20_Bridge_Logic.deployed();
      //get_asset_source_and_asset_id, should show details
      //remove asset
      //get_asset_source_and_asset_id should fail
    });
});
