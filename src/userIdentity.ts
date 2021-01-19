import { createPrivateKey, KeyObject } from 'crypto';
import jwtDecrypt, { JWTPayload } from 'jose/jwt/decrypt';
import EncryptJWT from 'jose/jwt/encrypt';
import { Gateways } from './data/gateways';
import { GitHubAccessToken, GitHubOrganization, GitHubUser } from './data/github';

export type KeyProvider = () => Promise<KeyObject>;

export type UserIdentity = {
  name: string;
};

export type UserToken = JWTPayload;

export type AuthGateway = {
  verifyToken(token: string): Promise<UserToken>;
  createToken(accessToken: GitHubAccessToken, user: GitHubUser, org: GitHubOrganization): Promise<string>;
};

// JWT encoding and decoding

const ALLOWED_ORGANIZATIONS = ['cocollc'];

const ISSUER = `urn:pub.collins.shastat`;

export async function sessionTokenForAccessToken(gateways: Gateways, auth: GitHubAccessToken): Promise<string> {
  auth.access_token;
  const user = await gateways.gitHub.getAuthenticatedUser(auth.access_token);
  const organizations = await gateways.gitHub.getAuthenticatedUserOrganizations(auth.access_token, user.login);
  const allowedOrg = organizations.find((organization) => ALLOWED_ORGANIZATIONS.indexOf(organization.login) > -1);
  if (allowedOrg == null) {
    return Promise.reject(new Error('Not member of approved organization'));
  }
  return gateways.auth.createToken(auth, user, allowedOrg);
}

function createToken(
  keyProvider: KeyProvider,
): (accessToken: GitHubAccessToken, user: GitHubUser, org: GitHubOrganization) => Promise<string> {
  return (accessToken, _user, organization) => {
    return keyProvider().then((key) =>
      new EncryptJWT({
        'urn:com.github:access_token': accessToken.access_token,
        'urn:com.github:organization_id': organization.id,
        'urn:com.github:organization_login': organization.login,
        'urn:com.github:refresh_token': accessToken.refresh_token,
      })
        .setProtectedHeader({ alg: 'RSA-OAEP', enc: 'A256GCM' })
        .setIssuedAt()
        .setIssuer(ISSUER)
        .setExpirationTime('60 min')
        .encrypt(key),
    );
  };
}

function verifyToken(keyProvider: KeyProvider): (token: string) => Promise<UserToken> {
  return (token) =>
    keyProvider().then((key) => jwtDecrypt(token, key, { issuer: ISSUER }).then((token) => token.payload));
}

export function createKeyProvider(): KeyProvider {
  const key = new Promise<KeyObject>((resolve, reject) => {
    try {
      const key = process.env.SHASTAT_IDENTITY_CERT!;
      resolve(createPrivateKey({ key, format: 'pem' }));
    } catch (error) {
      reject(error);
    }
  });

  return () => key;
}

export function createAuthGateway(keyProvider: KeyProvider): AuthGateway {
  return {
    verifyToken: verifyToken(keyProvider),
    createToken: createToken(keyProvider),
  };
}
