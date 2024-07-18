import { createSlice, PayloadAction } from '@reduxjs/toolkit'
type InitialState = {
    value: UserState;
}

type UserState = {
    
    user: string;
    slippage: number;
    tokenBalance: number;
    nativeTokenBalance: number;
    


}
const initialState = {
    value: {
        user: '',
       slippage:1,
       tokenBalance: 0,
       nativeTokenBalance: 0,

    } as UserState,
} as InitialState;


export const user = createSlice({

    name: "user",
    initialState,
    reducers: {
        resetUser: () =>{
            return initialState;
        },
        logIn: (state, action: PayloadAction<string>) =>{

            return{
                value: {
                    ...state.value,
                    user: action.payload,
                    slippage: 1,
                    tokenBalance: 0,
                    nativeTokenBalance: 0,
                  }
            }
        },
        setNativeTokenBalance: (state, action: PayloadAction<number>) => {
            state.value.nativeTokenBalance = action.payload;
          },
        setSlippage: (state, action:PayloadAction<number>) => {
            state.value.slippage = action.payload
        },
    },

});

export const {logIn,setSlippage, resetUser, setNativeTokenBalance} = user.actions;
export default user.reducer;