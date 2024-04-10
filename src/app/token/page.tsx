"use client"

import {toast} from "sonner"
import ConnectButton from "../ui/connect-button";

export default function Page() {
    return (
      <main className="m-4">
        <button onClick={() => toast('Success')}
        className="px-5 py3 text-white bg-blue-500 rounded">Test Test</button>
        <ConnectButton/>
      </main>
    );
  }