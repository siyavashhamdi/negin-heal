import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import {
  CloudUploadRounded as UploadIcon,
  SendRounded as SendIcon,
} from "@mui/icons-material";
import { useSearchParams } from "react-router-dom";
import { USER_SEND_SAMPLE_EMAIL_MUTATION } from "../../graphql/mutations/userSendSampleEmail.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import FileUploadField from "../../shared/forms/FileUploadField";
import { getFileIdFromAccessUrl } from "../../utils/fileAccessUrl.util";
import { uploadFile, type FileUploadResult } from "../../utils/fileUpload.util";
import styles from "./styles/dashboard.module.scss";

type UserSendSampleEmailMutationResponse = {
  userSendSampleEmail: {
    success: boolean;
    message: string;
  };
};

type UserSendSampleEmailMutationVariables = {
  to?: string;
};

const Dashboard = (): ReactElement => {
  const { t } = useTranslation();
  const { showError, showSuccess, showWarning } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sampleEmailTo, setSampleEmailTo] = useState<string>("");
  const [lastUpload, setLastUpload] = useState<FileUploadResult | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (!paymentStatus) {
      return;
    }

    const refId = searchParams.get("refId");
    const reason = searchParams.get("reason");

    if (paymentStatus === "success") {
      showSuccess(
        refId
          ? `پرداخت با موفقیت انجام شد. کد پیگیری: ${refId}`
          : "پرداخت با موفقیت انجام شد و دسترسی دوره فعال شد.",
      );
    } else if (paymentStatus === "cancelled") {
      showWarning("پرداخت لغو شد.");
    } else {
      showError(reason ? `پرداخت ناموفق بود: ${reason}` : "پرداخت ناموفق بود.");
    }

    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams, showError, showSuccess, showWarning]);

  const [sendSampleEmail, { loading: sampleEmailLoading }] = useMutationWithSnackbar<
    UserSendSampleEmailMutationResponse,
    UserSendSampleEmailMutationVariables
  >(USER_SEND_SAMPLE_EMAIL_MUTATION, {
    onSuccess: (data) => {
      showSuccess(data.userSendSampleEmail.message);
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedFile) {
      showWarning(t("pages.dashboard.uploader.missingFile"));
      return;
    }

    setUploadLoading(true);
    try {
      const uploadedFile = await uploadFile(selectedFile);
      setLastUpload(uploadedFile);
      setSelectedFile(null);
      showSuccess(t("pages.dashboard.uploader.success"));
    } catch {
      showError("آپلود فایل انجام نشد.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSendSampleEmail = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const normalizedEmail = sampleEmailTo.trim();
    await sendSampleEmail({
      variables: {
        to: normalizedEmail || undefined,
      },
    });
  };

  return (
    <section className={styles.page} aria-label="داشبورد">
      <Card className={styles.uploaderCard}>
        <CardContent>
          <form onSubmit={handleSendSampleEmail}>
            <Stack spacing={2} className={styles.mailSection}>
              <div>
                <Typography component="h2" variant="h6">
                  {t("pages.dashboard.mailTest.title")}
                </Typography>
                <Typography color="text.secondary" className={styles.uploaderDescription}>
                  {t("pages.dashboard.mailTest.description")}
                </Typography>
              </div>

              <TextField
                label={t("pages.dashboard.mailTest.emailLabel")}
                placeholder={t("pages.dashboard.mailTest.emailPlaceholder")}
                value={sampleEmailTo}
                onChange={(event) => setSampleEmailTo(event.target.value)}
                type="email"
                autoComplete="email"
                fullWidth
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SendIcon />}
                  disabled={sampleEmailLoading}
                >
                  {sampleEmailLoading
                    ? t("pages.dashboard.mailTest.sendingButton")
                    : t("pages.dashboard.mailTest.sendButton")}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>

      <Card className={styles.uploaderCard}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <div>
                <Typography component="h2" variant="h6">
                  {t("pages.dashboard.uploader.title")}
                </Typography>
                <Typography color="text.secondary" className={styles.uploaderDescription}>
                  {t("pages.dashboard.uploader.description")}
                </Typography>
              </div>

              <FileUploadField
                label={t("pages.dashboard.uploader.fieldLabel")}
                file={selectedFile}
                onChange={setSelectedFile}
                accept="*/*"
                allowedFormatsLabel={t("pages.dashboard.uploader.allowedFormats")}
                maxSizeLabel={t("pages.dashboard.uploader.maxSize")}
                dropTitle={t("pages.dashboard.uploader.dropTitle")}
                dropHint={t("pages.dashboard.uploader.dropHint")}
                removeLabel={t("pages.dashboard.uploader.removeLabel")}
                invalidLabel={t("pages.dashboard.uploader.invalidLabel")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<UploadIcon />}
                  disabled={uploadLoading}
                >
                  {uploadLoading
                    ? t("pages.dashboard.uploader.uploadingButton")
                    : t("pages.dashboard.uploader.uploadButton")}
                </Button>
              </Stack>

              {lastUpload ? (
                <div className={styles.uploadResult}>
                  <Typography variant="subtitle2">
                    {t("pages.dashboard.uploader.lastUpload")}
                  </Typography>
                  <Typography variant="body2">{lastUpload.name}</Typography>
                  <Typography variant="body2">
                    {t("pages.dashboard.uploader.path")}: {lastUpload.path}
                  </Typography>
                  <Typography variant="body2">
                    {t("pages.dashboard.uploader.mimeType")}: {lastUpload.mimeType}
                  </Typography>
                  <Typography variant="body2">
                    {t("pages.dashboard.uploader.size")}: {lastUpload.sizeBytes}
                  </Typography>
                  <Typography variant="body2">
                    File ID: {getFileIdFromAccessUrl(lastUpload.accessUrl) ?? "—"}
                  </Typography>
                </div>
              ) : null}
            </Stack>
          </form>
        </CardContent>
      </Card>
    </section>
  );
};

export default Dashboard;
