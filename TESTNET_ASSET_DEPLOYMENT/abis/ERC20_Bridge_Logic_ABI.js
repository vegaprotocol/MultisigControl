module.exports = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "erc20_asset_pool",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "multisig_control",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "new_minimum",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        }
      ],
      "name": "Asset_Deposit_Minimum_Set",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user_address",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bytes32",
          "name": "vega_public_key",
          "type": "bytes32"
        }
      ],
      "name": "Asset_Deposited",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "vega_id",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        }
      ],
      "name": "Asset_Listed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        }
      ],
      "name": "Asset_Removed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "user_address",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        }
      ],
      "name": "Asset_Withdrawn",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "multisig_control_source",
          "type": "address"
        }
      ],
      "name": "Multisig_Control_Set",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "isOwner",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "kill",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "vega_id",
          "type": "bytes32"
        }
      ],
      "name": "list_asset_admin",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        }
      ],
      "name": "remove_asset_admin",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        }
      ],
      "name": "get_vega_id",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "vega_id",
          "type": "bytes32"
        }
      ],
      "name": "get_asset_source_and_asset_id",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "vega_id",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "signatures",
          "type": "bytes"
        }
      ],
      "name": "list_asset",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "signatures",
          "type": "bytes"
        }
      ],
      "name": "remove_asset",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "minimum_amount",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "signatures",
          "type": "bytes"
        }
      ],
      "name": "set_deposit_minimum",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "expiry",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "nonce",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "signatures",
          "type": "bytes"
        }
      ],
      "name": "withdraw_asset",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "vega_public_key",
          "type": "bytes32"
        }
      ],
      "name": "deposit_asset",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        }
      ],
      "name": "is_asset_listed",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "internalType": "address",
          "name": "asset_source",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "asset_id",
          "type": "uint256"
        }
      ],
      "name": "get_deposit_minimum",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "get_multisig_control_address",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];