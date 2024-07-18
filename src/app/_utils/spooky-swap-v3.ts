// import { ethers } from 'ethers';
// import AugustusABI from '@/../contracts/ParaSwapABI.json'; // Add the ABI for the Augustus contract
// import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json';

// const AUGUSTUS_ADDRESS = '0x6A000F20005980200259B80c5102003040001068'; // Update to the actual Augustus contract address
// const WFTM_ADDRESS = '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83'; // Wrapped FTM address on Fantom

// const buyTokensWithFTMV3 = async (
//     chain: string,
//     walletProvider: any,
//     tokenAddress: string,
//     amountInFTM: { toString: () => string },
//     slippage: number
//   ) => {
//     if (!walletProvider) {
//       throw new Error('Please install a browser provider');
//     }
  
//     const provider = new ethers.providers.Web3Provider(walletProvider);
//     const signer = await provider.getSigner();
//     const augustus = new ethers.Contract(AUGUSTUS_ADDRESS, AugustusABI, signer);
//     const amountIn = ethers.utils.parseUnits(amountInFTM.toString(), 18);
//     const signerAddr = await signer.getAddress();
  
//     // Prepare the data for the swap using ParaSwap API or manual calculations
//     const swapData = {
//       fromToken: WFTM_ADDRESS,
//       toToken: tokenAddress,
//       amountIn: amountIn.toString(),
//       userAddress: signerAddr,
//       slippage: slippage.toString(),
//     };
  
//     const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current time
  
//     try {
//       const tx = await augustus.swap(
//         swapData.fromToken,
//         swapData.toToken,
//         swapData.amountIn,
//         swapData.userAddress,
//         deadline,
//         {
//           value: amountIn,
//           gasLimit: ethers.utils.hexlify(1000000),
//         }
//       );
  
//       const txHash = tx.hash;
//       console.log('txHash', txHash);
  
//       const result = await tx.wait();
//       return { result, txHash };
//     } catch (error) {
//       console.error('Swap failed:', error);
//       throw error;
//     }
//   };
  
//   const sellTokensForFTMV3 = async (
//     walletProvider: any,
//     tokenAddress: string,
//     amountInTokens: { toString: () => string },
//     slippage: number
//   ) => {
//     if (!walletProvider) {
//       throw new Error('Please install a browser provider');
//     }
  
//     const provider = new ethers.providers.Web3Provider(walletProvider);
//     const signer = await provider.getSigner();
//     const augustus = new ethers.Contract(AUGUSTUS_ADDRESS, AugustusABI, signer);
//     const amountIn = ethers.utils.parseUnits(amountInTokens.toString(), 18);
//     const signerAddr = await signer.getAddress();
  
//     // Prepare the data for the swap using ParaSwap API or manual calculations
//     const swapData = {
//       fromToken: tokenAddress,
//       toToken: WFTM_ADDRESS,
//       amountIn: amountIn.toString(),
//       userAddress: signerAddr,
//       slippage: slippage.toString(),
//     };
  
//     const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current time
  
//     // Approve the Augustus contract to spend your tokens
//     const tokenABI = ERC20TestArtifact.abi;
//     const token = new ethers.Contract(tokenAddress, tokenABI, signer);
//     await token.approve(AUGUSTUS_ADDRESS, amountIn);
  
//     try {
//       const tx = await augustus.swap(
//         swapData.fromToken,
//         swapData.toToken,
//         swapData.amountIn,
//         swapData.userAddress,
//         deadline,
//         {
//           gasLimit: ethers.utils.hexlify(1000000),
//         }
//       );
  
//       const txHash = tx.hash;
//       console.log('txHash', txHash);
  
//       const result = await tx.wait();
//       return { result, txHash };
//     } catch (error) {
//       console.error('Swap failed:', error);
//       throw error;
//     }
//   };
  

//   export { buyTokensWithFTMV3, sellTokensForFTMV3};