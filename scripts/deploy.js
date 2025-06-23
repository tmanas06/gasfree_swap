const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy GasFreeSwap contract
  const GasFreeSwap = await ethers.getContractFactory("GasFreeSwap");

  // Set fee recipient (can be the deployer initially)
  const feeRecipient = deployer.address;

  console.log("Deploying GasFreeSwap contract...");
  const gasFreeSwap = await GasFreeSwap.deploy(feeRecipient);
  await gasFreeSwap.deployed();

  console.log("GasFreeSwap deployed to:", gasFreeSwap.address);
  console.log("Fee recipient set to:", feeRecipient);

  // Verify contract on Etherscan (optional)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await gasFreeSwap.deployTransaction.wait(5);

    try {
      await hre.run("verify:verify", {
        address: gasFreeSwap.address,
        constructorArguments: [feeRecipient],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contracts: {
      GasFreeSwap: {
        address: gasFreeSwap.address,
        deploymentBlock: gasFreeSwap.deployTransaction.blockNumber,
        deployer: deployer.address,
        feeRecipient: feeRecipient,
      },
    },
    timestamp: new Date().toISOString(),
  };

  // Write deployment info to file
  const fs = require("fs");
  const path = require("path");

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment completed successfully!");
  console.log("Contract addresses:");
  console.log("- GasFreeSwap:", gasFreeSwap.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });