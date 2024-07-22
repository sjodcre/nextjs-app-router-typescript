"use client"
import { useState, useEffect } from 'react';
// import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
// import { useAppSelector } from '@/app/_redux/store';
import React from 'react';
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers5/react';
import { toast } from 'react-toastify';
import { extractFirstSixCharac } from '@/app/_utils/helpers';



interface Profile {

  account: string;
  bio: string;
  username: string;

}
const initialProfileData: Profile = {
  account: '',
  bio: '',
  username: '',
};

interface FolloweeData {

  followee: string;
  followee_username: string;
  followee_count: string;

}

interface FollowerData {

  follower: string;
  follower_username: string;
  follower_count: string;

}

interface FollowData {
  followerlist: FollowerData[];
  followeelist: FolloweeData[];
}

interface CoinsHeld {
  token_address: string;
  balance: string;
  token_ticker: string;
  token_name: string;
  image_url: string;  // Assuming this could be optional
}

interface CoinsCreated {

  creator: string;
  token_address: string;
  image_url: string;
  token_name: string;
  token_ticker: string;
  token_description: string;

}


// function Profile: React.FC = () => {

export default function Profile({ params }: { params: { id: string } }) {

  // const url = usePathname();
  // const id = url.substring("/profile/".length);
  const id = params.id;
  const { address, chainId,isConnected } = useWeb3ModalAccount()
  const { walletProvider } = useWeb3ModalProvider();
  const [currentChain, setCurrentChain] = useState('ftm');
  const [providerReady, setProviderReady] = useState(false);
  const [currentHeldPage, setCurrentHeldPage] = useState(1);
  const itemsPerPageHeld = 5; // This can also be dynamic if needed
  const [currentCreatedPage, setCurrentCreatedPage] = useState(1);
  const itemsPerPageCreated = 5; // This can also be dynamic if needed
  // const chainType = useAppSelector((state) => state.chainReducer.value.chainType);
  const [profileData, setProfileData] = useState<Profile>({
    account: '',
    bio: '',
    username: address || '',

  });
  const [profileUpdateData, setProfileUpdateData] = useState<Profile>(initialProfileData);

  const [changes, setChanges] = useState(false);
  const [profileExist, setProfileExist] = useState(false);
  const [coinHeldData, setCoinHeld] = useState<CoinsHeld[]>([]);
  const [coinCreatedData, setCoinCreated] = useState<CoinsCreated[]>([]);
  const [loading, setLoading] = useState(true);


  // Pagination helper
  const indexOfLastHeldItem = currentHeldPage * itemsPerPageHeld;
  const indexOfFirstHeldItem = indexOfLastHeldItem - itemsPerPageHeld;
  const currentItems = coinHeldData.slice(indexOfFirstHeldItem, indexOfLastHeldItem);
  const indexOfLastCreatedItem = currentCreatedPage * itemsPerPageCreated;
  const indexOfFirstCreatedItem = indexOfLastCreatedItem - itemsPerPageCreated;
  const currentCreatedItems = coinCreatedData.slice(indexOfFirstCreatedItem, indexOfLastCreatedItem);
  const [isFollowing, setIsFollowing] = useState(false);
  const nextHeldPage = () => {
    setCurrentHeldPage(prev => prev + 1);
  };

  const prevHeldPage = () => {
    if (currentHeldPage > 1) {
      setCurrentHeldPage(prev => prev - 1);
    } 
  };
  const nextCreatedPage = () => {
    setCurrentCreatedPage(prev => prev + 1);
  };

  const prevCreatedPage = () => {
    if (currentCreatedPage > 1) {
      setCurrentCreatedPage(prev => prev - 1);
    }
  };

  //tab
  const [openTab, setOpenTab] = React.useState(1);

  //popup model
  const [showModal, setShowModal] = useState(false);
  const SEI_CHAIN_ID = 713715;
  // const FTM_CHAIN_ID = 64165;
  const FTM_CHAIN_ID = 250;


  useEffect(() => {

    if (walletProvider) {
      setProviderReady(true);
    } else {
      setProviderReady(false);
    }
  }, [walletProvider]);


  // useEffect(() => {
  //   if (chainId) {
  //     if (chainId === SEI_CHAIN_ID) {
  //       setCurrentChain("sei")
  //     } else if (chainId === FTM_CHAIN_ID) {
  //       setCurrentChain("ftm")
  //     }
  //   }
  //   // fetchCoinHeld();
  // }, [chainId]);

  useEffect(() => {
    // const fetchCoinHeld = async () => {
    //   if (currentChain) { // Ensure currentChain is set
    //     // Your fetch logic here
    //     console.log(`Fetching coin held for ${currentChain}`);
    //     // Fetch coin held logic...
    //   }
    // };
    // console.log("current chain", currentChain)
    // console.log('is connected?', isConnected)
    if (currentChain) {
      fetchCoinHeld(currentChain);
      fetchCoinCreated(currentChain);
      fetchProfile();
      fetchFollowed();
      fetchFollowData();
    }

  }, [currentChain,changes,isFollowing]);

 /*  useEffect(() => {

    fetchProfile();
    fetchFollowed();
    fetchFollowData();
  }, [isConnected,isFollowing,currentChain]);

 */


  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profile?id=${id}&chain=${currentChain}`);
      if (!response.ok) {
        if (response.status === 404) {
          console.error('Profile not found');
          setLoading(false); // Set loading to false
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }
      const profileData: Profile = await response.json();
      setProfileData(profileData);
      if (profileData.username === null) {
        setProfileData(prevData => ({
          ...prevData,
          username: address || ''
        }));
      }
      setProfileExist(true);
    } catch (error) {
      console.error('Error fetching token:', error);
    } finally {
      setLoading(false); // Ensure loading is set to false after fetch
    }
  };

  const fetchCoinHeld = async (currentChain: string) => {
    try {
      console.log("chain before fetching coin held", currentChain)
      const response = await fetch(`/api/coinsheld?id=${id}&chain=${currentChain}`);
      console.log("response coin held", response)
      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }
      const data = await response.json();
      const mergedData = data.profiles.map((profile: { token_address: any; }) => ({
        ...profile,
        ...data.details.find((detail: { token_address: any; }) => detail.token_address === profile.token_address) || {}
      }));

      // console.log("Merged Coin Held Data", mergedData);
      console.log("coin held displayed", mergedData)
      setCoinHeld(mergedData);
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };


  const fetchCoinCreated = async (currentChain: string) => {
    try {
      const response = await fetch(`/api/coinscreated?id=${id}&chain=${currentChain}`);
      if (!response.ok) {
        throw new Error('Failed to fetch token');
      }
      const coinCreatedData = await response.json();
      setCoinCreated(coinCreatedData);
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  // useEffect(() => {


  //   // fetchCoinCreated();
  //   // fetchProfile();

  // }, [id]);




  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   setUsername(prevData => ({
  //     ...prevData,
  //     [name]: value,
  //   }));
  // };
  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileUpdateData(prevData => ({
      ...prevData,
      [name]: value,
    }));
    setChanges(true);
  }



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileUpdateData(prevData => ({
      ...prevData,
      [name]: value,  // Directly update the username property
    }));
    setChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/profile/update?id=${id}&chain=${currentChain}`, {
        method: 'POST',
        body: JSON.stringify(profileUpdateData),
      });
      const responseData = await response.json();


      if (response.status === 400) {
        setShowModal(false);
        toast.error("Username already exists");
        setProfileUpdateData(initialProfileData);
        setChanges(false);
      }
      else if (response.status === 201) {
        setShowModal(false);
        toast.success("Bio Updated");
        setProfileUpdateData(initialProfileData);
        setChanges(false);

      }
      else if (response.status === 200) {
        setShowModal(false);
        toast.success("Username and Bio Updated");
        setProfileUpdateData(initialProfileData);
        setChanges(false);

      }
      else if (response.status === 202) {
        setShowModal(false);
        toast.success("Username Updated");
        setProfileUpdateData(initialProfileData);
        setChanges(false);

      } else {
        setShowModal(false);
        toast.error('An error occurred, try again later')
        setProfileUpdateData(initialProfileData);
        setChanges(false);
      }
      //alert('Username updated successfully');
      // setShowModal(false);
      // profileData.username = username.username;
    } catch (error) {
      alert(error);
      console.error('Error updating token:', error);
    }
  };

  const fetchFollowed = async () => {
    try {
      const response = await fetch(`/api/follow/status?follower=${address}&followee=${id}&chain=${currentChain}`);
      if (response.status === 202) {
        setIsFollowing(false);
      }
      else if (response.status === 201) {
        setIsFollowing(true);

      }
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };


  const [followerlist, setFollowerlist] = useState<FollowerData[]>([]);
  const [followeelist, setFolloweelist] = useState<FolloweeData[]>([]);
  const fetchFollowData = async () => {
    try {
      const response = await fetch(`/api/follow/list?id=${id}&chain=${currentChain}`);
      if (!response.ok) {
        throw new Error('Failed to fetch follow data');
      }
      const data: FollowData = await response.json();
      setFollowerlist(data.followerlist);
      setFolloweelist(data.followeelist);

    } catch (error) {
      console.error('Error fetching token:', error);

    };
  }


  const handleFollow = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/follow/status?follower=${address}&followee=${id}&chain=${currentChain}`, {
        method: 'POST',
      });


      if (response.status === 201) {
        setIsFollowing(true);
      } else if (response.status === 202) {
        setIsFollowing(false);
      }

      //alert('Username updated successfully');
      // setShowModal(false);
      // profileData.username = username.username;
    } catch (error) {
      alert(error);
      console.error('Error updating token:', error);
    }
  };

  return (
<>
  <a className="mt-8 p-4 inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-10 px-4 py-2 -mt-5 text-2xl text-slate-50 hover:font-bold hover:bg-transparent hover:text-slate-50" href="/">
    [ home ]
  </a>
  
  { loading ? (
      <div className="p-4 text-center text-blue-500">
        Loading...
      </div>
    ) : 
  
    profileExist ? (
    <div className="text-green-400 bg-black min-h-screen p-6 font-mono">
      {id == address && (
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-4 py-2 text-sm font-medium text-black bg-green-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          EDIT PROFILE
        </button>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-75"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-black rounded-lg overflow-hidden shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-green-400">EDIT PROFILE</h3>
                  <div className="flex flex-col mt-4">
                    <label className="px-2 text-sm text-green-500">Username</label>
                    <input
                      className="rounded-md border border-gray-600 bg-black text-green-400 px-3 py-2 outline-none"
                      name="username"
                      defaultValue={profileData.username}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex flex-col mt-4">
                    <label className="px-2 text-sm text-green-500">Bio</label>
                    <textarea
                      className="rounded-md border border-gray-600 bg-black text-green-400 h-24 p-2 outline-none"
                      name="bio"
                      placeholder="bio"
                      defaultValue={profileData.bio}
                      onChange={handleReplyChange}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                onClick={handleSubmit}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-400 text-base font-medium text-black hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                disabled={!changes}
              >
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-black text-base font-medium text-green-400 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="text-lg font-bold">Username: {profileData.username}</p>
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm">{followerlist.length} Followers</p>
          {id !== address && isConnected && (
            <button
              className={`w-40 h-8 rounded-full bg-green-400 text-black hover:bg-green-600 text-sm font-medium leading-5`}
              onClick={handleFollow}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
        <p className="text-sm mt-2">Bio: {profileData.bio}</p>
        <div className="text-xs sm:text-sm border border-gray-600 rounded p-2 mt-4">
          {profileData.account}
        </div>
      </div>
      <div className="border border-green-500 border-dotted px-2 mt-6">
        <ul className="flex mb-0 list-none flex-wrap pt-3 pb-4 flex-row" role="tablist">
          <li className="-mb-px mr-1 last:mr-0 flex-auto text-center">
            <a
              className={`text-xs font-bold uppercase px-5 py-3 shadow-lg rounded block leading-normal ${
                openTab === 1 ? "text-black bg-green-400" : "text-green-400 bg-gray-800"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setOpenTab(1);
              }}
              data-toggle="tab"
              href="#link1"
              role="tablist"
            >
              Coins Held
            </a>
          </li>
          <li className="-mb-px mr-1 last:mr-0 flex-auto text-center">
            <a
              className={`text-xs font-bold uppercase px-5 py-3 shadow-lg rounded block leading-normal ${
                openTab === 2 ? "text-black bg-green-400" : "text-green-400 bg-gray-800"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setOpenTab(2);
              }}
              data-toggle="tab"
              href="#link2"
              role="tablist"
            >
              Coins Created
            </a>
          </li>
          <li className="-mb-px mr-1 last:mr-0 flex-auto text-center">
            <a
              className={`text-xs font-bold uppercase px-5 py-3 shadow-lg rounded block leading-normal ${
                openTab === 3 ? "text-black bg-green-400" : "text-green-400 bg-gray-800"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setOpenTab(3);
              }}
              data-toggle="tab"
              href="#link3"
              role="tablist"
            >
              Followers
            </a>
          </li>
          <li className="-mb-px mr-1 last:mr-0 flex-auto text-center">
            <a
              className={`text-xs font-bold uppercase px-5 py-3 shadow-lg rounded block leading-normal ${
                openTab === 4 ? "text-black bg-green-400" : "text-green-400 bg-gray-800"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setOpenTab(4);
              }}
              data-toggle="tab"
              href="#link4"
              role="tablist"
            >
              Following
            </a>
          </li>
        </ul>
        <div className="flex flex-col min-w-0 break-words bg-black text-green-400 w-full mb-6 shadow-lg rounded">
          <div className="px-4 py-5 flex-auto">
            <div className="tab-content tab-space">
              <div className={openTab === 1 ? "block" : "hidden"} id="link1">
                {currentItems.map((coinData: CoinsHeld, index: number) => (
                  <Link href={`/token/${currentChain}/${coinData.token_address}`} key={index}>
                    <div className="max-h-[300px] overflow-hidden h-fit p-2 flex border border-green-500 hover:bg-gray-800 gap-2 w-full">
                      {/* <img className='mr-4 w-12 h-auto flex' src={coinData.image_url || "https://via.placeholder.com/150"} alt="Token Image" /> */}
                      <div className="relative mr-4 w-12 h-auto flex">
                        <Image
                          src={coinData.image_url || "https://via.placeholder.com/150"}
                          alt="Token Image"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <ul className="text-xs font-normal leading-4 text-green-400">
                        <li>Token Address: {coinData.token_address}</li>
                        <li>Token Amount: {coinData.balance}</li>
                        <li>Token Name: {coinData.token_name}</li>
                        <li>Token Ticker: {coinData.token_ticker}</li>
                      </ul>
                    </div>
                  </Link>
                 ))}
                <div className="flex justify-between mt-4">
                  <button 
                    onClick={prevHeldPage} 
                    disabled={currentHeldPage === 1}
                    className="px-4 py-2 border border-green-500 rounded-md hover:bg-green-600 disabled:opacity-50 text-green-400 font-semibold"
                  >
                    Prev
                  </button>
                  <button 
                    onClick={nextHeldPage} 
                    disabled={currentHeldPage * itemsPerPageHeld >= coinHeldData.length} 
                    className="px-4 py-2 border border-green-500 rounded-md hover:bg-green-600 disabled:opacity-50 text-green-400 font-semibold" 
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className={openTab === 2 ? "block" : "hidden"} id="link2">
                {currentCreatedItems.map((coinData: CoinsCreated, index: number) => (
                  <Link href={`/token/${currentChain}/${coinData.token_address}`} key={index}>
                    <div className="max-h-[300px] overflow-hidden h-fit p-2 flex border border-green-500 hover:bg-gray-800 gap-2 w-full">
                      {/* <img className='mr-4 w-12 h-auto flex' src={coinData.image_url || "https://via.placeholder.com/150"} alt="Token Image" /> */}
                      <div className="relative mr-4 w-12 h-auto flex">
                        <Image
                          src={coinData.image_url || "https://via.placeholder.com/150"}
                          alt="Token Image"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <ul className="text-xs font-normal leading-4 text-green-400">
                        <li>Token Address: {coinData.token_address}</li>
                        <li>Creator: {coinData.creator}</li>
                        <li>Token Name: {coinData.token_name}</li>
                        <li>Token Ticker: {coinData.token_ticker}</li>
                        {/* <li>Token Description: {coinData.token_description ? (coinData.token_description.length > 20 ? coinData.token_description.slice(0, 20) + '...' : coinData.token_description) : 'No description'}</li> */}
                        <li>
                          Token Description:{" "}
                          {coinData.token_description
                            ? coinData.token_description.length > 20
                              ? coinData.token_description.slice(0, 20) + "..."
                              : coinData.token_description
                            : "No description"}
                        </li>
                      </ul>
                    </div>
                  </Link>
                ))}
                <div className="flex justify-between mt-4 ">
                  <button
                    onClick={prevCreatedPage}
                    disabled={currentCreatedPage === 1}
                    className="px-4 py-2 border border-green-500 rounded-md hover:bg-green-600 disabled:opacity-50 text-green-400 font-semibold"
                  >
                    Prev
                  </button>
                  <button
                    onClick={nextCreatedPage}
                    disabled={currentCreatedPage * itemsPerPageCreated >= coinCreatedData.length}
                    className="px-4 py-2 border border-green-500 rounded-md hover:bg-green-600 disabled:opacity-50 text-green-400 font-semibold"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className={openTab === 3 ? "block" : "hidden"} id="link3">
                {followerlist.map((follower, index) => (
                  <Link href={`/profile/${follower.follower}`} key={index}>
                    <div className="max-h-[300px] overflow-hidden h-fit p-2 flex border border-green-500 hover:bg-gray-800 gap-2 w-full justify-center">

                      <li className=' list-none'>
                        {/* {extractFirstSixCharac(follower.follower || 'unknown')}   {follower.follower_count} Followers */}
                        {extractFirstSixCharac(follower.follower_username)} {follower.follower_count} Followers
                      </li>
                    </div>
                  </Link>
                ))}
                {/* <div className="flex justify-between mt-4">
                  <button onClick={prevHeldPage} disabled={currentHeldPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-blue-700 disabled:opacity-50 text-green-500 font-semibold" >

                    Prev
                  </button>
                  <button onClick={nextHeldPage} disabled={currentHeldPage * itemsPerPageHeld >= coinHeldData.length} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-blue-700 disabled:opacity-50 text-green-500 font-semibold"  >
                    Next
                  </button>
                </div> */}


              </div>
              <div className={openTab === 4 ? "block" : "hidden"} id="link4">
                {followeelist.map((followee, index) => (
                  <Link href={`/profile/${followee.followee}`} key={index}>
                    <div className="max-h-[300px] overflow-hidden h-fit p-2 flex border border-green-500 hover:bg-gray-800 gap-2 w-full justify-center">

                      <li className=' list-none'>
                        {/* {extractFirstSixCharac(followee.followee || "unknown")} {followee.followee_count} Followers */}
                        {extractFirstSixCharac(followee.followee_username)} {followee.followee_count} Followers
                      </li>
                    </div>
                  </Link>
                ))}


                {/* <div className="flex justify-between mt-4">
                  <button onClick={prevHeldPage} disabled={currentHeldPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-blue-700 disabled:opacity-50 text-green-500 font-semibold" >

                    Prev
                  </button>
                  <button onClick={nextHeldPage} disabled={currentHeldPage * itemsPerPageHeld >= coinHeldData.length} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-blue-700 disabled:opacity-50 text-green-500 font-semibold"  >
                    Next
                  </button>
                </div> */}


              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    ) : (
      <div className="p-4 text-center text-red-500">
      Profile does not exist. Please connect with your account to create a profile.
      </div>
    )
  };


    </>
  );
};




// export default Profile;

