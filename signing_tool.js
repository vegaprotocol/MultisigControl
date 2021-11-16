
const ethUtil = require('ethereumjs-util');
var abi = require('ethereumjs-abi');
var crypto = require("crypto");







/*The following will generate 10 addresses from the mnemonic located in the .secret file*/
const fs = require("fs");
//TODO: ganache-cli -m "contents of .secret"
const mnemonic = fs.readFileSync(".secret").toString().trim();

const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');
const wallet = require('ethereumjs-wallet');

let private_keys ={};
let accounts = [];
async function init_private_keys(){
  private_keys = {};
  for(let key_idx = 0; key_idx < 10; key_idx++){
    const seed = await bip39.mnemonicToSeed(mnemonic); // mnemonic is the string containing the words

    const hdk = hdkey.fromMasterSeed(seed);
    const addr_node = hdk.derivePath("m/44'/60'/0'/0/" + key_idx); //m/44'/60'/0'/0/0 is derivation path for the first account. m/44'/60'/0'/0/1 is the derivation path for the second account and so on
    const addr = addr_node.getWallet().getAddressString(); //check that this is the same with the address that ganache list for the first account to make sure the derivation is correct
    const private_key = addr_node.getWallet().getPrivateKey();
    //console.log(private_key)
    //console.log(addr.toString("hex"))
    //console.log(private_key.toString("hex"))
    private_keys[addr.toString("hex")] = private_key;
    accounts.push(addr.toString("hex"));
  }
}




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


function sign_thing(param_types, param_list, function_name, sender, nonce, private_key){
  // sign_thing(["address", "bytes32"], ["0x1213", "0xabc"], "list_asset", "0x222", buffered_private_key)
  /*
  let encoded_message = get_message_to_sign(
      ["address", "bytes32"],
      [asset_address, new_asset_id],
      nonce,
      "list_asset",
      bridge_logic_instance._address);
*/

  let encoded_message = get_message_to_sign(
      param_types,
      param_list,
      nonce,
      function_name,
      sender);
  let encoded_hash = ethUtil.keccak256(encoded_message);

  let signature = ethUtil.ecsign(encoded_hash, private_key);
  let sig_string = to_signature_string(signature);

  return {
    sig_string: sig_string,
    nonce: nonce.toString(),
    params:param_list
  }
}


// threshold
//let sig = sign_thing(["uint16"],["1"],"set_threshold","0xb89a165ea8b619c14312db316baaa80d2a98b493",pk_buffer);

//020ba7143206012cb6d005425da10de9f5a0757a8f573ac9a29b87d144f2992a

//let sig = sign_thing(["address"],["0x898b9F9f9Cab971d9Ceb809F93799109Abbe2D10"],"set_bridge_address","0x10E47BAa1F149EfB7Cea21ee502244D040e71d4F",pk_buffer);

//let sig = sign_thing(["address", "bytes32"],["0x9E3446b4a985e5A66d078E32C7AB9334f42d3bAF", "0x020ba7143206012cb6d005425da10de9f5a0757a8f573ac9a29b87d144f2992a"],"list_asset","0x898b9F9f9Cab971d9Ceb809F93799109Abbe2D10",pk_buffer);

//let sig = sign_thing(["address"],["0xddDFA1974b156336b9c49579A2bC4e0a7059CAD0"],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",pk_buffer);
//let sig = sign_thing(["address"],["0xcf3e68E25FbD0F4bA0bCD862bFED00274F705668"],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",pk_buffer);
//let sig = sign_thing(["address"],["0x0bcB473865e28D9e4F13851633da33C9064e8029"],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",pk_buffer);
//let sig = sign_thing(["address"],["0xEDE59e0dF4D3319191Af449a9FcF757C1C0392d5"],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",pk_buffer);

//let sig = sign_thing(["address"],["0xb89A165EA8b619c14312dB316BaAa80D2a98B493"],"remove_signer","0xb89A165EA8b619c14312dB316BaAa80D2a98B493",pk_buffer_2);


///let sig = sign_thing(["address"],["0x9E3446b4a985e5A66d078E32C7AB9334f42d3bAF"],"remove_asset","0x898b9F9f9Cab971d9Ceb809F93799109Abbe2D10", nonce, pks[sig_idx]);
async function go(){
//  await init_private_keys();

  /*********Remove to revert to .secret mnemonic***********/
  private_keys =
      {
          "0xb89A165EA8b619c14312dB316BaAa80D2a98B493":Buffer.from("adef89153e4bd6b43876045efdd6818cec359340683edaec5e8588e635e8428b",'hex')
      };
  accounts = [
  "0xb89A165EA8b619c14312dB316BaAa80D2a98B493"
  ]

  /********************/


  let result_bundle = "0x";
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  for(let sig_idx = 0; sig_idx < accounts.length; sig_idx++){

    //let sig = sign_thing(["address"],["0xfF36d24276c411A5Ca270DF22e7d38FB216f7e50"],"remove_asset","0x898b9F9f9Cab971d9Ceb809F93799109Abbe2D10", nonce, pks[sig_idx]);
    let sig = sign_thing(["address", "bytes32"],["0xcB84d72e61e383767C4DFEb2d8ff7f4FB89abc6e", "0x020ba7143206012cb6d005425da10de9f5a0757a8f573ac9a29b87d144f2992a"],"list_asset","0x4149257d844Ef09f11b02f2e73CbDfaB4c911a73", nonce, private_keys[accounts[sig_idx]]);
    //let sig = sign_thing(["uint16"],["1"],"set_threshold","0x6aD570cB22d9c1A5EC5aBA5B6eBEA12AE6f08e97",nonce, private_keys[accounts[sig_idx]]);
    //let sig = sign_thing(["address"],["0x4149257d844Ef09f11b02f2e73CbDfaB4c911a73"],"set_bridge_address","0xdee027072f42eE88bf6920b0d0C271af4e8ff8fb",nonce, private_keys[accounts[sig_idx]]);
    //let sig = sign_thing(["address"],["0x0Ff52da611960E9155078cB5d81EF55C8DbF620E"],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",nonce, private_keys[accounts[sig_idx]]);

  //  let sig = sign_thing(["address"],[""],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",private_keys[accounts[sig_idx]]);
    //let sig = sign_thing(["address"],[""],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",private_keys[accounts[sig_idx]]);
  //  let sig = sign_thing(["address"],[""],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",private_keys[accounts[sig_idx]]);
  //  let sig = sign_thing(["address"],[""],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",private_keys[accounts[sig_idx]]);
    //let sig = sign_thing(["address"],[""],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",private_keys[accounts[sig_idx]]);
    //let sig = sign_thing(["address"],[""],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",private_keys[accounts[sig_idx]]);
    result_bundle += sig.sig_string.substr(2);


  }
  console.log("nonce: " + nonce.toString());
  console.log("sig bundle: " + result_bundle)
}

go();
