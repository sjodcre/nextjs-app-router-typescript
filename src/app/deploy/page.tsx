"use client";
// import { useWeb3React } from '@web3-react/core';
import { useState, MouseEvent, useEffect } from 'react';
import { Contract, BrowserProvider, ContractFactory, Signer, ethers } from 'ethers';
import ERC20TestArtifact from '../../../artifacts/contracts/ERCC20Test.sol/ERC20Test.json'

import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react'
import {toast} from 'sonner'
import ConnectButton from "../ui/connect-button";

const wei = function (num: string | number | bigint | boolean, decimals = 18) {
	return BigInt(num) * 10n ** BigInt(decimals);
  };

export default function Deploy() {
	interface FormData {
		[key: string]: string; // Allows any string to index the type
		network: string;
		owner: string;
		baseTokenURI: string;
		name: string;
		symbol: string;
		decimals: string;
		maxSupply: string;
	}

	interface FormErrors {
		[key: string]: string; // Allows indexing with a string
	}

	const [formData, setFormData] = useState<FormData>({
		network: '',
		owner: '',
		baseTokenURI: '',
		name: '',
		symbol: '',
		decimals: '',
		maxSupply:''
	});

	const [errors, setErrors] = useState<FormErrors>({
		network: '',
		owner: '',
		baseTokenURI: '',
		name: '',
		symbol: '',
		decimals: '',
		maxSupply: ''
	});

	const [signer, setSigner] = useState<Signer>();
	const { address, chainId, isConnected } = useWeb3ModalAccount()
  	const { walletProvider } = useWeb3ModalProvider()
	// const context = useWeb3React<Provider>();
    // const provider = new ethers.BrowserProvider(window.ethereum);

	// const { library, active } = context;


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

		// Validate owner field
		if (fieldName === 'owner' && !value.trim().startsWith('0x')) {
			error = 'Owner address must start with 0x';
		}

		// Validate minter field
		// if (fieldName === 'minter' && !value.trim().startsWith('0x')) {
		// 	error = 'Minter address must start with 0x';
		// }

		if (fieldName === 'name' && value.trim().length > 9) {
			error = 'Name should be less than 10 characters';
		}

		if (fieldName === 'symbol' && value.trim().length > 9) {
			error = 'Symbol should be less than 10 characters';
		}

		if (fieldName === 'decimals') {
			if (!(/^\d+$/.test(value.trim()))) {
				error = 'Number of decimals should be integer only';
			} else if (parseInt(value) < 18) {
				error = 'Value too small, should be more than 18';
			}
		}

		return error;
	};

	// const handleBlur = (e: { target: { name: any; value: any; }; }) => {
	// 	const { name, value } = e.target;
	// 	const error = validateField(name, value);
	// 	setErrors({
	// 		...errors,
	// 		[name]: error
	// 	});
	// };

	const handleDeploy = async () => {
		// Prevent deploying the Greeter contract multiple times or if signer is not defined
		// if (greeterContract || !signer) {
		//   return;
		// }
		let hasError = false;
  		let newErrors: FormErrors  = {};
		// Collect error messages
		let errorMessages: string[] = [];

 	 // Validate all fields
		Object.keys(formData).forEach(fieldName => {
			const error = validateField(fieldName, formData[fieldName]);
			newErrors[fieldName] = error;

			if (error) {
			hasError = true;
			errorMessages.push(error);
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
				// autoClose: 3000,
				// hideProgressBar: false,
				// closeOnClick: true,
				// pauseOnHover: true,
				// draggable: true,
				
				// progress: undefined,
				// theme: "light",
				});
			return;
		}
		// console.log("signer: "+ signer)
		// if (!signer) {
		// 	window.alert(`Please Connect first!`);

		// 	return;
		// }

		try {
			if (!isConnected) throw Error('User disconnected')

			// const ethersProvider = new BrowserProvider(walletProvider)
			if (walletProvider) {
				const ethersProvider = new BrowserProvider(walletProvider);
				const signer = await ethersProvider.getSigner();
				
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
				const ERC20TestContractAddress = "0xe7a3D1A2e108A67b7F678297907eB477f661e8bf"; 
				const provider = new ethers.JsonRpcProvider("https://evm-rpc-arctic-1.sei-apis.com")
				const contractToUse = new ethers.Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, provider);
				const txResponseTotalSupply = await contractToUse.balanceOf("0x372173ca23790098F17f376F59858a086Cae9Fb0");
				console.log(txResponseTotalSupply);

				// ===========erc20 test contract mint===========
				// const options = {
				// 	value: ethers.parseUnits("0.01", 18), // Your transaction value
				// 	gasLimit: ethers.toBeHex(1000000), // Example gas limit; adjust based on your needs
				// };
				// const ERC20TestContractAddress = "0xe7a3D1A2e108A67b7F678297907eB477f661e8bf"; 
				// const ERC20TestContract = new Contract(ERC20TestContractAddress, ERC20TestArtifact.abi, signer);

				// const mintTx = await ERC20TestContract.mint( options);  // Adjust parameters as needed
				// await mintTx.wait();
				// console.log(mintTx);


				//=========erc20 test contract deploy (bancor bonding curve not mint)==================
				// const options = {
				// 			// value: ethers.parseUnits("0.01", 18), // Your transaction value
				// 			gasLimit: ethers.toBeHex(1000000), // Example gas limit; adjust based on your needs
				// 		};
				// const ERC20_Token = new ContractFactory(
				// 	ERC20TestArtifact.abi,
				// 	ERC20TestArtifact.bytecode,
				// 	signer
				// );

				// const ERC20Contract = await ERC20_Token.deploy(
				// 	50000,
				// 	"Teacup",
				// 	"TCP"
				// );
				// const contractAddress = await ERC20Contract.getAddress(); // Correctly await the address
				// window.alert(`Contract deployed to: ${contractAddress}`);
				
			} else {
				// Handle the case where walletProvider is undefined
				console.error("Wallet provider is not available.");
			}

		} catch (error: any) {

			console.log(error.code);
			toast.error(`Deployment failed: ` + error.code);
		}	
	};
	
	
  

	return (


		<div className=" bg-[#1A2B37] shadow-md px-8 py-8 rounded">
			<ConnectButton/>
			{/* Form  */}
			<div className="mb-4">
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="owner">
					Owner
				</label>
				<input
					className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.owner ? 'border-[#EED12E]' : ''
						}`}
					id="owner"
					type="text"
					placeholder="0x..."
					name="owner"
					value={formData.owner}
					onChange={handleChange}
					// onBlur={handleBlur}
				/>
				{errors.owner && <p className="text-red-500 text-xs italic">{errors.owner}</p>}

			</div>
			<div className="mb-4">
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="baseTokenURI">
					Base Token Uri
				</label>
				<input
					className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.baseTokenURI ? 'border-[#EED12E]' : ''
						}`}
					id="baseTokenURI"
					type="text"
					placeholder="https://....."
					name="baseTokenURI"
					value={formData.baseTokenURI}
					onChange={handleChange}
					// onBlur={handleBlur}
				/>
				{errors.baseTokenURI && <p className="text-red-500 text-xs italic">{errors.baseTokenURI}</p>}

				{/* Add similar input fields for other items */}
			</div>
			<div className="mb-4">
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="name">
					Token Name
				</label>
				<input
					className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.name ? 'border-[#EED12E]' : ''
						}`}
					id="name"
					type="text"
					placeholder="Token Name"
					name="name"
					value={formData.name}
					onChange={handleChange}
					// onBlur={handleBlur}
				/>
				{errors.name && <p className="text-red-500 text-xs italic">{errors.name}</p>}

				{/* Add similar input fields for other items */}
			</div>
			<div className="mb-4">
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="symbol">
					Symbol
				</label>
				<input
					className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.symbol ? 'border-[#EED12E]' : ''
						}`}
					id="symbol"
					type="text"
					placeholder="Token Symbol"
					name="symbol"
					value={formData.symbol}
					onChange={handleChange}
					// onBlur={handleBlur}
				/>
				{errors.symbol && <p className="text-red-500 text-xs italic">{errors.symbol}</p>}

				{/* Add similar input fields for other items */}
			</div>
			<div className="mb-4">
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="decimals">
					Decimals
				</label>
				<input
					className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.decimals ? 'border-[#EED12E]' : ''
						}`}
					id="decimals"
					type="text"
					placeholder="Decimals"
					name="decimals"
					value={formData.decimals}
					onChange={handleChange}
					// onBlur={handleBlur}
				/>
				{errors.decimals && <p className="text-red-500 text-xs italic">{errors.decimals}</p>}
			</div>
			<div className="mb-4">
				<label className="block text-[#EED12E] text-sm font-bold mb-2" htmlFor="maxSupply">
					Max Supply
				</label>
				<input
					className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.minter ? 'border-[#EED12E]' : ''
						}`}
					id="maxSupply"
					type="text"
					placeholder=""
					name="maxSupply"
					value={formData.maxSupply}
					onChange={handleChange}
					// onBlur={handleBlur}
				/>
				{errors.minter && <p className="text-red-500 text-xs italic">{errors.minter}</p>}

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