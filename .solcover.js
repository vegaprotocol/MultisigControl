const fs = require("fs");
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
    providerOptions: {
      mnemonic: mnemonic,
      network_id: "*"
    }
};