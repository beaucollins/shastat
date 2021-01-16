import React from 'react';

export const Header = () => (
  <div>
    <h1>I am the header</h1>
  </div>
);
export const Admin = () => (
  <>
    <html>
      <body>
        <Header />
        <p>Hello 🌍</p>
        <Env />
      </body>
    </html>
  </>
);

const Env = () => {
  return (
    <ul>
      {Object.entries(process.env).map(([key, value]) => (
        <li key={key}>
          <code>{key}</code>: {value}
        </li>
      ))}
    </ul>
  );
};
