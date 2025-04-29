# Monad Magma MCP

## Features
- Stake MON: Stake MON tokens to receive gMON.
- Withdraw MON: Burn gMON to withdraw MON.

## Prerequisites
- Node.js (18.x or later)
- Git
- Monad Testnet wallet with MON tokens
- MCP-compatible client (e.g., Claude)

## Setup Commands

### Clone Repository
```bash
git clone https://github.com/0xjaywins/magma-mcp.git
cd monad-mcp-staking
```

### Install Dependencies
```bash
npm install
npm install --save-dev @types/node
```

### Configure .env
1. Create `.env`:
   ```bash
   code .env
   ```
2. Add:
   ```
   PRIVATE_KEY=0xYourPrivateKey
   ```
   Replace `0xYourPrivateKey` with your Monad Testnet private key.
3. Update `src/index.ts` with `.env` path (e.g., `/home/yourusername/monad-mcp-staking/.env` for Unix, `C:\Users\lenovo\Desktop\monad-mcp-staking\.env` for Windows).

### Build Project
```bash
npm run build
```

### Run Script
```bash
node dist/index.js
```

## Windows Setup Tips
- Use Windows paths (e.g., `C:\Program Files\nodejs\node.exe`, `C:\Users\lenovo\Desktop\magma-mcp\dist\index.js`).
- Claude config for Windows:
  ```json
  {
    "mcpServers": {
      "monad-mcp": {
        "command": "C:\\Program Files\\nodejs\\node.exe",
        "args": ["C:\\Users\\lenovo\\Desktop\\magma-mcp\\dist\\index.js"]
      }
    }
  }
  ```

## Testing with MCP Inspector
1. Install:
   ```bash
   npm install @modelcontextprotocol/inspector@0.10.2
   ```
2. Get paths:
   ```bash
   which node  # /home/yourUsername/.nvm/versions/node/v23.11.0/bin/node
   pwd  # /home/yourUsername/monad-mcp-staking
   ```
   Windows: Use `C:\Program Files\nodejs\node.exe`, `C:\Users\lenovo\Desktop\monad-mcp-staking\dist\index.js`.
3. Run:
   ```bash
   npx @modelcontextprotocol/inspector /home/yourUsername/.nvm/versions/node/v23.11.0/bin/node /home/yourUsername/monad-mcp-staking/dist/index.js
   ```

## Configuring Claude
- Use paths from above.
- Example `claude.json`:
  ```json
  {
    "mcpServers": {
      "monad-mcp": {
        "command": "node",
        "args": ["/home/yourUsername/.nvm/versions/node/v23.11.0/bin/node", "/home/yourUsername/monad-mcp-staking/dist/index.js"]
      }
    }
  }
  ```

## Expected Output
- Successful Stake:
  ```
  Successfully staked 0.2 MON on Magma.
  gMON minted: 0.2 gMON
  Your gMON balance: 0.2 gMON
  Transaction: 0x...
  Explorer: https://testnet.monadexplorer.com/tx/0x...
  ```
- MCP Inspector: Displays tool status and transaction logs.
- Claude: Shows JSON responses with transaction details.

## Troubleshooting
- Invalid .env: Ensure `PRIVATE_KEY` is correct.
- Insufficient Funds: Fund wallet with MON/gMON on Monad Testnet.
- Network Error: Verify RPC (`https://testnet-rpc.monad.xyz`).
- Path Issues: Update paths in `src/index.ts` and Claude config.
