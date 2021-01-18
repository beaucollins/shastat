import { route, routes, jsonResponse, Handler, Responder, Response } from '@fracture/serve';
import React from 'react';
import { mapResult } from '@fracture/parse';
import { parse as parseCookie } from 'cookie';
import { Gateways } from '../../data/gateways';
import { path, param, matchRest, paramValue, get } from '../../path';
import { Admin } from './Admin';
import { AppInfo } from './AppInfo';
import { inLayout } from '../../inLayout';
import { Layout } from './Layout';
import { Readable } from 'stream';
import { UserToken } from '../../userIdentity';

function identity<T>(value: T): T {
  return value;
}

const adminLayout = inLayout(Layout);

function authenticated<T>(
  verifyToken: (token: string) => Promise<UserToken>,
  handler: Responder<{ token: UserToken; context: T }>,
): Responder<T> {
  const notAuthorized: Responder<T> = () => [403, {}, Readable.from('Not Authorized')];
  return async (context, request) => {
    try {
      if (request.headers.cookie == null) {
        throw new Error('token not present');
      }
      const token = await verifyToken(parseCookie(request.headers.cookie).token);
      return handler({ context, token }, request);
    } catch (error) {
      return notAuthorized(context, request);
    }
  };
}

/**
 * /admin/*
 */
export const admin = <T extends string>({ gitHub, auth }: Gateways, prefix: T): Handler =>
  route(
    path(prefix as string, param('rest', matchRest)),
    authenticated(auth.verifyToken, async ({ token, context: [_admin, rest] }, request) =>
      mapResult(
        await routes(
          route(get(path('/apps')), async (_path) =>
            adminLayout(200, {}, <Admin installations={await gitHub.getInstallations()} />, {
              pageTitle: 'Installations',
            }),
          ),
          route(get(path('/users')), () => jsonResponse(200, {}, { lol: 'son' })),
          route(get(path('/info')), async () =>
            adminLayout(200, {}, <AppInfo app={await gitHub.getApp()} />, {
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
    ),
  );
