"use client";
// import { useWeb3React } from '@web3-react/core';
import { useState, MouseEvent, useEffect } from 'react';
import { Contract, ContractFactory, Signer, ethers } from 'ethers';

import { useWeb3ModalProvider, useWeb3ModalAccount, useSwitchNetwork } from '@web3modal/ethers5/react'
import { toast } from 'react-toastify'
// import ConnectButton from "../_ui/connect-button";
import { TokenParams } from '@/app/_utils/types';
import {  deployToken, deployManager } from '../_services/blockchain';
import { initOHLCData, postTokenData, postTransactionAndOHLC, postTransactionData } from '../_services/db-write';
import { setChain, resetChain } from "@/app/_redux/features/chain-slice";
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '@/app/_redux/store';
import { calculateExpectedReturn, calculateMinTokensWithSlippage } from '../_utils/helpers';



export default function Deploy() {
	interface FormData {
		[key: string]: string | File | undefined | number;
		name: string;
		ticker: string;
		description: string;
		twitter?: string;
		telegram?: string;
		website?: string;
		image?: File ;
		mintAmount: number;
	}

	interface FormErrors {
		[key: string]: string; // Allows indexing with a string
	}
	const initialFormData = {
		name: '',
		ticker: '',
		description: '',
		twitter: '',
		telegram: '',
		website: '',
		mintAmount:0,
	};

	const [formData, setFormData] = useState<FormData>(initialFormData);

	

	const [errors, setErrors] = useState<FormErrors>({
		name: '',
		ticker: '',
		description: '',
		twitter: '',
		telegram: '',
		website: ''
	});

	// const [signer, setSigner] = useState<Signer>();
	const router = useRouter()
	const { address, chainId, isConnected } = useWeb3ModalAccount()
  	const { walletProvider } = useWeb3ModalProvider()
	const { switchNetwork} = useSwitchNetwork()
	const [showOptions, setShowOptions] = useState(false);
	const [file,setFile] = useState<File>();
	const [selectedChain, setSelectedChain] = useState<string>('sei');  // Default sort by market cap
	const dispatch = useDispatch<AppDispatch>();
    const chainType = useAppSelector((state) => state.chainReducer.value.chainType);
	const [isDeploying, setIsDeploying] = useState(false);
	const toggleOptions = () => setShowOptions(!showOptions);
	
	useEffect(() => {
        dispatch(setChain(selectedChain));

    }, [dispatch, selectedChain]);

	// const handleChange = (e: { target: { name: any; value: any; }; }) => {
	// 	const { name, value } = e.target;
	// 	const error = validateField(name, value);
	// 	setFormData({
	// 		...formData,
	// 		[name]: value
	// 	});
	// 	setErrors({
	// 		...errors,
	// 		[name]: error
	// 	});
	// };
	const handleChange = (e: { target: { name: any; value: any; type: string }; }) => {
		const { name, value, type } = e.target;
		let newValue: string | number = value;
	
		if (type === 'number') {
			newValue = value === '' ? '' : Number(value); // Handle empty input
		}
	
		const error = validateField(name, newValue);
		setFormData({
			...formData,
			[name]: newValue
		});
		setErrors({
			...errors,
			[name]: error
		});
	};
	

	const validateField = (fieldName: string, value: string | number) => {
		let error = '';

		if (fieldName === 'name' && typeof value === 'string' && value.trim().length > 9) {
			error = 'Name should be less than 10 characters';
		}
		
		if (fieldName === 'name' && typeof value === 'string' && value === "" ) {
			error = 'Name should not be empty';
		}

		if (fieldName === 'ticker' && typeof value === 'string' && value.trim().length > 9) {
			error = 'Ticker should be less than 10 characters';
		}
		if (fieldName === 'ticker' && typeof value === 'string' && value === "") {
			error = 'Ticker should not be empty';
		}

		if (fieldName === 'mintAmount') {
			if (typeof value !== 'number') {
				error = 'Mint amount should be a number';
			} else if (value < 0) {
				error = 'Mint amount should be greater than or equal to 0';
			}
		}

		return error;
	};

	const handleUploadImage = async (imageFile?: File): Promise<string> => {
		if (!imageFile) {
			toast.error('No image file provided');
        return Promise.reject(new Error('No image file provided'));
		}

			try{
				const data = new FormData()
				data.set('file',imageFile)
				const response = await fetch ("http://localhost:3000/api/deploy", {
					method: 'POST',
					body: data
				})
				const result = await response.json();
				if (response.ok) {
					toast.success(`Contract deployed and image uploaded. Arweave URL: ${result}`);
					return result;
				} else {
				  throw new Error(result.error || 'Upload failed');
				}

			} catch (error: any) {
				// console.error('Image upload error:', error);
    			toast.error(`Error: ${error.message}`);
				return Promise.reject(new Error(error.message || 'Upload failed'));

			}		
		
	}

	const handleSeiChainButton = () => {
		console.log(chainType)

        if (selectedChain === "ftm") {
            setSelectedChain("sei");
			setFormData(initialFormData);
            dispatch(setChain(selectedChain));
        } 
    };
	const handleFtmChainButton = () => {
		console.log(chainType)

        if (selectedChain === "sei") {
            setSelectedChain("ftm");
			setFormData(initialFormData);
            dispatch(setChain(selectedChain));
        }
    };

	async function handleChainChange() {
		return new Promise((resolve, reject) => {
			// Assuming chain IDs for 'sei' and 'ftm' as constants for clarity
			const SEI_CHAIN_ID = 713715;
			// const FTM_CHAIN_ID = 64165;
			const FTM_CHAIN_ID = 250;
			let targetChainId = 250;
	
			if (selectedChain === "sei" && chainId !== SEI_CHAIN_ID) {
				targetChainId = SEI_CHAIN_ID;
			} else if (selectedChain === "ftm" && chainId !== FTM_CHAIN_ID) {
				targetChainId = FTM_CHAIN_ID;
			}
	
			console.log("targetchainId: ",  targetChainId)
			if (targetChainId !== null) {
				switchNetwork(targetChainId)
					.then(() => {
						// resolve(`Switched to ${targetChainId} successfully.`);
						resolve(targetChainId);
					})
					.catch((error) => {
						reject(`Failed to switch to ${targetChainId}: ${error}`);
					});
			} else {
				// Resolve immediately if no switch is needed
				// resolve("No network switch needed.");
				resolve(chainId);
			}
		});
	  }

	async function deployTokenWithUIFeedback(tokenParams: TokenParams, mintAmount: number, walletProvider: any, file: File | undefined): Promise<{ chainid: string; token_address: string }> {
		return handleChainChange()  // This promise's resolution starts the next steps
			.then(async () => {
				// Assuming chain change is successful, proceed with deployment
				const data = await deployToken(selectedChain, tokenParams, mintAmount, walletProvider);
				let url = '';
				try {
					url = await handleUploadImage(file);
					console.log('Uploaded Image URL:', url);
				} catch (error) {
					console.error('Failed to upload image:', error);
					// Consider whether you want to continue or throw an error here
				}
				toast.success(`Contract deployed to: ${data.token_address}`);
	
				const tokenListData = {
					...data,
					chainid: selectedChain,
					image_url: url,
					token_description: formData.description,
					twitter: formData.twitter,
					telegram: formData.telegram,
					website: formData.website,
				};
	
				await postTokenData(tokenListData);
				await initOHLCData(selectedChain, data.token_address, data.creator, data.datetime, data.tx_hash)
				.then(async response => {
					console.log('Backend response:', response);
					if (mintAmount > 0) {
						const depositAmount = Number(ethers.utils.parseUnits(mintAmount.toString(), 18));
	
						const tokensWithoutSlippage = calculateExpectedReturn(10**16, 10**17, 50000, depositAmount);
						console.log("tokensWithoutSlippage", tokensWithoutSlippage)
						const info = {
							selectedChain: selectedChain,
							contractAddress: data.token_address,
							account: data.creator,
							status: "successful",
							amount: tokensWithoutSlippage, // Ensure conversion to string before to Number if BigNumber
							deposit: depositAmount, // Same conversion as above
							timestamp: Math.floor(Date.now() / 1000),
							trade: 'buy',
							txHash: data.tx_hash
						  };
	
						await postTransactionAndOHLC(info, true).then(response => {
						console.log('Backend response:', response);
						// txid = response.primaryKey;
						}).catch((error: any) => {
						console.error('Error posting data to backend tx ohlc:', error);
						});
					}
				}).catch((error: any) => {
					console.error('Error posting data to backend init:', error);
					});
				;
				// return tokenListData;  // Successful deployment, resolve with this data
				// console.log("mintAMount", mintAmount)
				
				return {
					chainid: selectedChain,
					token_address: data.token_address
				};
			})
			.catch((error) => {
				console.error(`Error in deployment process: ${error}`);
				throw error;  // Ensure this error propagates to reject the promise
			});
	}

	const handleDeployManager = async () => {
		try {
			handleChainChange()  // This promise's resolution starts the next steps
			.then(async () => {
				// Assuming chain change is successful, proceed with deployment
				const data = await deployManager(walletProvider);
			}).catch((error) =>{
				toast.error(`Deploy manager contract failed: ` + error);
			})

		} catch (error) {
			console.log(error);
			toast.error(`Deploy manager contract failed: ` + error);
		}
	}

	const handleDeploy = async () => {
		// Prevent deploying the Greeter contract multiple times or if signer is not defined
		// if (greeterContract || !signer) {
		//   return;
		// }
		// const depositAmount = Number(ethers.utils.parseUnits(formData.mintAmount.toString(), 18));

		// const tokensWithoutSlippage = calculateExpectedReturn(10**16, 10**17, 50000, depositAmount);
		// console.log("tokensWithoutSlippage", tokensWithoutSlippage)

		if (isDeploying) return;  // Prevent further clicks when deployment is in progress

		setIsDeploying(true);
		let hasError = false;
  		let newErrors: FormErrors  = {};
		// Collect error messages
		let errorMessages: string[] = [];

		Object.keys(formData).forEach(fieldName => {
			if (fieldName !== 'image') { // Skip the image field
				const value = formData[fieldName];
				if (typeof value === 'string' || typeof value === 'number') { // Ensure value is a string before validating
					const error = validateField(fieldName, value);
					newErrors[fieldName] = error;
			
					if (error) {
						hasError = true;
						errorMessages.push(error);
					}
				}
			}
		});
		setErrors(newErrors);

		if (hasError) {
			// const formattedMessages  = errorMessages.map((msg, index) => `${index + 1}. ${msg}`).join("\n");

			// Prevent form submission if there are errors
			toast.error(
				<>
					{errorMessages.map((message, index) => (
					<div key={index}>{`${index + 1}. ${message}`}</div>
					))}
			 	</>, {
			position: "top-center",
			});
			setIsDeploying(false);  // Reset the deployment flag

			return;
		}

		if (file && file.size > 5 * 1024 * 1024) {  // Check if file size exceeds 7MB
			toast.error('File size exceeds 5MB limit');
			setIsDeploying(false);
			return;
		}
		
		try {
			if (!isConnected) throw Error('User is not connected')

			if (walletProvider) {
				const tokenParams: TokenParams = {
					reserveRatio: 50000,
					name: formData.name,
					ticker: formData.ticker,
				  };
				let url = '';
				toast.promise(
					deployTokenWithUIFeedback(tokenParams, formData.mintAmount, walletProvider, file),
					{
						pending: 'Deploying token...',
						success: 'Token deployment successful! 👌',
						error: 'Deployment failed! 🤯'
					}
				).then(tokenListData => {
					router.push('/token/' + tokenListData.chainid + '/' + tokenListData.token_address);
					setIsDeploying(false);  // Reset the deployment flag after success
				}).catch(error => {
					console.error("Failed to deploy token:", error);
					setIsDeploying(false); 

				});
				
			} else {
				// Handle the case where walletProvider is undefined
				console.error("Wallet provider is not available.");
				setIsDeploying(false);

			}

		} catch (error: any) {

			console.log(error);
			toast.error(`Deployment failed: ` + error);
			setIsDeploying(false); 

		}	
	};
	
	
  

	return (
<div className="bg-black shadow-md px-8 py-8 rounded sm:w-full md:w-1/2 mx-auto border-4 border-green-500">
    <div className="inline-flex shadow-md rounded-full overflow-hidden h-8 leading-5 mb-4">
        <button
            className={`transition duration-300 ease-in-out font-bold py-2 px-4
                        ${selectedChain === "sei" ? 'bg-gradient-to-r from-green-400 to-blue-500 text-black shadow-lg' : 'bg-gray-700 text-green-400 hover:bg-gray-600'}
                        focus:outline-none focus:ring-2 focus:ring-green-500`}
            onClick={handleSeiChainButton}
            disabled={selectedChain === "sei"}>
            SEI
        </button>
        <button
            className={`transition duration-300 ease-in-out font-bold py-2 px-4
                        ${selectedChain === "ftm" ? 'bg-gradient-to-r from-green-400 to-blue-500 text-black shadow-lg' : 'bg-gray-700 text-green-400 hover:bg-gray-600'}
                        focus:outline-none focus:ring-2 focus:ring-green-500`}
            onClick={handleFtmChainButton}
            disabled={selectedChain === "ftm"}>
            FTM
        </button>
    </div>

    {/* Form */}
    <div className="mb-4">
        <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="name">
            Name
        </label>
        <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-green-400 bg-black leading-tight focus:outline-none focus:shadow-outline ${errors.name ? 'border-green-500' : ''
                }`}
            id="name"
            type="text"
            placeholder="Token name"
            name="name"
            value={formData.name}
            onChange={handleChange}
        />
        {errors.name && <p className="text-red-500 text-xs italic">{errors.name}</p>}
    </div>

    <div className="mb-4">
        <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="ticker">
            Ticker
        </label>
        <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-green-400 bg-black leading-tight focus:outline-none focus:shadow-outline ${errors.ticker ? 'border-green-500' : ''
                }`}
            id="ticker"
            type="text"
            placeholder="Token symbol"
            name="ticker"
            value={formData.ticker}
            onChange={handleChange}
        />
        {errors.ticker && <p className="text-red-500 text-xs italic">{errors.ticker}</p>}
    </div>

    <div className="mb-4">
        <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="description">
            Description
        </label>
        <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-green-400 bg-black leading-tight focus:outline-none focus:shadow-outline ${errors.description ? 'border-green-500' : ''
                }`}
            id="description"
            type="text"
            placeholder="Token description"
            name="description"
            value={formData.description}
            onChange={handleChange}
        />
        {errors.description && <p className="text-red-500 text-xs italic">{errors.description}</p>}
    </div>

    <div className="mb-4">
        <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="image">
            Image
        </label>
        <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-green-400 bg-black leading-tight focus:outline-none focus:shadow-outline"
            id="image"
            type="file"
            name="image"
            onChange={(e) => { setFile(e.target.files?.[0]) }}
        />
        <p className="text-gray-500 text-xs italic">{file ? file.name : 'No file chosen'}</p>
    </div>

    <div className="mb-4">
        <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="mintAmount">
            Creator Initial Mint Amount
        </label>
        <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-green-400 bg-black leading-tight focus:outline-none focus:shadow-outline ${errors.mintAmount ? 'border-green-500' : ''
                }`}
            id="mintAmount"
            type="number"
            placeholder="0 optional"
            name="mintAmount"
            value={formData.mintAmount}
            onChange={handleChange}
        />
        {errors.mintAmount && <p className="text-red-500 text-xs italic">{errors.mintAmount}</p>}
    </div>

    <button onClick={toggleOptions} className="mb-4 bg-green-500 text-black px-4 py-2 rounded hover:bg-green-600">
        {showOptions ? 'Show less options' : 'Show more options'}
    </button>

    {showOptions && (
        <>
            <div className="mb-4">
                <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="twitter">
                    Twitter Link
                </label>
                <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-green-400 bg-black leading-tight focus:outline-none focus:shadow-outline ${errors.twitter ? 'border-green-500' : ''
                        }`}
                    id="twitter"
                    type="text"
                    placeholder="(optional)"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                />
                {errors.twitter && <p className="text-red-500 text-xs italic">{errors.twitter}</p>}
            </div>
            <div className="mb-4">
                <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="telegram">
                    Telegram Link
                </label>
                <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-green-400 bg-black leading-tight focus:outline-none focus:shadow-outline ${errors.minter ? 'border-green-500' : ''
                        }`}
                    id="telegram"
                    type="text"
                    placeholder="(optional)"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                />
                {errors.telegram && <p className="text-red-500 text-xs italic">{errors.telegram}</p>}
            </div>
            <div className="mb-4">
                <label className="block text-green-500 text-sm font-bold mb-2" htmlFor="website">
                    Website Link
                </label>
                <input
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-green-400 bg-black leading-tight focus:outline-none focus:shadow-outline ${errors.minter ? 'border-green-500' : ''
                        }`}
                    id="website"
                    type="text"
                    placeholder="(optional)"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                />
                {errors.website && <p className="text-red-500 text-xs italic">{errors.website}</p>}
            </div>
        </>
    )}

    {/* Deploy Button */}
    <div className="relative flex h-16 items-center justify-between">
        <div />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            <span className="absolute -inset-1.5" />
            <div className='relative ml-3'>
                <button className='relative flex bg-green-500 text-black px-6 hover:text-white rounded-lg py-2 text-sm font-medium leading-5'
                    type="button" onClick={handleDeploy} disabled={isDeploying}>
                    Deploy
                </button>
            </div>
        </div>
    </div>
</div>

	);
}