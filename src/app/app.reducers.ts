import { appSlice, AppState } from './app.slice';

export interface StoreState {
  fetch: AppState;
}

export const reducers = {
  fetch: appSlice.reducer,
};
