import { Endpoint, Response, exactPath, jsonResponse, route, routes, serve, Handler } from '@fracture/serve';
import { isSuccess, mapResult, success } from '@fracture/parse';
import { Gateway } from './data/gateway';
import { Readable } from 'stream';
import { renderToNodeStream } from 'react-dom/server';
import { createElement } from 'react';
import { OutgoingHttpHeaders } from 'http';
import { ServerStyleSheet } from 'styled-components';

import { resourceFromParam, whenFound } from './data/params';
import { CreateFooBody, parseBody, parseJson } from './parseBody';
import { alphaNumeric, get, mapRoute, matchRest, numeric, param, paramValue, path, post, routePath } from './path';
import { matchRoute } from './matchRoute';
import { Admin, ServerException } from './views';
import { GitHubGateway } from './data/github';

export interface Gateways {
  db: Gateway;
  gitHub: GitHubGateway;
}

export const createService = ({ db, gitHub }: Gateways): Endpoint =>
  serve(
    errorHandler(
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
              resourceFromParam(db.getFooForSha, ([, sha]) => paramValue(sha)),
            ),

            /**
             * GET /foo/:id
             */
            mapRoute(
              path('/foo/', param('id', alphaNumeric)),
              resourceFromParam(db.getFoo, ([, fooId]) => paramValue(fooId)),
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
            return db.createFoo(result.value).then(
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
              route(path('/apps'), async () =>
                htmlDocument(200, {}, createElement(Admin, { installations: await gitHub.getInstallations() })),
              ),
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
    ),

    /**
     * Default 404
     */
    () => jsonResponse(404, {}, { status: 'Not Found folks' }),
  );

async function readBuffer(stream: NodeJS.ReadableStream) {
  const buffers: Buffer[] = [];
  for await (const chunk of stream) {
    buffers.push(Buffer.from(chunk));
  }
  return Buffer.concat(buffers);
}

async function htmlDocument(status: number, headers: OutgoingHttpHeaders, view: React.ReactElement): Promise<Response> {
  const sheet = new ServerStyleSheet();
  try {
    const jsx = sheet.collectStyles(view);
    const stream = sheet.interleaveWithNodeStream(renderToNodeStream(jsx));
    const html = await readBuffer(stream);
    return [
      status,
      { ...headers, 'content-type': 'text/html;charset=utf-8', 'content-length': html.length },
      Readable.from(html),
    ];
  } finally {
    sheet.seal();
  }
}

function errorHandler(handler: Handler): Handler {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error : new Error(`Unknown error: ${error}`);
      return success(await htmlDocument(500, {}, createElement(ServerException, { error: reason })));
    }
  };
}
