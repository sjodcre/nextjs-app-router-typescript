// import BigNumber from "bignumber.js";

import { BigNumber, ethers } from "ethers";
import Decimal from 'decimal.js';
import ERC20TestArtifact from '@/../artifacts/contracts/ERC20Lock.sol/ERC20Lock.json'



// import BigNumber from 'bignumber.js';
// BigNumber.config({ EXPONENTIAL_AT: 1e+9 });  // Adjust as necessary for your precision needs
const MAX_RESERVE_RATIO = 1000000;  // Constant from your contract


export const extractFirstSixCharac = (input: string): string => {
    // Check if the input starts with '0x' and has at least 8 characters
    if (input.startsWith('0x') && input.length >= 8) {
        return input.substring(2, 8);  // Skip '0x' and take the next six characters
    }
    return '';  // Return an empty string if conditions are not met
};

export function calculateExpectedReturn(_supply: number, _reserveBalance: number, _reserveRatio: number, _depositAmount: number) {
    const MAX_RESERVE_RATIO = 1000000;  // Adjust based on your contract

    // Compute (1 + _depositAmount / _reserveBalance)
    const ratio = 1 + _depositAmount / _reserveBalance;

    // Compute (_reserveRatio / MAX_RESERVE_RATIO)
    const exp = _reserveRatio / MAX_RESERVE_RATIO;

    // Compute ratio ^ exp - 1
    const factor = Math.pow(ratio, exp) - 1;

    // Return _supply * factor
    return _supply * factor;
}

// export function calculateExpectedReturn(
//   _supply: BigNumber,
//   _reserveBalance: BigNumber,
//   _reserveRatio: number,
//   _depositAmount: BigNumber
// ): BigNumber {
//   const ONE_ETHER = BigNumber.from("1000000000000000000");

//   // Compute (1 + _depositAmount / _reserveBalance) with precision
//   const ratio = _depositAmount.mul(ONE_ETHER).div(_reserveBalance).add(ONE_ETHER);
//   console.log("ratio", ratio.toString())

//   // Compute (_reserveRatio / MAX_RESERVE_RATIO)
//   const exp = MAX_RESERVE_RATIO / _reserveRatio;
//   console.log("exp", exp)

//   // Compute ratio ^ exp - 1
//   const factor = power(ratio, exp).sub(ONE_ETHER);
//   console.log("factor", factor.toString())

//   // Return _supply * factor / ONE_ETHER to maintain precision
//   const result = _supply.mul(factor).div(ONE_ETHER);
//   console.log("return", result.toString())
//   return result;
// }

// export function calculateRequiredDeposit(_supply: number, _reserveBalance: number, _reserveRatio: number, Return: number) {
//     const MAX_RESERVE_RATIO = 1000000;  // Constant from your contract

//     // Calculate the inner part of the equation first
//     let innerPart = (Return / _supply + 1);
    
//     // Calculate the root
//     let exp = MAX_RESERVE_RATIO / _reserveRatio;
//     let root = Math.pow(innerPart, exp);

//     // Calculate _depositAmount
//     let _depositAmount = (root - 1) * _reserveBalance;

//     return Math.round(_depositAmount);
// }

// export function calculateRequiredDeposit(
//     _supply: BigNumber,
//     _reserveBalance: BigNumber,
//     _reserveRatio: number,
//     returnAmount: BigNumber
//   ): BigNumber {

//     // const innerPart = returnAmount.div(_supply).add(1);
//     // Calculate the inner part of the equation first
//     const scalingFactor = ethers.BigNumber.from(10).pow(18); // For scaling to maintain precision
//     const innerPart = returnAmount.mul(scalingFactor).div(_supply).add(scalingFactor);
    
//     // Calculate the exponent
//     const exp = MAX_RESERVE_RATIO / _reserveRatio;
  
//     // Calculate the root using the power function
//     const root = power(innerPart, exp);
  
//     // Calculate _depositAmount
//     const _depositAmount = root.sub(1).mul(_reserveBalance);
  
//     return _depositAmount;
//   }

export function calculateRequiredDeposit(
    _supply: BigNumber,
    _reserveBalance: BigNumber,
    _reserveRatio: number,
    Return: BigNumber
  ): BigNumber {
    const MAX_RESERVE_RATIO = 1000000;  // Constant from your contract
  
    // Convert inputs to Decimal for high-precision calculations
    const supplyDecimal = new Decimal(_supply.toString());
    const reserveBalanceDecimal = new Decimal(_reserveBalance.toString());
    const returnDecimal = new Decimal(Return.toString());
  
    // Calculate the inner part of the equation
    const innerPart = returnDecimal.div(supplyDecimal).plus(1);
  
    // Calculate the exponent
    const exp = MAX_RESERVE_RATIO / _reserveRatio;
  
    // Perform the exponentiation
    const root = innerPart.pow(exp);
  
    // Calculate _depositAmount
    const depositAmount = root.minus(1).times(reserveBalanceDecimal);
  
    // Convert back to BigNumber
    const _depositAmountBN = BigNumber.from(depositAmount.toFixed(0));
  
    return _depositAmountBN;
  }

