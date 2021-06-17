import { Action } from '@reduxjs/toolkit';
import { createEpicMiddleware } from 'redux-observable';
import { configureStore } from '@reduxjs/toolkit';
import { reducers } from './app.reducers';
import { appEpic$ } from './app.epic';
import { appSlice } from './app.slice';
import { EpicDependencies } from './app.epics.type';
import { api } from './app.api';

const epicDependencies: EpicDependencies = {
  api: api,
};

const epicMiddleware = createEpicMiddleware<Action, Action>({
  dependencies: epicDependencies,
});

export const store = configureStore({
  reducer: reducers,
  middleware: [epicMiddleware],
});

epicMiddleware.run(appEpic$ as any);

store.dispatch(appSlice.actions.fetchUser({ id: '1' }));
