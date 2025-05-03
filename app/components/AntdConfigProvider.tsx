'use client';

import React from 'react';
import { ConfigProvider } from 'antd';

interface AntdConfigProviderProps {
  children: React.ReactNode;
}

const AntdConfigProvider: React.FC<AntdConfigProviderProps> = ({ children }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          // You can customize the theme here
          colorPrimary: '#1677ff',
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdConfigProvider;
