import { useEffect, useMemo, useState, type FormEvent, type ReactElement } from "react";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useQuery } from "@apollo/client/react";
import { alpha, type Theme, useTheme } from "@mui/material/styles";

import { useAuth } from "../../contexts/AuthContext";
import { SUPER_ADMIN_TICKET_SEND_MUTATION } from "../../graphql/mutations/superAdminTicketSend.mutation";
import { TICKET_CLOSE_MUTATION } from "../../graphql/mutations/ticketClose.mutation";
import { USER_TICKET_CLOSE_MUTATION } from "../../graphql/mutations/userTicketClose.mutation";
import { USER_TICKET_SEND_MUTATION } from "../../graphql/mutations/userTicketSend.mutation";
import { USER_PICKER_LIST_QUERY } from "../../graphql/queries/userPickerList.query";
import { useDebounce } from "../../hooks/useDebounce";
import { USER_ME_QUERY } from "../../graphql/queries/userMe.query";
import { type UserMeGqlResponse, type UserMeResponse } from "../../hooks/useMe";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import ModalFooterActions, { type ModalFooterAction } from "../../shared/crud/ModalFooterActions";
import EntityAutocompleteField from "../../shared/forms/EntityAutocompleteField";
import FileUploadField from "../../shared/forms/FileUploadField";
import {
  buildExistingFilePreview,
  getFileIdFromAccessUrl,
  resolveFileAccessUrl,
} from "../../utils/fileAccessUrl.util";
import { uploadFile as uploadFileToApi } from "../../utils/fileUpload.util";
import {
  FILE_UPLOAD_POLICY,
  FILE_UPLOAD_POLICY_MAX_SIZE_BYTES,
} from "../../constants/fileUploadPolicies";
import {
  type UserPickerListQuery,
  type UserListQueryVariables,
  type UserPickerListRow,
} from "../UsersManagement/users-management-list.api";
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

type EndUserOption = {
  readonly id: string;
  readonly label: string;
  readonly subtitle: string;
  readonly row: UserPickerListRow;
};

export type TicketDialogMode = "create" | "view";

export type TicketDialogProps = {
  readonly open: boolean;
  readonly mode: TicketDialogMode;
  readonly record: SupportTicketRecord | null;
  readonly detailLoading?: boolean;
  readonly canReply: boolean;
  readonly isSuperAdmin: boolean;
  readonly initialCategory?: TicketCategory;
  readonly disableCategorySelect?: boolean;
  readonly onClose: () => void;
  readonly onSuccess: () => void;
};

const EMPTY_DISPLAY = "—";
const END_USER_DEFAULT_OPTIONS_LIMIT = 10;
const END_USER_SEARCH_OPTIONS_LIMIT = 200;

