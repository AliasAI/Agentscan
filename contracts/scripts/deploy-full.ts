import hre from "hardhat";
import { formatEther, parseEther, encodeFunctionData } from "viem";
import * as fs from "fs";
import * as path from "path";

// Already deployed implementation addresses (reuse them)
const IDENTITY_IMPL = "0x01087213e3934bc156194e0d8a9c00f09874c572";
const REPUTATION_IMPL = "0xe55d10f699bcf2207573b7be697c983c0d92c2b5";

async function main() {
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId || 0;

  console.log("\n" + "=".repeat(60));
  console.log("ERC-8004 Full Deployment (MinimalUUPS → Upgrade)");
  console.log("=".repeat(60));
  console.log(`Network: ${networkName} (Chain ID: ${chainId})`);

  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const deployerAddress = deployer.account.address;
  const balance = await publicClient.getBalance({ address: deployerAddress });

  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${formatEther(balance)} BNB`);

  if (balance < parseEther("0.003")) {
    console.error("\n[ERROR] Need at least 0.003 BNB");
    process.exit(1);
  }

  const startBlock = await publicClient.getBlockNumber();

  // Step 1: Deploy MinimalUUPS
  console.log("\n" + "-".repeat(60));
  console.log("Step 1: Deploy MinimalUUPS Implementation");
  console.log("-".repeat(60));

  console.log("\nDeploying MinimalUUPS...");
  const minimalUUPS = await hre.viem.deployContract("MinimalUUPS");
  console.log(`MinimalUUPS: ${minimalUUPS.address}`);

  // Step 2: Deploy Identity Proxy with MinimalUUPS and initialize
  console.log("\n" + "-".repeat(60));
  console.log("Step 2: Deploy Identity Proxy (with initialization)");
  console.log("-".repeat(60));

  // Encode initialize(owner, identityRegistry) - for Identity, identityRegistry is address(0)
  const identityInitData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "owner_", type: "address" },
          { name: "identityRegistry_", type: "address" },
        ],
        name: "initialize",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    functionName: "initialize",
    args: [deployerAddress, "0x0000000000000000000000000000000000000000"],
  });

  console.log("\nDeploying Identity Proxy...");
  const identityProxy = await hre.viem.deployContract(
    "contracts/ERC1967Proxy.sol:ERC1967Proxy",
    [minimalUUPS.address, identityInitData]
  );
  console.log(`Identity Proxy: ${identityProxy.address}`);

  // Verify owner is set
  const identityMinimal = await hre.viem.getContractAt(
    "MinimalUUPS",
    identityProxy.address
  );
  const idOwner = await identityMinimal.read.owner();
  console.log(`Identity Owner: ${idOwner}`);

  // Step 3: Deploy Reputation Proxy with MinimalUUPS
  console.log("\n" + "-".repeat(60));
  console.log("Step 3: Deploy Reputation Proxy (with initialization)");
  console.log("-".repeat(60));

  // For Reputation, identityRegistry points to Identity Proxy
  const reputationInitData = encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: "owner_", type: "address" },
          { name: "identityRegistry_", type: "address" },
        ],
        name: "initialize",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    functionName: "initialize",
    args: [deployerAddress, identityProxy.address],
  });

  console.log("\nDeploying Reputation Proxy...");
  const reputationProxy = await hre.viem.deployContract(
    "contracts/ERC1967Proxy.sol:ERC1967Proxy",
    [minimalUUPS.address, reputationInitData]
  );
  console.log(`Reputation Proxy: ${reputationProxy.address}`);

  const repMinimal = await hre.viem.getContractAt(
    "MinimalUUPS",
    reputationProxy.address
  );
  const repOwner = await repMinimal.read.owner();
  console.log(`Reputation Owner: ${repOwner}`);

  // Step 4: Upgrade to real implementations
  console.log("\n" + "-".repeat(60));
  console.log("Step 4: Upgrade to Real Implementations");
  console.log("-".repeat(60));

  console.log("\nUpgrading Identity to IdentityRegistryUpgradeable...");
  const upgradeTx1 = await identityMinimal.write.upgradeToAndCall([
    IDENTITY_IMPL as `0x${string}`,
    "0x" as `0x${string}`,
  ]);
  await publicClient.waitForTransactionReceipt({ hash: upgradeTx1 });
  console.log(`TX: ${upgradeTx1}`);

  console.log("\nUpgrading Reputation to ReputationRegistryUpgradeable...");
  const upgradeTx2 = await repMinimal.write.upgradeToAndCall([
    REPUTATION_IMPL as `0x${string}`,
    "0x" as `0x${string}`,
  ]);
  await publicClient.waitForTransactionReceipt({ hash: upgradeTx2 });
  console.log(`TX: ${upgradeTx2}`);

  // Step 5: Verify
  console.log("\n" + "=".repeat(60));
  console.log("Verification");
  console.log("=".repeat(60));

  const identity = await hre.viem.getContractAt(
    "IdentityRegistryUpgradeable",
    identityProxy.address
  );
  const reputation = await hre.viem.getContractAt(
    "ReputationRegistryUpgradeable",
    reputationProxy.address
  );

  const idVersion = await identity.read.getVersion();
  const repVersion = await reputation.read.getVersion();
  const linkedId = await reputation.read.getIdentityRegistry();

  console.log(`\nIdentity Registry:`);
  console.log(`   Address: ${identityProxy.address}`);
  console.log(`   Version: ${idVersion}`);

  console.log(`\nReputation Registry:`);
  console.log(`   Address: ${reputationProxy.address}`);
  console.log(`   Version: ${repVersion}`);
  console.log(`   Linked Identity: ${linkedId}`);

  // Save deployment
  const deployment = {
    network: networkName,
    chainId,
    deployer: deployerAddress,
    minimalUUPS: minimalUUPS.address,
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

  const filename = `${networkName}-final-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deployment, null, 2)
  );

  console.log("\n" + "=".repeat(60));
  console.log("✅ DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log(`\n📋 Use these addresses:`);
  console.log(`   Identity Registry:   ${identityProxy.address}`);
  console.log(`   Reputation Registry: ${reputationProxy.address}`);
  console.log(`\n💾 Saved to: deployments/${filename}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("\n❌ Error:", e);
    process.exit(1);
  });
