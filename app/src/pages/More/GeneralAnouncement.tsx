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
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent, type ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { GENERAL_ANOUNCEMENT_SEND_MUTATION } from "../../graphql/mutations/generalAnouncementSend.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import DashboardMenuHeader from "../../shared/DashboardMenuHeader";
import styles from "./styles/more.module.scss";

type GeneralAnouncementSendMutationResult = {
  readonly generalAnouncementSend: {
    readonly deliveredUsers: number;
    readonly activeSubscribedUsers: number;
  };
};

type GeneralAnouncementSendMutationVariables = {
  readonly input: {
    readonly title: string;
    readonly description: string;
    readonly mode: GeneralAnouncementMode;
  };
};

type GeneralAnouncementMode = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

const MAX_TITLE_LENGTH = 90;
const MAX_DESCRIPTION_LENGTH = 400;
const ANOUNCEMENT_MODE_OPTIONS: readonly {
  readonly value: GeneralAnouncementMode;
  readonly label: string;
}[] = [
  { value: "INFO", label: "اطلاع‌رسانی" },
  { value: "SUCCESS", label: "موفقیت" },
  { value: "WARNING", label: "هشدار" },
  { value: "ERROR", label: "خطا" },
];

function renderModeIcon(mode: GeneralAnouncementMode): ReactElement {
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

const GeneralAnouncement = (): ReactElement => {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<GeneralAnouncementMode>("INFO");
  const [lastDelivery, setLastDelivery] =
    useState<GeneralAnouncementSendMutationResult["generalAnouncementSend"] | null>(null);
  const [sendGeneralAnouncement, sendResult] = useMutationWithSnackbar<
    GeneralAnouncementSendMutationResult,
    GeneralAnouncementSendMutationVariables
  >(GENERAL_ANOUNCEMENT_SEND_MUTATION, {
    successMessage: "اعلام عمومی برای کاربران فعال ارسال شد.",
    errorMessage: "ارسال اعلام عمومی انجام نشد.",
    onSuccess: (data) => {
      setLastDelivery(data.generalAnouncementSend);
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
  const previewTitle = trimmedTitle || "عنوان اعلام اینجا نمایش داده می‌شود";
  const previewDescription =
    trimmedDescription || "متن اعلام قبل از ارسال، با همین ظاهر برای کاربران نمایش داده می‌شود.";
  const previewModeClassName = styles[`generalAnouncementPreview${mode}`] ?? "";
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

    void sendGeneralAnouncement({
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
        title="ارسال اعلام عمومی"
        description="ارسال اعلام زنده برای کاربران فعال و مشترک در کانال عمومی"
        backTo={APP_SHELL_ROUTES.more}
        backLabel="بازگشت به سایر"
      />

      <Paper className={styles.generalAnouncementPanel} component="form" onSubmit={handleSubmit}>
        <Box className={styles.generalAnouncementIcon}>
          <CampaignRoundedIcon />
        </Box>

        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              متن اعلام مدیر
            </Typography>
            <Typography variant="body2" color="text.secondary">
              این پیام فقط به کاربران دارای اتصال فعال ارسال می‌شود.
            </Typography>
          </Box>

          <TextField
            label="عنوان اعلام"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            inputProps={{ maxLength: MAX_TITLE_LENGTH }}
            helperText={`${title.length}/${MAX_TITLE_LENGTH}`}
            fullWidth
            required
          />

          <TextField
            label="متن اعلام"
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
            onChange={(event) => setMode(event.target.value as GeneralAnouncementMode)}
            fullWidth
          >
            {ANOUNCEMENT_MODE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Box className={styles.generalAnouncementPreviewBlock}>
            <Typography variant="subtitle2" fontWeight={800}>
              پیش‌نمایش اعلام
            </Typography>
            <div className={`${styles.generalAnouncementPreview} ${previewModeClassName}`}>
              <span className={styles.generalAnouncementPreviewGlow} aria-hidden="true" />
              <span className={styles.generalAnouncementPreviewIcon} aria-hidden="true">
                {renderModeIcon(mode)}
              </span>
              <div className={styles.generalAnouncementPreviewContent}>
                <strong>{previewTitle}</strong>
                <p>{previewDescription}</p>
              </div>
            </div>
          </Box>

          {lastDelivery ? (
            <Alert severity="success">
              اعلام به {lastDelivery.deliveredUsers} کاربر فعال ارسال شد. کاربران فعال مشترک در لحظه
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
            ارسال اعلام عمومی
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default GeneralAnouncement;
