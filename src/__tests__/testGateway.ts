import { Gateway } from '../data/gateway';
import { GitHubGateway } from '../data/github';
import { notImplemented } from '../data/notImplemented';
import { AuthGateway } from '../userIdentity';

export const override = <T extends Record<string, unknown>>(imp: T) => (overrides: Partial<T>): T => {
  return {
    ...imp,
    ...overrides,
  };
};

export const defaultTestGateway: Gateway = {
  getFoo: notImplemented(),
  getFooForSha: notImplemented(),
  createFoo: notImplemented(),
};

export const overrideGateway = override(defaultTestGateway);

export const defaultTestGitHubGateway: GitHubGateway = {
  getInstallations: notImplemented(),
  getApp: notImplemented(),
  getAuthenticatedUser: notImplemented(),
  getAuthenticatedUserOrganizations: notImplemented(),
  exchangeOAuthCode: notImplemented(),
};

export const overrideGithubGateway = override(defaultTestGitHubGateway);

export const defaultTestAuthGateway: AuthGateway = {
  verifyToken: () => Promise.reject('Bad token'),
};

export const overrideAuth = override(defaultTestAuthGateway);
