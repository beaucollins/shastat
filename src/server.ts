import { createServer, Server } from 'http';
import { format } from 'util';

import { createPool } from './data/createPool';
import { createDatabaseGateway } from './data/gateway';
import { Gateways } from './data/gateways';
import { createGitHubGateway } from './data/github';
import { createService } from './service';
import { createAuthGateway, createKeyProvider } from './userIdentity';

export const listen = (gateways: Gateways, port: number | string): Server => {
  const service = createService(gateways);
  return createServer((request, response) => service(request, response)).listen(port);
};

if (require.main === module) {
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  const gateways: Gateways = {
    db: createDatabaseGateway(createPool()),
    gitHub: createGitHubGateway({
      gitHubAppCert: process.env.GITHUB_APP_CERT!,
      gitHubAppId: process.env.GITHUB_APP_ID!,
    }),
    auth: createAuthGateway(createKeyProvider(process.env.SHASTAT_IDENTITY_CERT!)),
  };
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  const http = listen(gateways, process.env['PORT'] ?? '6000').on('listening', () => {
    process.stderr.write(format('Listening %o\n', http.address()));
  });
}
