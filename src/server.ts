import { exactPath, jsonResponse, route, routes, serve } from '@fracture/serve';
import { createServer } from 'http';
import { format } from 'util';
import { alphaNumeric, numeric, param, path } from './path';

export const service = serve(
  routes(
    /**
     * Request /greet/alice/from/bob
     */
    route(
      path('/greet/', param('name', alphaNumeric), '/from/', param('from', alphaNumeric)),
      ([, name, , from], _req) => jsonResponse(200, {}, { message: 'some pattern', name: name[2], from: from[2] }),
    ),
    /**
     * Request /add/1/to/1
     */
    route(path('/add/', param('left', numeric), '/to/', param('right', numeric)), ([_, left, __, right]) =>
      jsonResponse(200, {}, { sum: left[2] + right[2] }),
    ),
    /**
     * Request /hello
     */
    route(exactPath('/hello'), () => jsonResponse(200, {}, { hello: 'world' })),
  ),
  /**
   * Default 404
   */
  () => jsonResponse(404, {}, { status: 'Not Found folks' }),
);

export const listen = (port: number | string) => {
  return createServer((request, response) => service(request, response)).listen(port);
};

if (require.main === module) {
  const http = listen(process.env['PORT'] ?? '6000').on('listening', () => {
    process.stderr.write(format('Listening %o\n', http.address()));
  });
}
