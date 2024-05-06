// // Define types for the symbol generation function
// interface SymbolInfo {
//     short: string;
//     full: string;
// }

// // Define type for the parsed symbol information
// interface ParsedSymbol {
//     exchange: string;
//     fromSymbol: string;
//     toSymbol: string;
// }

// // Makes requests to the CryptoCompare API
// export async function makeApiRequest(path: string): Promise<any> {
//     try {
//         const response = await fetch(`https://min-api.cryptocompare.com/${path}`);
//         return response.json();
//     } catch (error) {
//         // Ensuring that 'error' has a 'status' field. Assuming it does not, use a default error message
//         const status = (error as any).status ? (error as any).status : "unknown";
//         throw new Error(`CryptoCompare request error: ${status}`);
//     }
// }

// // Generates a symbol ID from a pair of the coins
// export function generateSymbol(exchange: string, fromSymbol: string, toSymbol: string): SymbolInfo {
//     const short = `${fromSymbol}/${toSymbol}`;
//     return {
//         short,
//         full: `${exchange}:${short}`,
//     };
// }

// // Returns all parts of the symbol
// export function parseFullSymbol(fullSymbol: string): ParsedSymbol | null {
//     const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
//     if (!match) {
//         return null;
//     }
//     return { exchange: match[1], fromSymbol: match[2], toSymbol: match[3] };
// }

export const extractFirstSixCharac = (input: string): string => {
    // Check if the input starts with '0x' and has at least 8 characters
    if (input.startsWith('0x') && input.length >= 8) {
        return input.substring(2, 8);  // Skip '0x' and take the next six characters
    }
    return '';  // Return an empty string if conditions are not met
};