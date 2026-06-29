import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { Button, IconButton } from "@mui/material";
import { useCallback, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./styles/PageBackNavigation.module.scss";

type PageBackNavigationBaseProps = {
  readonly label: string;
  readonly className?: string;
  readonly size?: "small" | "medium" | "large";
  /** Used only when there is no previous in-app history entry. */
  readonly fallbackTo?: string;
};

type PageBackHistoryProps = PageBackNavigationBaseProps & {
  readonly onClick?: never;
};

type PageBackClickProps = PageBackNavigationBaseProps & {
  readonly onClick: () => void;
  readonly fallbackTo?: never;
};

export type PageBackNavigationProps = (PageBackHistoryProps | PageBackClickProps) & {
  /** Shows a floating icon-only back control on small screens (product detail style). */
  readonly mobileOverlay?: boolean;
};

type PageBackControlProps = PageBackHistoryProps | PageBackClickProps;

function canNavigateHistoryBack(): boolean {
  const historyIndex = window.history.state?.idx;
  return typeof historyIndex === "number" && historyIndex > 0;
}

export function usePageBackNavigation(fallbackTo?: string): () => void {
  const navigate = useNavigate();

  return useCallback(() => {
    if (canNavigateHistoryBack()) {
      navigate(-1);
      return;
    }

    if (fallbackTo) {
      navigate(fallbackTo);
      return;
    }

    navigate(-1);
  }, [fallbackTo, navigate]);
}

function usePageBackHandler(
  onClick: (() => void) | undefined,
  fallbackTo: string | undefined
): () => void {
  const navigateBack = usePageBackNavigation(fallbackTo);
  return onClick ?? navigateBack;
}

export function PageBackTextButton({
  label,
  className,
  size,
  onClick,
  fallbackTo,
}: PageBackControlProps): ReactElement {
  const handleClick = usePageBackHandler(onClick, fallbackTo);

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant="text"
      size={size}
      className={className}
      startIcon={<ArrowBackRoundedIcon />}
    >
      {label}
    </Button>
  );
}

export function PageBackIconButton({
  label,
  className,
  onClick,
  fallbackTo,
}: PageBackControlProps): ReactElement {
  const handleClick = usePageBackHandler(onClick, fallbackTo);

  return (
    <IconButton type="button" onClick={handleClick} className={className} aria-label={label}>
      <ArrowBackRoundedIcon />
    </IconButton>
  );
}

export default function PageBackNavigation({
  label,
  className,
  size,
  mobileOverlay = false,
  onClick,
  fallbackTo,
}: PageBackNavigationProps): ReactElement {
  const topBarClassName = mobileOverlay
    ? `${styles.topBar} ${styles.topBarHiddenOnMobile}`
    : styles.topBar;
  const controlProps = onClick ? { label, onClick } : { label, fallbackTo };

  return (
    <>
      <div className={topBarClassName}>
        <PageBackTextButton label={label} className={className} size={size} {...controlProps} />
      </div>
      {mobileOverlay ? (
        <PageBackIconButton
          label={label}
          className={styles.mobileTopBackButton}
          {...controlProps}
        />
      ) : null}
    </>
  );
}
