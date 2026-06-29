import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Box, Button, Typography } from "@mui/material";
import { type ReactElement } from "react";
import { Link as RouterLink } from "react-router-dom";

import { useTranslation } from "../hooks/useTranslation";
import {
  NOTIFICATION_SOURCE_LABEL,
  type NotificationSource,
} from "../pages/Notifications/notifications-list.api";
import { inferNotificationSourceFromPayload } from "../utilities/infer-notification-source.util";
import { resolveNotificationActionPayload } from "../utilities/notification-action.util";
import { resolveNotificationProductLink } from "../utilities/notification-product-link.util";

export type NotificationSnackbarContentProps = {
  readonly title: string;
  readonly message: string;
  readonly payload: Record<string, unknown> | null;
  readonly source?: NotificationSource | null;
};

const actionButtonSx = {
  alignSelf: "flex-end",
  minWidth: 0,
  px: 1,
  py: 0.25,
  fontSize: "0.75rem",
  lineHeight: 1.35,
  fontWeight: 500,
  borderColor: "rgba(255, 255, 255, 0.72)",
  color: "inherit",
  gap: 0.35,
  "&:hover": {
    borderColor: "#fff",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
} as const;

const sourceBadgeSx = {
  display: "inline-flex",
  alignItems: "center",
  px: 0.75,
  py: 0.125,
  borderRadius: 999,
  fontSize: "0.6875rem",
  lineHeight: 1.35,
  fontWeight: 600,
  backgroundColor: "rgba(255, 255, 255, 0.16)",
} as const;

function NotificationActionButton({
  label,
  href,
}: {
  readonly label: string;
  readonly href: string;
}): ReactElement {
  if (href.startsWith("/")) {
    return (
      <Button
        color="inherit"
        size="small"
        variant="outlined"
        component={RouterLink}
        to={href}
        endIcon={<ArrowBackRoundedIcon sx={{ fontSize: "0.9rem !important" }} />}
        sx={actionButtonSx}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      color="inherit"
      size="small"
      variant="outlined"
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      endIcon={<ArrowBackRoundedIcon sx={{ fontSize: "0.9rem !important" }} />}
      sx={actionButtonSx}
    >
      {label}
    </Button>
  );
}

export function NotificationSnackbarContent({
  title,
  message,
  payload,
  source,
}: NotificationSnackbarContentProps): ReactElement {
  const { t } = useTranslation();
  const resolvedSource = source ?? inferNotificationSourceFromPayload(payload);
  const productLink = resolvedSource
    ? resolveNotificationProductLink(resolvedSource, payload)
    : null;
  const customAction = resolveNotificationActionPayload(payload ?? undefined);
  const shouldShowMessage = message.trim() !== title.trim();
  const isChapterReleaseNotification = resolvedSource === "PRODUCT_CHAPTER";
  const showChapterAction = isChapterReleaseNotification && productLink != null;
  const showPaymentAction = resolvedSource === "PAYMENT" && productLink != null;
  const productLinkActionLabel = productLink
    ? t(`pages.notifications.${productLink.actionLabel}.action`)
    : null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 0.5,
        width: "100%",
      }}
    >
      <Typography component="span" variant="body2" fontWeight={600} sx={{ width: "100%" }}>
        {title}
      </Typography>

      {showChapterAction && productLink && productLinkActionLabel ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            alignItems: "center",
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <Box component="span" sx={sourceBadgeSx}>
            {NOTIFICATION_SOURCE_LABEL.PRODUCT_CHAPTER}
          </Box>
          <NotificationActionButton label={productLinkActionLabel} href={productLink.href} />
        </Box>
      ) : null}

      {shouldShowMessage || showPaymentAction ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 0.5,
            width: "100%",
          }}
        >
          {shouldShowMessage ? (
            <Typography component="span" variant="body2" sx={{ width: "100%" }}>
              {message}
            </Typography>
          ) : null}
          {showPaymentAction && productLink && productLinkActionLabel ? (
            <NotificationActionButton label={productLinkActionLabel} href={productLink.href} />
          ) : null}
        </Box>
      ) : null}

      {!showChapterAction && !showPaymentAction && customAction ? (
        <NotificationActionButton label={customAction.label} href={customAction.href} />
      ) : null}
    </Box>
  );
}
