import { type ReactElement, type ReactNode } from "react";
import { Button, Stack, type ButtonProps } from "@mui/material";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { useEntityModalRequestClose } from "./entityModalCloseContext";
import { MODAL_CLOSE_LABEL } from "./modalFooterActions.util";

type FooterActionColor = NonNullable<ButtonProps["color"]>;
type FooterActionVariant = NonNullable<ButtonProps["variant"]>;

export type ModalFooterAction = {
  readonly key: string;
  readonly label?: string;
  readonly onClick?: () => void;
  readonly type?: "button" | "submit";
  readonly color?: FooterActionColor;
  readonly variant?: FooterActionVariant;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
  /** Applies standard dismiss styling and default label (`بستن`). */
  readonly isCloseButton?: boolean;
  /** Applies standard destructive styling (contained + error). */
  readonly isDestructive?: boolean;
};

type ModalFooterActionsProps = {
  readonly actions: readonly ModalFooterAction[];
  /** On mobile, primary action appears above the close button. */
  readonly reverseOrderOnMobile?: boolean;
};

function resolveActionPresentation(action: ModalFooterAction): {
  label: string;
  color: FooterActionColor;
  variant: FooterActionVariant;
} {
  if (action.isCloseButton) {
    return {
      label: action.label ?? MODAL_CLOSE_LABEL,
      variant: action.variant ?? "outlined",
      color: action.color ?? "inherit",
    };
  }

  if (action.isDestructive) {
    return {
      label: action.label ?? "",
      variant: action.variant ?? "contained",
      color: action.color ?? "error",
    };
  }

  return {
    label: action.label ?? "",
    variant: action.variant ?? "contained",
    color: action.color ?? "primary",
  };
}

export default function ModalFooterActions({
  actions,
  reverseOrderOnMobile = true,
}: ModalFooterActionsProps): ReactElement {
  const { isCompact } = useMobileDialogProps();
  const requestModalClose = useEntityModalRequestClose();

  return (
    <Stack
      direction={isCompact && reverseOrderOnMobile ? "column-reverse" : "column"}
      spacing={1.5}
      sx={{
        width: "100%",
        "& .MuiButton-root": {
          width: "100%",
        },
      }}
    >
      {actions.map((action) => {
        const presentation = resolveActionPresentation(action);

        const handleClick = (): void => {
          if (action.isCloseButton && requestModalClose) {
            requestModalClose();
            return;
          }

          action.onClick?.();
        };

        return (
          <Button
            key={action.key}
            type={action.type ?? "button"}
            onClick={handleClick}
            color={presentation.color}
            variant={presentation.variant}
            startIcon={action.icon}
            disabled={action.disabled}
          >
            {presentation.label}
          </Button>
        );
      })}
    </Stack>
  );
}
