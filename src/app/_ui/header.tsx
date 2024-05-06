"use client"
import Link from 'next/link';

const Header = () => {

    const profile = "0x742d35cc6634c0532925a3b844bc454e4438f44e"; 

  return (
    <header className=" text-white py-4 flex justify-between items-center">
      <div className="container mx-auto">
       
      </div>
      <div className="mr-4">
        <Link href={`/profile/${profile}`}>
         | View Profile |
        </Link>
      </div>
    </header>
  );
};

export default Header;