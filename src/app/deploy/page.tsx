"use client";
// import { useWeb3React } from '@web3-react/core';
import { useState, MouseEvent, useEffect } from 'react';
import { Contract, BrowserProvider, ContractFactory, Signer, ethers } from 'ethers';
import ERC20TestArtifact from '../../../artifacts/contracts/ERCC20Test.sol/ERC20Test.json'

import { useWeb3ModalProvider, useWeb3ModalAccount, useSwitchNetwork } from '@web3modal/ethers/react'
import { toast } from 'react-toastify'
// import ConnectButton from "../_ui/connect-button";
import { TokenParams } from '@/app/_utils/types';
import { burnToken, deployToken, getBalance, mintToken } from '../_services/blockchain';
import { initOHLCData, postTokenData } from '../_services/db-write';
import { logIn, logOut } from "@/app/_redux/features/chain-slice";
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '@/app/_redux/store';



export default function Deploy() {
	interface FormData {
		[key: string]: string | File | undefined;
		name: string;
		ticker: string;
		description: string;
		twitter?: string;
		telegram?: string;
		website?: string;
		image?: File ;
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
    const chainType = useAppSelector((state) => state.authReducer.value.chainType);

	const toggleOptions = () => setShowOptions(!showOptions);
	
	useEffect(() => {
        dispatch(logIn(selectedChain));

    }, [dispatch, logIn, selectedChain]);


	const handleChange = (e: { target: { name: any; value: any; }; }) => {
		const { name, value } = e.target;
		const error = validateField(name, value);
		setFormData({
			...formData,
			[name]: value
		});
		setErrors({
			...errors,
			[name]: error
		});


	};

	const validateField = (fieldName: string, value: string) => {
		let error = '';

		if (fieldName === 'name' && value.trim().length > 9) {
			error = 'Name should be less than 10 characters';
		}

		if (fieldName === 'ticker' && value.trim().length > 9) {
			error = 'Ticker should be less than 10 characters';
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
            dispatch(logIn(selectedChain));
        } 
    };
	const handleFtmChainButton = () => {
		console.log(chainType)

        if (selectedChain === "sei") {
            setSelectedChain("ftm");
			setFormData(initialFormData);
            dispatch(logIn(selectedChain));
        }
    };

	async function handleChainChange() {
		return new Promise((resolve, reject) => {
			// Assuming chain IDs for 'sei' and 'ftm' as constants for clarity
			const SEI_CHAIN_ID = 713715;
			const FTM_CHAIN_ID = 64165;
	
			let targetChainId = null;
	
			if (selectedChain === "sei" && chainId !== SEI_CHAIN_ID) {
				targetChainId = SEI_CHAIN_ID;
			} else if (selectedChain === "ftm" && chainId !== FTM_CHAIN_ID) {
				targetChainId = FTM_CHAIN_ID;
			}
	
			console.log( targetChainId)
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

	  async function deployTokenWithUIFeedback(tokenParams: TokenParams, walletProvider: any, file: File | undefined) {
		try {
			await handleChainChange();
	
			const data = await deployToken(tokenParams, walletProvider);
			let url = '';
			try {
				url = await handleUploadImage(file);
				console.log('Uploaded Image URL:', url);
			} catch (error) {
				console.error('Failed to upload image:', error);
			}
	
			const tokenListData = {
				...data,
				chainid: selectedChain,
				image_url: url,
				token_description: formData.description,
				twitter: formData.twitter, // Include Twitter data from formData.
				telegram: formData.telegram, // Include Telegram data from formData.
				website: formData.website, // Include Website data from formData.
			};
	
			await postTokenData(tokenListData);
			await initOHLCData(selectedChain, data.token_address, data.creator, data.datetime, data.tx_hash);
			return tokenListData; // Resolve the promise with token list data
		} catch (error) {
			console.error(`Error in deployment: ${error}`);
			throw error; // Rethrow the error to handle it in toast.promise's error section
		}
	}

	const handleDeploy = async () => {
		// Prevent deploying the Greeter contract multiple times or if signer is not defined
		// if (greeterContract || !signer) {
		//   return;
		// }
		let hasError = false;
  		let newErrors: FormErrors  = {};
		// Collect error messages
		let errorMessages: string[] = [];

		Object.keys(formData).forEach(fieldName => {
			if (fieldName !== 'image') { // Skip the image field
				const value = formData[fieldName];
				if (typeof value === 'string') { // Ensure value is a string before validating
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
			return;
		}
		try {
			if (!isConnected) throw Error('User is not connected')

			// const ethersProvider = new BrowserProvider(walletProvider)
			if (walletProvider) {
				const tokenParams: TokenParams = {
					reserveRatio: 50000,
					name: formData.name,
					ticker: formData.ticker
				  };
				let url = '';

				toast.promise(
					deployTokenWithUIFeedback(tokenParams, walletProvider, file),
					{
						pending: 'Deploying token...',
						success: 'Token deployment successful! 👌',
						error: 'Deployment failed! 🤯'
					}
				).then(tokenListData => {
					router.push('/token/' + tokenListData.chainid + '/' + tokenListData.token_address);
				}).catch(error => {
					console.error("Failed to deploy token:", error);
				});
				
			} else {
				// Handle the case where walletProvider is undefined
				console.error("Wallet provider is not available.");
			}

		} catch (error: any) {

			console.log(error);
			toast.error(`Deployment failed: ` + error);
		}	
	};
	
	
  

	return (

		
		<div className=" bg-[#1A2B37] shadow-md px-8 py-8 rounded sm:w-full md:w-1/2 mx-auto">
			{/* <ConnectButton/> */}
			 <div className="inline-flex shadow-md rounded-full overflow-hidden h-8 leading-5">
 				<button 
 					className={`hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 
 								${selectedChain === "sei" ? 'bg-blue-500 text-white' : 'bg-gray-300'}
 								focus:outline-none focus:ring-2 focus:ring-blue-500`}
 					onClick={handleSeiChainButton}
 					disabled={selectedChain === "sei"}>
 					Sei
 				</button>
 				<button 
 					className={`hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 
 								${selectedChain === "ftm" ? 'bg-blue-500 text-white' : 'bg-gray-300'}
 								focus:outline-none focus:ring-2 focus:ring-blue-500`}
 					onClick={handleFtmChainButton}
 					disabled={selectedChain === "ftm"}>
 					FTM
 				</button>
 			</div> 
			{/* Form  */}
			<div className="mb-4">
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="name">
					Name
				</label>
				<input
					className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.name ? 'border-[#EED12E]' : ''
						}`}
					id="name"
					type="text"
					placeholder="token name"
					name="name"
					value={formData.name}
					onChange={handleChange}
					// onBlur={handleBlur}
				/>
				{errors.name && <p className="text-red-500 text-xs italic">{errors.name}</p>}

			</div>
			
			<div className="mb-4">
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="ticker">
					Ticker
				</label>
				<input
					className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.ticker ? 'border-[#EED12E]' : ''
						}`}
					id="ticker"
					type="text"
					placeholder="token symbol"
					name="ticker"
					value={formData.ticker}
					onChange={handleChange}
					// onBlur={handleBlur}
				/>
				{errors.ticker && <p className="text-red-500 text-xs italic">{errors.ticker}</p>}

				{/* Add similar input fields for other items */}
			</div>
			<div className="mb-4">
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="description">
					Description
				</label>
				<input
					className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.description ? 'border-[#EED12E]' : ''
						}`}
					id="description"
					type="text"
					placeholder="token description"
					name="description"
					value={formData.description}
					onChange={handleChange}
					// onBlur={handleBlur}
				/>
				{errors.description && <p className="text-red-500 text-xs italic">{errors.description}</p>}

				{/* Add similar input fields for other items */}
			</div>
			
			<div className="mb-4">
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="image">
					Image
				</label>
				<input
				className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
				id="image"
				type="file"
				name="image"
				onChange={(e) => {setFile(e.target.files?.[0])}}
				/>
				<p className="text-gray-500 text-xs italic">{file ? file.name : 'No file chosen'}</p>
			</div>

			<button onClick={toggleOptions} className="mb-4 bg-[#EED12E] text-black px-4 py-2 rounded">
				{showOptions ? 'Show less options' : 'Show more options'}
			</button>

			{showOptions && (
				<>
					<div className="mb-4">
						<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="twitter">
							Twitter Link
						</label>
						<input
							className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.twitter ? 'border-[#EED12E]' : ''
								}`}
							id="twitter"
							type="text"
							placeholder="(optional)"
							name="twitter"
							value={formData.twitter}
							onChange={handleChange}
							// onBlur={handleBlur}
						/>
						{errors.twitter && <p className="text-red-500 text-xs italic">{errors.twitter}</p>}
					</div>
					<div className="mb-4">
						<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="telegram">
							Telegram Link
						</label>
						<input
							className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.minter ? 'border-[#EED12E]' : ''
								}`}
							id="telegram"
							type="text"
							placeholder="(optional)"
							name="telegram"
							value={formData.telegram}
							onChange={handleChange}
							// onBlur={handleBlur}
						/>
						{errors.telegram && <p className="text-red-500 text-xs italic">{errors.telegram}</p>}

						{/* Add similar input fields for other items */}
					</div>
					<div className="mb-4">
						<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="website">
							Website Link
						</label>
						<input
							className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.minter ? 'border-[#EED12E]' : ''
								}`}
							id="website"
							type="text"
							placeholder="(optional)"
							name="website"
							value={formData.website}
							onChange={handleChange}
							// onBlur={handleBlur}
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
						<button className='relative  flex bg-[#EED12E] text-black  px-6 hover:text-white rounded-lg py-2 text-sm font-medium leading-5'
							type="button" onClick={handleDeploy}>
							Deploy
						</button>
					</div>
				</div>
			</div>
		</div>


	);
}