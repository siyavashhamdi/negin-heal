import { type ReactElement } from "react";
import { Container } from "@mui/material";
import DashboardMenuHeader from "../../shared/DashboardMenuHeader";
import { useTranslation } from "../../hooks/useTranslation";
import UsersManagementList from "./List";
import { UsersManagementEntityTitleProvider } from "./UsersManagementEntityContext";

const UsersManagementIndex = (): ReactElement => {
  const { t } = useTranslation();
  const title = t("pages.usersManagement.title");
  const description = t("pages.usersManagement.subtitle", { title });

  return (
    <UsersManagementEntityTitleProvider entityTitle={title}>
      <Container maxWidth="xl" disableGutters>
        <DashboardMenuHeader title={title} description={description} />
        <UsersManagementList />
      </Container>
    </UsersManagementEntityTitleProvider>
  );
};

export default UsersManagementIndex;
