import { type ReactElement } from "react";
import { Container } from "@mui/material";

import DashboardMenuHeader from "../../shared/DashboardMenuHeader";
import { useTranslation } from "../../hooks/useTranslation";
import SupportList from "./List";

const SupportTicketsIndex = (): ReactElement => {
  const { t } = useTranslation();
  const title = t("pages.support.title");
  const description = t("pages.support.subtitle");

  return (
    <Container maxWidth="xl" disableGutters>
      <DashboardMenuHeader title={title} description={description} />
      <SupportList />
    </Container>
  );
};

export default SupportTicketsIndex;
