import { createSlice, PayloadAction } from '@reduxjs/toolkit'
type InitialState = {
    value: ChainState;
}

type ChainState = {
    
    chainType: string;
    


}
const initialState = {
    value: {
       chainType:"sei",

    } as ChainState,
} as InitialState;


export const chain = createSlice({

    name: "auth",
    initialState,
    reducers: {
        logOut: () =>{
            return initialState;
        },
        logIn: (state, action: PayloadAction<string>) =>{

            return{
                value:{
                    
                    chainType: action.payload,
                   
                }
            }
        }
    },

});

export const {logIn,logOut} = chain.actions;
export default chain.reducer;