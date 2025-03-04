import { SessionProvider } from 'next-auth/react';
import { AppProps } from 'next/app';
import { Session } from 'next-auth';
import '../styles/globals.css'; // Import global styles
import { ThemeProvider } from 'next-themes';

// Modify the props type to include the session
function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps<{ session: Session }>) {
  return (
    <SessionProvider session={session}>
       <ThemeProvider attribute="class">
        <Component {...pageProps} />
     </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp;
