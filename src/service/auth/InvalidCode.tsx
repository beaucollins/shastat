import React from 'react';

type Props = {
  error: Error;
};

export const InvalidCode = ({ error }: Props) => (
  <p>
    Invalid code: {error.message} <a href="/login">Try again</a>.
  </p>
);
