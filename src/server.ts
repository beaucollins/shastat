import { createServer, Server } from 'http';
import { format } from 'util';
import { createPool } from './data/createPool';
import { createDatabaseGateway, Gateway } from './data/gateway';
import { createService } from './service';

export const listen = (gateway: Gateway, port: number | string): Server => {
  const service = createService(gateway);
  return createServer((request, response) => service(request, response)).listen(port);
};

if (require.main === module) {
  const http = listen(createDatabaseGateway(createPool()), process.env['PORT'] ?? '6000').on('listening', () => {
    process.stderr.write(format('Listening %o\n', http.address()));
  });
}
