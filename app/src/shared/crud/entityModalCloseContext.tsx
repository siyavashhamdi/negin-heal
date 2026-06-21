import { createContext, useContext } from "react";

const EntityModalCloseContext = createContext<(() => void) | null>(null);

export const EntityModalCloseProvider = EntityModalCloseContext.Provider;

export function useEntityModalRequestClose(): (() => void) | null {
  return useContext(EntityModalCloseContext);
}
