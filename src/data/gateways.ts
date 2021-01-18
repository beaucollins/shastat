import { AuthGateway } from '../userIdentity';
import { Gateway } from './gateway';
import { GitHubGateway } from './github';

export interface Gateways {
  db: Gateway;
  gitHub: GitHubGateway;
  auth: AuthGateway;
}
