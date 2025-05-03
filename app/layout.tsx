import '@ant-design/v5-patch-for-react-19';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import "./globals.css";
import AntdConfigProvider from './components/AntdConfigProvider';

export const metadata = {
  title: 'A2A Chat',
  description: 'Agent-to-Agent Chat Application',
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AntdRegistry>
          <AntdConfigProvider>
            {children}
          </AntdConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
