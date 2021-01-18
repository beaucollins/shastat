import { Gateway } from '../data/gateway';
import { GitHubGateway } from '../data/github';
import { notImplemented } from '../data/notImplemented';

export const defaultTestGateway: Gateway = {
  getFoo: notImplemented(),
  getFooForSha: notImplemented(),
  createFoo: notImplemented(),
};

export const overrideGateway = (overrides: Partial<Gateway>): Gateway => ({
  ...defaultTestGateway,
  ...overrides,
});

export const defaultTestGitHubGateway: GitHubGateway = {
  getInstallations: notImplemented(),
  getApp: notImplemented(),
};

export const overrideGithubGateway = (overrides: Partial<GitHubGateway>): GitHubGateway => ({
  ...defaultTestGitHubGateway,
  ...overrides,
});
