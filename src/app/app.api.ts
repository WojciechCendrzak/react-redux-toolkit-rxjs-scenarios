import { fakeAsync } from '../logic/fakeAsync';
import { User, Entity, Product } from './app.model';

export const fetchApi = {
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
};

export type FetchApi = typeof fetchApi;
