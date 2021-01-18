import React from 'react';
import { routes, route, jsonResponse, Request } from '@fracture/serve';
import { Parser, success, mapSuccess, mapFailure, mapResult, failure, objectOf, isString } from '@fracture/parse';
import { renderView } from '../../inLayout';
import { get, path } from '../../path';
import { Login } from './Login';
import { encode, parse } from 'querystring';
import { Gateways } from '../../data/gateways';
import { InvalidCode } from './InvalidCode';
import { Readable } from 'stream';
import { sessionTokenForAccessToken } from '../../userIdentity';
import { emptyBody } from '../../emptyBody';

const parseQueryString: Parser<Record<string, string | string[]>, Request> = ({ request }) => {
  const url = request.url;
  if (url == null) {
    return success({});
  }
  const index = url.indexOf('?');
  if (index === -1) {
    return success({});
  }
  return success(parse(url.slice(index + 1)));
};

function parseQuery<T>(parser: Parser<T, Record<string, unknown>>): Parser<T, Request> {
  return (request: Request) => {
    return mapSuccess(parseQueryString(request), (o) =>
      mapFailure(parser(o), ({ reason }) => failure(request, reason)),
    );
  };
}

const createAuthUrl = () =>
  `https://github.com/login/oauth/authorize?${encode({
    client_id: process.env.GITHUB_APP_CLIENT_ID,
    redirect_uri: 'http://localhost:6005/auth/validate',
  })}`;

const parseCode = parseQuery(objectOf({ code: isString }));

export const auth = (gateways: Gateways) =>
  routes(
    route(get(path('/login')), () => renderView(200, {}, <Login gitHubAuthURL={createAuthUrl()} />)),
    route(get(path('/auth/validate')), (_, request) =>
      mapResult(
        parseCode(request),
        async ({ code }) => {
          try {
            const authToken = await gateways.gitHub.exchangeOAuthCode(code);
            // Cookie this
            const token = await sessionTokenForAccessToken(gateways, authToken);
            return [301, { location: '/', 'Set-Cookie': `token=${token}; Path=/` }, emptyBody()];
          } catch (error) {
            return renderView(400, {}, <InvalidCode error={error} />);
          }
        },
        ({ reason }) => renderView(400, {}, <InvalidCode error={new Error(reason)} />),
      ),
    ),
  );
