import React from 'react';

interface AddTokenButtonProps {
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenImage: string;
  walletProvider: any;
}

const AddTokenButton: React.FC<AddTokenButtonProps> = ({ tokenAddress, tokenSymbol, tokenDecimals, tokenImage, walletProvider }) => {
  const addTokenToWallet = async () => {
    try {
      const ethereum = walletProvider;

      if (ethereum && ethereum.isMetaMask) {
        const wasAdded = await ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: tokenAddress,
              symbol: tokenSymbol,
              decimals: tokenDecimals,
              image: tokenImage,
            },
          },
        });

        if (wasAdded) {
          console.log('Token added!');
        } else {
          console.log('Token not added');
        }
      } else {
        console.error('MetaMask is not installed');
      }
    } catch (error) {
      console.error('Error adding token:', error);
    }
  };

  return (
    <button
      onClick={addTokenToWallet}
      className="px-4 py-2 text-xs bg-green-300 text-black rounded-md hover:bg-blue-700"
    >
      Add Token to MetaMask
    </button>
  );
};

export default AddTokenButton;
