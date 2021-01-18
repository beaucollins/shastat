import { Octokit } from '@octokit/rest';
import { components } from '@octokit/openapi-types';
import { sign } from 'jsonwebtoken';

export type GitHubInstallation = components['schemas']['installation'];

export type GitHubApp = components['schemas']['integration'];

export interface GitHubGateway {
  getInstallations(): Promise<GitHubInstallation[]>;
  getApp(): Promise<GitHubApp>;
}

function api<T, Input extends unknown[], Return extends { data: T }>(
  method: (header: { authorization: string }, ...input: Input) => Promise<Return>,
): (...input: Input) => Promise<T> {
  return (...args) =>
    createGitHubJWT()
      .then((header) => method(header, ...args))
      .then((r) => r.data);
}

export function createGitHubGateway(): GitHubGateway {
  const octokit = new Octokit({
    userAgent: `cocollc-devops/${process.env.VERSION ?? `dev`}`,
  });
  return {
    getInstallations: api((auth) =>
      octokit.apps.listInstallations({
        headers: { ...auth },
      }),
    ),
    getApp: api((auth) => octokit.apps.getAuthenticated({ headers: { ...auth } })),
  };
}

function createGitHubJWT(): Promise<{ authorization: string }> {
  return new Promise((resolve, reject) => {
    sign(
      { foo: 'bar' },
      process.env.GITHUB_APP_CERT!,
      { algorithm: 'RS256', expiresIn: '5 minutes', issuer: process.env.GITHUB_APP_ID! },
      (error, encoded) => {
        if (error != null) {
          reject(error);
          return;
        }
        if (encoded == null) {
          reject(new Error('Failed to sign'));
          return;
        }
        resolve({ authorization: `bearer ${encoded}` });
      },
    );
  });
}
