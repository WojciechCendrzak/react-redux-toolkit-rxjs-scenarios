import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, User } from './app.model';

export interface AppState {
  user?: User;
  photoUrls?: string[];
  producById: Record<string, Product>;
  messages: string[];
  products?: Product[];
  selectedProduct?: Product;
}

export const initialAppState: AppState = {
  producById: {},
  messages: [],
};

export const appSlice = createSlice({
  name: 'app',
  initialState: initialAppState,
  reducers: {
    ping: () => {},
    pong: () => {},
    endGame: () => {},
    login: (
      _state,
      _action: PayloadAction<{ login: string; password: string }>
    ) => {},
    fetchUser: (_state, _action: PayloadAction<{ id: string }>) => {},
    setUser: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
    },
    fetchProduct: (_state, _action: PayloadAction<{ id: string }>) => {},
    setProduct: (state, action: PayloadAction<{ product: Product }>) => {
      const { product } = action.payload;
      state.producById[product.id] = product;
    },
    fetchSelectedProduct: (
      _state,
      _action: PayloadAction<{ id: string }>
    ) => {},
    setSelectedProduct: (
      state,
      action: PayloadAction<{ product: Product }>
    ) => {
      state.selectedProduct = action.payload.product;
    },
    uploadPhotos: (_state, _action: PayloadAction<{ files: File[] }>) => {},
    setPhotos: (state, action: PayloadAction<{ photoUrls: string[] }>) => {
      state.photoUrls = action.payload.photoUrls;
    },
    logout: () => {},
    reset: () => initialAppState,
    navigateHome: () => {},
    startListeningFromWebSocket: () => {},
    setMessage: (state, action: PayloadAction<{ message: string }>) => {
      state.messages.push(action.payload.message);
    },
    searchProduct: (
      _state,
      _action: PayloadAction<{ searchPhrase: string }>
    ) => {},
    setProducts: (state, action: PayloadAction<{ products: Product[] }>) => {
      state.products = action.payload.products;
    },
  },
});
