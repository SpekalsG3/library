import React from 'react';

import '@styles/globals.css';
import '@styles/variables.css';

import Head from 'next/head';
import { AppProps } from 'next/app';
import { LayersProvider } from "../components/ux/layers";

export default function App ({
    pageProps,
    Component,
}: AppProps) {
  return (
    <>
      <Head>
        <title>SkillPath</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.ico" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
      </Head>
      <LayersProvider>
        <Component {...pageProps} />
      </LayersProvider>
    </>
  );
}
