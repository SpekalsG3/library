import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import Link from 'next/link';

export default class MyDocument extends Document {
  static async getInitialProps (ctx: any) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render () {
    return (
      <Html lang="en">
        <Head>
            <link rel="preload" href="/fonts/font_material_symbols_outlined.woff2" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}