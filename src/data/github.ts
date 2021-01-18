import { Octokit } from '@octokit/rest';
import { Parser, objectOf, isString, mapResult } from '@fracture/parse';
import { components } from '@octokit/openapi-types';
import { request } from 'https';
import { encode, parse } from 'querystring';
import { readBuffer } from '../parseBody';
import SignJWT from 'jose/jwt/sign';
import { createPrivateKey } from 'crypto';

export type GitHubInstallation = components['schemas']['installation'];

export type GitHubApp = components['schemas']['integration'];
export type GitHubUser = components['schemas']['public-user' | 'private-user'];
export type GitHubOrganization = components['schemas']['organization-simple'];
export type GitHubAccessToken = {
  access_token: string;
  expires_in: string;
  refresh_token: string;
  refresh_token_expires_in: string;
  scope: string;
  token_type: string;
};

const parseAccessToken: Parser<GitHubAccessToken> = objectOf({
  access_token: isString,
  expires_in: isString,
  refresh_token: isString,
  refresh_token_expires_in: isString,
  scope: isString,
  token_type: isString,
});

export type GitHubGateway = {
  getInstallations(): Promise<GitHubInstallation[]>;
  getApp(): Promise<GitHubApp>;
  getAuthenticatedUserOrganizations(accessToken: string, username: string): Promise<GitHubOrganization[]>;
  getAuthenticatedUser(accessToken: string): Promise<GitHubUser>;
  exchangeOAuthCode(code: string): Promise<GitHubAccessToken>;
};

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
    exchangeOAuthCode: (code) => {
      return new Promise((resolve, reject) => {
        const body = encode({
          code,
          client_id: process.env.GITHUB_APP_CLIENT_ID,
          client_secret: process.env.GITHUB_APP_CLIENT_SECRET,
        });
        const tokenRequest = request({
          method: 'POST',
          host: 'github.com',
          path: '/login/oauth/access_token',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'content-length': body.length,
          },
        })
          .on('error', reject)
          .on('response', async (response) => {
            if (response.statusCode != 200) {
              return reject(new Error(`Not a doctor: ${response.statusCode}`));
            }
            const body = await readBuffer(response);
            mapResult(parseAccessToken(parse(body.toString('utf-8'))), resolve, ({ value }) =>
              reject(new Error(value.error_description ?? 'Unknown failure.')),
            );
          });
        tokenRequest.end(body);
      });
    },

    async getAuthenticatedUser(code) {
      const user = await octokit.users
        .getAuthenticated({
          headers: { authorization: `token ${code}` },
        })
        .then((r) => r.data);

      return user;
    },

    getAuthenticatedUserOrganizations(accessToken, username) {
      return octokit.orgs
        .listForUser({ headers: { authorization: `token ${accessToken}` }, username })
        .then((response) => response.data);
    },
  };
}

function createGitHubJWT(): Promise<{ authorization: string }> {
  const privateKey = createPrivateKey({ key: process.env.GITHUB_APP_CERT!, format: 'pem' });
  return new SignJWT({ foo: 'bar' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(process.env.GITHUB_APP_ID!)
    .setIssuedAt()
    .setExpirationTime('5 minutes')
    .sign(privateKey)
    .then((encoded) => ({ authorization: `bearer ${encoded}` }));
}