function formatPersianDateTime(date: Date): string {
  const datePart = date.toLocaleDateString("fa-IR");
  const timePart = date.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${timePart} · ${datePart}`;
}

function formatDateTime(value: string): string {
  if (!value.trim()) {
    return EMPTY_DISPLAY;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_DISPLAY;
  }
  return formatPersianDateTime(date);
}

function formatUserDisplayName(user: SupportTicketMessage["senderUser"]): string {
  if (!user) {
    return "فرستنده نامشخص";
  }
  const parts = [user.profile?.firstName?.trim(), user.profile?.lastName?.trim()].filter(
    (part): part is string => Boolean(part)
  );
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return user.username?.trim() || "فرستنده نامشخص";
}

function getUserFullName(row: UserPickerListRow): string {
  const parts = [row.profile?.firstName?.trim(), row.profile?.lastName?.trim()].filter(
    (part): part is string => Boolean(part)
  );

  return parts.length > 0 ? parts.join(" ") : row.username;
}

function userToEndUserOption(row: UserPickerListRow): EndUserOption {
  const phone = row.profile?.phoneNumber?.trim();
  const email = row.profile?.email?.trim();

  return {
    id: row.id,
    label: getUserFullName(row),
    subtitle: [row.username, phone || email].filter(Boolean).join(" · "),
    row,
  };
}

function getMessageTone(
  message: SupportTicketMessage,
  currentUserId?: string,
  ticketCreatorUserId?: string
): "own" | "support" | "user" {
  const senderUserId = message.senderUser?.id?.trim() || "";
  const isSanitizedSupportMessage =
    !senderUserId && message.senderUser?.profile?.firstName?.trim() === "پشتیبانی";
  const isOwnMessage =
    Boolean(currentUserId && senderUserId && senderUserId === currentUserId) ||
    (!senderUserId && !isSanitizedSupportMessage);

  if (isOwnMessage) {
    return "own";
  }

  const isEndUserMessage =
    Boolean(ticketCreatorUserId && senderUserId && senderUserId === ticketCreatorUserId) &&
    !isSanitizedSupportMessage;

  if (isEndUserMessage) {
    return "user";
  }

  return "support";
}

type MessageToneStyle = {
  readonly border: string;
  readonly background: string;
  readonly backgroundDark: string;
};

const MESSAGE_TONE_STYLES: Record<"own" | "support" | "user", MessageToneStyle> = {
  own: {
    border: "#0d9488",
    background: "#ccfbf1",
    backgroundDark: "rgba(13, 148, 136, 0.24)",
  },
  support: {
    border: "#7c3aed",
    background: "#ede9fe",
    backgroundDark: "rgba(124, 58, 237, 0.24)",
  },
  user: {
    border: "#c9567e",
    background: "#fce7f3",
    backgroundDark: "rgba(37, 99, 235, 0.24)",
  },
};

function getMessageToneStyle(
  tone: "own" | "support" | "user",
  mode: "light" | "dark"
): { border: string; background: string } {
  const style = MESSAGE_TONE_STYLES[tone];
  return {
    border: style.border,
    background: mode === "dark" ? style.backgroundDark : style.background,
  };
}

function getMessageBubbleSx(
  isOwnMessage: boolean,
  toneStyle: { border: string; background: string },
  theme: Theme,
) {
  const borderColor = alpha(toneStyle.border, theme.palette.mode === "dark" ? 0.72 : 0.42);
  const cornerRadius = "1.125rem";

  return {
    display: "grid",
    gap: 0.75,
    width: "100%",
    maxWidth: { xs: "94%", sm: "82%", md: "76%" },
    px: 1.75,
    py: 1.35,
    borderTopLeftRadius: cornerRadius,
    borderTopRightRadius: cornerRadius,
    borderBottomLeftRadius: isOwnMessage ? cornerRadius : 0,
    borderBottomRightRadius: isOwnMessage ? 0 : cornerRadius,
    border: `1px solid ${borderColor}`,
    bgcolor: toneStyle.background,
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 0.35rem 1rem rgba(0, 0, 0, 0.18)"
        : "0 0.35rem 1rem rgba(15, 23, 42, 0.06)",
  };
}

function getMessageSentAtTimestamp(value?: string | null): number {
  if (!value?.trim()) {
    return 0;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortMessagesBySentAt(
  messages: readonly SupportTicketMessage[],
): SupportTicketMessage[] {
  return [...messages].sort((left, right) => {
    const leftTimestamp = getMessageSentAtTimestamp(left.sentAt);
    const rightTimestamp = getMessageSentAtTimestamp(right.sentAt);
    return leftTimestamp - rightTimestamp;
  });
}

function formatMessageDateTime(value?: string | null): string {
  if (!value?.trim()) {
    return EMPTY_DISPLAY;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return EMPTY_DISPLAY;
  }
  return formatPersianDateTime(date);
}

function getProfileStyleInitial(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed.slice(0, 1) || "?";
}

function formatMeDisplayName(
  meUser: UserMeGqlResponse | null,
  fallbackUsername?: string | null,
): string {
  if (!meUser) {
    return fallbackUsername?.trim() || "کاربر";
  }

  const firstName = meUser.profile?.firstName?.trim();
  const lastName = meUser.profile?.lastName?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  return firstName || meUser.username?.trim() || fallbackUsername?.trim() || "کاربر";
}

function resolveMessageAvatarUrl(
  message: SupportTicketMessage,
  tone: "own" | "support" | "user",
  currentUserAvatarUrl: string | null,
  ticketOwnerAvatarUrl: string | null,
): string | null {
  const senderAvatarUrl = resolveFileAccessUrl(message.senderUser?.profile?.avatarAccessUrl);
  if (senderAvatarUrl) {
    return senderAvatarUrl;
  }

  if (tone === "own") {
    return currentUserAvatarUrl;
  }

  if (tone === "user") {
    return ticketOwnerAvatarUrl;
  }

  return null;
}

function MessageSenderAvatar({
  tone,
  toneStyle,
  displayName,
  avatarUrl,
}: {
  readonly tone: "own" | "support" | "user";
  readonly toneStyle: { border: string; background: string };
  readonly displayName: string;
  readonly avatarUrl: string | null;
}): ReactElement {
  const theme = useTheme();
  const initials = getProfileStyleInitial(displayName);
  const showSupportIcon = tone === "support" && !avatarUrl;

  return (
    <Avatar
      src={avatarUrl ?? undefined}
      alt={displayName}
      sx={{
        width: { xs: 34, sm: 38 },
        height: { xs: 34, sm: 38 },
        flexShrink: 0,
        bgcolor: showSupportIcon
          ? toneStyle.border
          : alpha(toneStyle.border, theme.palette.mode === "dark" ? 0.38 : 0.16),
        color: showSupportIcon ? "common.white" : toneStyle.border,
        fontWeight: 800,
        fontSize: "0.82rem",
        border: `2px solid ${alpha(toneStyle.border, theme.palette.mode === "dark" ? 0.65 : 0.4)}`,
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 0.25rem 0.75rem ${alpha(toneStyle.border, 0.35)}`
            : `0 0.25rem 0.75rem ${alpha(toneStyle.border, 0.18)}`,
      }}
    >
      {showSupportIcon ? (
        <SupportAgentRoundedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
      ) : (
        initials
      )}
    </Avatar>
  );
}

