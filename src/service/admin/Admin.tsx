import React from 'react';
import { GitHubInstallation } from '../../data/github';

export const Admin = ({ installations }: { installations: GitHubInstallation[] }) => (
  <>
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
  </>
);
