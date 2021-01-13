import { Gateway } from '../data/gateway';

export const defaultTestGateway: Gateway = {
  getFoo: () => Promise.reject(new Error('This error intentionally left blank.')),
  getFooForSha: () => Promise.reject(new Error('This error intentionally left blank.')),
  createFoo: () => Promise.reject(new Error('This error intentionally left blank.')),
};

export const overrideGateway = (overrides: Partial<Gateway>): Gateway => ({
  ...defaultTestGateway,
  ...overrides,
});
