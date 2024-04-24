import { useWeb3Modal } from '@web3modal/ethers/react'

export default function ConnectButton() {
  // 4. Use modal hook
  const { open } = useWeb3Modal()

  return (
    <>
      <button 
      className={`w-40 h-8 rounded-full bg-[#EED12E] text-black hover:text-white text-sm font-medium leading-5`}
      onClick={() => open()}>Connect Wallet</button>
      <button 
      className={`w-40 h-8 rounded-full bg-[#EED12E] text-black hover:text-white text-sm font-medium leading-5`}
      onClick={() => open({ view: 'Networks' })}>Network</button>
    </>
  )
}