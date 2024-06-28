const hre = require('hardhat');
const ethers = hre.ethers;

async function main() {
  const feeReceiver = "0x0287b980Ffb856cfF0cB61B926219ccf977B6fB4"; // Replace with your address
  const feeAmount = ethers.utils.parseUnits("0.1", 18);
  const contractOwner = "0xf759c09456A4170DCb5603171D726C3ceBaDd3D5"; // Replace with your contract owner address
  const gasPrice = ethers.utils.parseUnits('20', 'gwei'); // Adjust based on current network conditions

  const Manager = await ethers.getContractFactory('Manager'); // Adjust if your contract name is different
  const manager = await Manager.deploy(feeReceiver, feeAmount, contractOwner, {
    gasLimit: 5000000, // Adjust based on your needs
    gasPrice: gasPrice,
  });

  await manager.deployed();

  console.log('Manager contract deployed at:', manager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error deploying Manager contract:', error);
    process.exit(1);
  });