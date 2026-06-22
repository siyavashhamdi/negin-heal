import { useQuery } from "@apollo/client/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";
import { AddRounded as AddRoundedIcon, Clear as ClearIcon } from "@mui/icons-material";
import { Avatar, Box, Checkbox, Chip, CircularProgress, IconButton, InputAdornment, ListItemText, MenuItem, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { type Theme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { USER_CREATE_MUTATION } from "../../graphql/mutations/userCreate.mutation";
import { USER_UPDATE_MUTATION } from "../../graphql/mutations/userUpdate.mutation";
import {
  buildExistingFilePreview,
  getFileIdFromAccessUrl,
  resolveFileAccessUrl,
  type FileAccessUrl,
} from "../../utils/fileAccessUrl.util";
import { hasFormChanges } from "../../utils/formChange.util";
import { MULTILINE_TEXTAREA_MIN_ROWS, MULTILINE_TEXTAREA_MAX_ROWS } from "../../constants/multilineTextarea.constants";
import { uploadFile } from "../../utils/fileUpload.util";
import {
  FILE_UPLOAD_POLICY,
  FILE_UPLOAD_POLICY_MAX_SIZE_BYTES,
} from "../../constants/fileUploadPolicies";
import { USER_LIST_QUERY } from "../../graphql/queries/userList.query";
import { USER_DETAIL_QUERY } from "../../graphql/queries/userDetail.query";
import { useDebounce } from "../../hooks/useDebounce";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import {
  useServerPaginatedQuery,
  type ServerPageResult,
} from "../../hooks/useServerPaginatedQuery";
import { useSnackbar } from "../../hooks/useSnackbar";
import { useTranslation } from "../../hooks/useTranslation";
import { sanitizeMobilePhoneInput, normalizeOptionalMobilePhoneToLocal, sanitizeLatinEmailInput, sanitizeLatinUsernameInput, latinIdentityFieldInputProps } from "../../utilities/mobile-phone.util";
import { isValidEmail, isValidMobilePhone } from "../../utilities/contact-validation.util";
import { isValidUsernameLength } from "../../utils/usernamePolicy.util";
import CrudRowActions from "../../shared/crud/CrudRowActions";
import EntityTableShell from "../../shared/crud/EntityTableShell";
import FileUploadField from "../../shared/forms/FileUploadField";
import JalaliDateFilterField from "../../shared/table/JalaliDateFilterField";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import crudPrimitives from "../../shared/crud/styles/crudPrimitives.module.scss";
import DateTimeValue from "../../shared/display/DateTimeValue";
import {
  EMPTY_MANAGED_USERS_LIST_FILTERS,
  hasManagedUsersColumnFiltersApplied,
  type ManagedUserRecord,
  type ManagedUsersListFilters,
} from "./users-management.types";
import {
  buildUserListQueryVariables,
  mapUserDetailRowToRecord,
  mapUserListItemRowToRecord,
  type UserDetailQuery,
  type UserDetailQueryVariables,
  type UserListItemRow,
  type UserListQuery,
  type UserListQueryVariables,
  type UserDetailRow,
  type UserRole,
  type UserStatus,
} from "./users-management-list.api";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import AppTooltip from "../../shared/AppTooltip";

const COLUMN_WIDTH_BY_ID: Record<string, string> = {
  avatarAccessUrl: "4.5rem",
  username: "12rem",
  firstName: "10rem",
  lastName: "11rem",
  fullName: "13rem",
  email: "15rem",
  phoneNumber: "11rem",
  avatarAccessUrl: "14rem",
  bio: "16rem",
  roles: "14rem",
  createdAt: "10rem",
  updatedAt: "10rem",
  status: "9rem",
  actions: "5rem",
};

const MOBILE_COLUMN_WIDTH_BY_ID: Record<string, string> = {
  avatarAccessUrl: "5rem",
  username: "24rem",
  firstName: "20rem",
  lastName: "22rem",
  fullName: "26rem",
  email: "30rem",
  phoneNumber: "22rem",
  avatarAccessUrl: "28rem",
  bio: "32rem",
  roles: "28rem",
  createdAt: "20rem",
  updatedAt: "20rem",
  status: "18rem",
  actions: "10rem",
};

const TABLE_TOOLBAR_OPTIONS = {
  showSearch: true,
  showColumnVisibility: true,
  showRefresh: true,
  showFilterButton: true,
} as const;

const EMPTY_DISPLAY = "—";

const ROLE_OPTIONS: readonly UserRole[] = ["SUPER_ADMIN", "ADMIN", "END_USER"];
const STATUS_OPTIONS: readonly UserStatus[] = ["ACTIVE", "DEACTIVE", "SUSPENDED", "BANNED"];

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "سوپر ادمین",
  ADMIN: "ادمین",
  END_USER: "کاربر",
};

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: "فعال",
  DEACTIVE: "غیرفعال",
  SUSPENDED: "تعلیق‌شده",
  BANNED: "مسدود",
};

