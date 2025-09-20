
'use client';

import { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';

interface AdminTitleContextType {
  pageTitle: string;
  setPageTitle: Dispatch<SetStateAction<string>>;
}

export const AdminTitleContext = createContext<AdminTitleContextType | undefined>(undefined);

export const AdminTitleProvider = ({ children }: { children: ReactNode }) => {
  const [pageTitle, setPageTitle] = useState('Dashboard');

  return (
    <AdminTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </AdminTitleContext.Provider>
  );
};
