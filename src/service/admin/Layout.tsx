import React from 'react';
import styled from 'styled-components';

const HeaderDiv = styled.div`
  background: red;
`;

const Header = () => (
  <HeaderDiv>
    <h1>I am the header</h1>
    <nav>
      <li>
        <a href="/admin/apps">Installations</a>
        <a href="/admin/info">Info</a>
      </li>
    </nav>
  </HeaderDiv>
);

type LayoutProps = {
  pageTitle: string;
  children: React.ReactNode;
};

export const Layout = ({ children, pageTitle }: LayoutProps) => {
  return (
    <html>
      <head>
        <title>{pageTitle}</title>
        <Header />
      </head>
      <body>{children}</body>
    </html>
  );
};
