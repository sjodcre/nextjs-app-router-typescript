import { ChartingLibraryWidgetOptions } from "public/static/charting_library/charting_library";

export interface TokenParams {
  reserveRatio: number;
  name: string;
  ticker: string;
}

export interface ExtendedWidgetOptions extends ChartingLibraryWidgetOptions {
  chainId: string; // Adding chainId to the properties
}

export interface TokenHolder {
  account: string;
  balance: number;
}

export interface SmartContractError {
  message?: string;
  reason?: string;
  code?: string;
  stack?: string;
}


export type TokenPageDetails = {
  token_address: string;
  token_ticker: string;
  token_name: string;
  token_description: string;
  image_url: string; 
  creator: string;
  twitter:string;
  telegram: string;
  website: string;
  datetime: number; // Total supply might be large, consider handling big numbers appropriately
};

export type TokenListData = {
  token_address: string;
  token_ticker: string;
  token_name: string;
  token_description: string;
  image_url: string;
  creator: string;
  datetime: number;
  tx_hash: string;
}

export interface TradeData {
  txid: number;
  token_address: string;
  account: string;
  token_amount: number;
  native_amount: number;
  // price_per_token: number;
  timestamp: number;
  trade: 'buy' | 'sell';
  // sum: number;
  tx_hash: string
}

export interface Reply {
 
  id : string
  token_address :string
  file_uri :string
  text :string
  creator :string
  username :string
  created_at :string
}