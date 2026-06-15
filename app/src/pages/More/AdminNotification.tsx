import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";
import { useState, type FormEvent, type ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { ADMIN_NOTIFICATION_SEND_MUTATION } from "../../graphql/mutations/adminNotificationSend.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import DashboardMenuHeader from "../../shared/DashboardMenuHeader";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import styles from "./styles/more.module.scss";

type AdminNotificationSendMutationResult = {
  readonly adminNotificationSend: {
    readonly deliveredUsers: number;
    readonly activeSubscribedUsers: number;
  };
};

type AdminNotificationSendMutationVariables = {
  readonly input: {
    readonly title: string;
    readonly description: string;
    readonly mode: AdminNotificationMode;
  };
};

type AdminNotificationMode = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

const MAX_TITLE_LENGTH = 90;
const MAX_DESCRIPTION_LENGTH = 400;
const NOTIFICATION_MODE_OPTIONS: readonly {
  readonly value: AdminNotificationMode;
  readonly label: string;
}[] = [
  { value: "INFO", label: "اطلاع‌رسانی" },
  { value: "SUCCESS", label: "موفقیت" },
  { value: "WARNING", label: "هشدار" },
  { value: "ERROR", label: "خطا" },
];

function renderModeIcon(mode: AdminNotificationMode): ReactElement {
  switch (mode) {
    case "SUCCESS":
      return <CheckCircleOutlineRoundedIcon fontSize="small" />;
    case "WARNING":
      return <WarningAmberRoundedIcon fontSize="small" />;
    case "ERROR":
      return <ErrorOutlineRoundedIcon fontSize="small" />;
    case "INFO":
    default:
      return <InfoOutlinedIcon fontSize="small" />;
  }
}

const AdminNotification = (): ReactElement => {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<AdminNotificationMode>("INFO");
  const [lastDelivery, setLastDelivery] =
    useState<AdminNotificationSendMutationResult["adminNotificationSend"] | null>(null);
  const [sendAdminNotification, sendResult] = useMutationWithSnackbar<
    AdminNotificationSendMutationResult,
    AdminNotificationSendMutationVariables
  >(ADMIN_NOTIFICATION_SEND_MUTATION, {
    successMessage: "اعلان عمومی برای کاربران فعال ارسال شد.",
    errorMessage: "ارسال اعلان عمومی انجام نشد.",
    onSuccess: (data) => {
      setLastDelivery(data.adminNotificationSend);
      setTitle("");
      setDescription("");
      setMode("INFO");
    },
  });

  if (!isSuperAdmin) {
    return <Navigate to={APP_SHELL_ROUTES.more} replace />;
  }

  const trimmedTitle = title.trim();
  const trimmedDescription = description.trim();
  const previewTitle = trimmedTitle || "عنوان اعلان اینجا نمایش داده می‌شود";
  const previewDescription =
    trimmedDescription || "متن اعلان قبل از ارسال، با همین ظاهر برای کاربران نمایش داده می‌شود.";
  const previewModeClassName = styles[`adminNotificationPreview${mode}`] ?? "";
  const canSubmit =
    trimmedTitle.length > 0 &&
    trimmedDescription.length > 0 &&
    title.length <= MAX_TITLE_LENGTH &&
    description.length <= MAX_DESCRIPTION_LENGTH &&
    !sendResult.loading;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    void sendAdminNotification({
      variables: {
        input: {
          title: trimmedTitle,
          description: trimmedDescription,
          mode,
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

      <Paper className={styles.adminNotificationPanel} component="form" onSubmit={handleSubmit}>
        <Box className={styles.adminNotificationIcon}>
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
            label="عنوان اعلان"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            inputProps={{ maxLength: MAX_TITLE_LENGTH }}
            helperText={`${title.length}/${MAX_TITLE_LENGTH}`}
            fullWidth
            required
          />

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
            label="نوع نمایش پاپ‌آپ"
            value={mode}
            onChange={(event) => setMode(event.target.value as AdminNotificationMode)}
            fullWidth
          >
            {NOTIFICATION_MODE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Box className={styles.adminNotificationPreviewBlock}>
            <Typography variant="subtitle2" fontWeight={800}>
              پیش‌نمایش اعلان
            </Typography>
            <div className={`${styles.adminNotificationPreview} ${previewModeClassName}`}>
              <span className={styles.adminNotificationPreviewGlow} aria-hidden="true" />
              <span className={styles.adminNotificationPreviewIcon} aria-hidden="true">
                {renderModeIcon(mode)}
              </span>
              <div className={styles.adminNotificationPreviewContent}>
                <strong>{previewTitle}</strong>
                <p>{previewDescription}</p>
              </div>
            </div>
          </Box>

          {lastDelivery ? (
            <Alert severity="success">
              اعلان به {lastDelivery.deliveredUsers} کاربر فعال ارسال شد. کاربران فعال مشترک در
              لحظه ارسال: {lastDelivery.activeSubscribedUsers}
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

export default AdminNotification;
