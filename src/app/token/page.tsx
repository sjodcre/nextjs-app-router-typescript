"use client"

export default function TokenLayout ({ params }: { params: { tokenAddress: string } }) {

  
  // if (!params || !params.tokenAddress) {
    // return <div>Loading token information...</div>;  // or "Error: Token not found" if it should never be undefined
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white">
          <h1 className="text-3xl font-bold mb-8">
              Uncharted Territory 404. Please navigate correctly!
          </h1>
          <img src="/skull-head.jpg" alt="Uncharted Territory" className="w-auto max-w-md" />
      </div>
  );
  
  // }
  } 