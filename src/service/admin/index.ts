import { route, routes, jsonResponse, Handler } from '@fracture/serve';
import { mapResult } from '@fracture/parse';
import { Gateways } from '../../data/gateways';
import { path, param, matchRest, paramValue, get } from '../../path';
import { Admin } from './Admin';
import { AppInfo } from './AppInfo';
import { inLayout } from '../../inLayout';
import { Layout } from './Layout';
import { createElement } from 'react';

function identity<T>(value: T): T {
  return value;
}

const adminLayout = inLayout(Layout);

/**
 * /admin/*
 */
export const admin = <T extends string>({ gitHub }: Gateways, prefix: T): Handler =>
  route(path(prefix, param('rest', matchRest)), async ([_admin, rest], request) =>
    mapResult(
      await routes(
        route(get(path('/apps')), async (_path) =>
          adminLayout(200, {}, createElement(Admin, { installations: await gitHub.getInstallations() }), {
            pageTitle: 'Installations',
          }),
        ),
        route(get(path('/users')), () => jsonResponse(200, {}, { lol: 'son' })),
        route(get(path('/info')), async () =>
          adminLayout(200, {}, createElement(AppInfo, { app: await gitHub.getApp() }), {
            pageTitle: '',
          }),
        ),
      )({
        ...request,
        url: `/${paramValue(rest)}`,
      }),
      identity,
      (failure) => jsonResponse(400, {}, { status: prefix, reason: failure.reason }),
    ),
  );
