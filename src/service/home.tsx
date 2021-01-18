import { route } from '@fracture/serve';
import React from 'react';
import { renderView } from '../inLayout';
import { get, path } from '../path';

const Home = () => (
  <>
    Hello. <a href="/login">Sign In</a>.
  </>
);

export const home = route(get(path('/')), () => renderView(200, {}, <Home />));
