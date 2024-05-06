import {configureStore} from '@reduxjs/toolkit';
import chainReducer from "./features/chain-slice";
import userReducer from "./features/user-slice";
import { TypedUseSelectorHook, useSelector } from 'react-redux';

export const store = configureStore({

    reducer: {
        chainReducer,
        userReducer,

    },

});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
