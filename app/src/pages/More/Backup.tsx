import BackupRoundedIcon from "@mui/icons-material/BackupRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState, type FormEvent, type ReactElement } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { BACKUP_RUN_MUTATION } from "../../graphql/mutations/backupRun.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import DashboardMenuHeader from "../../shared/DashboardMenuHeader";
import { opaqueShellProps } from "../../shared/opaqueShell";
import styles from "./styles/more.module.scss";

type BackupTarget = "MONGODB" | "MINIO";

type BackupRunItem = {
  readonly target: BackupTarget;
  readonly archiveFileName: string;
  readonly archiveFormat: string;
  readonly archivePartCount: number;
  readonly formattedArchiveSize: string;
  readonly durationMs: number;
  readonly createdAt: string;
  readonly telegramDelivered: boolean;
  readonly telegramMessageId?: number | null;
  readonly telegramDeliveryNote?: string | null;
  readonly collectionCount?: number | null;
  readonly documentCount?: number | null;
  readonly objectCount?: number | null;
  readonly fileRecordCount?: number | null;
};

type BackupRunMutationResult = {
  readonly backupRun: {
    readonly items: readonly BackupRunItem[];
  };
};

type BackupRunMutationVariables = {
  readonly input: {
    readonly targets: readonly BackupTarget[];
  };
};

const BACKUP_TARGET_OPTIONS: readonly {
  readonly value: BackupTarget;
  readonly label: string;
  readonly description: string;
}[] = [
  {
    value: "MONGODB",
    label: "MongoDB",
    description: "خروجی JSON همه کالکشن‌ها در یک آرشیو RAR رمزدار",
  },
  {
    value: "MINIO",
    label: "MinIO",
    description: "فایل‌ها و متادیتا در یک آرشیو RAR رمزدار جداگانه",
  },
];

const formatDuration = (durationMs: number): string => {
  if (durationMs < 1000) {
    return `${durationMs} میلی‌ثانیه`;
  }

  const totalSeconds = durationMs / 1000;
  if (totalSeconds < 60) {
    return `${totalSeconds.toFixed(1)} ثانیه`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes} دقیقه و ${seconds} ثانیه`;
};

const formatTargetLabel = (target: BackupTarget): string =>
  target === "MONGODB" ? "MongoDB" : "MinIO";

const Backup = (): ReactElement => {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;
  const [selectedTargets, setSelectedTargets] = useState<readonly BackupTarget[]>(["MONGODB"]);
  const [lastResults, setLastResults] = useState<readonly BackupRunItem[]>([]);
  const [runBackup, runResult] = useMutationWithSnackbar<
    BackupRunMutationResult,
    BackupRunMutationVariables
  >(BACKUP_RUN_MUTATION, {
    successMessage: "پشتیبان‌گیری انجام شد و به تلگرام ارسال شد.",
    errorMessage: "پشتیبان‌گیری انجام نشد.",
    onSuccess: (data) => {
      setLastResults(data.backupRun.items);
    },
  });

  if (!isSuperAdmin) {
    return <Navigate to={APP_SHELL_ROUTES.more} replace />;
  }

  const toggleTarget = (target: BackupTarget): void => {
    setSelectedTargets((current) =>
      current.includes(target) ? current.filter((value) => value !== target) : [...current, target]
    );
  };

  const canSubmit = selectedTargets.length > 0 && !runResult.loading;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    void runBackup({
      variables: {
        input: {
          targets: selectedTargets,
        },
      },
    });
  };

  return (
    <Container maxWidth="md" disableGutters>
      <DashboardMenuHeader
        title="پشتیبان‌گیری"
        description="ایجاد آرشیو RAR رمزدار و ارسال به کانال تلگرام پشتیبان"
      />

      <Paper
        className={styles.globalAnouncementPanel}
        component="form"
        onSubmit={handleSubmit}
        {...opaqueShellProps}
      >
        <Stack spacing={2}>
          <Box className={styles.globalAnouncementHeader}>
            <Box className={styles.backupIcon}>
              <BackupRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                انتخاب منبع پشتیبان
              </Typography>
              <Typography variant="body2" color="text.secondary">
                هر منبع به‌صورت یک آرشیو RAR رمزدار جداگانه ساخته و به تلگرام ارسال می‌شود.
              </Typography>
            </Box>
          </Box>

          <FormGroup>
            {BACKUP_TARGET_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={selectedTargets.includes(option.value)}
                    onChange={() => toggleTarget(option.value)}
                  />
                }
                label={
                  <Box>
                    <Typography fontWeight={700}>{option.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </FormGroup>

          <Alert severity="info" icon={<StorageRoundedIcon fontSize="inherit" />}>
            فرمت آرشیو: <strong>RAR رمزدار</strong>. اگر حجم از ۵۰ مگابایت بیشتر باشد، به چند قسمت
            تقسیم و هر قسمت جداگانه به تلگرام ارسال می‌شود. پس از ارسال موفق، هیچ فایلی روی سرور
            باقی نمی‌ماند.
          </Alert>

          {lastResults.length > 0 ? (
            <Stack spacing={1.25}>
              <Typography variant="subtitle2" fontWeight={800}>
                نتیجه آخرین پشتیبان‌گیری
              </Typography>
              {lastResults.map((item) => (
                <Alert
                  key={`${item.target}-${item.archiveFileName}`}
                  severity={item.telegramDelivered ? "success" : "warning"}
                  icon={<CheckCircleOutlineRoundedIcon fontSize="inherit" />}
                >
                  <Typography fontWeight={700}>{formatTargetLabel(item.target)}</Typography>
                  <Typography variant="body2">
                    فایل: {item.archiveFileName} ({item.formattedArchiveSize}
                    {item.archivePartCount > 1 ? ` • ${item.archivePartCount} قسمت` : ""})
                  </Typography>
                  <Typography variant="body2">
                    مدت: {formatDuration(item.durationMs)}
                    {item.collectionCount != null ? ` • کالکشن‌ها: ${item.collectionCount}` : ""}
                    {item.documentCount != null ? ` • سندها: ${item.documentCount}` : ""}
                    {item.objectCount != null ? ` • آبجکت‌ها: ${item.objectCount}` : ""}
                    {item.fileRecordCount != null
                      ? ` • رکوردهای files: ${item.fileRecordCount}`
                      : ""}
                  </Typography>
                  {item.telegramDeliveryNote ? (
                    <Typography variant="body2">{item.telegramDeliveryNote}</Typography>
                  ) : null}
                </Alert>
              ))}
            </Stack>
          ) : null}

          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SendRoundedIcon />}
            disabled={!canSubmit}
          >
            {runResult.loading ? "در حال پشتیبان‌گیری..." : "شروع پشتیبان‌گیری و ارسال"}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default Backup;
