import React from 'react';

export type Props = {
  gitHubAuthURL: string;
  children?: React.ReactNode;
};

export const Login = ({ gitHubAuthURL, children }: Props) => <a href={gitHubAuthURL}>{children ?? 'Sign In'}</a>;
