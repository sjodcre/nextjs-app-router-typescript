
"use client"
import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '../_redux/store';


interface Token {
  tokenid: number;
  tokenaddress:string;
  tokenname: string;
  tokensymbol: string;
  marketcap: number;
  creator: string;
  username:string;
  chainid:string;
  

}

// "use client"
// import { useState, useEffect } from 'react';
// import { usePathname, useRouter } from 'next/navigation';
// import Link from 'next/link';


const TokenPage: React.FC = () => {
 
  const id = usePathname();
  

  const chainType = useAppSelector((state) => state.chainReducer.value.chainType);
  const [formData, setFormData] = useState<Token>({
    tokenid: 0,
    tokenname: '',
    tokensymbol: '',
    marketcap: 0,
    creator: '',
    username:'',
    chainid:'',
    tokenaddress:''
    
  });
  const fetchToken = async () => {
    try {
      const response = await fetch(`/api/token${id}?chain=${chainType}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }
      const tokenData: Token = await response.json();
      setFormData(tokenData);
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  useEffect(() => {
   

    
      fetchToken();

  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/token/update?chain=${chainType}`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Failed to update token');
      }
      console.log('Token updated successfully');
    } catch (error) {
      console.error('Error updating token:', error);
    }
  };

 

  return (
    <div>
      <h1>Edit Token</h1>
      <label className='text-9xl flex justify-center'>Chain : {chainType} </label>
      <Link href={`/profile/${formData.creator}`}>
        <h2>Owner : {formData.username} </h2>
      </Link>
      <form onSubmit={handleSubmit}>
        <label>
          Token Name:
          <input type="text" name="tokenname" value={formData.tokenname} disabled onChange={handleChange} />
        </label>
        <label>
          ChainID:
          <input type="text" name="chainid" value={formData.chainid}  disabled onChange={handleChange} />
        </label>
        <label>
          Token Symbol:
          <input type="text" name="tokensymbol" value={formData.tokensymbol}  disabled onChange={handleChange} />
        </label>
        <label>
          Market Cap:
          <input type="number" name="marketcap" value={formData.marketcap.toString()} onChange={handleChange} />
        </label>

        <button type="submit">Save</button>
      </form>
    </div>
  );
};
