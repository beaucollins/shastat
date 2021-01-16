import { Octokit } from '@octokit/rest';
import { components } from '@octokit/openapi-types';
import { sign } from 'jsonwebtoken';

export type GitHubInstallation = components['schemas']['installation'];

export interface GitHubGateway {
  getInstallations(): Promise<GitHubInstallation[]>;
}

export function createGitHubGateway(): GitHubGateway {
  const octokit = new Octokit();
  return {
    getInstallations: async () => {
      const result = await octokit.apps.listInstallations({
        headers: { authorization: `bearer ${await createGitHubJWT()}` },
      });
      if (result.status !== 200) {
        throw new Error('Authentication failed');
      }
      return result.data;
    },
  };
}

function createGitHubJWT(): Promise<string> {
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
        resolve(encoded);
      },
    );
  });
}
