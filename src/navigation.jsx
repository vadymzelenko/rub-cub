import { createContext, useContext } from 'react';

export const NavContext = createContext({
  navigate: () => {},
  back: () => {},
  home: () => {},
  canGoBack: false,
});

export const useNav = () => useContext(NavContext);
