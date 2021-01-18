import React from 'react';
import { GitHubApp } from '../../data/github';

export type Props = {
  app: GitHubApp;
};

export const AppInfo = ({ app }: Props) => (
  <>
    <h1>Info</h1>
    <pre>{JSON.stringify(app, null, ' ')}</pre>
  </>
);
