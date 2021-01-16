import { Gateway } from '../data/gateway';
import { GitHubGateway } from '../data/github';

function notImplemented<T extends unknown[], R>(reason = 'not implemented') {
  return (..._args: T): Promise<R> => Promise.reject(new Error(reason));
}

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
};

export const overrideGithubGateway = (overrides: Partial<GitHubGateway>): GitHubGateway => ({
  ...defaultTestGitHubGateway,
  ...overrides,
});
