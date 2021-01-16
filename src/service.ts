import { Endpoint, Response, exactPath, jsonResponse, route, routes, serve } from '@fracture/serve';
import { isSuccess, mapResult } from '@fracture/parse';
import { Gateway } from './data/gateway';
import { Readable } from 'stream';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { OutgoingHttpHeaders } from 'http';

import { resourceFromParam, whenFound } from './data/params';
import { CreateFooBody, parseBody, parseJson } from './parseBody';
import { alphaNumeric, get, mapRoute, matchRest, numeric, param, paramValue, path, post, routePath } from './path';
import { matchRoute } from './matchRoute';
import { Admin } from './views';

export const createService = (gateway: Gateway): Endpoint =>
  serve(
    routes(
      /**
       * Request /greet/alice/from/bob
       */
      routePath(path('/greet/', param('name', alphaNumeric), '/from/', param('from', alphaNumeric)), {
        GET: ([, name, , from]) =>
          jsonResponse(200, {}, { message: 'some pattern', name: paramValue(name), from: paramValue(from) }),
        POST: ([, name, , from]) =>
          jsonResponse(201, {}, { whatsup: 'doc', name: paramValue(name), from: paramValue(from) }),
      }),

      route(
        matchRoute(
          /**
           * GET /foo/sha/:sha
           */
          mapRoute(
            path('/foo/sha/', param('sha', alphaNumeric)),
            resourceFromParam(gateway.getFooForSha, ([, sha]) => paramValue(sha)),
          ),

          /**
           * GET /foo/:id
           */
          mapRoute(
            path('/foo/', param('id', alphaNumeric)),
            resourceFromParam(gateway.getFoo, ([, fooId]) => paramValue(fooId)),
          ),
        ),
        whenFound(
          (foo) => jsonResponse(200, {}, { foo }),
          (id, error) => jsonResponse(404, {}, { status: 'not_found', id, error: error.message }),
        ),
      ),

      /**
       * POST /foo
       */
      route(post(path('/foo')), async (_p, req) => {
        const result = await parseBody(req, parseJson(CreateFooBody));
        if (isSuccess(result)) {
          return gateway.createFoo(result.value).then(
            (foo) => jsonResponse(201, {}, { foo }),
            (error) => jsonResponse(424, {}, { error: error.message }),
          );
        }
        return jsonResponse(424, {}, { error: result.reason });
      }),

      /**
       * Request /add/1/to/1
       */
      route(
        get(path('/add/', param('left', numeric), '/to/', param('right', numeric))),
        ([_method, [_, left, __, right]]) => jsonResponse(200, {}, { sum: paramValue(left) + paramValue(right) }),
      ),

      /**
       * Request /hello
       */
      route(get(exactPath('/hello')), () => jsonResponse(200, {}, { hello: 'world' })),

      /**
       * /admin/*
       */
      route(path('/admin/', param('rest', matchRest)), async ([_admin, rest], request) =>
        mapResult(
          await routes(
            route(path('/apps'), () => htmlDocument(200, {}, createElement(Admin))),
            route(path('/users'), () => jsonResponse(200, {}, { lol: 'son' })),
          )({
            ...request,
            url: `/${paramValue(rest)}`,
          }),
          (response) => response,
          (failure) => jsonResponse(400, {}, { status: 'wtf', reason: failure.reason }),
        ),
      ),
    ),

    /**
     * Default 404
     */
    () => jsonResponse(404, {}, { status: 'Not Found folks' }),
  );

function htmlDocument(status: number, headers: OutgoingHttpHeaders, view: React.ReactElement): Response {
  const html = Buffer.from(renderToStaticMarkup(view), 'utf-8');
  return [
    status,
    { ...headers, 'content-type': 'text/html;charset=utf-8', 'content-length': html.length },
    Readable.from(html),
  ];
}
