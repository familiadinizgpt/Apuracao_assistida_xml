'use client';

import { createContext, useContext } from 'react';
import type { AccessSummary } from '@/lib/access';

const AccessContext = createContext<AccessSummary>({
  hasAccess: false,
  label: 'Acesso não liberado',
  xmlLimit: 0,
});

export function AccessProvider({
  value,
  children,
}: {
  value: AccessSummary;
  children: React.ReactNode;
}) {
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  return useContext(AccessContext);
}
