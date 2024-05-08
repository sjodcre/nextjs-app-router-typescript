import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../_redux/store';
import { setSlippage } from '../_redux/features/user-slice';

interface SlippageDialogProps {
  open: boolean;
  onDialogClose: () => void;
  // onSetSlippage: (slippage: string) => void; // Callback to pass slippage to parent

}

const SlippageDialog: React.FC<SlippageDialogProps> = ({ open, onDialogClose }) => {
  const slippageRedux = useAppSelector((state) => state.userReducer.value.slippage);
  const [slippageUI, setSlippageUI] = useState(slippageRedux);
  const dispatch = useDispatch<AppDispatch>();

  const handleSlippageSet = () => {
    // onSetSlippage(slippage);
    dispatch(setSlippage(slippageUI))
    onDialogClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onDialogClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[400px] translate-x-[-50%] 
        translate-y-[-50%] gap-4 border border-slate-200 p-6 shadow-lg sm:rounded-lg dark:border-slate-800 
        dark:bg-slate-950 bg-primary text-white text-center duration-200 data-[state=open]:animate-in 
        data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
        data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 
        data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 
        data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg dark:border-slate-800 dark:bg-slate-950 bg-black 
        text-white text-center max-w-[400px]">
          <div className="grid gap-2 w-fit justify-self-center">
            <Dialog.Title>Set max. slippage (%)</Dialog.Title>
            <input
                className="bg-[#2a2a3b] border border-slate-200 rounded-md p-2 w-fit justify-self-center"
                type="number"
                id = "slippage"
                value={slippageUI}
                onChange={(e) => setSlippageUI(Number(e.target.value))}
            />
            <div className="text-xs">
                This is the maximum amount of slippage you are willing to accept when placing trades
            </div>
            <Dialog.Close onClick= {handleSlippageSet} className="text-slate-50 hover:font-bold hover:text-slate-50 cursor-pointer w-fit justify-self-center">
                Close
            </Dialog.Close>
          </div>
          
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SlippageDialog;