import { filter, map, mergeMap } from 'rxjs/operators';
import { EpicDependencies, RootEpic } from '../app/app.epics.type';
import { fetchSlice } from './fetch.slice';
import { TestScheduler } from 'rxjs/testing';
import { StateObservable } from 'redux-observable';
import { of } from 'rxjs';
import { User } from './fetch.model';

export const testFetchUserEpic$: RootEpic = (action$, _, { fetchApi }) =>
  action$.pipe(
    filter(fetchSlice.actions.fetchUser.match),
    mergeMap((action) => fetchApi.fetchUser(action.payload.id)),
    map((user) => fetchSlice.actions.setUser({ user }))
  );

describe('epic test', () => {
  it('testFetchUserEpic', () => {
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
      const action$ = hot('-a', {
        a: fetchSlice.actions.fetchUser({ id: '123' }),
      });
      const state$ = new StateObservable(of(), null);
      const dependencies = {
        fetchApi: {
          fetchUser: (id: string) =>
            cold('--a', {
              a: user,
            }),
        },
        // TODO: hack
      } as unknown as EpicDependencies;

      const output$ = testFetchUserEpic$(action$, state$, dependencies);

      expectObservable(output$).toBe('---a', {
        a: fetchSlice.actions.setUser({ user }),
      });
    });
  });
});
