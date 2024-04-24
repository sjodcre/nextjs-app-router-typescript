import TokenLayout from "../page";

export default function TokenPage({ params }: { params: { tokenAddress: string } }) {
  console.log('token address: '+ params.tokenAddress)
  if (!params.tokenAddress || params.tokenAddress === "") {
    return <div>Error: Token not found</div>;  // Display error if tokenAddress is undefined or empty
  }
  return (
    <div style={{ display: 'grid', height: '100vh', gridTemplateRows: 'auto auto auto 1fr', alignItems: 'start' }}>
      <TokenLayout params={params}/>
    </div>
  )
}