import {
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import {
  Box,
  Button,
  Chip,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

import { useAuth } from "../../contexts/AuthContext";
import { FILE_UPLOAD_MUTATION } from "../../graphql/mutations/fileUpload.mutation";
import { SUPER_ADMIN_TICKET_SEND_MUTATION } from "../../graphql/mutations/superAdminTicketSend.mutation";
import { TICKET_CLOSE_MUTATION } from "../../graphql/mutations/ticketClose.mutation";
import { USER_TICKET_CLOSE_MUTATION } from "../../graphql/mutations/userTicketClose.mutation";
import { USER_TICKET_SEND_MUTATION } from "../../graphql/mutations/userTicketSend.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import FileUploadField from "../../shared/forms/FileUploadField";
import {
  TICKET_CATEGORY_LABEL,
  TICKET_CATEGORY_OPTIONS,
  TICKET_CLOSED_BY_LABEL,
  TICKET_PRIORITY_LABEL,
  TICKET_PRIORITY_OPTIONS,
  TICKET_STATUS_LABEL,
} from "./support-labels.util";
import type {
  SupportTicketAttachment,
  SupportTicketMessage,
  SupportTicketRecord,
  TicketCategory,
  TicketPriority,
} from "./support.types";

type FileUploadMutationResult = {
  readonly fileUpload: {
    readonly id: string;
  };
};

type FileUploadMutationVariables = {
  readonly input: {
    readonly name: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
    readonly contentBase64: string;
  };
};

type UserTicketSendMutation = {
  readonly userTicketSend: {
    readonly id: string;
  };
};

type UserTicketSendMutationVariables = {
  readonly input: {
    readonly id?: string | null;
    readonly title?: string | null;
    readonly category?: TicketCategory | null;
    readonly priority?: TicketPriority | null;
    readonly message: {
      readonly body: string;
      readonly attachmentFileIds?: readonly string[] | null;
    };
  };
};

type SuperAdminTicketSendMutation = {
  readonly superAdminTicketSend: {
    readonly id: string;
  };
};

type SuperAdminTicketSendMutationVariables = {
  readonly input: {
    readonly id?: string | null;
    readonly endUserId?: string | null;
    readonly title?: string | null;
    readonly category?: TicketCategory | null;
    readonly priority?: TicketPriority | null;
    readonly message: {
      readonly body: string;
      readonly attachmentFileIds?: readonly string[] | null;
    };
  };
};

type TicketCloseMutation = {
  readonly ticketClose: {
    readonly id: string;
    readonly status: string;
  };
};

type UserTicketCloseMutation = {
  readonly userTicketClose: {
    readonly id: string;
    readonly status: string;
  };
};

type TicketCloseMutationVariables = {
  readonly id: string;
};

type PreviewableAttachment = SupportTicketAttachment & {
  readonly accessUrl: string;
};

export type TicketDialogMode = "create" | "view";

export type TicketDialogProps = {
  readonly open: boolean;
  readonly mode: TicketDialogMode;
  readonly record: SupportTicketRecord | null;
  readonly canReply: boolean;
  readonly isSuperAdmin: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
};

const EMPTY_DISPLAY = "—";

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.replace(/^data:.*;base64,/, ""));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

function formatDateTime(value: string): string {
  if (!value.trim()) {
    return EMPTY_DISPLAY;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_DISPLAY;
  }
  return date.toLocaleString("fa-IR");
}

function formatFileSize(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return EMPTY_DISPLAY;
  }
  if (value < 1024) {
    return `${value.toLocaleString("fa-IR")} بایت`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} کیلوبایت`;
  }
  return `${(value / (1024 * 1024)).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت`;
}

function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function isVideoMimeType(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

function isAudioMimeType(mimeType: string): boolean {
  return mimeType.startsWith("audio/");
}

function isPreviewableMedia(file: SupportTicketAttachment): file is PreviewableAttachment {
  const accessUrl = file.accessUrl?.trim();
  const mimeType = file.mimeType?.trim() ?? "";
  return Boolean(
    accessUrl &&
      (isImageMimeType(mimeType) || isVideoMimeType(mimeType) || isAudioMimeType(mimeType)),
  );
}

function formatUserDisplayName(user: SupportTicketMessage["senderUser"]): string {
  if (!user) {
    return "فرستنده نامشخص";
  }
  const parts = [user.profile?.firstName?.trim(), user.profile?.lastName?.trim()].filter(
    (part): part is string => Boolean(part),
  );
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return user.username?.trim() || "فرستنده نامشخص";
}

function renderAttachmentLinks(
  attachments: readonly SupportTicketAttachment[],
  onPreviewAttachment: (file: PreviewableAttachment) => void,
  isOwnMessage: boolean,
): ReactElement | null {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <Stack spacing={0.75} sx={{ mt: 1.5 }}>
      {attachments.map((file) => {
        const label = file.name?.trim() || file.id;
        const href = file.accessUrl?.trim();
        const attachmentContent = (
          <>
            <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {file.mimeType?.trim() || "فایل"} · {formatFileSize(file.sizeBytes)}
            </Typography>
          </>
        );

        if (isPreviewableMedia(file)) {
          return (
            <Paper
              key={file.id}
              component="button"
              type="button"
              onClick={() => onPreviewAttachment(file)}
              variant="outlined"
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                width: "100%",
                p: 1,
                borderRadius: 2,
                cursor: "pointer",
                color: "text.primary",
                textAlign: "start",
                bgcolor: (theme) =>
                  alpha(
                    isOwnMessage ? theme.palette.primary.main : theme.palette.secondary.main,
                    theme.palette.mode === "dark" ? 0.1 : 0.05,
                  ),
                borderColor: (theme) =>
                  alpha(
                    isOwnMessage ? theme.palette.primary.main : theme.palette.secondary.main,
                    theme.palette.mode === "dark" ? 0.34 : 0.18,
                  ),
                "&:hover": {
                  bgcolor: (theme) =>
                    alpha(
                      isOwnMessage ? theme.palette.primary.main : theme.palette.secondary.main,
                      theme.palette.mode === "dark" ? 0.16 : 0.09,
                    ),
                },
              }}
            >
              <Box
                aria-hidden="true"
                sx={{
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  bgcolor: (theme) =>
                    alpha(
                      isOwnMessage ? theme.palette.primary.main : theme.palette.secondary.main,
                      0.16,
                    ),
                  fontWeight: 900,
                }}
              >
                {isImageMimeType(file.mimeType ?? "")
                  ? "IMG"
                  : isVideoMimeType(file.mimeType ?? "")
                    ? "VID"
                    : isAudioMimeType(file.mimeType ?? "")
                      ? "AUD"
                      : "FILE"}
              </Box>
              <Box sx={{ minWidth: 0 }}>{attachmentContent}</Box>
            </Paper>
          );
        }

        return href ? (
          <Paper
            key={file.id}
            variant="outlined"
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              p: 1,
              borderRadius: 2,
              bgcolor: "background.paper",
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
                width: 34,
                height: 34,
                borderRadius: 1.5,
                bgcolor: "action.hover",
                fontWeight: 900,
              }}
            >
              FILE
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Link href={href} target="_blank" rel="noopener noreferrer" variant="body2">
                {label}
              </Link>
              <Typography variant="caption" color="text.secondary" display="block">
                {file.mimeType?.trim() || "فایل"} · {formatFileSize(file.sizeBytes)}
              </Typography>
            </Box>
          </Paper>
        ) : (
          <Typography key={file.id} variant="body2" color="text.secondary">
            {label}
          </Typography>
        );
      })}
    </Stack>
  );
}

function MessageBubble({
  message,
  currentUserId,
  onPreviewAttachment,
}: {
  readonly message: SupportTicketMessage;
  readonly currentUserId?: string;
  readonly onPreviewAttachment: (file: PreviewableAttachment) => void;
}): ReactElement {
  const senderUserId = message.senderUser?.id?.trim() || "";
  const isSanitizedSupportMessage =
    !senderUserId && message.senderUser?.profile?.firstName?.trim() === "پشتیبانی";
  const isOwnMessage =
    Boolean(currentUserId && senderUserId && senderUserId === currentUserId) ||
    (!senderUserId && !isSanitizedSupportMessage);
  const senderName = isOwnMessage ? "شما" : formatUserDisplayName(message.senderUser);
  const avatarLabel = isOwnMessage ? "ش" : "پ";

  return (
    <Stack
      direction={isOwnMessage ? "row-reverse" : "row"}
      spacing={1.25}
      alignItems="flex-start"
      sx={{
        width: "100%",
        justifyContent: isOwnMessage ? "flex-start" : "flex-start",
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          display: { xs: "none", sm: "grid" },
          placeItems: "center",
          flex: "0 0 auto",
          width: 36,
          height: 36,
          borderRadius: "50%",
          color: isOwnMessage ? "primary.contrastText" : "secondary.contrastText",
          bgcolor: isOwnMessage ? "primary.main" : "secondary.main",
          fontWeight: 900,
          boxShadow: 1,
        }}
      >
        {avatarLabel}
      </Box>
      <Paper
        variant="outlined"
        sx={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          width: "100%",
          maxWidth: "100%",
          p: 2,
          borderRadius: 3,
          borderBottomLeftRadius: isOwnMessage ? 0 : 3,
          borderBottomRightRadius: isOwnMessage ? 3 : 0,
          borderColor: (theme) =>
            alpha(
              isOwnMessage ? theme.palette.primary.main : theme.palette.secondary.main,
              theme.palette.mode === "dark" ? 0.42 : 0.22,
            ),
          bgcolor: (theme) =>
            alpha(
              isOwnMessage ? theme.palette.primary.main : theme.palette.secondary.main,
              theme.palette.mode === "dark" ? 0.2 : 0.07,
            ),
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 0.75rem 1.875rem rgba(0, 0, 0, 0.22)"
              : "0 0.75rem 1.875rem rgba(15, 23, 42, 0.08)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          mb={1}
          justifyContent={isOwnMessage ? "flex-end" : "flex-start"}
        >
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1,
              py: 0.25,
              borderRadius: 999,
              fontSize: "0.75rem",
              fontWeight: 900,
              bgcolor: (theme) =>
                alpha(
                  isOwnMessage ? theme.palette.primary.main : theme.palette.secondary.main,
                  theme.palette.mode === "dark" ? 0.24 : 0.12,
                ),
              color: isOwnMessage ? "primary.dark" : "secondary.dark",
            }}
          >
            {senderName}
          </Box>
        </Stack>
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            lineHeight: 1.9,
            fontSize: "0.92rem",
          }}
        >
          {message.body}
        </Typography>
        {renderAttachmentLinks(message.attachmentFiles ?? [], onPreviewAttachment, isOwnMessage)}
      </Paper>
    </Stack>
  );
}

const TicketDialog = ({
  open,
  mode,
  record,
  canReply,
  isSuperAdmin,
  onClose,
  onSuccess,
}: TicketDialogProps): ReactElement => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobile = useMediaQuery((muiTheme: Theme) => muiTheme.breakpoints.down("md"));
  const currentUserId = user?.id?.trim();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TicketCategory>("OTHER");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [messageBody, setMessageBody] = useState("");
  const [endUserId, setEndUserId] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<PreviewableAttachment | null>(null);

  const resetForm = (): void => {
    setTitle("");
    setCategory("OTHER");
    setPriority("MEDIUM");
    setMessageBody("");
    setEndUserId("");
    setAttachmentFile(null);
  };

  const handleClose = (): void => {
    resetForm();
    setPreviewAttachment(null);
    onClose();
  };

  const [uploadFile, uploadFileResult] = useMutationWithSnackbar<
    FileUploadMutationResult,
    FileUploadMutationVariables
  >(FILE_UPLOAD_MUTATION, {
    errorMessage: t("pages.support.attachments.uploadError"),
  });

  const [sendUserTicket, sendUserTicketResult] = useMutationWithSnackbar<
    UserTicketSendMutation,
    UserTicketSendMutationVariables
  >(USER_TICKET_SEND_MUTATION, {
    successMessage: t("pages.support.send.success"),
    errorMessage: t("pages.support.send.error"),
    onSuccess: () => {
      resetForm();
      onSuccess();
    },
  });

  const [sendSuperAdminTicket, sendSuperAdminTicketResult] = useMutationWithSnackbar<
    SuperAdminTicketSendMutation,
    SuperAdminTicketSendMutationVariables
  >(SUPER_ADMIN_TICKET_SEND_MUTATION, {
    successMessage: t("pages.support.send.success"),
    errorMessage: t("pages.support.send.error"),
    onSuccess: () => {
      resetForm();
      onSuccess();
    },
  });

  const [closeStaffTicket, closeStaffTicketResult] = useMutationWithSnackbar<
    TicketCloseMutation,
    TicketCloseMutationVariables
  >(TICKET_CLOSE_MUTATION, {
    successMessage: t("pages.support.closeTicket.success"),
    errorMessage: t("pages.support.closeTicket.error"),
    onSuccess: () => {
      resetForm();
      onSuccess();
    },
  });

  const [closeUserTicket, closeUserTicketResult] = useMutationWithSnackbar<
    UserTicketCloseMutation,
    TicketCloseMutationVariables
  >(USER_TICKET_CLOSE_MUTATION, {
    successMessage: t("pages.support.closeTicket.success"),
    errorMessage: t("pages.support.closeTicket.error"),
    onSuccess: () => {
      resetForm();
      onSuccess();
    },
  });

  const isSubmitting =
    uploadFileResult.loading ||
    sendUserTicketResult.loading ||
    sendSuperAdminTicketResult.loading ||
    closeStaffTicketResult.loading ||
    closeUserTicketResult.loading;

  const uploadAttachmentIfNeeded = async (): Promise<string[] | undefined> => {
    if (!attachmentFile) {
      return undefined;
    }

    const contentBase64 = await readFileAsBase64(attachmentFile);
    const { data, error } = await uploadFile({
      variables: {
        input: {
          name: attachmentFile.name,
          mimeType: attachmentFile.type || "application/octet-stream",
          sizeBytes: attachmentFile.size,
          contentBase64,
        },
      },
    });

    if (error || !data?.fileUpload.id) {
      return undefined;
    }

    return [data.fileUpload.id];
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const body = messageBody.trim();
    if (!body) {
      return;
    }

    const attachmentFileIds = await uploadAttachmentIfNeeded();
    if (attachmentFile && !attachmentFileIds) {
      return;
    }

    if (mode === "create") {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        return;
      }
      const trimmedEndUserId = endUserId.trim();
      if (isSuperAdmin && !trimmedEndUserId) {
        return;
      }

      const input = {
        title: trimmedTitle,
        category,
        priority,
        message: {
          body,
          attachmentFileIds,
        },
      };

      if (isSuperAdmin) {
        void sendSuperAdminTicket({
          variables: { input: { ...input, endUserId: trimmedEndUserId } },
        });
      } else {
        void sendUserTicket({ variables: { input } });
      }
      return;
    }

    if (!record) {
      return;
    }

    const input = {
      id: record.id,
      message: {
        body,
        attachmentFileIds,
      },
    };

    if (isSuperAdmin) {
      void sendSuperAdminTicket({ variables: { input } });
    } else {
      void sendUserTicket({ variables: { input } });
    }
  };

  const canCloseTicket = mode === "view" && record != null && record.status !== "CLOSED";

  const handleCloseTicket = (): void => {
    if (!record || record.status === "CLOSED") {
      return;
    }

    if (isSuperAdmin) {
      void closeStaffTicket({ variables: { id: record.id } });
      return;
    }

    void closeUserTicket({ variables: { id: record.id } });
  };

  const dialogTitle =
    mode === "create"
      ? t("pages.support.create.title")
      : t("pages.support.view.title");

  const previewMimeType = previewAttachment?.mimeType?.trim() ?? "";
  const previewTitle = previewAttachment?.name?.trim() || previewAttachment?.id || "";

  return (
    <>
      <EntityModalShell
        open={open}
        title={dialogTitle}
        onClose={handleClose}
        maxWidth="md"
        useFormWrapper
        onSubmit={handleSubmit}
        pinFooterToBottomOnMobile
        footer={
          <Stack
            direction={isMobile ? "column-reverse" : "row"}
            spacing={1.5}
            sx={{
              width: "100%",
              justifyContent: isMobile ? "stretch" : "space-between",
              "& .MuiButton-root": {
                width: isMobile ? "100%" : "auto",
                minWidth: isMobile ? undefined : "8rem",
              },
            }}
          >
            <Stack
              direction={isMobile ? "column-reverse" : "row"}
              spacing={1.5}
              sx={{ width: isMobile ? "100%" : "auto" }}
            >
              <Button
                type="button"
                variant="outlined"
                color="inherit"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t("pages.support.actions.cancel")}
              </Button>
              {canCloseTicket ? (
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  onClick={handleCloseTicket}
                  disabled={isSubmitting}
                >
                  {t("pages.support.actions.closeTicket")}
                </Button>
              ) : null}
            </Stack>

            {mode === "create" || canReply ? (
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {mode === "create"
                  ? t("pages.support.create.submit")
                  : t("pages.support.reply.submit")}
              </Button>
            ) : null}
          </Stack>
        }
      >
        <Stack spacing={3}>
        {mode === "create" ? (
          <>
            {isSuperAdmin ? (
              <TextField
                label={t("pages.support.create.endUserIdLabel")}
                helperText={t("pages.support.create.endUserIdHelp")}
                value={endUserId}
                onChange={(event) => setEndUserId(event.target.value)}
                required
                fullWidth
                size="small"
              />
            ) : null}
            <TextField
              label={t("table.pages.support.columns.title")}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              fullWidth
              size="small"
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label={t("table.pages.support.columns.category")}
                value={category}
                onChange={(event) => setCategory(event.target.value as TicketCategory)}
                fullWidth
                size="small"
                required
              >
                {TICKET_CATEGORY_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {TICKET_CATEGORY_LABEL[option]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label={t("table.pages.support.columns.priority")}
                value={priority}
                onChange={(event) => setPriority(event.target.value as TicketPriority)}
                fullWidth
                size="small"
              >
                {TICKET_PRIORITY_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {TICKET_PRIORITY_LABEL[option]}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </>
        ) : record ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={800}>
                {record.title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" variant="outlined" label={TICKET_CATEGORY_LABEL[record.category]} />
                <Chip size="small" variant="outlined" label={TICKET_PRIORITY_LABEL[record.priority]} />
                <Chip
                  size="small"
                  variant="outlined"
                  color={
                    record.status === "OPEN"
                      ? "warning"
                      : record.status === "ANSWERED"
                        ? "info"
                        : "default"
                  }
                  label={TICKET_STATUS_LABEL[record.status]}
                />
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {t("table.pages.support.columns.createdByUserName")}: {record.createdByUserName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("table.pages.support.columns.createdAt")}: {formatDateTime(record.createdAt)}
                </Typography>
                {record.closedAt ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {t("table.pages.support.columns.closedBy")}:{" "}
                      {record.closedBy !== "-"
                        ? (TICKET_CLOSED_BY_LABEL[
                            record.closedBy as keyof typeof TICKET_CLOSED_BY_LABEL
                          ] ?? record.closedBy)
                        : EMPTY_DISPLAY}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("table.pages.support.columns.closedAt")}: {formatDateTime(record.closedAt)}
                    </Typography>
                  </>
                ) : null}
              </Box>
            </Stack>
          </Paper>
        ) : null}

        {mode === "view" && record ? (
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" fontWeight={800}>
              {t("pages.support.view.messagesTitle")}
            </Typography>
            {record.messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("pages.support.view.noMessages")}
              </Typography>
            ) : (
              <Stack spacing={2} role="log" aria-live="polite" aria-label="گفتگوی تیکت">
                {record.messages.map((message, index) => (
                  <MessageBubble
                    key={`${record.id}-message-${index}`}
                    message={message}
                    currentUserId={currentUserId}
                    onPreviewAttachment={setPreviewAttachment}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        ) : null}

        {mode === "create" || canReply ? (
          <Stack spacing={2}>
            <TextField
              label={
                mode === "create"
                  ? t("pages.support.create.messageLabel")
                  : t("pages.support.reply.messageLabel")
              }
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              required
              fullWidth
              size="small"
              multiline
              minRows={4}
            />
            <FileUploadField
              label={t("pages.support.attachments.label")}
              file={attachmentFile}
              onChange={setAttachmentFile}
              accept="image/*,application/pdf,.doc,.docx,.txt"
              allowedFormatsLabel={t("pages.support.attachments.allowedFormats")}
              maxSizeLabel={t("pages.support.attachments.maxSize")}
              dropTitle={t("pages.support.attachments.dropTitle")}
              mobileDropTitle={t("pages.support.attachments.mobileDropTitle")}
              dropHint={t("pages.support.attachments.dropHint")}
              mobileDropHint={t("pages.support.attachments.mobileDropHint")}
              removeLabel={t("pages.support.attachments.removeLabel")}
              invalidLabel={t("pages.support.attachments.invalidLabel")}
              optionalLabel={t("pages.support.attachments.optionalLabel")}
            />
          </Stack>
        ) : null}
        </Stack>
      </EntityModalShell>

      <EntityModalShell
        open={previewAttachment != null}
        title={previewTitle}
        onClose={() => setPreviewAttachment(null)}
        maxWidth="lg"
        footer={
          <Button variant="outlined" color="inherit" onClick={() => setPreviewAttachment(null)}>
            {t("pages.support.actions.cancel")}
          </Button>
        }
      >
        {previewAttachment ? (
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              minHeight: { xs: "18rem", md: "28rem" },
              borderRadius: 2,
              bgcolor: "action.hover",
              overflow: "hidden",
            }}
          >
            {isImageMimeType(previewMimeType) ? (
              <Box
                component="img"
                src={previewAttachment.accessUrl}
                alt={previewTitle}
                sx={{
                  display: "block",
                  inlineSize: "100%",
                  maxBlockSize: "min(72vh, 46rem)",
                  objectFit: "contain",
                }}
              />
            ) : null}
            {isVideoMimeType(previewMimeType) ? (
              <Box
                component="video"
                src={previewAttachment.accessUrl}
                controls
                autoPlay
                sx={{
                  display: "block",
                  inlineSize: "100%",
                  maxBlockSize: "min(72vh, 46rem)",
                  bgcolor: "common.black",
                }}
              />
            ) : null}
            {isAudioMimeType(previewMimeType) ? (
              <Box
                component="audio"
                src={previewAttachment.accessUrl}
                controls
                autoPlay
                sx={{
                  inlineSize: "min(100%, 42rem)",
                  m: 3,
                }}
              />
            ) : null}
          </Box>
        ) : null}
      </EntityModalShell>
    </>
  );
};

export default TicketDialog;
