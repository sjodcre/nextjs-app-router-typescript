export interface TokenParams {
    reserveRatio: number;
    name: string;
    ticker: string;
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
  }