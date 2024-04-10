"use client";
// import { useWeb3React } from '@web3-react/core';
import { useState, MouseEvent, useEffect } from 'react';
import { Contract, ethers, EthersError, Signer } from 'ethers';
import XeniaArtifact from '../../../artifacts/contracts/Xenia.sol/Xenia.json';
import ERC721Artifact from '../../../artifacts/contracts/ERC721Test.sol/ERC721Test.json';
// import { Bounce, toast } from 'react-toastify'
import {toast} from 'sonner'
import { sign } from 'crypto';
// import { Provider } from '../utils/provider';
// import hre from 'hardhat';
 


// import {NavBar } from "../../components/NavBar";
// import { Navigation } from "../components/nav";

export function Deploy() {
	interface FormData {
		[key: string]: string; // Allows any string to index the type
		network: string;
		minter: string;
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
		minter: '',
		baseTokenURI: '',
		name: '',
		symbol: '',
		decimals: '',
		maxSupply:''
	});

	const [errors, setErrors] = useState<FormErrors>({
		owner: '',
		baseTokenURI: '',
		name: '',
		symbol: '',
		decimals: '',
		maxSupply: ''
	});

	const [signer, setSigner] = useState<Signer>();
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

	// useEffect((): void => {
	// 	if (!library) {
	// 		setSigner(undefined);
	// 		return;
	// 	}

	// 	setSigner(library.getSigner());
	// }, [library]);

	// useEffect(() => {
    //     if (!provider.hasSigner) {
	// 		setSigner(undefined);
	// 		return;
	// 	}
	// 	// async function fetchSigner() {
	// 	// 	// Assuming `ethers.BrowserProvider` is correct and exists in your ethers version
	// 	// 	// If it's not available or incorrect, you might need to use `Web3Provider` or another appropriate provider class
	// 	// 	const provider = new ethers.BrowserProvider(window.ethereum);
	// 	// 	const signerFromProvider = await provider.getSigner();
	// 	// 	setSigner(signerFromProvider);
	// 	// }
	// 	// try {
			
			
	// 	// 		fetchSigner();

	// 	// } catch (error) {
	// 	// 	window.alert(`Connection Failed`);
	// 	// }
	// 	provider.getSigner()
    //   	.then(signer => {
	// 		setSigner(signer);

	// 	})
	// 	// console.log("signer: "+ signer)
		
    //   }, [provider]);

	//   const validateForm = () => {
	//     // const errors = {};

	//     // Validate owner field
	//     if (!formData.owner.trim().startsWith('0x')) {
	//       errors.owner = 'Owner address must start with 0x';
	//     }

	// 	if (!formData.minter.trim().startsWith('0x')) {
	// 		errors.minter = 'Minter address must start with 0x';
	// 	  }

	//     setErrors(errors);
	//     return Object.keys(errors).length === 0;
	//   };

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
		console.log("signer: "+ signer)
		if (!signer) {
			window.alert(`Please Connect first!`);

			return;
		}

		try {
			// const accounts = await hre.ethers.getSigners();
			// const deployer = accounts[0].address;
			// console.log(`Deploy from account: ${deployer}`);

			// const bond = await hre.ethers.deployContract('ERC721Artifact', [
			// 	formData.owner,
			// 	formData.baseTokenURI,
			// 	formData.name,
			// 	formData.symbol,
			// 	formData.maxSupply
			//   ]);
			//   await bond.waitForDeployment();
			// //   console.log(` -> MCV2_Bond contract deployed at ${bond.target}`);
			//   window.alert(`Contract deployed to: ${bond.target}`);

			
			// const ERC721ConFact = new ethers.ContractFactory(
			// 	ERC721Artifact.abi,
			// 	ERC721Artifact.bytecode,
			// 	deployer
			// );
			// const ERC721Contract = await ERC721ConFact.deploy(
			// 	// '0xf759c09456A4170DCb5603171D726C3ceBaDd3D5',
			// 	// "https://arweave.net/b28dit8OPFADvxA7YJm9ZB1hEfLENkhm8UcLpeXdKMA/",
			// 	// "DegenDigestAR2",
			// 	// "DDGR2",
			// 	formData.owner,
			// 	formData.baseTokenURI,
			// 	formData.name,
			// 	formData.symbol,
			// 	formData.maxSupply
			// );
			// const contractAddress = await ERC721Contract.getAddress(); // Correctly await the address
			// window.alert(`Contract deployed to: ${contractAddress}`);

			// const ERC404ConFact = new ethers.ContractFactory(
			// 	XeniaArtifact.abi,
			// 	XeniaArtifact.bytecode,
			// 	signer
			//   );

			// const ERC404Contract = await ERC404ConFact.deploy(
			// 	formData.owner,
			// 	formData.name,
			// 	formData.symbol,
			// 	formData.baseTokenURI,
			// 	parseInt(formData.decimals),
			// 	Number(formData.maxSupply)
			// 	// '0xf759c09456A4170DCb5603171D726C3ceBaDd3D5',
			// 	// '0xf759c09456A4170DCb5603171D726C3ceBaDd3D5',
			// 	// "ipfs://bafybeifs23ww7wkjprvlyrl4zfhizp3bb3qjfkvix5w3zhgyizg2tor6ae/",
			// 	// "DEF",
			// 	// "FDE",
			// 	// 18,
			// );

				// window.alert(`Greeter deployed to: ${ERC404Contract.address}`);

		} catch (error: any) {
			// if (error is EthersError) {
			// 	console.log(ethers.isError);
			// }
			console.log(error.code);
			toast.error(`Deployment failed: ` + error.code);

			// if (ethers.isError(error)) {
			// 	errorCode = error.code; // Extract the error code
			// }

			// window.alert(`Deployment failed: ${errorCode}`);
		}	
	};
	
	
  

	return (


		<div className=" bg-[#1A2B37] shadow-md px-8 py-8 rounded">

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
					placeholder="0x..."
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