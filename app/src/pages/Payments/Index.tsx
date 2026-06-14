import { type ReactElement } from "react";
import { Container } from "@mui/material";

import { useTranslation } from "../../hooks/useTranslation";
import DashboardMenuHeader from "../../shared/DashboardMenuHeader";
import PaymentsList from "./List";

const PaymentsIndex = (): ReactElement => {
  const { t } = useTranslation();
  const title = t("pages.payments.title");
  const description = t("pages.payments.subtitle");

  return (
    <Container maxWidth="xl" disableGutters>
      <DashboardMenuHeader title={title} description={description} />
      <PaymentsList />
    </Container>
  );
};

export default PaymentsIndex;