function renderMessageAttachments(
  attachments: readonly SupportTicketAttachment[]
): ReactElement | null {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1.25} sx={{ mt: 1.5 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={800}>
        پیوست
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(auto-fill, minmax(11rem, 1fr))",
          },
        }}
      >
        {attachments.map((file, index) => {
          const attachmentId =
            file.id?.trim() ||
            getFileIdFromAccessUrl(file.accessUrl) ||
            file.path?.trim() ||
            `attachment-${index}`;
          const existingFile = buildExistingFilePreview(file.accessUrl, file.name ?? undefined, {
            mimeType: file.mimeType,
            sizeBytes: file.sizeBytes,
          });

          if (!existingFile) {
            const fallbackName = file.name?.trim() || file.accessUrl?.name?.trim() || "فایل";
            return (
              <Paper key={attachmentId} variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {fallbackName}
                </Typography>
              </Paper>
            );
          }

          return (
            <FileUploadField
              key={attachmentId}
              readOnly
              hideLabel
              fullWidth
              label={existingFile.name}
              file={null}
              onChange={() => undefined}
              existingFile={existingFile}
              accept="*/*"
              allowedFormatsLabel=""
              maxSizeLabel=""
              dropTitle=""
              dropHint=""
              removeLabel=""
              invalidLabel=""
            />
          );
        })}
      </Box>
    </Stack>
  );
}