const STATUS_COLOR: Record<
  UserStatus,
  "default" | "primary" | "success" | "warning" | "error" | "info"
> = {
  ACTIVE: "success",
  DEACTIVE: "default",
  SUSPENDED: "warning",
  BANNED: "error",
};

type UserUpdateMutation = {
  readonly userUpdate: UserDetailRow;
};

type UserEditFormState = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatarAccessUrl: FileAccessUrl | null;
  bio: string;
  roles: UserRole[];
  status: UserStatus;
  password: string;
};

type UserCreateMutation = {
  readonly userCreate: UserDetailRow;
};

type UserCreateMutationVariables = {
  readonly input: {
    readonly username: string;
    readonly password: string;
    readonly profile?: {
      readonly firstName?: string | null;
      readonly lastName?: string | null;
      readonly email?: string | null;
      readonly phoneNumber?: string | null;
      readonly avatarFileId?: string | null;
      readonly bio?: string | null;
    };
    readonly roles: readonly UserRole[];
    readonly status?: UserStatus;
  };
};

type UserUpdateMutationVariables = {
  readonly input: {
    readonly id: string;
    readonly username?: string | null;
    readonly profile?: {
      readonly firstName?: string | null;
      readonly lastName?: string | null;
      readonly email?: string | null;
      readonly phoneNumber?: string | null;
      readonly avatarFileId?: string | null;
      readonly bio?: string | null;
    };
    readonly roles?: readonly UserRole[];
    readonly status?: UserStatus;
    readonly password?: string | null;
  };
};

type UserDialogMode = "create" | "edit";

function orEmpty(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "-" ? EMPTY_DISPLAY : trimmed;
}

function editableValue(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" || trimmed === "-" || trimmed === EMPTY_DISPLAY ? "" : value;
}

