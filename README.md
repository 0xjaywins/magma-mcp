Monad Magma MCP Staking Tool
Features

Stake MON: Stake MON tokens to receive gMON.
Withdraw MON: Burn gMON to withdraw MON.

Prerequisites

Node.js (18.x or later)
Git
Monad Testnet wallet with MON tokens
MCP-compatible client (e.g., Claude)

Setup Commands
Clone the Repository
git clone https://github.com/0xjaywins/magma-mcp.git
cd monad-mcp-staking

Install Dependencies
npm install
npm install --save-dev @types/node

Configure .env

Create .env in the root directory:code .env


Add:PRIVATE_KEY=0xYourPrivateKey

Replace 0xYourPrivateKey with your Monad Testnet private key.
Update src/index.ts with the .env path (e.g., /home/yourusername/monad-mcp-staking/.env).

Note for Windows Users: Replace Unix paths (e.g., /home/yourUsername/...) with Windows paths (e.g., C:\Program Files\nodejs\node.exe for Node.js, C:\Users\lenovo\Desktop\magma-mcp\dist\index.js for the script).
Build the Project
npm run build

Run the Script
node dist/index.js

Testing with MCP Inspector
Install MCP Inspector
npm install @modelcontextprotocol/inspector@0.10.2

Get Node and Script Paths
which node  # Example: /home/yourUsername/.nvm/versions/node/v23.11.0/bin/node
pwd  # Example: /home/yourUsername/monad-mcp-staking

Combine for the script path (e.g., /home/yourUsername/monad-mcp-staking/dist/index.js).
Run MCP Inspector
npx @modelcontextprotocol/inspector /home/yourUsername/.nvm/versions/node/v23.11.0/bin/node /home/yourUsername/monad-mcp-staking/dist/index.js

Replace paths with your own.
Configuring Claude
Create Claude JSON Config
Use the Node and script paths from above. Example claude.json:
{
  "mcpServers": {
    "monad-mcp": {
      "command": "node",
      "args": [
        "/home/yourUsername/.nvm/versions/node/v23.11.0/bin/node",
        "/home/yourUsername/monad-mcp-staking/dist/index.js"
      ]
    }
  }
}

## Windows Setup Tips
- Use Windows paths (e.g., `C:\Program Files\nodejs\node.exe` for Node.js, `C:\Users\YourUsername\magma-mcp\dist\index.js` for the script).
- In Claude’s JSON config, replace `command: "node"` with the full Node.js path.
- Example Claude config for Windows:
  ```json
  {
    "mcpServers": {
      "monad-mcp": {
        "command": "C:\\Program Files\\nodejs\\node.exe",
        "args": ["C:\\Users\\YourUsername\\magma-mcp\\dist\\index.js"]
      }
    }
  }
  
Save and configure your Claude client to use this file.
Expected Output

Successful Stake:Successfully staked 0.2 MON on Magma.
gMON minted: 0.2 gMON
Your gMON balance: 0.2 gMON
Transaction: 0x...
Explorer: https://testnet.monadexplorer.com/tx/0x...


MCP Inspector: Displays tool status and transaction logs.
Claude: Shows JSON responses with transaction details.

Troubleshooting

Invalid .env: Ensure PRIVATE_KEY is correct.
Insufficient Funds: Fund your wallet with MON/gMON on Monad Testnet.
Network Error: Verify RPC (https://testnet-rpc.monad.xyz).
Path Issues: Update paths in src/index.ts and Claude config.

