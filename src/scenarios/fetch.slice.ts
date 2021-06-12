import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from './fetch.model';

export interface FetchState {
  user?: User;
}

const initialState: FetchState = {};

export const fetchSlice = createSlice({
  name: 'fetch',
  initialState,
  reducers: {
    fetchUser: (_state, _action: PayloadAction<{ id: string }>) => {},
    setUser: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
    },
  },
});
