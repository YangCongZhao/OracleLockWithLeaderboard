import "./globals.css";
import Header from "@/app/components/Header";
import { cookieToInitialState } from 'wagmi'
import { headers } from 'next/headers'
import { getConfig } from '../config/wagmi'
import { Providers } from './components/Providers'
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const initialState = cookieToInitialState(
        getConfig(),
        (await headers()).get('cookie')
    )
  return (
    <html lang="en">
      <body>
      <Providers initialState={initialState}>
          <Header />
          <div >{children}</div> {/* 预留 header 高度 */}
      </Providers>
      </body>
    </html>
  );
}
