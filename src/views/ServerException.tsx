import React from 'react';

export const ServerException = ({ error }: { error: Error }) => (
  <html>
    <head>
      <title>Server Exception: {error.message}</title>
    </head>
    <p>⚠️: {error.message}</p>
    <pre>{error.stack}</pre>
  </html>
);