function power(base: BigNumber, exp: number): BigNumber {
    let result = BigNumber.from(1);
    while (exp > 0) {
      if (exp % 2 == 1) {
        result = result.mul(base);
      }
      base = base.mul(base);
      exp = Math.floor(exp / 2);
    }
    return result;
  }

//fix imbalance from using bignumber to do calculation
// function power(base: BigNumber, exponent: number): BigNumber {
//   let result = BigNumber.from("1000000000000000000"); // Start with 1 in scaled form (1e18)
//   let currentExp = exponent;
//   let currentBase = base;

//   while (currentExp > 0) {
//     if (currentExp % 2 === 1) {
//       result = result.mul(currentBase).div(BigNumber.from("1000000000000000000"));
//     }
//     currentBase = currentBase.mul(currentBase).div(BigNumber.from("1000000000000000000"));
//     currentExp = Math.floor(currentExp / 2);
//   }

//   return result;
// }

export function calculateMinTokensWithSlippage(_supply: number, _reserveBalance: number, _reserveRatio: number , _depositAmount: number , slippagePercent: number): {estToken:number,estTokenWSlippage:number} {
    const tokensWithoutSlippage = calculateExpectedReturn(_supply, _reserveBalance, _reserveRatio, _depositAmount);
    const slippageMultiplier = (100 - slippagePercent) / 100;

    return {estToken: Math.round(tokensWithoutSlippage), estTokenWSlippage: Math.round(tokensWithoutSlippage * slippageMultiplier)}
}

// export function calculateMinTokensWithSlippage(
//     _supply: string,
//     _reserveBalance: BigNumber,
//     _reserveRatio: number,
//     _depositAmount: BigNumber,
//     slippagePercent: number
//   ): { estToken: BigNumber, estTokenWSlippage: BigNumber } {
//     const supply = BigNumber.from(_supply);
//     const tokensWithoutSlippage = calculateExpectedReturn(supply, _reserveBalance, _reserveRatio, _depositAmount);
//     const slippageMultiplier = BigNumber.from(100 - slippagePercent).mul(BigNumber.from('1000000000000000000')).div(100);
  
//     const estTokenWSlippage = tokensWithoutSlippage.mul(slippageMultiplier).div(BigNumber.from('1000000000000000000'));
//     return { estToken: tokensWithoutSlippage, estTokenWSlippage };
//   }

export function calculateBurnReturn(_supply: number, _reserveBalance: number, _reserveRatio: number, _sellAmount: number): number {
    // Compute (1 - _sellAmount / _supply)
    const MAX_RESERVE_RATIO = 1000000;  // Adjust based on your contract
    const ratio = 1 - (_sellAmount / _supply);

    // Compute (1 / (_reserveRatio / MAX_RESERVE_RATIO))
    const exp = 1 / (_reserveRatio / MAX_RESERVE_RATIO);

    // Compute ratio ^ exp
    const factor = Math.pow(ratio, exp);

    // Calculate return
    const burnReturn = _reserveBalance * (1 - factor);

    return burnReturn;
}

// export function calculateBurnReturn(
//     _supply: BigNumber,
//     _reserveBalance: BigNumber,
//     _reserveRatio: number,
//     _sellAmount: BigNumber
//   ): BigNumber {
//     const MAX_RESERVE_RATIO = 1000000; // Adjust based on your contract
  
//     // Compute (1 - _sellAmount / _supply)
//     const one = BigNumber.from(1);
//     const ratio = one.sub(_sellAmount.div(_supply)); // 1 - (_sellAmount / _supply)
  
//     // Compute (1 / (_reserveRatio / MAX_RESERVE_RATIO))
//     const exp = MAX_RESERVE_RATIO / _reserveRatio;
  
//     // Compute ratio ^ exp
//     const factor = power(ratio, exp);
  
//     // Calculate return
//     const burnReturn = _reserveBalance.mul(one.sub(factor));
  
//     return burnReturn;
//   }

