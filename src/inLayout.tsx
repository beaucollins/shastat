import { Response } from '@fracture/serve';

import { OutgoingHttpHeaders } from 'http';
import React from 'react';
import { htmlDocument } from './htmlDocument';

type LayoutProps = { children?: React.ReactNode };

export function renderView<P extends Record<string, unknown>>(
  code: number,
  headers: OutgoingHttpHeaders,
  element: React.ReactElement<P>,
): Promise<Response> {
  return htmlDocument(code, headers, element);
}

export function renderViewInLayout<P extends Record<string, unknown>, L extends LayoutProps>(
  status: number,
  headers: OutgoingHttpHeaders,
  element: React.ReactElement<P>,
  Layout: React.ComponentType<L>,
  layoutProps: Omit<L, 'children'>,
): Promise<Response> {
  const props = {
    ...layoutProps,
    children: element,
  } as L;
  return renderView(status, headers, <Layout {...props} />);
}

export function inLayout<L extends LayoutProps>(Layout: React.ComponentType<L>) {
  return function viewInLayout<P extends Record<string, unknown>>(
    status: number,
    headers: OutgoingHttpHeaders,
    element: React.ReactElement<P>,
    layoutProps: Omit<L, 'children'>,
  ): Promise<Response> {
    return renderViewInLayout(status, headers, element, Layout, layoutProps);
  };
}
