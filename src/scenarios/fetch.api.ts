import { fakeAsync } from '../logic/fakeAsync';
import { User } from './fetch.model';

export const fetchApi = {
  fetchUser: (id: string) =>
    fakeAsync<User>({ id, firstName: 'first name', lastName: 'last name' }),
};
