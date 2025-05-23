/**
 * Monad MCP Staking Tool
 *
 * This file implements an MCP server for staking and withdrawing MON tokens
 * on the Magma staking platform on the Monad Testnet (chain ID 10143).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
  encodeFunctionData,
  parseEventLogs,
  getAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

// Load environment variables
const envPath = "C:\\Users\\lenovo\\Desktop\\monad-mcp-staking\\.env";
console.error(`[DEBUG] Loading .env file from: ${envPath}`);
dotenv.config({ path: envPath });

// Validate private key
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("PRIVATE_KEY environment variable is not set");
}

// Initialize public client for Monad Testnet
console.error("[DEBUG] Initializing Public Client for Monad Testnet");
const publicClient = createPublicClient({
  chain: {
    id: 10143,
    name: "monad-testnet",
    network: "monad-testnet",
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  },
  transport: http(),
});

// Initialize wallet client
console.error("[DEBUG] Initializing Wallet Client for Monad Testnet");
const account = privateKeyToAccount(privateKey as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: {
    id: 10143,
    name: "monad-testnet",
    network: "monad-testnet",
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  },
  transport: http(),
});

// Contract details
const RAW_STAKING_CONTRACT_ADDRESS = "0x2c9C959516e9AAEdB2C748224a41249202ca8BE7";
let STAKING_CONTRACT_ADDRESS: `0x${string}`;
try {
  STAKING_CONTRACT_ADDRESS = getAddress(RAW_STAKING_CONTRACT_ADDRESS);
  console.error(`[DEBUG] Normalized staking contract address: ${STAKING_CONTRACT_ADDRESS}`);
} catch (error) {
  throw new Error(`Invalid staking contract address: ${RAW_STAKING_CONTRACT_ADDRESS}`);
}
const MONAD_EXPLORER_URL = "https://testnet.monadexplorer.com/tx/";

// Check proxy implementation (EIP-1967 slot)
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
try {
  const implementationAddress = await publicClient.getStorageAt({
    address: STAKING_CONTRACT_ADDRESS,
    slot: IMPLEMENTATION_SLOT,
  });
  console.error(`[DEBUG] Implementation address: ${implementationAddress}`);
  if (implementationAddress && implementationAddress !== "0x0000000000000000000000000000000000000000") {
    console.error("[DEBUG] Confirmed: Contract is a proxy. Implementation address found.");
  } else {
    console.error("[DEBUG] Warning: Contract does not appear to be a proxy.");
  }
} catch (error) {
  console.error("[DEBUG] Failed to check proxy implementation slot:", error);
}

// Staking contract ABI
const STAKING_CONTRACT_ABI = [
  {"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
  {"inputs":[],"name":"ContractPaused","type":"error"},
  {"inputs":[],"name":"FailedToSendMon","type":"error"},
  {"inputs":[],"name":"InsufficientBalance","type":"error"},
  {"inputs":[],"name":"InvalidInitialization","type":"error"},
  {"inputs":[],"name":"InvalidZeroInput","type":"error"},
  {"inputs":[],"name":"MaxTVLReached","type":"error"},
  {"inputs":[],"name":"NotDepositWithdrawPauser","type":"error"},
  {"inputs":[],"name":"NotInitializing","type":"error"},
  {"inputs":[],"name":"NotStakeManagerAdmin","type":"error"},
  {"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},
  {
    "anonymous":false,
    "inputs":[
      {"indexed":true,"internalType":"address","name":"depositor","type":"address"},
      {"indexed":true,"internalType":"uint256","name":"amount","type":"uint256"},
      {"indexed":false,"internalType":"uint256","name":"gMonMinted","type":"uint256"},
      {"indexed":true,"internalType":"uint256","name":"referralId","type":"uint256"}
    ],
    "name":"Deposit",
    "type":"event"
  },
  {
    "anonymous":false,
    "inputs":[{"indexed":false,"internalType":"uint64","name":"version","type":"uint64"}],
    "name":"Initialized",
    "type":"event"
  },
  {
    "anonymous":false,
    "inputs":[
      {"indexed":true,"internalType":"address","name":"withdrawer","type":"address"},
      {"indexed":true,"internalType":"uint256","name":"amount","type":"uint256"},
      {"indexed":false,"internalType":"uint256","name":"gMonBurned","type":"uint256"}
    ],
    "name":"Withdraw",
    "type":"event"
  },
  {
    "inputs":[],"name":"calculateTVL",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[],"name":"depositMon",
    "outputs":[],"stateMutability":"payable",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_referralId","type":"uint256"}],
    "name":"depositMon",
    "outputs":[],"stateMutability":"payable",
    "type":"function"
  },
  {
    "inputs":[],"name":"gMON",
    "outputs":[{"internalType":"contract IGMonToken","name":"","type":"address"}],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[
      {"internalType":"contract IRoleManager","name":"_roleManager","type":"address"},
      {"internalType":"contract IGMonToken","name":"_gMon","type":"address"}
    ],
    "name":"initialize",
    "outputs":[],"stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[],"name":"maxDepositTVL",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[],"name":"paused",
    "outputs":[{"internalType":"bool","name":"","type":"bool"}],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[],"name":"roleManager",
    "outputs":[{"internalType":"contract IRoleManager","name":"","type":"address"}],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_maxDepositTVL","type":"uint256"}],
    "name":"setMaxDepositTVL",
    "outputs":[],"stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"bool","name":"_paused","type":"bool"}],
    "name":"setPaused",
    "outputs":[],"stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[],"name":"totalValueLocked",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],
    "name":"withdrawMon",
    "outputs":[],"stateMutability":"nonpayable",
    "type":"function"
  }
];

// ERC-20 ABI for gMON token
const ERC20_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

// Event interfaces
interface DepositEvent {
  eventName: "Deposit";
  args: {
    depositor: string;
    amount: bigint;
    gMonMinted: bigint;
    referralId: bigint;
  };
}

interface WithdrawEvent {
  eventName: "Withdraw";
  args: {
    withdrawer: string;
    amount: bigint;
    gMonBurned: bigint;
  };
}

// Initialize MCP server
const server = new McpServer({
  name: "monad-testnet-magma-staking-tool",
  version: "0.0.1",
  capabilities: ["stake-mon-on-magma", "withdraw-mon-from-magma"],
});
console.error("[DEBUG] McpServer initialized");

// Tool: Stake MON on Magma
server.tool(
  "stake-mon-on-magma",
  "Stake MON tokens on Magma (magmastaking.xyz) on Monad Testnet and receive gMON",
  {
    amount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount: must be a positive number (e.g., '0.2')").describe("Amount of MON to stake (e.g., '0.2' for 0.2 MON)"),
    referralId: z.string().regex(/^\d+$/, "Invalid referral ID: must be a number").optional().nullable().describe("Optional referral ID for staking (e.g., '12345')"),
  },
  async ({ amount, referralId }) => {
    console.error(`[DEBUG] Staking ${amount} MON on Magma at ${STAKING_CONTRACT_ADDRESS}`);
    try {
      // Parse amount
      const decimals = 18;
      const parsedAmount = parseUnits(amount, decimals);
      if (parsedAmount <= BigInt(0)) {
        throw new Error("Amount must be greater than 0");
      }
      console.error(`[DEBUG] Parsed amount: ${parsedAmount}`);

      // Check if contract is paused
      const isPaused = await publicClient.readContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: "paused",
      }) as boolean;
      if (isPaused) {
        throw new Error("Staking is currently paused on Magma");
      }

      // Log current TVL
      const currentTVL = await publicClient.readContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: "totalValueLocked",
      }) as bigint;
      console.error(`[DEBUG] Current TVL: ${formatUnits(currentTVL, decimals)} MON`);

      // Skip maxDepositTVL check, rely on contract
      console.error("[DEBUG] Skipping maxDepositTVL check. Relying on contract to enforce TVL limits.");

      // Check MON balance
      const monBalance = await publicClient.getBalance({ address: account.address });
      if (monBalance < parsedAmount) {
        throw new Error(`Insufficient MON balance. Available: ${formatUnits(monBalance, decimals)} MON, Required: ${amount} MON`);
      }
      console.error(`[DEBUG] User MON balance: ${formatUnits(monBalance, decimals)} MON`);

      // Estimate gas
      const gasPrice = await publicClient.getGasPrice();
      console.error(`[DEBUG] Current gas price: ${formatUnits(gasPrice, 9)} gwei`);

      const functionData = referralId
        ? encodeFunctionData({
            abi: STAKING_CONTRACT_ABI,
            functionName: "depositMon",
            args: [BigInt(referralId)],
          })
        : encodeFunctionData({
            abi: STAKING_CONTRACT_ABI,
            functionName: "depositMon",
            args: [],
          });

      const stakeGasEstimate = await publicClient.estimateGas({
        account: account.address,
        to: STAKING_CONTRACT_ADDRESS,
        value: parsedAmount,
        data: functionData,
      });
      console.error(`[DEBUG] Estimated gas for staking: ${stakeGasEstimate}`);

      const estimatedGasCost = stakeGasEstimate * gasPrice;
      const totalMonRequired = parsedAmount + estimatedGasCost;
      if (monBalance < totalMonRequired) {
        throw new Error(
          `Insufficient MON for staking and gas fees. Available: ${formatUnits(monBalance, decimals)} MON, ` +
          `Required: ${formatUnits(totalMonRequired, decimals)} MON (Staking: ${amount} MON, Gas: ${formatUnits(estimatedGasCost, decimals)} MON)`
        );
      }

      // Stake MON
      const stakeTxHash = await walletClient.writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: "depositMon",
        args: referralId ? [BigInt(referralId)] : [],
        value: parsedAmount,
        account,
      });
      console.error(`[DEBUG] Staking transaction sent: ${stakeTxHash}`);

      // Wait for confirmation
      const stakeReceipt = await publicClient.waitForTransactionReceipt({ hash: stakeTxHash });
      if (stakeReceipt.status !== "success") {
        throw new Error(`Staking transaction failed: ${stakeTxHash}`);
      }
      console.error(`[DEBUG] Staking transaction confirmed: ${stakeTxHash}`);

      // Fetch gMON token address
      const gmonTokenAddress = await publicClient.readContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: "gMON",
      }) as `0x${string}`;
      console.error(`[DEBUG] gMON token address: ${gmonTokenAddress}`);

      // Query gMON balance
      const gmonDecimals = await publicClient.readContract({
        address: gmonTokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      }) as number;
      const gmonBalance = await publicClient.readContract({
        address: gmonTokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      }) as bigint;
      console.error(`[DEBUG] gMON balance: ${formatUnits(gmonBalance, gmonDecimals)} gMON`);

      // Parse Deposit event
      let gmonMintedMessage = "Unable to parse the amount of gMON minted.";
      const depositEvents = parseEventLogs({
        abi: STAKING_CONTRACT_ABI,
        logs: stakeReceipt.logs,
        eventName: "Deposit",
      }) as unknown as DepositEvent[];
      const depositEvent = depositEvents.find(
        (event) => event.args.depositor.toLowerCase() === account.address.toLowerCase()
      );
      if (depositEvent) {
        const gmonMinted = BigInt(depositEvent.args.gMonMinted);
        gmonMintedMessage = `gMON minted: ${formatUnits(gmonMinted, gmonDecimals)} gMON`;
        console.error(`[DEBUG] gMON minted: ${formatUnits(gmonMinted, gmonDecimals)} gMON`);
      }

      // Generate explorer link
      const explorerLink = `${MONAD_EXPLORER_URL}${stakeTxHash}`;
      console.error(`[DEBUG] Explorer link: ${explorerLink}`);

      // Construct response
      const message = `Successfully staked ${amount} MON on Magma.\n` +
                     `${gmonMintedMessage}\n` +
                     `Your gMON balance: ${formatUnits(gmonBalance, gmonDecimals)} gMON\n` +
                     `Transaction: ${stakeTxHash} (Gas used: ${stakeReceipt.gasUsed.toString()})\n` +
                     `Explorer: ${explorerLink}`;
      return {
        content: [{ type: "text", text: message }],
      };
    } catch (error) {
      console.error(`[DEBUG] Error in stake-mon-on-magma: ${error}`);
      return {
        content: [{ type: "text", text: `Failed to stake MON on Magma: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);
console.error("[DEBUG] stake-mon-on-magma tool registered");

// Tool: Withdraw MON from Magma
server.tool(
  "withdraw-mon-from-magma",
  "Withdraw MON tokens from Magma (magmastaking.xyz) on Monad Testnet by burning gMON",
  {
    amount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount: must be a positive number (e.g., '0.05')").describe("Amount of gMON to burn and withdraw as MON (e.g., '0.05' for 0.05 MON)"),
  },
  async ({ amount }) => {
    console.error(`[DEBUG] Withdrawing ${amount} MON from Magma at ${STAKING_CONTRACT_ADDRESS}`);
    try {
      // Fetch gMON token address
      const gmonTokenAddress = await publicClient.readContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: "gMON",
      }) as `0x${string}`;
      console.error(`[DEBUG] gMON token address: ${gmonTokenAddress}`);

      // Parse amount
      const gmonDecimals = await publicClient.readContract({
        address: gmonTokenAddress,
        abi: ERC20_ABI,
        functionName: "decimals",
      }) as number;
      const parsedAmount = parseUnits(amount, gmonDecimals);
      if (parsedAmount <= BigInt(0)) {
        throw new Error("Amount must be greater than 0");
      }
      console.error(`[DEBUG] Parsed amount: ${parsedAmount}`);

      // Check if contract is paused
      const isPaused = await publicClient.readContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: "paused",
      }) as boolean;
      if (isPaused) {
        throw new Error("Withdrawals are currently paused on Magma");
      }

      // Check gMON balance
      const gmonBalance = await publicClient.readContract({
        address: gmonTokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      }) as bigint;
      if (gmonBalance < parsedAmount) {
        throw new Error(`Insufficient gMON balance. Available: ${formatUnits(gmonBalance, gmonDecimals)} gMON, Requested: ${amount} gMON`);
      }
      console.error(`[DEBUG] gMON balance: ${formatUnits(gmonBalance, gmonDecimals)} gMON`);

      // Estimate gas
      const gasPrice = await publicClient.getGasPrice();
      console.error(`[DEBUG] Current gas price: ${formatUnits(gasPrice, 9)} gwei`);

      const functionData = encodeFunctionData({
        abi: STAKING_CONTRACT_ABI,
        functionName: "withdrawMon",
        args: [parsedAmount],
      });

      const withdrawGasEstimate = await publicClient.estimateGas({
        account: account.address,
        to: STAKING_CONTRACT_ADDRESS,
        data: functionData,
      });
      console.error(`[DEBUG] Estimated gas for withdrawal: ${withdrawGasEstimate}`);

      const estimatedGasCost = withdrawGasEstimate * gasPrice;
      const monBalance = await publicClient.getBalance({ address: account.address });
      if (monBalance < estimatedGasCost) {
        throw new Error(
          `Insufficient MON for gas fees. Available: ${formatUnits(monBalance, 18)} MON, Required: ${formatUnits(estimatedGasCost, 18)} MON`
        );
      }

      // Withdraw MON
      const withdrawTxHash = await walletClient.writeContract({
        address: STAKING_CONTRACT_ADDRESS,
        abi: STAKING_CONTRACT_ABI,
        functionName: "withdrawMon",
        args: [parsedAmount],
        account,
      });
      console.error(`[DEBUG] Withdrawal transaction sent: ${withdrawTxHash}`);

      // Wait for confirmation
      const withdrawReceipt = await publicClient.waitForTransactionReceipt({ hash: withdrawTxHash });
      if (withdrawReceipt.status !== "success") {
        throw new Error(`Withdrawal transaction failed: ${withdrawTxHash}`);
      }
      console.error(`[DEBUG] Withdrawal transaction confirmed: ${withdrawTxHash}`);

      // Query updated gMON balance
      const updatedGmonBalance = await publicClient.readContract({
        address: gmonTokenAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      }) as bigint;
      console.error(`[DEBUG] Updated gMON balance: ${formatUnits(updatedGmonBalance, gmonDecimals)} gMON`);

      // Parse Withdraw event
      let gmonBurnedMessage = "Unable to parse the amount of gMON burned.";
      const withdrawEvents = parseEventLogs({
        abi: STAKING_CONTRACT_ABI,
        logs: withdrawReceipt.logs,
        eventName: "Withdraw",
      }) as unknown as WithdrawEvent[];
      const withdrawEvent = withdrawEvents.find(
        (event) => event.args.withdrawer.toLowerCase() === account.address.toLowerCase()
      );
      if (withdrawEvent) {
        const gmonBurned = BigInt(withdrawEvent.args.gMonBurned);
        gmonBurnedMessage = `gMON burned: ${formatUnits(gmonBurned, gmonDecimals)} gMON`;
        console.error(`[DEBUG] gMON burned: ${formatUnits(gmonBurned, gmonDecimals)} gMON`);
      }

      // Generate explorer link
      const explorerLink = `${MONAD_EXPLORER_URL}${withdrawTxHash}`;
      console.error(`[DEBUG] Explorer link: ${explorerLink}`);

      // Construct response
      const message = `Successfully withdrew ${amount} MON from Magma.\n` +
                     `${gmonBurnedMessage}\n` +
                     `Your updated gMON balance: ${formatUnits(updatedGmonBalance, gmonDecimals)} gMON\n` +
                     `Transaction: ${withdrawTxHash} (Gas used: ${withdrawReceipt.gasUsed.toString()})\n` +
                     `Explorer: ${explorerLink}`;
      return {
        content: [{ type: "text", text: message }],
      };
    } catch (error) {
      console.error(`[DEBUG] Error in withdraw-mon-from-magma: ${error}`);
      return {
        content: [{ type: "text", text: `Failed to withdraw MON from Magma: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);
console.error("[DEBUG] withdraw-mon-from-magma tool registered");

// Main function
async function main() {
  console.error("[DEBUG] Starting server");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[DEBUG] Server running");
}

main().catch((error) => {
  console.error("[DEBUG] Fatal error:", error);
  process.exit(1);
});