export function calculateMinReturnWithSlippage(_supply: number, _reserveBalance: number, _reserveRatio: number, _sellAmount: number, slippagePercent: number): {estAmount:number,estAmountWSlippage:number} {
    const burnReturnWithoutSlippage = calculateBurnReturn(_supply, _reserveBalance, _reserveRatio, _sellAmount);
    const slippageMultiplier = (100 - slippagePercent) / 100;

    // Calculate the minimum return based on the slippage percentage
    return {estAmount: Math.round(burnReturnWithoutSlippage), estAmountWSlippage:  Math.round(burnReturnWithoutSlippage * slippageMultiplier)}

    // return Math.round(burnReturnWithoutSlippage * slippageMultiplier);
}

// export function calculateMinReturnWithSlippage(
//     _supply: BigNumber,
//     _reserveBalance: BigNumber,
//     _reserveRatio: number,
//     _sellAmount: BigNumber,
//     slippagePercent: number
//   ): { estAmount: BigNumber, estAmountWSlippage: BigNumber } {
//     const burnReturnWithoutSlippage = calculateBurnReturn(_supply, _reserveBalance, _reserveRatio, _sellAmount);
//     const slippageMultiplier = BigNumber.from(100 - slippagePercent).div(100);
  
//     // Calculate the minimum return based on the slippage percentage
//     const estAmountWSlippage = burnReturnWithoutSlippage.mul(slippageMultiplier);
//     return { estAmount: burnReturnWithoutSlippage, estAmountWSlippage };
//   }

export function getAccountUrl(chainid: string, holderAccount: string) {
    // const networkType = params.tokenInfo[0]; // Assume params.tokenInfo[0] contains the network type

    switch (chainid) {
        case 'ftm':
            return `https://public-sonic.fantom.network/address/${holderAccount}`;
        case 'sei':
            return `https://seitrace.com/address/${holderAccount}`;
        default:
            return ''; // No link in case of other networks
    }
}

export function parseFullSymbol(fullSymbol: string) {
    const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
    if (!match) {
        return null;
    }
    return { exchange: match[1], fromSymbol: match[2], toSymbol: match[3] };
}

export function generateSymbol(exchange: any, fromSymbol: any, toSymbol: any) {
    const short = `${fromSymbol}/${toSymbol}`;
    return {
        short,
        full: `${exchange}:${short}`,
    };
}


export const formatTokenAmount = (tokenAmount: number): string => {
    const amount = parseFloat((tokenAmount / 1E18).toString()) * 1e18; // Adjusting for token decimals

    if (amount < 1e6) {
        return `${(amount / 1e3).toFixed(1)}k`;
    } else if (amount >= 1e6 && amount < 1e9) {
        return `${(amount / 1e6).toFixed(2)}m`;
    } else {
        return `${(amount / 1e9).toFixed(2)}b`;
    }
};

export const formatMarketCap = (num: number) => {
    return num.toLocaleString('en-US', {
      style: 'decimal',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });
  };

// export  function calculatePrice(reserveBalance: BigNumber, tokenSupply: BigNumber, reserveRatio: number): number {
//     const price = reserveBalance.mul(BigNumber.from(1e18)).div(tokenSupply).mul(reserveRatio);
//     return parseFloat(ethers.utils.formatUnits(price, 36)); // Adjust for the correct number of decimals
//   }

export function calculatePrice(reserveBalance: BigNumber, tokenSupply: BigNumber, reserveRatio: BigNumber): number {

    const MAX_RESERVE_RATIO = 1000000; // 1,000,000

    const reserveRatioBN = reserveRatio.mul(BigNumber.from(10).pow(18)).div(MAX_RESERVE_RATIO);

    const price = reserveBalance.mul(reserveRatioBN).div(tokenSupply);
    
    return parseFloat(ethers.utils.formatUnits(price, 18)); // Adjust for the correct number of decimals
}

export function extractLogData(receipt, signerAddr) {
    const formattedSignerAddr = '0x' + signerAddr.toLowerCase().substring(2).padStart(64, '0');
    console.log("Formatted Signer Address: ", formattedSignerAddr);

    // Filter logs that match the criteria
    const matchingLogs = receipt.logs.filter(log => 
        log.topics.length === 3 &&
        log.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000' &&
        log.topics[2] === formattedSignerAddr
    );

    // Further filter out logs where the data is "0x"
    const validLog = matchingLogs.find(log => log.data !== "0x");

    if (validLog) {
        console.log("Found valid log: ", validLog);
        const logData = validLog.data;
        const bigNumberValue = ethers.BigNumber.from(logData.toString());
        const decimalValue = bigNumberValue.toString();
        return decimalValue;
    } else {
        console.log("No matching valid log found.");
        return null;
    }
}