function MessageBubble({
  message,
  messageIndex,
  currentUserId,
  currentUserAvatarUrl,
  currentUserDisplayName,
  ticketCreatorUserId,
  ticketOwnerAvatarUrl,
  isEndUserView,
}: {
  readonly message: SupportTicketMessage;
  readonly messageIndex: number;
  readonly currentUserId?: string;
  readonly currentUserAvatarUrl: string | null;
  readonly currentUserDisplayName: string;
  readonly ticketCreatorUserId?: string;
  readonly ticketOwnerAvatarUrl: string | null;
  readonly isEndUserView: boolean;
}): ReactElement {
  const theme = useTheme();
  const tone = getMessageTone(message, currentUserId, ticketCreatorUserId);
  const toneStyle = getMessageToneStyle(tone, theme.palette.mode);
  const isOwnMessage = tone === "own";
  const senderName =
    isEndUserView && isOwnMessage ? "شما" : formatUserDisplayName(message.senderUser);
  const avatarDisplayName = isOwnMessage ? currentUserDisplayName : senderName;
  const messageNumber = `#${(messageIndex + 1).toLocaleString("fa-IR")}`;
  const sentAtLabel = formatMessageDateTime(message.sentAt);
  const avatarUrl = resolveMessageAvatarUrl(
    message,
    tone,
    currentUserAvatarUrl,
    ticketOwnerAvatarUrl,
  );

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        width: "100%",
      }}
    >
      <Box sx={getMessageBubbleSx(isOwnMessage, toneStyle, theme)}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            <MessageSenderAvatar
              tone={tone}
              toneStyle={toneStyle}
              displayName={avatarDisplayName}
              avatarUrl={avatarUrl}
            />
            <Typography
              variant="body2"
              fontWeight={800}
              sx={{ minWidth: 0, overflowWrap: "anywhere" }}
            >
              {senderName}
            </Typography>
          </Stack>
          <Stack alignItems="flex-end" spacing={0.15} sx={{ flexShrink: 0 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
                color: toneStyle.border,
              }}
            >
              {messageNumber}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              {sentAtLabel}
            </Typography>
          </Stack>
        </Stack>

        <Typography
          variant="body2"
          sx={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            lineHeight: 1.85,
            fontSize: "0.92rem",
          }}
        >
          {message.body}
        </Typography>

        {renderMessageAttachments(message.attachmentFiles ?? [])}
      </Box>
    </Box>
  );
}

