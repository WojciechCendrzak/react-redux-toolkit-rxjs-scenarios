import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from './app.model';

export interface AppState {
  user?: User;
  photoUrls?: string[];
}

export const initialAppState: AppState = {};

export const appSlice = createSlice({
  name: 'app',
  initialState: initialAppState,
  reducers: {
    ping: () => {},
    pong: () => {},
    endGate: () => {},
    login: (
      _state,
      _action: PayloadAction<{ login: string; password: string }>
    ) => {},
    fetchUser: (_state, _action: PayloadAction<{ id: string }>) => {},
    setUser: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
    },
    uploadPhotos: (_state, _action: PayloadAction<{ files: File[] }>) => {},
    setPhotos: (state, action: PayloadAction<{ photoUrls: string[] }>) => {
      state.photoUrls = action.payload.photoUrls;
    },
  },
});
