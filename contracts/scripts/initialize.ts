import hre from "hardhat";
import { formatEther } from "viem";

// Deployed proxy addresses
const IDENTITY_PROXY = "0xd2184d4377b2dc4fcc9ad8f2f0b9842bf6f1a19f";
const REPUTATION_PROXY = "0xcd40e749c64761da2298436fe0ea4dc23f58c1f3";

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("ERC-8004 Contract Initialization");
  console.log("=".repeat(60));

  const [deployer] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log(`Deployer: ${deployer.account.address}`);
  console.log(`Balance: ${formatEther(balance)} BNB`);

  // Get contract instances at proxy addresses
  const identity = await hre.viem.getContractAt(
    "IdentityRegistryUpgradeable",
    IDENTITY_PROXY as `0x${string}`
  );

  const reputation = await hre.viem.getContractAt(
    "ReputationRegistryUpgradeable",
    REPUTATION_PROXY as `0x${string}`
  );

  // Check current state
  console.log("\n" + "-".repeat(60));
  console.log("Checking current state...");
  console.log("-".repeat(60));

  try {
    const version = await identity.read.getVersion();
    console.log(`Identity version: ${version}`);
  } catch (e) {
    console.log("Identity not initialized yet");
  }

  try {
    const version = await reputation.read.getVersion();
    console.log(`Reputation version: ${version}`);
  } catch (e) {
    console.log("Reputation not initialized yet");
  }

  // Initialize Identity Registry
  console.log("\n" + "-".repeat(60));
  console.log("[1/2] Initializing Identity Registry...");
  console.log("-".repeat(60));

  try {
    const tx1 = await identity.write.initialize();
    console.log(`   TX: ${tx1}`);
    await publicClient.waitForTransactionReceipt({ hash: tx1 });
    console.log("   ✅ Identity initialized!");
  } catch (e: any) {
    if (e.message?.includes("already initialized") || e.message?.includes("Initializable")) {
      console.log("   ⏭️  Already initialized, skipping...");
    } else {
      console.error("   ❌ Error:", e.message || e);
    }
  }

  // Initialize Reputation Registry
  console.log("\n" + "-".repeat(60));
  console.log("[2/2] Initializing Reputation Registry...");
  console.log("-".repeat(60));

  try {
    const tx2 = await reputation.write.initialize([IDENTITY_PROXY as `0x${string}`]);
    console.log(`   TX: ${tx2}`);
    await publicClient.waitForTransactionReceipt({ hash: tx2 });
    console.log("   ✅ Reputation initialized!");
  } catch (e: any) {
    if (e.message?.includes("already initialized") || e.message?.includes("Initializable")) {
      console.log("   ⏭️  Already initialized, skipping...");
    } else {
      console.error("   ❌ Error:", e.message || e);
    }
  }

  // Verify
  console.log("\n" + "=".repeat(60));
  console.log("Verification");
  console.log("=".repeat(60));

  try {
    const idVersion = await identity.read.getVersion();
    const repVersion = await reputation.read.getVersion();
    const linkedIdentity = await reputation.read.getIdentityRegistry();

    console.log(`\nIdentity Registry:`);
    console.log(`   Address: ${IDENTITY_PROXY}`);
    console.log(`   Version: ${idVersion}`);

    console.log(`\nReputation Registry:`);
    console.log(`   Address: ${REPUTATION_PROXY}`);
    console.log(`   Version: ${repVersion}`);
    console.log(`   Linked Identity: ${linkedIdentity}`);

    if (linkedIdentity.toLowerCase() === IDENTITY_PROXY.toLowerCase()) {
      console.log("\n✅ All contracts initialized and linked correctly!");
    }
  } catch (e) {
    console.error("Verification failed:", e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
