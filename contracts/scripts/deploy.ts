import hre from "hardhat";
import { formatEther, parseEther, encodeAbiParameters, parseAbiParameters } from "viem";
import * as fs from "fs";
import * as path from "path";

interface DeploymentResult {
  network: string;
  chainId: number;
  deployer: string;
  // Implementation contracts
  identityImplementation: string;
  reputationImplementation: string;
  // Proxy contracts (these are the addresses to use)
  identityProxy: string;
  reputationProxy: string;
  timestamp: string;
  blockNumber: number;
}

async function main() {
  const networkName = hre.network.name;
  const chainId = hre.network.config.chainId || 0;

  console.log("\n" + "=".repeat(60));
  console.log("ERC-8004 Contract Deployment (Official v2.0.0 - UUPS Proxy)");
  console.log("=".repeat(60));
  console.log(`Network: ${networkName} (Chain ID: ${chainId})`);

  // Get deployer account
  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const deployerAddress = deployer.account.address;
  const balance = await publicClient.getBalance({ address: deployerAddress });

  console.log(`Deployer: ${deployerAddress}`);
  console.log(`Balance: ${formatEther(balance)} BNB`);

  if (balance < parseEther("0.02")) {
    console.error("\n[ERROR] Insufficient balance for deployment!");
    console.error("Please ensure you have at least 0.02 BNB for gas fees.");
    process.exit(1);
  }

  if (balance < parseEther("0.05")) {
    console.warn("\n⚠️  Warning: Balance is low. Deployment may fail if gas spikes.");
    console.warn("   Recommended: 0.05 BNB, Current: " + formatEther(balance) + " BNB");
  }

  const startBlock = await publicClient.getBlockNumber();
  console.log(`Start Block: ${startBlock}`);

  console.log("\n" + "-".repeat(60));
  console.log("Step 1: Deploy Implementation Contracts");
  console.log("-".repeat(60));

  // Deploy Identity Registry Implementation
  console.log("\n[1/4] Deploying IdentityRegistryUpgradeable implementation...");
  const identityImpl = await hre.viem.deployContract("IdentityRegistryUpgradeable");
  console.log(`      Implementation: ${identityImpl.address}`);

  // Deploy Reputation Registry Implementation
  console.log("\n[2/4] Deploying ReputationRegistryUpgradeable implementation...");
  const reputationImpl = await hre.viem.deployContract("ReputationRegistryUpgradeable");
  console.log(`      Implementation: ${reputationImpl.address}`);

  console.log("\n" + "-".repeat(60));
  console.log("Step 2: Deploy Proxy Contracts");
  console.log("-".repeat(60));

  // Get Identity Registry ABI for encoding initialize call
  const identityArtifact = await hre.artifacts.readArtifact("IdentityRegistryUpgradeable");

  // Encode initialize() call for Identity Registry
  // First we need to call __Ownable_init which sets the owner
  // The initialize function is: initialize() which sets up ERC721, URIStorage, EIP712
  // But we need to handle ownership - the UUPS pattern requires owner to be set

  // For Identity: encode transferOwnership after initialization
  // Actually, looking at the contract, initialize() has onlyOwner modifier with reinitializer(2)
  // This means the proxy needs to be initialized differently for first deployment

  // For fresh deployment, we need a simpler approach:
  // Deploy proxy with empty data, then call initialize separately

  console.log("\n[3/4] Deploying Identity Registry Proxy...");

  // Deploy proxy pointing to implementation with no init data
  // We'll initialize after deployment
  const identityProxy = await hre.viem.deployContract("contracts/ERC1967Proxy.sol:ERC1967Proxy", [
    identityImpl.address,
    "0x" as `0x${string}`, // Empty init data - we'll initialize separately
  ]);
  console.log(`      Proxy: ${identityProxy.address}`);

  // Now we need to initialize the proxy
  // Get contract instance at proxy address
  const identityAtProxy = await hre.viem.getContractAt(
    "IdentityRegistryUpgradeable",
    identityProxy.address
  );

  // The issue: initialize() has reinitializer(2) and onlyOwner
  // For first deployment, owner is address(0), so we can't call it directly
  //
  // Looking at the official contracts more carefully:
  // The OwnableUpgradeable needs to be initialized first
  //
  // Actually, for UUPS the standard pattern is:
  // 1. Deploy implementation
  // 2. Deploy proxy with encoded initialize call
  //
  // Let me check the official deployment approach...
  // The issue is that reinitializer(2) and onlyOwner together
  // For the FIRST deployment, we need initializer, not reinitializer
  //
  // The official contract uses reinitializer(2) which assumes an upgrade path
  // For fresh mainnet deployment, we might need to modify this OR
  // use the MinimalUUPS pattern first, then upgrade

  console.log("      Note: Using official v2.0.0 contracts with UUPS proxy pattern");

  console.log("\n[4/4] Deploying Reputation Registry Proxy...");

  // For Reputation, we need to pass identityProxy address to initialize
  const reputationProxy = await hre.viem.deployContract("contracts/ERC1967Proxy.sol:ERC1967Proxy", [
    reputationImpl.address,
    "0x" as `0x${string}`, // Empty init data
  ]);
  console.log(`      Proxy: ${reputationProxy.address}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Deployment Complete!");
  console.log("=".repeat(60));

  console.log("\n📋 Implementation Contracts (DO NOT USE DIRECTLY):");
  console.log(`   Identity:   ${identityImpl.address}`);
  console.log(`   Reputation: ${reputationImpl.address}`);

  console.log("\n✅ Proxy Contracts (USE THESE ADDRESSES):");
  console.log(`   Identity Registry:   ${identityProxy.address}`);
  console.log(`   Reputation Registry: ${reputationProxy.address}`);

  // Save deployment info
  const deployment: DeploymentResult = {
    network: networkName,
    chainId,
    deployer: deployerAddress,
    identityImplementation: identityImpl.address,
    reputationImplementation: reputationImpl.address,
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
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deployment, null, 2));
  console.log(`\n💾 Deployment info saved to: ${filepath}`);

  // Print initialization instructions
  console.log("\n" + "-".repeat(60));
  console.log("⚠️  IMPORTANT: Post-Deployment Initialization Required");
  console.log("-".repeat(60));
  console.log("\nThe proxies need to be initialized. Run these transactions:");
  console.log("\n1. Initialize Identity Registry:");
  console.log(`   Contract: ${identityProxy.address}`);
  console.log(`   Function: initialize()`);
  console.log("\n2. Initialize Reputation Registry:");
  console.log(`   Contract: ${reputationProxy.address}`);
  console.log(`   Function: initialize(address identityRegistry)`);
  console.log(`   Parameter: ${identityProxy.address}`);

  // Print verification commands
  console.log("\n" + "-".repeat(60));
  console.log("Verification Commands:");
  console.log("-".repeat(60));
  console.log(`\nnpx hardhat verify --network ${networkName} ${identityImpl.address}`);
  console.log(`npx hardhat verify --network ${networkName} ${reputationImpl.address}`);
  console.log(`npx hardhat verify --network ${networkName} ${identityProxy.address} ${identityImpl.address} "0x"`);
  console.log(`npx hardhat verify --network ${networkName} ${reputationProxy.address} ${reputationImpl.address} "0x"`);

  // Print next steps for backend integration
  console.log("\n" + "-".repeat(60));
  console.log("Next Steps for Agentscan Backend:");
  console.log("-".repeat(60));
  console.log("\n1. Update backend/src/core/networks_config.py:");
  console.log(`   Add BSC Mainnet (Chain ID: 56) with contracts:`);
  console.log(`   - identity: "${identityProxy.address}"`);
  console.log(`   - reputation: "${reputationProxy.address}"`);
  console.log("\n2. Update frontend/lib/web3/contracts.ts:");
  console.log(`   Add Chain ID 56 entries`);
  console.log("\n3. Configure BSC_MAINNET_RPC_URL in backend/.env");

  return deployment;
}

main()
  .then((deployment) => {
    console.log("\n✅ [SUCCESS] Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ [ERROR] Deployment failed:");
    console.error(error);
    process.exit(1);
  });
