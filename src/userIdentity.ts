import { Gateways } from './data/gateways';
import { GitHubAccessToken } from './data/github';
import { sign, verify } from 'jsonwebtoken';

export type UserIdentity = {
  name: string;
};

export type UserToken = Record<string, unknown>;

export type AuthGateway = {
  verifyToken(token: string): Promise<UserToken>;
};

// JWT encoding and decoding

const ALLOWED_ORGS = ['cocollc'];
const KEY = process.env.SHASTAT_IDENTITY_CERT!;

export async function sessionTokenForAccessToken(gateways: Gateways, auth: GitHubAccessToken): Promise<string> {
  auth.access_token;
  const user = await gateways.gitHub.getAuthenticatedUser(auth.access_token);
  const orgs = await gateways.gitHub.getAuthenticatedUserOrganizations(auth.access_token, user.login);
  const allowedOrg = orgs.find((org) => ALLOWED_ORGS.indexOf(org.login) > -1);
  if (allowedOrg == null) {
    return Promise.reject(new Error('Not member of approved organization'));
  }
  return createToken();
}

export function createToken(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    sign({}, KEY, { issuer: 'pub.collins.shastat' }, (error, encoded) => {
      if (error != null) {
        reject(error);
        return;
      }
      if (encoded == null) {
        reject(new Error('sign failed'));
        return;
      }
      resolve(encoded);
    });
  });
}

export function verifyToken(token: string): Promise<UserToken> {
  return new Promise((resolve, reject) =>
    verify(token, KEY, (error, decoded) => {
      if (error != null) {
        reject(error);
        return;
      }
      if (decoded == null) {
        reject(new Error('Failed to decode.'));
        return;
      }
      resolve(decoded as UserToken);
    }),
  );
}

export function createAuthGateway(): AuthGateway {
  return { verifyToken };
}
