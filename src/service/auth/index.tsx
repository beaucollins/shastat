import React from 'react';
import { routes, route } from '@fracture/serve';
import { mapResult, objectOf, isString } from '@fracture/parse';
import { renderView } from '../../inLayout';
import { get, path } from '../../path';
import { Login } from './Login';
import { encode } from 'querystring';
import { Gateways } from '../../data/gateways';
import { InvalidCode } from './InvalidCode';
import { sessionTokenForAccessToken } from '../../userIdentity';
import { emptyBody } from '../../emptyBody';
import { parseQuery } from '../../parseQuery';

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
