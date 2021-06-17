import { fakeAsync } from '../logic/fakeAsync';
import { User, Entity, Product } from './app.model';

export const api = {
  login: (payload: { login: string; password: string }) =>
    fakeAsync<Entity>({
      id: '1',
    }),
  fetchUser: (id: string) =>
    fakeAsync<User>({ id, firstName: 'first name', lastName: 'last name' }),
  fetchProduct: (id: string) =>
    fakeAsync<Product>({ id, name: 'product name' }),
  uploadPhoto: (file: File) =>
    fakeAsync<{ url: string }>({ url: '//some-photo' }),
  logout: () => fakeAsync(),
  startWebSocketClient: () => new WebSocket('ws://localhost:8080'),
  searchProducts: (searchPhrase: string) =>
    fakeAsync<Product[]>([{ id: '1', name: `${searchPhrase} 1` }]),
};

export type Api = typeof api;
