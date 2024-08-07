import { createSlice, PayloadAction } from '@reduxjs/toolkit'
type InitialState = {
    value: ChainState;
}

type ChainState = {
    
    chainType: string;
    


}
const initialState = {
    value: {
       chainType:"ftm",

    } as ChainState,
} as InitialState;


export const chain = createSlice({

    name: "chain",
    initialState,
    reducers: {
        resetChain: () =>{
            return initialState;
        },
        setChain: (state, action: PayloadAction<string>) =>{

            return{
                value:{
                    
                    chainType: action.payload,
                   
                }
            }
        }
    },

});

export const {setChain,resetChain} = chain.actions;
export default chain.reducer;