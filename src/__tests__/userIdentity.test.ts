import { createReadStream } from 'fs';
import { resolve } from 'path';
import { GitHubAccessToken, GitHubOrganization, GitHubUser } from '../data/github';
import { readBuffer } from '../parseBody';
import { createAuthGateway, createKeyProvider, sessionTokenForAccessToken } from '../userIdentity';
import { overrideGateway, overrideGithubGateway } from './testGateway';

describe('userIdentity', () => {
  const pem = createReadStream(resolve(__dirname, '../jwt/__tests__/key.pem'));
  const provider = readBuffer(pem).then((key) => createKeyProvider(key));

  it('creates a token', async () => {
    const authData: GitHubAccessToken = {
      access_token: 'ABCD',
      expires_in: '5 min',
      refresh_token: 'refresh-token',
      refresh_token_expires_in: 'now',
      scope: '',
      token_type: 'access_token',
    };

    const gateways = {
      auth: createAuthGateway(await provider),
      gitHub: overrideGithubGateway({
        getAuthenticatedUser: () => Promise.resolve({} as GitHubUser),
        getAuthenticatedUserOrganizations: () => Promise.resolve([{ login: 'cocollc' } as GitHubOrganization]),
      }),
      db: overrideGateway({}),
    };

    const token = await sessionTokenForAccessToken(gateways, authData);
    expect(token).toEqual(expect.any(String));
  });

  it('fails to create token when no matching organization', async () => {
    const authData: GitHubAccessToken = {
      access_token: 'ABCD',
      expires_in: '5 min',
      refresh_token: 'refresh-token',
      refresh_token_expires_in: 'now',
      scope: '',
      token_type: 'access_token',
    };

    const gateways = {
      auth: createAuthGateway(await provider),
      gitHub: overrideGithubGateway({
        getAuthenticatedUser: () => Promise.resolve({} as GitHubUser),
        getAuthenticatedUserOrganizations: () => Promise.resolve([{ login: 'other' } as GitHubOrganization]),
      }),
      db: overrideGateway({}),
    };

    await expect(sessionTokenForAccessToken(gateways, authData)).rejects.toThrow('Not member of approved organization');
  });

  it('signs and verifies tokens', async () => {
    const gateway = createAuthGateway(await provider);
    const token = await gateway.createToken(
      {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      } as GitHubAccessToken,
      { login: 'user_login' } as GitHubUser,
      { login: 'org_login', id: 1 } as GitHubOrganization,
    );

    const verified = await gateway.verifyToken(token);

    expect(verified).toEqual({
      iat: expect.any(Number),
      exp: expect.any(Number),
      iss: 'urn:pub.collins.shastat',
      'urn:com.github:organization_login': 'org_login',
      'urn:com.github:organization_id': 1,
      'urn:com.github:refresh_token': 'mock-refresh-token',
      'urn:com.github:access_token': 'mock-access-token',
    });
  });

  it('createKeyProvider', async () => {
    const provider = createKeyProvider('-----BEGIN RSA PRIVATE KEY-----\n-----END RSA PRIVATE KEY-----');
    await expect(provider()).rejects.toThrowError(/Failed to read private key/);
  });
});
