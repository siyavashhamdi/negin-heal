import { useContext } from "react";
import { UsersManagementEntityTitleContext } from "./usersManagementEntityTitleContext";

export function useUsersManagementEntityTitle(): string {
  return useContext(UsersManagementEntityTitleContext);
}