function optionalInput(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function buildCreateFormState(): UserEditFormState {
  return {
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    avatarAccessUrl: null,
    bio: "",
    roles: ["END_USER"],
    status: "ACTIVE",
    password: "",
  };
}

function buildEditFormState(record: ManagedUserRecord): UserEditFormState {
  return {
    username: editableValue(record.username),
    firstName: editableValue(record.firstName),
    lastName: editableValue(record.lastName),
    email: editableValue(record.email),
    phoneNumber: editableValue(record.phoneNumber),
    avatarAccessUrl: record.avatarAccessUrl,
    bio: editableValue(record.bio),
    roles: record.roles.filter((role): role is UserRole => ROLE_OPTIONS.includes(role as UserRole)),
    status: STATUS_OPTIONS.includes(record.status as UserStatus)
      ? (record.status as UserStatus)
      : "ACTIVE",
    password: "",
  };
}

function UserAvatarCell({
  avatarAccessUrl,
  displayName,
}: {
  readonly avatarAccessUrl?: FileAccessUrl | null;
  readonly displayName: string;
}): ReactElement {
  const resolvedUrl = resolveFileAccessUrl(avatarAccessUrl);
  const initial = displayName.trim().slice(0, 1) || "?";

  return (
    <Avatar
      src={resolvedUrl ?? undefined}
      alt=""
      sx={{ width: 32, height: 32, bgcolor: "action.hover", mx: "auto" }}
    >
      {initial}
    </Avatar>
  );
}

function selectUserListPage(
  data: UserListQuery | undefined,
): ServerPageResult<UserListItemRow> | null {
  const page = data?.userList;
  if (!page) {
    return null;
  }

  const limit = Math.max(1, page.pagination.limit || 10);
  const skip = Math.max(0, page.pagination.skip || 0);
  const total = Math.max(0, page.pagination.total || 0);

  return {
    items: page.items,
    total,
    page: Math.floor(skip / limit) + 1,
    pageSize: limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

const UsersManagementList = (): ReactElement => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery((muiTheme: Theme) => muiTheme.breakpoints.down("md"));
  const { t } = useTranslation();
  const { showError } = useSnackbar();
  const hasShownLoadErrorRef = useRef(false);
  const isCreateRoute = location.pathname === `${APP_SHELL_ROUTES.users}/new`;
  const editUserId = useMemo(() => {
    const editRoutePrefix = `${APP_SHELL_ROUTES.users}/edit/`;
    if (!location.pathname.startsWith(editRoutePrefix)) {
      return null;
    }

    const routeId = location.pathname.slice(editRoutePrefix.length);
    return routeId || null;
  }, [location.pathname]);
  const userDialogOpen = isCreateRoute || editUserId != null;

  const { data: userDetailData, loading: userDetailLoading } = useQuery<
    UserDetailQuery,
    UserDetailQueryVariables
  >(USER_DETAIL_QUERY, {
    variables: { input: { id: editUserId ?? "" } },
    skip: !editUserId,
    fetchPolicy: "network-only",
  });

  const editUserRecord = useMemo(() => {
    if (!editUserId || userDetailData?.userDetail?.id !== editUserId) {
      return null;
    }

    return mapUserDetailRowToRecord(userDetailData.userDetail);
  }, [editUserId, userDetailData]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    avatarAccessUrl: true,
    username: true,
    firstName: false,
    lastName: false,
    fullName: true,
    email: true,
    phoneNumber: true,
    bio: false,
    roles: true,
    status: true,
    createdAt: true,
    updatedAt: false,
  });
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [appliedFilters, setAppliedFilters] = useState<ManagedUsersListFilters>(
    EMPTY_MANAGED_USERS_LIST_FILTERS
  );
  const [pendingFilters, setPendingFilters] = useState<ManagedUsersListFilters>(
    EMPTY_MANAGED_USERS_LIST_FILTERS
  );
  const debouncedPendingFilters = useDebounce(pendingFilters, 500);
  const applyFiltersRef = useRef<(() => void) | null>(null);
  const [dialogMode, setDialogMode] = useState<UserDialogMode>("edit");
  const [editTarget, setEditTarget] = useState<ManagedUserRecord | null>(null);
  const [editForm, setEditForm] = useState<UserEditFormState | null>(null);
  const [initialEditForm, setInitialEditForm] = useState<UserEditFormState | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const appliedDialogKeyRef = useRef<string | null>(null);

  const hasAppliedFilters = useMemo(
    () => debouncedSearchQuery.trim() !== "" || hasManagedUsersColumnFiltersApplied(appliedFilters),
    [appliedFilters, debouncedSearchQuery]
  );

  const buildVariables = useCallback(
    ({ page, pageSize }: { page: number; pageSize: number }) =>
      buildUserListQueryVariables(debouncedSearchQuery, appliedFilters, page, pageSize),
    [appliedFilters, debouncedSearchQuery]
  );

  const {
    items: rows,
    loading,
    error,
    onRefresh,
    pagination,
  } = useServerPaginatedQuery<
    UserListQuery,
    UserListQueryVariables,
    UserListItemRow,
    ManagedUserRecord
  >({
    query: USER_LIST_QUERY,
    variables: buildVariables,
    selectPage: selectUserListPage,
    mapItem: mapUserListItemRowToRecord,
    resetPageDeps: [debouncedSearchQuery, appliedFilters],
  });

  const [createUser, createUserResult] = useMutationWithSnackbar<
    UserCreateMutation,
    UserCreateMutationVariables
  >(USER_CREATE_MUTATION, {
    successMessage: t("pages.usersManagement.create.success"),
    onSuccess: () => {
      setEditTarget(null);
      setEditForm(null);
      setAvatarFile(null);
      setDialogMode("edit");
      onRefresh();
    },
  });

  const [updateUser, updateUserResult] = useMutationWithSnackbar<
    UserUpdateMutation,
    UserUpdateMutationVariables
  >(USER_UPDATE_MUTATION, {
    successMessage: t("pages.usersManagement.edit.success"),
    onSuccess: () => {
      setEditTarget(null);
      setEditForm(null);
      setAvatarFile(null);
      setDialogMode("edit");
      onRefresh();
    },
  });

  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  const isSavingUser =
    createUserResult.loading ||
    updateUserResult.loading ||
    isAvatarUploading ||
    (editUserId != null && userDetailLoading);

  const isCreateFormReady =
    editForm != null &&
    isValidUsernameLength(editForm.username) &&
    editForm.roles.length > 0 &&
    editForm.password.trim().length > 0;

  const hasEditFormChanges =
    initialEditForm != null &&
    editForm != null &&
    (hasFormChanges(initialEditForm, editForm) || avatarFile != null);

  const canSubmitUserForm =
    dialogMode === "create" ? isCreateFormReady : hasEditFormChanges;

  useEffect(() => {
    if (!error) {
      hasShownLoadErrorRef.current = false;
      return;
    }
    if (hasShownLoadErrorRef.current) {
      return;
    }
    showError(t("errors.general.loadData"));
    hasShownLoadErrorRef.current = true;
  }, [error, showError, t]);

  const columns = useMemo<ColumnDef<ManagedUserRecord>[]>(
    () => [
      {
        accessorKey: "avatarAccessUrl",
        header: t("table.pages.usersManagement.columns.avatarFileId"),
        cell: ({ row }) => (
          <UserAvatarCell
            avatarAccessUrl={row.original.avatarAccessUrl}
            displayName={
              row.original.fullName !== EMPTY_DISPLAY
                ? row.original.fullName
                : row.original.username
            }
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "fullName",
        header: t("table.pages.usersManagement.columns.fullName"),
        cell: (info) => (
          <Typography variant="body2">{orEmpty(info.getValue() as string)}</Typography>
        ),
      },
      {
        accessorKey: "username",
        header: t("table.pages.usersManagement.columns.username"),
        cell: (info) => (
          <Typography variant="body2" fontWeight={600}>
            {orEmpty(info.getValue() as string)}
          </Typography>
        ),
      },
      {
        accessorKey: "email",
        header: t("table.pages.usersManagement.columns.email"),
        cell: (info) => (
          <Typography variant="body2" className={crudPrimitives.tabularNums}>
            {orEmpty(info.getValue() as string)}
          </Typography>
        ),
      },
      {
        accessorKey: "phoneNumber",
        header: t("table.pages.usersManagement.columns.phoneNumber"),
        cell: (info) => (
          <Typography variant="body2" className={crudPrimitives.tabularNums}>
            {orEmpty(info.getValue() as string)}
          </Typography>
        ),
      },
      {
        accessorKey: "roles",
        header: t("table.pages.usersManagement.columns.roles"),
        cell: (info) => {
          const roles = info.getValue() as readonly UserRole[];
          if (roles.length === 0) {
            return (
              <Typography variant="body2" color="text.secondary">
                {EMPTY_DISPLAY}
              </Typography>
            );
          }
          return (
            <Stack direction="row" spacing={0.5} justifyContent="center">
              {roles.map((role) => (
                <Chip key={role} size="small" label={ROLE_LABEL[role] ?? role} variant="outlined" />
              ))}
            </Stack>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: t("table.pages.usersManagement.columns.createdAt"),
        cell: (info) => <DateTimeValue value={info.getValue() as string} />,
      },
      {
        accessorKey: "status",
        header: t("table.pages.usersManagement.columns.status"),
        cell: (info) => {
          const status = info.getValue() as UserStatus;
          return (
            <Chip
              size="small"
              color={STATUS_COLOR[status] ?? "default"}
              variant="outlined"
              label={STATUS_LABEL[status] ?? status}
            />
          );
        },
      },
      {
        accessorKey: "firstName",
        header: t("table.pages.usersManagement.columns.firstName"),
        cell: (info) => (
          <Typography variant="body2">{orEmpty(info.getValue() as string)}</Typography>
        ),
      },
      {
        accessorKey: "lastName",
        header: t("table.pages.usersManagement.columns.lastName"),
        cell: (info) => (
          <Typography variant="body2">{orEmpty(info.getValue() as string)}</Typography>
        ),
      },
      {
        accessorKey: "bio",
        header: t("table.pages.usersManagement.columns.bio"),
        cell: (info) => (
          <Typography variant="body2">{orEmpty(info.getValue() as string)}</Typography>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: t("table.pages.usersManagement.columns.updatedAt"),
        cell: (info) => <DateTimeValue value={info.getValue() as string} />,
      },
      {
        id: "actions",
        header: t("table.columns.actions"),
        cell: ({ row }) => (
          <CrudRowActions
            onEdit={() => {
              navigate(`${APP_SHELL_ROUTES.users}/edit/${row.original.id}`);
            }}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [t]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  const handleClearFilters = (): void => {
    setPendingFilters(EMPTY_MANAGED_USERS_LIST_FILTERS);
    setAppliedFilters(EMPTY_MANAGED_USERS_LIST_FILTERS);
    setSearchQuery("");
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = (): void => {
    setSearchQuery("");
  };

  const handleApplyFilters = (): void => {
    setAppliedFilters({ ...pendingFilters });
  };

  useEffect(() => {
    applyFiltersRef.current = handleApplyFilters;
  });

  useEffect(() => {
    if (!showColumnFilters) {
      return;
    }
    applyFiltersRef.current?.();
  }, [debouncedPendingFilters, showColumnFilters]);

  const renderTextFilter = (
    key: keyof Pick<
      ManagedUsersListFilters,
      "username" | "firstName" | "lastName" | "fullName" | "email" | "phoneNumber"
    >,
    label: string,
    sanitize?: (value: string) => string,
  ): ReactElement => {
    const textFilterValue = pendingFilters[key];
    return (
      <TextField
        size="small"
        fullWidth
        aria-label={label}
        value={textFilterValue}
        onChange={(event) => {
          const nextValue = sanitize ? sanitize(event.target.value) : event.target.value;
          setPendingFilters((prev) => ({
            ...prev,
            [key]: nextValue,
          }));
        }}
        inputProps={
          key === "phoneNumber"
            ? { ...latinIdentityFieldInputProps, inputMode: "tel", className: undefined }
            : key === "username" || key === "email"
              ? { ...latinIdentityFieldInputProps, inputMode: key === "email" ? "email" : "text" }
              : undefined
        }
        InputProps={{
          endAdornment:
            textFilterValue.trim() !== "" ? (
              <InputAdornment position="end">
                <AppTooltip title={t("table.dataGrid.filter.clearField")} arrow>
                  <IconButton
                    size="small"
                    edge="end"
                    aria-label={t("table.dataGrid.filter.clearField")}
                    onClick={() =>
                      setPendingFilters((prev) => ({
                        ...prev,
                        [key]: "",
                      }))
                    }
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </AppTooltip>
              </InputAdornment>
            ) : undefined,
        }}
      />
    );
  };

  const renderSelectFilter = (
    key: keyof Pick<ManagedUsersListFilters, "role" | "status">,
    label: string,
    options: readonly string[],
    labels: Record<string, string>
  ): ReactElement => (
    <TextField
      select
      size="small"
      fullWidth
      aria-label={label}
      value={pendingFilters[key]}
      onChange={(event) =>
        setPendingFilters((prev) => ({
          ...prev,
          [key]: event.target.value,
        }))
      }
    >
      <MenuItem value="ALL">{t("table.filters.all")}</MenuItem>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {labels[option] ?? option}
        </MenuItem>
      ))}
    </TextField>
  );

  const renderDateFilter = (
    key: keyof Pick<
      ManagedUsersListFilters,
      "createdAtFrom" | "createdAtTo" | "updatedAtFrom" | "updatedAtTo"
    >,
    label: string
  ): ReactElement => (
    <JalaliDateFilterField
      ariaLabel={label}
      label={label}
      value={pendingFilters[key]}
      onChange={(value) =>
        setPendingFilters((prev) => ({
          ...prev,
          [key]: value,
        }))
      }
    />
  );

  const renderFilterCell = (column: Column<ManagedUserRecord, unknown>) => {
    if (column.id === "username") {
      return renderTextFilter(
        "username",
        t("table.pages.usersManagement.columns.username"),
        sanitizeLatinUsernameInput,
      );
    }
    if (column.id === "firstName") {
      return renderTextFilter("firstName", t("table.pages.usersManagement.columns.firstName"));
    }
    if (column.id === "lastName") {
      return renderTextFilter("lastName", t("table.pages.usersManagement.columns.lastName"));
    }
    if (column.id === "fullName") {
      return renderTextFilter("fullName", t("table.pages.usersManagement.columns.fullName"));
    }
    if (column.id === "email") {
      return renderTextFilter(
        "email",
        t("table.pages.usersManagement.columns.email"),
        sanitizeLatinEmailInput,
      );
    }
    if (column.id === "phoneNumber") {
      return renderTextFilter(
        "phoneNumber",
        t("table.pages.usersManagement.columns.phoneNumber"),
        sanitizeMobilePhoneInput,
      );
    }
    if (column.id === "roles") {
      return renderSelectFilter(
        "role",
        t("table.pages.usersManagement.columns.roles"),
        ROLE_OPTIONS,
        ROLE_LABEL
      );
    }
    if (column.id === "status") {
      return renderSelectFilter(
        "status",
        t("table.pages.usersManagement.columns.status"),
        STATUS_OPTIONS,
        STATUS_LABEL
      );
    }
    if (column.id === "createdAt") {
      return (
        <Stack spacing={1}>
          {renderDateFilter(
            "createdAtFrom",
            t("table.pages.usersManagement.filters.createdAtFrom")
          )}
          {renderDateFilter("createdAtTo", t("table.pages.usersManagement.filters.createdAtTo"))}
        </Stack>
      );
    }
    if (column.id === "updatedAt") {
      return (
        <Stack spacing={1}>
          {renderDateFilter(
            "updatedAtFrom",
            t("table.pages.usersManagement.filters.updatedAtFrom")
          )}
          {renderDateFilter("updatedAtTo", t("table.pages.usersManagement.filters.updatedAtTo"))}
        </Stack>
      );
    }
    return null;
  };

  const handleCloseEditDialog = (): void => {
    if (isSavingUser) {
      return;
    }
    appliedDialogKeyRef.current = null;
    setEditTarget(null);
    setEditForm(null);
    setInitialEditForm(null);
    setAvatarFile(null);
    setDialogMode("edit");
    navigate(APP_SHELL_ROUTES.users);
  };

  const handleOpenCreateDialog = (): void => {
    const nextForm = buildCreateFormState();
    setDialogMode("create");
    setEditTarget(null);
    setInitialEditForm(nextForm);
    setEditForm(nextForm);
    setAvatarFile(null);
    navigate(`${APP_SHELL_ROUTES.users}/new`);
  };

  useEffect(() => {
    if (isCreateRoute) {
      if (appliedDialogKeyRef.current === "__create__") {
        return;
      }

      const nextForm = buildCreateFormState();
      setDialogMode("create");
      setEditTarget(null);
      setInitialEditForm(nextForm);
      setEditForm(nextForm);
      setAvatarFile(null);
      appliedDialogKeyRef.current = "__create__";
      return;
    }

    if (!editUserRecord || !editUserId) {
      return;
    }

    if (appliedDialogKeyRef.current === editUserId) {
      return;
    }

    const nextForm = buildEditFormState(editUserRecord);
    setDialogMode("edit");
    setEditTarget(editUserRecord);
    setInitialEditForm(nextForm);
    setEditForm(nextForm);
    setAvatarFile(null);
    appliedDialogKeyRef.current = editUserId;
  }, [editUserId, editUserRecord, isCreateRoute]);

  const setEditField = <TField extends keyof UserEditFormState>(
    field: TField,
    value: UserEditFormState[TField]
  ): void => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const uploadSelectedAvatar = async (file: File): Promise<string | null> => {
    setIsAvatarUploading(true);
    try {
      const uploadedFile = await uploadFile(file, {
        policy: FILE_UPLOAD_POLICY.AVATAR,
        accept: "image/*",
        maxSizeBytes: FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.AVATAR,
      });
      return getFileIdFromAccessUrl(uploadedFile.accessUrl);
    } catch {
      showError(t("pages.usersManagement.avatarUpload.error"));
      return null;
    } finally {
      setIsAvatarUploading(false);
    }
  };

  const handleSubmitEdit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!editForm) {
      return;
    }

    const username = editForm.username.trim();
    if (!username) {
      showError(t("pages.usersManagement.edit.usernameRequired"));
      return;
    }

    if (!isValidUsernameLength(username)) {
      showError(t("pages.usersManagement.validation.usernameMinLength"));
      return;
    }

    if (editForm.roles.length === 0) {
      showError(t("pages.usersManagement.edit.rolesRequired"));
      return;
    }

    const emailValue = editForm.email.trim();
    if (emailValue && !isValidEmail(emailValue)) {
      showError(t("pages.usersManagement.validation.invalidEmail"));
      return;
    }

    const phoneValue = editForm.phoneNumber.trim();
    const normalizedPhone = normalizeOptionalMobilePhoneToLocal(phoneValue);
    if (phoneValue && !normalizedPhone) {
      showError(t("pages.usersManagement.validation.invalidPhoneNumber"));
      return;
    }

    let avatarFileId = getFileIdFromAccessUrl(editForm.avatarAccessUrl);
    if (avatarFile) {
      avatarFileId = await uploadSelectedAvatar(avatarFile);
      if (!avatarFileId) {
        return;
      }
    }

    if (dialogMode === "create") {
      const password = editForm.password.trim();
      if (!password) {
        showError(t("pages.usersManagement.create.passwordRequired"));
        return;
      }

      void createUser({
        variables: {
          input: {
            username,
            password,
            profile: {
              firstName: optionalInput(editForm.firstName),
              lastName: optionalInput(editForm.lastName),
              email: optionalInput(editForm.email),
              phoneNumber: normalizedPhone,
              avatarFileId,
              bio: optionalInput(editForm.bio),
            },
            roles: editForm.roles,
            status: editForm.status,
          },
        },
      });
      return;
    }

    if (!editTarget) {
      return;
    }

    void updateUser({
      variables: {
        input: {
          id: editTarget.id,
          username,
          profile: {
            firstName: optionalInput(editForm.firstName),
            lastName: optionalInput(editForm.lastName),
            email: optionalInput(editForm.email),
            phoneNumber: normalizedPhone,
            avatarFileId,
            bio: optionalInput(editForm.bio),
          },
          roles: editForm.roles,
          status: editForm.status,
          password: optionalInput(editForm.password) ?? undefined,
        },
      },
    });
  };

  return (
    <>
      <EntityTableShell<ManagedUserRecord>
        table={table}
        pagedRows={table.getRowModel().rows}
        isMobile={isMobile}
        searchValue={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        onRefresh={onRefresh}
        loading={loading}
        showNewButton
        newButtonText={t("table.entity.createButton", {
          title: t("pages.usersManagement.createEntityTitle"),
        })}
        onNewClick={handleOpenCreateDialog}
        toolbarOptions={TABLE_TOOLBAR_OPTIONS}
        showColumnFilters={showColumnFilters}
        onShowColumnFiltersChange={setShowColumnFilters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        renderFilterCell={renderFilterCell}
        columnWidthById={isMobile ? MOBILE_COLUMN_WIDTH_BY_ID : COLUMN_WIDTH_BY_ID}
        noDataLabel={error ? t("errors.general.loadData") : undefined}
        hasActiveFilters={hasAppliedFilters}
        pagination={pagination}
      />

      <EntityModalShell
        open={userDialogOpen}
        onClose={handleCloseEditDialog}
        disableClose={isSavingUser}
        hasUnsavedChanges={canSubmitUserForm}
        maxWidth="lg"
        resetKey={editUserId != null ? `${editUserId}-${Boolean(editUserRecord)}` : undefined}
        title={
          dialogMode === "create"
            ? t("pages.usersManagement.create.title")
            : t("pages.usersManagement.edit.title")
        }
        subtitle={
          dialogMode === "create"
            ? t("pages.usersManagement.create.subtitle")
            : editUserRecord?.fullName?.trim() ||
              editUserRecord?.username?.trim() ||
              t("pages.usersManagement.edit.subtitle")
        }
        useFormWrapper
        onSubmit={handleSubmitEdit}
        closeOnSave
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: handleCloseEditDialog,
                disabled: isSavingUser,
              },
              {
                key: "submit",
                label: isSavingUser
                  ? t("pages.usersManagement.edit.saving")
                  : dialogMode === "create"
                    ? t("pages.usersManagement.create.save")
                    : t("pages.usersManagement.edit.save"),
                type: "submit",
                icon: dialogMode === "create" ? <AddRoundedIcon /> : undefined,
                disabled: isSavingUser || !editForm || !canSubmitUserForm,
              },
            ]}
          />
        }
      >
        {editUserId != null && userDetailLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 320 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              در حال دریافت اطلاعات کاربر...
            </Typography>
          </Stack>
        ) : editForm ? (
          <Stack spacing={3}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label={t("table.pages.usersManagement.columns.username")}
                    value={editForm.username}
                    onChange={(event) =>
                      setEditField("username", sanitizeLatinUsernameInput(event.target.value))
                    }
                    required
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t("table.pages.usersManagement.columns.email")}
                    value={editForm.email}
                    onChange={(event) =>
                      setEditField("email", sanitizeLatinEmailInput(event.target.value))
                    }
                    fullWidth
                    size="small"
                    type="email"
                  />
                  <TextField
                    label={t("table.pages.usersManagement.columns.phoneNumber")}
                    value={editForm.phoneNumber}
                    onChange={(event) =>
                      setEditField("phoneNumber", sanitizeMobilePhoneInput(event.target.value))
                    }
                    fullWidth
                    size="small"
                    inputProps={{ ...latinIdentityFieldInputProps, inputMode: "tel", dir: "ltr" }}
                  />
                </Stack>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
                  <TextField
                    label={t("table.pages.usersManagement.columns.firstName")}
                    value={editForm.firstName}
                    onChange={(event) => setEditField("firstName", event.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t("table.pages.usersManagement.columns.lastName")}
                    value={editForm.lastName}
                    onChange={(event) => setEditField("lastName", event.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label={t("table.pages.usersManagement.columns.bio")}
                    value={editForm.bio}
                    onChange={(event) => setEditField("bio", event.target.value)}
                    fullWidth
                    size="small"
                    multiline
                    minRows={MULTILINE_TEXTAREA_MIN_ROWS}
                    maxRows={MULTILINE_TEXTAREA_MAX_ROWS}
                  />
                </Stack>

                <FileUploadField
                  label={t("pages.usersManagement.avatarUpload.label")}
                  file={avatarFile}
                  onChange={setAvatarFile}
                  existingFile={buildExistingFilePreview(
                    editForm.avatarAccessUrl,
                    editForm.username.trim() || "آواتار",
                  )}
                  onExistingFileClear={() => {
                    setAvatarFile(null);
                    setEditField("avatarAccessUrl", null);
                  }}
                  accept="image/*"
                  allowedFormatsLabel={t("pages.usersManagement.avatarUpload.allowedFormats")}
                  maxSizeLabel={t("pages.usersManagement.avatarUpload.maxSize")}
                  maxSizeBytes={FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.AVATAR}
                  dropTitle={t("pages.usersManagement.avatarUpload.dropTitle")}
                  mobileDropTitle={t("pages.usersManagement.avatarUpload.mobileDropTitle")}
                  dropHint={t("pages.usersManagement.avatarUpload.dropHint")}
                  mobileDropHint={t("pages.usersManagement.avatarUpload.mobileDropHint")}
                  removeLabel={t("pages.usersManagement.avatarUpload.removeLabel")}
                  invalidLabel={t("pages.usersManagement.avatarUpload.invalidLabel")}
                  fullWidth
                />

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    label={
                      dialogMode === "create"
                        ? t("pages.usersManagement.create.password")
                        : t("pages.usersManagement.edit.password")
                    }
                    value={editForm.password}
                    onChange={(event) => setEditField("password", event.target.value)}
                    fullWidth
                    size="small"
                    type="password"
                    required={dialogMode === "create"}
                    helperText={
                      dialogMode === "create"
                        ? t("pages.usersManagement.create.passwordHelp")
                        : t("pages.usersManagement.edit.passwordHelp")
                    }
                    autoComplete="new-password"
                  />
                  <TextField
                    select
                    label={t("table.pages.usersManagement.columns.status")}
                    value={editForm.status}
                    onChange={(event) => setEditField("status", event.target.value as UserStatus)}
                    fullWidth
                    size="small"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>

                <TextField
                  select
                  label={t("table.pages.usersManagement.columns.roles")}
                  value={editForm.roles}
                  onChange={(event) => {
                    const value = event.target.value;
                    setEditField(
                      "roles",
                      typeof value === "string"
                        ? (value.split(",") as UserRole[])
                        : (value as UserRole[])
                    );
                  }}
                  SelectProps={{
                    multiple: true,
                    renderValue: (selected) =>
                      (selected as UserRole[]).map((role) => ROLE_LABEL[role] ?? role).join("، "),
                  }}
                  fullWidth
                  size="small"
                  required
                >
                  {ROLE_OPTIONS.map((role) => (
                    <MenuItem key={role} value={role}>
                      <Checkbox checked={editForm.roles.includes(role)} size="small" />
                      <ListItemText primary={ROLE_LABEL[role]} />
                    </MenuItem>
                  ))}
                </TextField>

              </Stack>
            ) : null}
      </EntityModalShell>
    </>
  );
};

export default UsersManagementList;