const TicketDialog = ({
  open,
  mode,
  record,
  detailLoading = false,
  canReply,
  isSuperAdmin,
  initialCategory,
  disableCategorySelect = false,
  onClose,
  onSuccess,
}: TicketDialogProps): ReactElement => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: meData } = useQuery<UserMeResponse>(USER_ME_QUERY, {
    fetchPolicy: "cache-only",
    returnPartialData: true,
  });
  const meUser = meData?.me ?? null;
  const currentUserAvatarUrl = resolveFileAccessUrl(meUser?.profile?.avatarAccessUrl);
  const isMobile = useMediaQuery((muiTheme: Theme) => muiTheme.breakpoints.down("md"));
  const currentUserId = user?.id?.trim();
  const currentUserDisplayName = useMemo(
    () => formatMeDisplayName(meUser, user?.username),
    [meUser, user?.username],
  );
  const roles = user?.roles ?? [];
  const isEndUserView = !roles.includes("SUPER_ADMIN") && !roles.includes("ADMIN");
  const defaultCategory = initialCategory ?? "OTHER";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TicketCategory>(defaultCategory);
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [messageBody, setMessageBody] = useState("");
  const [selectedEndUser, setSelectedEndUser] = useState<EndUserOption | null>(null);
  const [endUserSearch, setEndUserSearch] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const debouncedEndUserSearch = useDebounce(endUserSearch, 400);

  const resetForm = (): void => {
    setTitle("");
    setCategory(defaultCategory);
    setPriority("MEDIUM");
    setMessageBody("");
    setSelectedEndUser(null);
    setEndUserSearch("");
    setAttachmentFile(null);
  };

  useEffect(() => {
    if (open && mode === "create") {
      setCategory(defaultCategory);
    }
  }, [defaultCategory, mode, open]);

  const handleClose = (): void => {
    resetForm();
    onClose();
  };

  const [isAttachmentUploading, setIsAttachmentUploading] = useState(false);

  const endUserOptionsVariables = useMemo<UserListQueryVariables>(() => {
    const query = debouncedEndUserSearch.trim();

    return {
      input: {
        filters: {
          query: query || null,
          role: "END_USER",
          status: "ACTIVE",
        },
        options: {
          limit: query ? END_USER_SEARCH_OPTIONS_LIMIT : END_USER_DEFAULT_OPTIONS_LIMIT,
          skip: 0,
          sort: { createdAt: "DESC" },
        },
      },
    };
  }, [debouncedEndUserSearch]);

  const { data: endUserOptionsData, loading: endUserOptionsLoading } = useQuery<
    UserPickerListQuery,
    UserListQueryVariables
  >(USER_PICKER_LIST_QUERY, {
    variables: endUserOptionsVariables,
    fetchPolicy: "cache-first",
    skip: !open || mode !== "create" || !isSuperAdmin,
  });

  const endUserOptions = useMemo(
    () => (endUserOptionsData?.userList.items ?? []).map(userToEndUserOption),
    [endUserOptionsData]
  );

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
    detailLoading ||
    isAttachmentUploading ||
    sendUserTicketResult.loading ||
    sendSuperAdminTicketResult.loading ||
    closeStaffTicketResult.loading ||
    closeUserTicketResult.loading;

  const uploadAttachmentIfNeeded = async (): Promise<string[] | undefined> => {
    if (!attachmentFile) {
      return undefined;
    }

    setIsAttachmentUploading(true);
    try {
      const uploadedFile = await uploadFileToApi(attachmentFile, {
        policy: FILE_UPLOAD_POLICY.SUPPORT_ATTACHMENT,
        accept: "image/*,application/pdf,.doc,.docx,.txt,video/*,audio/*",
        maxSizeBytes: FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.SUPPORT_ATTACHMENT,
      });
      const fileId = getFileIdFromAccessUrl(uploadedFile.accessUrl);
      if (!fileId) {
        return undefined;
      }
      return [fileId];
    } catch {
      return undefined;
    } finally {
      setIsAttachmentUploading(false);
    }
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
      if (isSuperAdmin && !selectedEndUser) {
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
          variables: { input: { ...input, endUserId: selectedEndUser?.id } },
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

  const canSubmitCreate =
    title.trim().length > 0 &&
    messageBody.trim().length > 0 &&
    (!isSuperAdmin || selectedEndUser != null);

  const canSubmitReply = messageBody.trim().length > 0 || attachmentFile != null;

  const canSubmitTicket = mode === "create" ? canSubmitCreate : canSubmitReply;

  const conversationMessages = useMemo(
    () => (record ? sortMessagesBySentAt(record.messages) : []),
    [record],
  );

  const ticketOwnerAvatarUrl = useMemo(
    () => resolveFileAccessUrl(record?.createdByUser?.profile?.avatarAccessUrl) ?? null,
    [record?.createdByUser?.profile?.avatarAccessUrl],
  );

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
    mode === "create" ? t("pages.support.create.title") : t("pages.support.view.title");

  const footerActions: ModalFooterAction[] = [
    {
      key: "close",
      isCloseButton: true,
      onClick: handleClose,
      disabled: isSubmitting,
    },
  ];

  if (canCloseTicket) {
    footerActions.push({
      key: "close-ticket",
      label: t("pages.support.actions.closeTicket"),
      onClick: handleCloseTicket,
      variant: "outlined",
      color: "error",
      disabled: isSubmitting,
    });
  }

  if (mode === "create" || canReply) {
    footerActions.push({
      key: "submit",
      label:
        mode === "create"
          ? t("pages.support.create.submit")
          : t("pages.support.reply.submit"),
      type: "submit",
      variant: "contained",
      color: "primary",
      disabled: isSubmitting || !canSubmitTicket,
    });
  }

  return (
    <EntityModalShell
      open={open}
      title={dialogTitle}
      onClose={handleClose}
      maxWidth="md"
      resetKey={mode === "view" ? `${record?.id ?? ""}-${detailLoading}` : undefined}
      useFormWrapper
      onSubmit={handleSubmit}
      pinFooterToBottomOnMobile
      footer={<ModalFooterActions actions={footerActions} reverseOrderOnMobile={isMobile} />}
    >
      <Stack spacing={3}>
        {mode === "create" ? (
          <>
            {isSuperAdmin ? (
              <EntityAutocompleteField
                options={endUserOptions}
                value={selectedEndUser}
                inputValue={endUserSearch}
                loading={endUserOptionsLoading}
                onInputChange={setEndUserSearch}
                onChange={setSelectedEndUser}
                noOptionsText={t("pages.support.create.endUserNoOptions")}
                label={t("pages.support.create.endUserIdLabel")}
                helperText={t("pages.support.create.endUserIdHelp")}
                placeholder={t("pages.support.create.endUserSearchPlaceholder")}
                required
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
                disabled={disableCategorySelect}
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
        ) : detailLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 320 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              در حال دریافت اطلاعات تیکت...
            </Typography>
          </Stack>
        ) : record ? (
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6" fontWeight={800}>
                {record.title}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  variant="outlined"
                  label={TICKET_CATEGORY_LABEL[record.category]}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={TICKET_PRIORITY_LABEL[record.priority]}
                />
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
                <Typography variant="body2" color="text.secondary">
                  {t("table.pages.support.columns.updatedAt")}: {formatDateTime(record.updatedAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  پیام‌ها: {record.messageCount.toLocaleString("fa-IR")} · پیوست:{" "}
                  {record.attachmentCount.toLocaleString("fa-IR")}
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

            {conversationMessages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                {t("pages.support.view.noMessages")}
              </Typography>
            ) : (
              <Stack spacing={2} role="log" aria-live="polite" aria-label="گفتگوی تیکت">
                {conversationMessages.map((message, index) => (
                  <MessageBubble
                    key={`${record.id}-message-${message.sentAt ?? index}`}
                    message={message}
                    messageIndex={index}
                    currentUserId={currentUserId}
                    currentUserAvatarUrl={currentUserAvatarUrl}
                    currentUserDisplayName={currentUserDisplayName}
                    ticketCreatorUserId={record.createdByUserId}
                    ticketOwnerAvatarUrl={ticketOwnerAvatarUrl}
                    isEndUserView={isEndUserView}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        ) : null}

        {(mode === "create" || canReply) && !detailLoading ? (
          <Stack spacing={2}>
            <Divider />
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
              accept="image/*,application/pdf,.doc,.docx,.txt,video/*,audio/*"
              allowedFormatsLabel={t("pages.support.attachments.allowedFormats")}
              maxSizeLabel={t("pages.support.attachments.maxSize")}
              maxSizeBytes={FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.SUPPORT_ATTACHMENT}
              dropTitle={t("pages.support.attachments.dropTitle")}
              mobileDropTitle={t("pages.support.attachments.mobileDropTitle")}
              dropHint={t("pages.support.attachments.dropHint")}
              mobileDropHint={t("pages.support.attachments.mobileDropHint")}
              removeLabel={t("pages.support.attachments.removeLabel")}
              invalidLabel={t("pages.support.attachments.invalidLabel")}
              fullWidth
            />
          </Stack>
        ) : null}
      </Stack>
    </EntityModalShell>
  );
};

export default TicketDialog;
