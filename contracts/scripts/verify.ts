import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentResult {
  network: string;
  chainId: number;
  deployer: string;
  identityRegistry: string;
  reputationRegistry: string;
  timestamp: string;
}

async function main() {
  const networkName = hre.network.name;

  console.log("\n" + "=".repeat(60));
  console.log("ERC-8004 Contract Verification");
  console.log("=".repeat(60));
  console.log(`Network: ${networkName}`);

  // Find the latest deployment for this network
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    console.error("\n[ERROR] No deployments directory found!");
    console.error("Please run deploy.ts first.");
    process.exit(1);
  }

  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith(networkName) && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error(`\n[ERROR] No deployment found for network: ${networkName}`);
    console.error("Please run deploy.ts first.");
    process.exit(1);
  }

  const latestFile = files[0];
  const filepath = path.join(deploymentsDir, latestFile);
  const deployment: DeploymentResult = JSON.parse(fs.readFileSync(filepath, "utf-8"));

  console.log(`\nUsing deployment: ${latestFile}`);
  console.log(`Deployed at: ${deployment.timestamp}`);
  console.log(`Identity Registry: ${deployment.identityRegistry}`);
  console.log(`Reputation Registry: ${deployment.reputationRegistry}`);

  console.log("\n" + "-".repeat(60));
  console.log("Verifying contracts on BscScan...");
  console.log("-".repeat(60));

  // Verify Identity Registry
  console.log("\n[1/2] Verifying Identity Registry...");
  try {
    await hre.run("verify:verify", {
      address: deployment.identityRegistry,
      constructorArguments: [],
    });
    console.log("     [OK] Identity Registry verified!");
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Already Verified")) {
      console.log("     [SKIP] Already verified");
    } else {
      console.error("     [FAIL]", error);
    }
  }

  // Verify Reputation Registry
  console.log("\n[2/2] Verifying Reputation Registry...");
  try {
    await hre.run("verify:verify", {
      address: deployment.reputationRegistry,
      constructorArguments: [],
    });
    console.log("     [OK] Reputation Registry verified!");
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Already Verified")) {
      console.log("     [SKIP] Already verified");
    } else {
      console.error("     [FAIL]", error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Verification Complete!");
  console.log("=".repeat(60));

  // Print BscScan links
  const explorerUrl = networkName === "bscMainnet"
    ? "https://bscscan.com"
    : "https://testnet.bscscan.com";

  console.log("\nView on BscScan:");
  console.log(`Identity Registry:   ${explorerUrl}/address/${deployment.identityRegistry}#code`);
  console.log(`Reputation Registry: ${explorerUrl}/address/${deployment.reputationRegistry}#code`);
}

main()
  .then(() => {
    console.log("\n[SUCCESS] Verification completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n[ERROR] Verification failed:");
    console.error(error);
    process.exit(1);
  });
