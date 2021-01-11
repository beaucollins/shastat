import { Gateway } from '../data/gateway';

export const defaultTestGateway: Gateway = {
  getFoo: () => Promise.reject(new Error('lol')),
};

export const overrideGateway = (overrides: Partial<Gateway>): Gateway => ({
  ...defaultTestGateway,
  ...overrides,
});
