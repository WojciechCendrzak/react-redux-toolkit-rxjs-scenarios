import { EpicDependencies } from './app.epics.type';
import { appSlice } from './app.slice';
import { TestScheduler } from 'rxjs/testing';
import { StateObservable } from 'redux-observable';
import { of } from 'rxjs';
import { User } from './app.model';
import { fetchUserEpic$ } from '../scenarios/fetch.epic.test';

const {
  actions: { fetchUser, setUser },
} = appSlice;

describe(fetchUserEpic$.name, () => {
  it('', () => {
    const testScheduler = new TestScheduler((actual, expected) => {
      expect(JSON.stringify(actual, null, 2)).toBe(
        JSON.stringify(expected, null, 2)
      );
    });

    const user: User = {
      id: '123',
      firstName: 'first name',
      lastName: 'last name',
    };

    testScheduler.run(({ hot, cold, expectObservable }) => {
      const action$ = hot('-a', { a: fetchUser({ id: '123' }) });
      const state$ = new StateObservable(of(), null);
      const dependencies = {
        fetchApi: { fetchUser: (id: string) => cold('-a', { a: user }) },
      } as unknown as EpicDependencies;

      const output$ = fetchUserEpic$(action$, state$, dependencies);

      expectObservable(output$).toBe('--a', { a: setUser({ user }) });
    });
  });
});
