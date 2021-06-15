import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { FetchApi } from './app.api';
import { StoreState } from './app.reducers';

export type EpicDependencies = {
  fetchApi: FetchApi;
};

export type RootEpic = Epic<Action, Action, (StoreState | null), EpicDependencies>;
