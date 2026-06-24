import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  useCallback,
  useState,
} from "react";
import { Box, Button, Popover, TextField } from "@mui/material";
import { useTranslation } from "../../hooks/useTranslation";
import { toWesternDigits } from "../../utilities/persian-digits.util";
import styles from "./styles/PaginationControls.module.scss";

export function parsePageNumberInput(value: string, totalPages: number): number | null {
  const normalized = toWesternDigits(value.trim());
  if (normalized === "") {
    return null;
  }
  const parsed = Number.parseInt(normalized, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > totalPages) {
    return null;
  }
  return parsed;
}

interface PaginationGoToPagePopoverProps {
  totalPages: number;
  onPageChange: (event: ChangeEvent<unknown>, value: number) => void;
}

export function usePaginationGoToPagePopover({
  totalPages,
  onPageChange,
}: PaginationGoToPagePopoverProps): {
  openGoToPagePopover: (anchor: HTMLElement) => void;
  goToPagePopover: ReactElement | null;
} {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const close = useCallback((): void => {
    setAnchorEl(null);
    setInput("");
    setError(false);
  }, []);

  const openGoToPagePopover = useCallback((anchor: HTMLElement): void => {
    setAnchorEl(anchor);
    setInput("");
    setError(false);
  }, []);

  const submit = useCallback((): void => {
    const targetPage = parsePageNumberInput(input, totalPages);
    if (targetPage == null) {
      setError(true);
      return;
    }
    onPageChange({} as ChangeEvent<unknown>, targetPage);
    close();
  }, [close, input, onPageChange, totalPages]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  const goToPagePopover =
    totalPages > 1 ? (
      <Popover
        open={anchorEl != null}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          className: styles.goToPagePopover,
          onMouseDown: (event: MouseEvent<HTMLDivElement>) => {
            event.stopPropagation();
          },
        }}
      >
        <Box className={styles.goToPageContent}>
          <TextField
            size="small"
            autoFocus
            label={t("table.pagination.goToPageLabel")}
            placeholder={t("table.pagination.goToPagePlaceholder")}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(false);
            }}
            onKeyDown={handleKeyDown}
            error={error}
            helperText={error ? t("table.pagination.goToPageInvalid", { totalPages }) : undefined}
            inputProps={{
              inputMode: "numeric",
              pattern: "[0-9]*",
            }}
          />
          <Button variant="contained" size="small" onClick={submit} disabled={input.trim() === ""}>
            {t("table.pagination.goToPageButton")}
          </Button>
        </Box>
      </Popover>
    ) : null;

  return { openGoToPagePopover, goToPagePopover };
}
