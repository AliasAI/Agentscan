import hre from "hardhat";
import { formatEther, parseEther } from "viem";
import * as fs from "fs";
import * as path from "path";

// Already deployed implementation addresses
const IDENTITY_IMPL = "0x01087213e3934bc156194e0d8a9c00f09874c572";
const REPUTATION_IMPL = "0xe55d10f699bcf2207573b7be697c983c0d92c2b5";

async function main() {
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId || 0;

  console.log("\n" + "=".repeat(60));
  console.log("ERC-8004 Proxy Deployment (Continue from previous)");
  console.log("=".repeat(60));
  console.log(`Network: ${networkName} (Chain ID: ${chainId})`);

  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const deployerAddress = deployer.account.address;
  const balance = await publicClient.getBalance({ address: deployerAddress });

  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${formatEther(balance)} BNB`);

  if (balance < parseEther("0.005")) {
    console.error("\n[ERROR] Insufficient balance!");
    console.error("Please add at least 0.01 BNB for proxy deployment.");
    process.exit(1);
  }

  console.log("\nUsing existing implementations:");
  console.log(`  Identity:   ${IDENTITY_IMPL}`);
  console.log(`  Reputation: ${REPUTATION_IMPL}`);

  const startBlock = await publicClient.getBlockNumber();

  console.log("\n" + "-".repeat(60));
  console.log("Deploying Proxy Contracts");
  console.log("-".repeat(60));

  // Deploy Identity Proxy
  console.log("\n[1/2] Deploying Identity Registry Proxy...");
  const identityProxy = await hre.viem.deployContract(
    "contracts/ERC1967Proxy.sol:ERC1967Proxy",
    [IDENTITY_IMPL, "0x" as `0x${string}`]
  );
  console.log(`      Proxy: ${identityProxy.address}`);

  // Deploy Reputation Proxy
  console.log("\n[2/2] Deploying Reputation Registry Proxy...");
  const reputationProxy = await hre.viem.deployContract(
    "contracts/ERC1967Proxy.sol:ERC1967Proxy",
    [REPUTATION_IMPL, "0x" as `0x${string}`]
  );
  console.log(`      Proxy: ${reputationProxy.address}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Complete!");
  console.log("=".repeat(60));

  console.log("\n✅ Final Contract Addresses (USE THESE):");
  console.log(`   Identity Registry:   ${identityProxy.address}`);
  console.log(`   Reputation Registry: ${reputationProxy.address}`);

  // Save deployment
  const deployment = {
    network: networkName,
    chainId,
    deployer: deployerAddress,
    identityImplementation: IDENTITY_IMPL,
    reputationImplementation: REPUTATION_IMPL,
    identityProxy: identityProxy.address,
    reputationProxy: reputationProxy.address,
    timestamp: new Date().toISOString(),
    blockNumber: Number(startBlock),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${networkName}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deployment, null, 2)
  );

  console.log(`\n💾 Saved to: deployments/${filename}`);

  // Next steps
  console.log("\n" + "-".repeat(60));
  console.log("⚠️  Initialize the contracts:");
  console.log("-".repeat(60));
  console.log(`\n1. Identity: Call initialize() on ${identityProxy.address}`);
  console.log(`2. Reputation: Call initialize(${identityProxy.address}) on ${reputationProxy.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
