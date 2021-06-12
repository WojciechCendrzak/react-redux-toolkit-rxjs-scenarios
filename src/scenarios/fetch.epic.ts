import { combineEpics } from 'redux-observable';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { RootEpic } from '../app/app.epics.type';
import { fetchApi } from './fetch.api';
import { fetchSlice } from './fetch.slice';

const fetch$: RootEpic = (action$) =>
  action$.pipe(
    filter(fetchSlice.actions.fetchUser.match),
    map((action) => action.payload.id),
    switchMap((id) => fetchApi.fetchUser(id)),
    map((user) => fetchSlice.actions.setUser({ user }))
  );

export const fetchEpic$ = combineEpics(fetch$);
