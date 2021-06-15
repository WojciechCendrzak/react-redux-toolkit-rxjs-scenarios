import { fakeAsync } from '../logic/fakeAsync';
import { User, UserId } from './app.model';

export const fetchApi = {
  login: (payload: { login: string; password: string }) =>
    fakeAsync<UserId>({
      id: '1',
    }),
  fetchUser: (id: string) =>
    fakeAsync<User>({ id, firstName: 'first name', lastName: 'last name' }),
  uploadPhoto: (file: File) =>
    fakeAsync<{ url: string }>({ url: '//some-photo' }),
};

export type FetchApi = typeof fetchApi;
