// convex/blockchain/abis.ts
// All ABIs from nad.fun/abi.md — ready to use

export const lensAbi = [
  {
    type: "function",
    name: "getAmountOut",
    inputs: [
      { name: "_token", type: "address" },
      { name: "_amountIn", type: "uint256" },
      { name: "_isBuy", type: "bool" },
    ],
    outputs: [
      { name: "router", type: "address" },
      { name: "amountOut", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProgress",
    inputs: [{ name: "_token", type: "address" }],
    outputs: [{ name: "progress", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getInitialBuyAmountOut",
    inputs: [{ name: "amountIn", type: "uint256" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isGraduated",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;

export const curveAbi = [
  {
    type: "function",
    name: "feeConfig",
    inputs: [],
    outputs: [
      { name: "deployFeeAmount", type: "uint256" },
      { name: "graduateFeeAmount", type: "uint256" },
      { name: "protocolFee", type: "uint24" },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "CurveCreate",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "pool", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
      { name: "symbol", type: "string", indexed: false },
      { name: "tokenURI", type: "string", indexed: false },
      { name: "virtualMon", type: "uint256", indexed: false },
      { name: "virtualToken", type: "uint256", indexed: false },
      { name: "targetTokenAmount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const;

export const bondingCurveRouterAbi = [
  {
    type: "function",
    name: "create",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "tokenURI", type: "string" },
          { name: "amountOut", type: "uint256" },
          { name: "salt", type: "bytes32" },
          { name: "actionId", type: "uint8" },
        ],
      },
    ],
    outputs: [
      { name: "token", type: "address" },
      { name: "pool", type: "address" },
    ],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "buy",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "amountOutMin", type: "uint256" },
          { name: "token", type: "address" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "sell",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMin", type: "uint256" },
          { name: "token", type: "address" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "nonces",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ type: "string" }],
    stateMutability: "view",
  },
] as const;
