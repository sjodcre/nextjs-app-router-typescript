"use client";
// import { useWeb3React } from '@web3-react/core';
import { useState, MouseEvent, useEffect } from 'react';
import { Contract, BrowserProvider, ContractFactory, Signer, ethers } from 'ethers';
import ERC20TestArtifact from '../../../artifacts/contracts/ERCC20Test.sol/ERC20Test.json'

import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react'
import { toast } from 'react-toastify'
import ConnectButton from "../_ui/connect-button";
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
		network: string;
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

	const [formData, setFormData] = useState<FormData>({
		network: '',
		name: '',
		ticker: '',
		description: '',
		twitter: '',
		telegram:'',
		website: '',

	});

	const [errors, setErrors] = useState<FormErrors>({
		network: '',
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
        if (selectedChain === "ftm") {

            setSelectedChain("sei");
            dispatch(logIn(selectedChain));
        } 


    };
	const handleFtmChainButton = () => {
        if (selectedChain === "sei") {

            setSelectedChain("ftm");
            dispatch(logIn(selectedChain));
        }

    };

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
				//==================================================================
				try {
					// const ethersProvider = new BrowserProvider(walletProvider)

					const data = await deployToken(tokenParams, walletProvider);
					// toast.success(`Token Creation Successful!${address}`);
					try {
						url = await handleUploadImage(file);
						console.log('Uploaded Image URL:', url);
					} catch (error) {
						console.error('Failed to upload image:', error);
					}
					
					const tokenListData = {
						...data,
						image_url: url,
						token_description: formData.description,
						twitter: formData.twitter, // Include Twitter data from formData.
						telegram: formData.telegram, // Include Telegram data from formData.
						website: formData.website, // Include Website data from formData.
					  };
										
					await postTokenData(tokenListData);//done
					await initOHLCData(data.token_address,data.creator, data.datetime, data.tx_hash);
					router.push('/token/' + selectedChain + '/' + data.token_address)
					
					// await toast.promise(
					// 	new Promise(async (resolve, reject) => {
					// 		mintToken("0x83b7d56507b0C0F50161D8E49Bb1186E7262d4CE",0.01,walletProvider)
					// 		.then((tx) => {
					// 		//   dispatch(setTicketModal('scale-0'))
					// 		//   setTickets('')
					// 		  console.log(tx)
					// 		  resolve(tx)
					// 		})
					// 		.catch((error) => reject(error))
					// 	}),
					// 	{
					// 	  pending: 'Minting...',
					// 	  success: 'Mint successful! 👌',
					// 	  error: 'Encountered error 🤯',
					// 	}
					//   )

					// const balance = await getBalance("0x83b7d56507b0C0F50161D8E49Bb1186E7262d4CE" ,walletProvider);
					// console.log(balance)

					// await toast.promise(
					// 	new Promise(async (resolve, reject) => {
					// 		burnToken("0x83b7d56507b0C0F50161D8E49Bb1186E7262d4CE","47768820872059",walletProvider)
					// 		.then((tx) => {
					// 		//   dispatch(setTicketModal('scale-0'))
					// 		//   setTickets('')
					// 		  console.log(tx)
					// 		  resolve(tx)
					// 		})
					// 		.catch((error) => reject(error))
					// 	}),
					// 	{
					// 	  pending: 'Selling...',
					// 	  success: 'Selling Done! 👌',
					// 	  error: 'Encountered error 🤯',
					// 	}
					//   )
					
				} catch (error) {
					console.log(`Error: ${error}`);
				}
				//===============================================================================

				// const ethersProvider = new BrowserProvider(walletProvider);
				// const signer = await ethersProvider.getSigner();
				
				// ===========erc20 test contract burn===========
				// const options = {
				// 	// value: ethers.parseUnits("0.01", 18), // Your transaction value
				// 	gasLimit: ethers.toBeHex(1000000), // Example gas limit; adjust based on your needs
				// };
				// const amountToBurn = ethers.parseUnits("49976265426123", 1);
				// const ERC20TestContractAddress = "0xe7a3D1A2e108A67b7F678297907eB477f661e8bf"; 
				// const ERC20TestContract = new Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, signer);

				// const mintTx = await ERC20TestContract.burn( "49928857892001",options);  // Adjust parameters as needed
				// await mintTx.wait();
				// console.log(mintTx);

				//==============erc20 test contract query=======
				const ethersProvider = new BrowserProvider(walletProvider);
				const signer = await ethersProvider.getSigner();
				const ERC20TestContractAddress = "0x9AA19CF4849c03a77877CaFBf61003aeDFDA3779"; 
				const provider = new ethers.JsonRpcProvider("https://evm-rpc-arctic-1.sei-apis.com")
				const contractToUse = new ethers.Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, provider);
				const txResponseTotalSupply = await contractToUse.balanceOf("0x372173ca23790098F17f376F59858a086Cae9Fb0");
				console.log(txResponseTotalSupply);

				// ===========erc20 test contract mint===========
				// const ethersProvider = new BrowserProvider(walletProvider);
				// const signer = await ethersProvider.getSigner();
				// const options = {
				// 	value: ethers.parseUnits("0.01", 18), // Your transaction value
				// 	gasLimit: ethers.toBeHex(1000000), // Example gas limit; adjust based on your needs
				// };
				// const ERC20TestContractAddress = "0xda8C4b55679AA98cBe36d4f67093247D5B93c40C"; 
				// const ERC20TestContract = new Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, signer);

				// const mintTx = await ERC20TestContract.mint( options);  // Adjust parameters as needed
				// await mintTx.wait();
				// console.log(Math.floor(Date.now() / 1000));
				
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

		
		<div className=" bg-[#1A2B37] shadow-md px-8 py-8 rounded">
			<ConnectButton/>
			<div className="inline-flex">
                <button className={` hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l ${selectedChain==="sei" ? 'bg-blue-500 disable' : 'bg-gray-300'
                    }`} onClick={handleSeiChainButton}>
                    Sei
                </button>
                <button className={` hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l ${selectedChain==="ftm" ? 'bg-blue-500' : 'bg-gray-300'
                    }`} onClick={handleFtmChainButton}>
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
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="network">
					Network
				</label>
				<select
					className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
					id="network"
					name="network"
					value={formData.network}
					onChange={handleChange} // Make sure to implement this function to handle changes
				>
					{/* <option value="">Select Network</option> */}
					<option value="SeiEVM">SeiEVM</option>
					{/* <option value="Blast">Blast</option> */}
				</select>
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