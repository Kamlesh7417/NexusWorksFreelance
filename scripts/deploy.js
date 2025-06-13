const hre = require("hardhat");

async function main() {
  console.log("Deploying NexusWorks smart contracts...");

  // Deploy WORK Token
  const WorkToken = await hre.ethers.getContractFactory("WorkToken");
  const workToken = await WorkToken.deploy();
  await workToken.deployed();
  console.log("WORK Token deployed to:", workToken.address);

  // Deploy Project Escrow
  const ProjectEscrow = await hre.ethers.getContractFactory("ProjectEscrow");
  const projectEscrow = await ProjectEscrow.deploy(
    workToken.address,
    "0x1234567890123456789012345678901234567890" // Fee recipient address
  );
  await projectEscrow.deployed();
  console.log("Project Escrow deployed to:", projectEscrow.address);

  // Deploy Reputation System
  const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy(projectEscrow.address);
  await reputationSystem.deployed();
  console.log("Reputation System deployed to:", reputationSystem.address);

  // Update environment variables
  console.log("\nAdd these to your .env.local file:");
  console.log(`NEXT_PUBLIC_WORK_TOKEN_ADDRESS=${workToken.address}`);
  console.log(`NEXT_PUBLIC_PROJECT_ESCROW_ADDRESS=${projectEscrow.address}`);
  console.log(`NEXT_PUBLIC_REPUTATION_ADDRESS=${reputationSystem.address}`);

  // Verify contracts on Etherscan (if on mainnet/testnet)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nVerifying contracts on Etherscan...");
    
    try {
      await hre.run("verify:verify", {
        address: workToken.address,
        constructorArguments: []
      });
      console.log("WORK Token verified");
    } catch (error) {
      console.log("WORK Token verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: projectEscrow.address,
        constructorArguments: [
          workToken.address,
          "0x1234567890123456789012345678901234567890"
        ]
      });
      console.log("Project Escrow verified");
    } catch (error) {
      console.log("Project Escrow verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: reputationSystem.address,
        constructorArguments: [projectEscrow.address]
      });
      console.log("Reputation System verified");
    } catch (error) {
      console.log("Reputation System verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });