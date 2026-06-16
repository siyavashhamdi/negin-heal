import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent, type ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { GLOBAL_ANOUNCEMENT_SEND_MUTATION } from "../../graphql/mutations/globalAnouncementSend.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import DashboardMenuHeader from "../../shared/DashboardMenuHeader";
import NotificationActionFields, {
  EMPTY_NOTIFICATION_ACTION_FORM,
  buildNotificationActionPayloadFromForm,
  hasNotificationActionFormValue,
  isNotificationActionFormValid,
  type NotificationActionFormState,
} from "./NotificationActionFields";
import styles from "./styles/more.module.scss";

type GlobalAnouncementSendMutationResult = {
  readonly globalAnouncementSend: {
    readonly deliveredUsers: number;
    readonly activeSubscribedUsers: number;
  };
};

type GlobalAnouncementSendMutationVariables = {
  readonly input: {
    readonly title?: string;
    readonly description: string;
    readonly mode: NotificationMode;
    readonly messageType: GlobalAnouncementMessageType;
    readonly isPushNotification: boolean;
    readonly payload?: {
      readonly action?: {
        readonly label: string;
        readonly href: string;
      };
    };
  };
};

type NotificationMode = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
type GlobalAnouncementMessageType = "POPUP" | "SNACKBAR";

const MAX_TITLE_LENGTH = 90;
const MAX_DESCRIPTION_LENGTH = 400;
const ANOUNCEMENT_MODE_OPTIONS: readonly {
  readonly value: NotificationMode;
  readonly label: string;
}[] = [
  { value: "INFO", label: "اطلاع‌رسانی" },
  { value: "SUCCESS", label: "موفقیت" },
  { value: "WARNING", label: "هشدار" },
  { value: "ERROR", label: "خطا" },
];

const ANOUNCEMENT_MESSAGE_TYPE_OPTIONS: readonly {
  readonly value: GlobalAnouncementMessageType;
  readonly label: string;
}[] = [
  { value: "POPUP", label: "پاپ‌آپ" },
  { value: "SNACKBAR", label: "اسنک‌بار" },
];

const GlobalAnouncement = (): ReactElement => {
  const { user } = useAuth();
  const { showError } = useSnackbar();
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<NotificationMode>("INFO");
  const [messageType, setMessageType] = useState<GlobalAnouncementMessageType>("POPUP");
  const [isPushNotification, setIsPushNotification] = useState(false);
  const [actionForm, setActionForm] = useState<NotificationActionFormState>(
    EMPTY_NOTIFICATION_ACTION_FORM,
  );
  const [lastDelivery, setLastDelivery] =
    useState<GlobalAnouncementSendMutationResult["globalAnouncementSend"] | null>(null);
  const [sendGlobalAnouncement, sendResult] = useMutationWithSnackbar<
    GlobalAnouncementSendMutationResult,
    GlobalAnouncementSendMutationVariables
  >(GLOBAL_ANOUNCEMENT_SEND_MUTATION, {
    successMessage: "اعلان عمومی برای کاربران فعال ارسال شد.",
    errorMessage: "ارسال اعلان عمومی انجام نشد.",
    onSuccess: (data) => {
      setLastDelivery(data.globalAnouncementSend);
      setTitle("");
      setDescription("");
      setMode("INFO");
      setMessageType("POPUP");
      setIsPushNotification(false);
      setActionForm(EMPTY_NOTIFICATION_ACTION_FORM);
    },
  });

  if (!isSuperAdmin) {
    return <Navigate to={APP_SHELL_ROUTES.more} replace />;
  }

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const isTitleRequired = messageType === "POPUP";
  const previewTitle = messageType === "POPUP" ? trimmedTitle : "";
  const previewDescription = trimmedDescription;
  const previewAction = buildNotificationActionPayloadFromForm(actionForm);
  const hasPartialAction = hasNotificationActionFormValue(actionForm);
  const canSubmit =
    (!isTitleRequired || trimmedTitle.length > 0) &&
    trimmedDescription.length > 0 &&
    (!isTitleRequired || title.length <= MAX_TITLE_LENGTH) &&
    description.length <= MAX_DESCRIPTION_LENGTH &&
    isNotificationActionFormValid(actionForm) &&
    !sendResult.loading;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    if (hasPartialAction && !previewAction) {
      showError("برای فعال شدن دکمه اقدام، هم عنوان و هم آدرس لینک را وارد کنید.");
      return;
    }

    void sendGlobalAnouncement({
      variables: {
        input: {
          ...(messageType === "POPUP" && trimmedTitle ? { title: trimmedTitle } : {}),
          description: trimmedDescription,
          mode,
          messageType,
          isPushNotification,
          ...(previewAction ? { payload: { action: previewAction } } : {}),
        },
      },
    });
  };

  return (
    <Container maxWidth="md" disableGutters>
      <DashboardMenuHeader
        title="ارسال اعلان عمومی"
        description="ارسال اعلان زنده برای کاربران فعال و مشترک در کانال عمومی"
        backTo={APP_SHELL_ROUTES.more}
        backLabel="بازگشت به سایر"
      />

      <Paper className={styles.globalAnouncementPanel} component="form" onSubmit={handleSubmit}>
        <Box className={styles.globalAnouncementIcon}>
          <CampaignRoundedIcon />
        </Box>

        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              متن اعلان مدیر
            </Typography>
            <Typography variant="body2" color="text.secondary">
              این پیام فقط به کاربران دارای اتصال فعال ارسال می‌شود.
            </Typography>
          </Box>

          <TextField
            select
            label="نوع پیام"
            value={messageType}
            onChange={(event) => setMessageType(event.target.value as GlobalAnouncementMessageType)}
            fullWidth
          >
            {ANOUNCEMENT_MESSAGE_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {messageType === "POPUP" ? (
            <TextField
              label="عنوان اعلان"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              inputProps={{ maxLength: MAX_TITLE_LENGTH }}
              helperText={`${title.length}/${MAX_TITLE_LENGTH}`}
              fullWidth
              required
            />
          ) : null}

          <TextField
            label="متن اعلان"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            inputProps={{ maxLength: MAX_DESCRIPTION_LENGTH }}
            helperText={`${description.length}/${MAX_DESCRIPTION_LENGTH}`}
            fullWidth
            required
            multiline
            minRows={5}
          />

          <TextField
            select
            label="حالت نمایش"
            value={mode}
            onChange={(event) => setMode(event.target.value as NotificationMode)}
            fullWidth
          >
            {ANOUNCEMENT_MODE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <FormControlLabel
            control={
              <Switch
                checked={isPushNotification}
                onChange={(event) => setIsPushNotification(event.target.checked)}
              />
            }
            label="ارسال همزمان به عنوان پوش نوتیفیکیشن"
          />

          <NotificationActionFields value={actionForm} onChange={setActionForm} />

          <Box className={styles.globalAnouncementPreviewBlock}>
            <Typography variant="subtitle2" fontWeight={800}>
              پیش‌نمایش اعلان
            </Typography>
            {messageType === "POPUP" ? (
              <aside
                className={[
                  "main-layout__general-update-popup",
                  styles.globalAnouncementPopupPreview,
                  `main-layout__general-update-popup--${
                    mode === "WARNING"
                      ? "warning"
                      : mode === "ERROR"
                        ? "error"
                        : mode === "SUCCESS"
                          ? "success"
                          : "info"
                  }`,
                ].join(" ")}
                role={mode === "ERROR" ? "alert" : "status"}
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="main-layout__general-update-popup-glow" aria-hidden="true" />
                <div className="main-layout__general-update-popup-icon" aria-hidden="true">
                  {mode === "SUCCESS" ? (
                    <CheckCircleOutlineRoundedIcon fontSize="small" />
                  ) : mode === "WARNING" ? (
                    <WarningAmberRoundedIcon fontSize="small" />
                  ) : mode === "ERROR" ? (
                    <ErrorOutlineRoundedIcon fontSize="small" />
                  ) : (
                    <InfoOutlinedIcon fontSize="small" />
                  )}
                </div>
                <div className="main-layout__general-update-popup-content">
                  {previewTitle ? <h3>{previewTitle}</h3> : null}
                  {previewDescription ? <p>{previewDescription}</p> : null}
                  {previewAction ? (
                    <Button
                      size="small"
                      variant="contained"
                      className="main-layout__general-update-popup-action"
                      disabled
                    >
                      {previewAction.label}
                    </Button>
                  ) : null}
                </div>
                <IconButton
                  className="main-layout__general-update-popup-close"
                  aria-label="بستن اعلان"
                  size="small"
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </aside>
            ) : (
              <Alert
                severity={
                  mode === "WARNING"
                    ? "warning"
                    : mode === "ERROR"
                      ? "error"
                      : mode === "SUCCESS"
                        ? "success"
                        : "info"
                }
                variant="filled"
              >
                {previewTitle ? (
                  <>
                    <strong>{previewTitle}</strong>: {previewDescription}
                  </>
                ) : (
                  previewDescription
                )}
              </Alert>
            )}
          </Box>

          {lastDelivery ? (
            <Alert severity="success">
              اعلان به {lastDelivery.deliveredUsers} کاربر فعال ارسال شد. کاربران فعال مشترک در لحظه
              ارسال: {lastDelivery.activeSubscribedUsers}
            </Alert>
          ) : (
            <Alert severity="info">
              کاربران بسته یا آفلاین پیام زنده دریافت نمی‌کنند؛ فقط نشست‌های فعال مشترک هدف قرار
              می‌گیرند.
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SendRoundedIcon />}
            disabled={!canSubmit}
          >
            ارسال اعلان عمومی
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default GlobalAnouncement;
