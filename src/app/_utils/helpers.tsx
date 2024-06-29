// import BigNumber from "bignumber.js";

// import BigNumber from 'bignumber.js';
// BigNumber.config({ EXPONENTIAL_AT: 1e+9 });  // Adjust as necessary for your precision needs


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

export function calculateRequiredDeposit(_supply: number, _reserveBalance: number, _reserveRatio: number, Return: number) {
    const MAX_RESERVE_RATIO = 1000000;  // Constant from your contract

    // Calculate the inner part of the equation first
    let innerPart = (Return / _supply + 1);
    
    // Calculate the root
    let exp = MAX_RESERVE_RATIO / _reserveRatio;
    let root = Math.pow(innerPart, exp);

    // Calculate _depositAmount
    let _depositAmount = (root - 1) * _reserveBalance;

    return Math.round(_depositAmount);
}

export function calculateMinTokensWithSlippage(_supply: number, _reserveBalance: number, _reserveRatio: number , _depositAmount: number , slippagePercent: number): {estToken:number,estTokenWSlippage:number} {
    const tokensWithoutSlippage = calculateExpectedReturn(_supply, _reserveBalance, _reserveRatio, _depositAmount);
    const slippageMultiplier = (100 - slippagePercent) / 100;

    return {estToken: Math.round(tokensWithoutSlippage), estTokenWSlippage: Math.round(tokensWithoutSlippage * slippageMultiplier)}
}

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

export function calculateMinReturnWithSlippage(_supply: number, _reserveBalance: number, _reserveRatio: number, _sellAmount: number, slippagePercent: number): {estAmount:number,estAmountWSlippage:number} {
    const burnReturnWithoutSlippage = calculateBurnReturn(_supply, _reserveBalance, _reserveRatio, _sellAmount);
    const slippageMultiplier = (100 - slippagePercent) / 100;

    // Calculate the minimum return based on the slippage percentage
    return {estAmount: Math.round(burnReturnWithoutSlippage), estAmountWSlippage:  Math.round(burnReturnWithoutSlippage * slippageMultiplier)}

    // return Math.round(burnReturnWithoutSlippage * slippageMultiplier);
}

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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };