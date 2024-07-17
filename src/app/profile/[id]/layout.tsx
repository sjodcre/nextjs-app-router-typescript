export default function Layout({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex flex-col justify-center items-center h-screen" >
        {/* <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div> */}
        {children}
      </div>
    );
  }