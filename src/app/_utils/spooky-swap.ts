import { ethers } from 'ethers';
import SpookySwapRouterABI from '@/../contracts/SpookySwapRouterABI.json'; // Add the ABI for the SpookySwap Router contract
import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json'
import PairABI from '@/../contracts/SpookySwapPairABI.json';
const SPOOKYSWAP_ROUTER_ADDRESS = '0xF491e7B69E4244ad4002BC14e878a34207E38c29'; // SpookySwap router contract address
const WFTM_ADDRESS = '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83'; // Wrapped FTM address on Fantom



const buyTokensWithFTM = async (
  chain: string,
  walletProvider: any,
  tokenAddress: string,
  amountInFTM: { toString: () => string },
  slippage: number
) => {
  if (!walletProvider) {
    throw new Error('Please install a browser provider');
  }

  const provider = new ethers.providers.Web3Provider(walletProvider);
  const signer = await provider.getSigner();
  const router = new ethers.Contract(SPOOKYSWAP_ROUTER_ADDRESS, SpookySwapRouterABI, signer);
  const amountIn = ethers.utils.parseUnits(amountInFTM.toString(), 18);
  const signerAddr = await signer.getAddress();
  // const amountOutMin = ethers.utils.parseUnits('0', 18); // Adjust based on slippage calculation
  const amounts = await router.getAmountsOut(amountIn, [WFTM_ADDRESS, tokenAddress]);
  const amountOutWithoutSlippage = amounts[1];
  console.log("amount estimate from the router ", Number(amounts[1]))

  // Calculate the minimum amount of tokens to receive based on slippage
  const amountOutMin = amountOutWithoutSlippage.mul(100 - slippage).div(100);
  // console.log("amountmin with slippage", Number(amountOutMin))

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current time

  try {
    const tx = await router.swapExactETHForTokens(
      amountOutMin.toString(),
      [WFTM_ADDRESS, "0x33fA2D14a34568d6Efc0cB75A437D980177Fb3bD"],
      signerAddr.toString(),
      deadline,
      {
        value: amountIn,
        gasLimit: ethers.utils.hexlify(1000000), // Correct use of hexlify
      }
    );
    const txHash = tx.hash;
    console.log("txHash", txHash);

    const result = await tx.wait();
    return { result, txHash };
  } catch (error) {
    console.error('Swap failed:', error);
    throw error;
  }
};

const sellTokensForFTM = async (
    walletProvider: any,
    tokenAddress: string,
    amountInTokens: { toString: () => string; },
    slippage: number
  ) => {
    if (!walletProvider) {
      throw new Error('Please install a browser provider');
    }
  
    const provider = new ethers.providers.Web3Provider(walletProvider);
    const signer = await provider.getSigner();
    const router = new ethers.Contract(SPOOKYSWAP_ROUTER_ADDRESS, SpookySwapRouterABI, signer);
    const amountIn = ethers.utils.parseUnits(amountInTokens.toString(), 0);
    const signerAddr = await signer.getAddress();
    const gasPrice = ethers.utils.parseUnits('15', 'gwei');
    const amounts = await router.getAmountsOut(amountIn, [tokenAddress, WFTM_ADDRESS]);
    const amountOutWithoutSlippage = amounts[1];
    console.log("amount estimate from the router ", Number(amounts[1]))
    // const amountOutMin = ethers.utils.parseUnits('0', 18); // Adjust based on slippage calculation
    const amountOutMin = amountOutWithoutSlippage.mul(100 - slippage).div(100);
    console.log("amountmin with slippage", amountOutMin)

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from the current time
  
    // Approve the router to spend your tokens
    const tokenABI = ERC20TestArtifact.abi;
    const token = new ethers.Contract(tokenAddress, tokenABI, signer);
    await token.approve(SPOOKYSWAP_ROUTER_ADDRESS, amountIn);
  
    try {
      const tx = await router.swapExactTokensForETH(
        amountIn.toString(),
        amountOutMin.toString(),
        [tokenAddress, WFTM_ADDRESS],
        signerAddr.toString(),
        deadline,
        {
          gasLimit: ethers.utils.hexlify(1000000), // Correct use of hexlify
        }
      );
  
      const result = await tx.wait();
      return { result, txHash: tx.hash };
    } catch (error) {
      console.error('Swap failed:', error);
      throw error;

    }
  };

async function getReserves(pairAddress: string) {
  const walletProvider = new ethers.providers.JsonRpcProvider('https://fantom-rpc.publicnode.com/');

  // const provider = new ethers.providers.Web3Provider(walletProvider);
  const pairContract = new ethers.Contract(pairAddress, PairABI, walletProvider);
  const reserves = await pairContract.getReserves();
  return {
    reserve0: Number(ethers.utils.formatUnits(reserves[0], 18)),
    reserve1: Number(ethers.utils.formatUnits(reserves[1], 18))
  };
}

function calculateTokenPrice(reserves: { reserve0: number, reserve1: number }, wftmPrice: number) {
  const priceTokenInWFTM = reserves.reserve0 / reserves.reserve1;
  const priceTokenInUSD = priceTokenInWFTM * wftmPrice;
  return priceTokenInUSD;
}

// Type guard to check if error is of type 'any' with message property
function isErrorWithSimpleMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Type guard to check if error is of type 'any' with data and message properties
function isErrorWithMessage(error: unknown): error is { data: { message: string } } {
  return typeof error === 'object' && error !== null && 'data' in error && 'message' in (error as any).data;
}




export { buyTokensWithFTM, sellTokensForFTM, getReserves, calculateTokenPrice};
