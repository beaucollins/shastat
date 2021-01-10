import { Endpoint, exactPath, jsonResponse, route, routes, serve } from '@fracture/serve';
import { Gateway } from './data/gateway';

import { queryFoo } from './data/params';
import { alphaNumeric, get, mapRoute, numeric, param, path, post, routePath } from './path';
import { notImplemented } from './response';

export const createService = (gateway: Gateway): Endpoint =>
  serve(
    routes(
      /**
       * Request /greet/alice/from/bob
       */
      routePath(path('/greet/', param('name', alphaNumeric), '/from/', param('from', alphaNumeric)), {
        GET: ([, name, , from]) => jsonResponse(200, {}, { message: 'some pattern', name: name[2], from: from[2] }),
        POST: ([, name, , from]) => jsonResponse(201, {}, { whatsup: 'doc', name: name[2], from: from[2] }),
      }),
      /**
       * GET /foo/:id
       */
      route(
        mapRoute(
          path('/foo/', param('id', alphaNumeric)),
          queryFoo(([, fooId]) => fooId[2], gateway.getFoo),
        ),
        (result) =>
          result[0] === 'found'
            ? jsonResponse(200, {}, { foo: result[1] })
            : jsonResponse(404, {}, { status: 'not_found', id: result[1], error: result[2].message }),
      ),
      /**
       * POST /foo
       */
      route(post(path('/foo')), (_p, _req) => {
        return notImplemented();
      }),
      /**
       * Request /add/1/to/1
       */
      route(
        get(path('/add/', param('left', numeric), '/to/', param('right', numeric))),
        ([_method, [_, left, __, right]]) => jsonResponse(200, {}, { sum: left[2] + right[2] }),
      ),
      /**
       * Request /hello
       */
      route(get(exactPath('/hello')), () => jsonResponse(200, {}, { hello: 'world' })),
    ),
    /**
     * Default 404
     */
    () => jsonResponse(404, {}, { status: 'Not Found folks' }),
  );
