import React, { createContext, useContext, useMemo, useState } from 'react';

type DrawerCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const Ctx = createContext<DrawerCtx | null>(null);

export const useAppDrawer = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppDrawer must be used inside AppDrawerProvider');
  return v;
};

export const AppDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      openDrawer: () => setOpen(true),
      closeDrawer: () => setOpen(false),
    }),
    [open]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};