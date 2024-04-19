// pages/token/[id].tsx

import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Token {
  tokenid: number;
  tokenname: string;
  tokensymbol: string;
  marketcap: number;
  creator: string;
  
 
}

interface TokenPageProps {
  token: Token | null;
}

const TokenPage: React.FC<TokenPageProps> = ({ token }) => {
  const router = useRouter();
  const id = router.query?.id as string | undefined;
  
  if (!id) {
    // Handle the case when ID is not available
  }
  

  if (!token) {
    return <div>Error: Token not found</div>;
  }

  // Define state for form fields
  const [formData, setFormData] = useState<Token>({
    tokenid: token.tokenid,
    tokenname: token.tokenname,
    tokensymbol: token.tokensymbol,
    marketcap: token.marketcap,
    creator: token.creator

  });

  // Define event handler to update form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Define event handler to submit form data
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/token/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update token');
      }
  
      console.log('Token updated successfully');
    } catch (error) {
      console.error('Error updating token:', error);
      // Handle error
    }
  };

  return (
    <div>
      <h1>Edit Token</h1>
      
      <Link href={`profile/${token.creator}`}>
        <h2>Owner : {token.creator} </h2>
      </Link>
      <form onSubmit={handleSubmit}>
        <label>
          Token Name:
          <input type="text" name="token_name" value={formData.tokenname} disabled onChange={handleChange} />
        </label>
        <label>
          Token Symbol:
          <input type="text" name="token_symbol" value={formData.tokensymbol} disabled onChange={handleChange} />
        </label>
        <label>
          Market Cap:
          <input type="number" name="marketcap" value={formData.marketcap} onChange={handleChange} />
        </label>
     
        <button type="submit">Save</button>
      </form>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<TokenPageProps> = async ({ params }) => {
  try {
    const id = params?.id as string | undefined;

    if (!id) {
      // Handle the case when ID is not available
    }

    // Fetch token data based on the ID from the API route
    const response = await fetch(`http://localhost:3000/api/token/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch token');
    }
    const token = await response.json();
    return {
      props: {
        token: token,
      },
    };
  } catch (error) {
    console.error('Error fetching token:', error);
    return {
      props: {
        token: null,
      },
    };
  }
};

export default TokenPage;
