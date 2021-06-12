import { Action } from '@reduxjs/toolkit';
import { createEpicMiddleware } from 'redux-observable';
import { configureStore } from '@reduxjs/toolkit';
import { reducers } from './app.reducers';
import { rootEpic$ } from './app.epic';
import { fetchSlice } from '../scenarios/fetch.slice';

const epicMiddleware = createEpicMiddleware<Action, Action>();

export const store = configureStore({
  reducer: reducers,
  middleware: [epicMiddleware],
});

epicMiddleware.run(rootEpic$ as any);

store.dispatch(fetchSlice.actions.fetchUser({ id: '1' }));
