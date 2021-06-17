import { Action } from 'redux';
import { Epic } from 'redux-observable';
import { Api } from './app.api';
import { StoreState } from './app.reducers';

export type EpicDependencies = {
  api: Api;
};

export type RootEpic = Epic<
  Action,
  Action,
  StoreState | null,
  EpicDependencies
>;
