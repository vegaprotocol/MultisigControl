
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
  //await init_private_keys();

  /*********Remove to revert to .secret mnemonic***********/
  /*
  private_keys =
      {
        "0xddDFA1974b156336b9c49579A2bC4e0a7059CAD0":Buffer.from("5b569f098b150a70a1dbe3603d54560bda4d0c22e5754977d21e35e12c5bcf62",'hex'),
        "0xcf3e68E25FbD0F4bA0bCD862bFED00274F705668":Buffer.from("577d78eb8da82145b0fbbb193045d94c91abc0b94ca5ea7407aa4713fe33a8f9",'hex'),
        "0x0bcB473865e28D9e4F13851633da33C9064e8029":Buffer.from("17b1a04d2f8295843f1b29f07534be55fa15723554574f34b1a2ae38f380fde8",'hex'),
        "0xEDE59e0dF4D3319191Af449a9FcF757C1C0392d5":Buffer.from("76dc4d459e7b5c6f2c8521f14e7dd87902631feec7bbde4411d5a379cc0f10ff",'hex')
      };
  accounts = [
  "0xddDFA1974b156336b9c49579A2bC4e0a7059CAD0",
  "0xcf3e68E25FbD0F4bA0bCD862bFED00274F705668",
  "0x0bcB473865e28D9e4F13851633da33C9064e8029",
  "0xEDE59e0dF4D3319191Af449a9FcF757C1C0392d5"
  ]
  */

  /********************/


  let result_bundle = "0x";
  let nonce = new ethUtil.BN(crypto.randomBytes(32));
  for(let sig_idx = 0; sig_idx < accounts.length; sig_idx++){

    //let sig = sign_thing(["address"],["0x0c2b46b7C0BCc7a1d696078506Fb4Ff9C0aF123d"],"remove_asset","0xb4E6cF254B61332BC93ffE96bD836561F7D8F37c", nonce, private_keys[accounts[sig_idx]]);


    //let sig = sign_thing(["address", "bytes32"],["0x547cbA83a7eb82b546ee5C7ff0527F258Ba4546D", "0xf11862be7fc37c47372439f982a8f09912c4f995434120ff43ff51d9c34ef71a"],"list_asset","0xb4E6cF254B61332BC93ffE96bD836561F7D8F37c", nonce, private_keys[accounts[sig_idx]]);



    let sig = sign_thing(["uint16"],["667"],"set_threshold","0x6aD570cB22d9c1A5EC5aBA5B6eBEA12AE6f08e97",nonce, private_keys[accounts[sig_idx]]);
    //let sig = sign_thing(["address"],["0xCd403f722b76366f7d609842C589906ca051310f"],"set_bridge_address","0xF0f0FcDA832415b935802c6dAD0a6dA2c7EAed8f",nonce, private_keys[accounts[sig_idx]]);

    //let sig = sign_thing(["address"],["0x0Ff52da611960E9155078cB5d81EF55C8DbF620E"],"add_signer","0xb89a165ea8b619c14312db316baaa80d2a98b493",nonce, private_keys[accounts[sig_idx]]);
    //let sig = sign_thing(["address", "bytes32"],["0xcB84d72e61e383767C4DFEb2d8ff7f4FB89abc6e", "0xd1984e3d365faa05bcafbe41f50f90e3663ee7c0da22bb1e24b164e9532691b2"],"list_asset","0xCd403f722b76366f7d609842C589906ca051310f", nonce, private_keys[accounts[sig_idx]]);
    /*
0x28d5a6B3D96836B2341C95C1587B474F38d33Ac2
0x14174f3c9443EdC12685578FE4d165be5f57fBd3
0xe64f539dc59DA01ec95d10a665581fDbA0194215
0x9211696Be4bE710C83DA8a36e68C25Cc4020E979
0xF3920d9Ab483177C99846503A118fa84A557bB27
0x6532A4E841136d5eDC346A1bE2a6D518E0395520
0x1b79814f66773df25ba126E8d1A557ab2676246f
0xa88E4b7a9DA62fd82e9f65a60450Fc8237468b0B
0x7E8e08F2991dfD6e8E142F5d5219EcA44900ec9b
0x4e5fe67964254EA035F7F927803102712557edEa
0x94124b36696a1aa9DD65e70659Da161A925E3FB5
0xAd3EB716a9C4B7eA98b175f4ca73ad01289104B0
0xaa5184EB96aDf3f14151412fd895a30F5A2E6995
    */
    //let sig = sign_thing(["address"],[""],"add_signer","0x6aD570cB22d9c1A5EC5aBA5B6eBEA12AE6f08e97",nonce,private_keys[accounts[sig_idx]]);


    result_bundle += sig.sig_string.substr(2);


  }
  console.log("nonce: " + nonce.toString());
  console.log("sig bundle: " + result_bundle)
}

go();
