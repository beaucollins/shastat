import React from 'react';
import styled from 'styled-components';
import type { GitHubInstallation } from './data/github';

const HeaderDiv = styled.div`
  background: red;
`;

export const Header = () => (
  <HeaderDiv>
    <h1>I am the header</h1>
  </HeaderDiv>
);
export const Admin = ({ installations }: { installations: GitHubInstallation[] }) => (
  <html>
    <head>
      <title>Hi</title>
    </head>
    <Header />
    <p>Hello 🌍</p>
    <ul>
      {installations.map((installation) => (
        <li key={installation.id}>
          <img width={25} height={25} src={installation.account?.avatar_url} />
          <strong>{installation.account?.login}</strong> {installation.account?.name}
          <> </>
          {installation.html_url}
          <a href={installation.repositories_url}>Repos</a>
          <pre>{JSON.stringify(installation, null, ' ')}</pre>
        </li>
      ))}
    </ul>
  </html>
);

export const ServerException = ({ error }: { error: Error }) => (
  <html>
    <head>
      <title>Server Exception: {error.message}</title>
    </head>
    <p>⚠️: {error.message}</p>
    <pre>{error.stack}</pre>
  </html>
);
