import { type ReactElement, type ReactNode } from "react";
import { UsersManagementEntityTitleContext } from "./usersManagementEntityTitleContext";

export function UsersManagementEntityTitleProvider({
  entityTitle,
  children,
}: {
  entityTitle: string;
  children: ReactNode;
}): ReactElement {
  return (
    <UsersManagementEntityTitleContext.Provider value={entityTitle}>
      {children}
    </UsersManagementEntityTitleContext.Provider>
  );
}
