import { type ReactElement, type ReactNode } from "react";
import { Button, Stack, type ButtonProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMobileDialogProps } from "../../hooks/useMobileDialogProps";
import { crudModalFooterSx } from "./modalThemeSx";

type FooterActionColor = NonNullable<ButtonProps["color"]>;
type FooterActionVariant = NonNullable<ButtonProps["variant"]>;

export type ModalFooterAction = {
  readonly key: string;
  readonly label: string;
  readonly onClick?: () => void;
  readonly type?: "button" | "submit";
  readonly color?: FooterActionColor;
  readonly variant?: FooterActionVariant;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
};

type ModalFooterActionsProps = {
  readonly actions: readonly ModalFooterAction[];
  readonly reverseOrderOnMobile?: boolean;
  readonly pinFooterToBottomOnMobile?: boolean;
};

export default function ModalFooterActions({
  actions,
  reverseOrderOnMobile = true,
  pinFooterToBottomOnMobile = true,
}: ModalFooterActionsProps): ReactElement {
  const theme = useTheme();
  const { isCompact } = useMobileDialogProps();

  return (
    <Stack
      sx={crudModalFooterSx(theme, { pinFooterToBottomOnMobile })}
      direction="column"
      spacing={0}
    >
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
        {actions.map((action) => (
          <Button
            key={action.key}
            type={action.type ?? "button"}
            onClick={action.onClick}
            color={action.color ?? "primary"}
            variant={action.variant ?? "contained"}
            startIcon={action.icon}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}
