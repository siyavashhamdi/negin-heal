import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Box } from "@mui/material";
import AppTooltip from "../AppTooltip";

interface DisabledCapable {
  disabled?: boolean;
}

export interface CityFilterRequiresStateTooltipProps {
  /** When false, the child is wrapped in a tooltip explaining that a province must be selected first. */
  stateSelected: boolean;
  tooltipTitle: string;
  children: ReactNode;
}

/**
 * Wraps a city/county filter control; disables it until a province is selected and shows a tooltip when disabled.
 */
const CityFilterRequiresStateTooltip = ({
  stateSelected,
  tooltipTitle,
  children,
}: CityFilterRequiresStateTooltipProps): ReactElement => {
  if (!isValidElement<DisabledCapable>(children)) {
    return <>{children}</>;
  }

  const disabled = !stateSelected || Boolean(children.props.disabled);
  const control = cloneElement(children, { disabled });

  if (stateSelected) {
    return control;
  }

  return (
    <AppTooltip title={tooltipTitle} arrow>
      <Box component="span" sx={{ display: "block", width: "100%" }}>
        {control}
      </Box>
    </AppTooltip>
  );
};

export default CityFilterRequiresStateTooltip;
