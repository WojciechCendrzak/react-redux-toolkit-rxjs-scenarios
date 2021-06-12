import { fetchSlice, FetchState } from '../scenarios/fetch.slice';

export interface StoreState {
  fetch: FetchState;
}

export const reducers = {
  fetch: fetchSlice.reducer,
};
