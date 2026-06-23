import { Box, Typography } from "@mui/material";
import { type ReactElement } from "react";

import { useRelativeTimeNow } from "../../hooks/useRelativeTimeNow";
import {
  formatAbsoluteDateTimeCaption,
  parseDisplayDateTime,
} from "../../utilities/display-datetime.util";
import {
  formatRelativeTimeLabel,
  shouldUseRelativeTimeLabel,
} from "../../utilities/relative-time.util";
import AppTooltip from "../AppTooltip";
import crudPrimitives from "../crud/styles/crudPrimitives.module.scss";

const EMPTY_DISPLAY = "—";

export interface DateTimeValueProps {
  readonly value?: string | Date | null;
  readonly emphasizeDate?: boolean;
  readonly emptyDisplay?: string;
}

export function DateTimeValue({
  value,
  emphasizeDate = false,
  emptyDisplay = EMPTY_DISPLAY,
}: DateTimeValueProps): ReactElement {
  const parsed = parseDisplayDateTime(value);
  const relativeDateMs =
    parsed && shouldUseRelativeTimeLabel(parsed.date) ? parsed.date.getTime() : null;
  const now = useRelativeTimeNow(relativeDateMs);

  if (!parsed) {
    return (
      <Typography
        variant="body2"
        fontWeight={emphasizeDate ? 600 : undefined}
        className={crudPrimitives.tabularNums}
      >
        {emptyDisplay}
      </Typography>
    );
  }

  const useRelative = shouldUseRelativeTimeLabel(parsed.date, now);
  const primaryLabel = useRelative ? formatRelativeTimeLabel(parsed.date, now) : parsed.dateLabel;
  const absoluteLabel = formatAbsoluteDateTimeCaption(parsed);

  if (useRelative) {
    return (
      <AppTooltip title={absoluteLabel} arrow describeChild>
        <Box
          component="time"
          dateTime={parsed.date.toISOString()}
          aria-label={absoluteLabel}
          sx={{ display: "inline-block", cursor: "help" }}
        >
          <Typography
            variant="body2"
            fontWeight={emphasizeDate ? 600 : undefined}
            className={crudPrimitives.tabularNums}
            component="span"
          >
            {primaryLabel}
          </Typography>
        </Box>
      </AppTooltip>
    );
  }

  return (
    <Box component="time" dateTime={parsed.date.toISOString()} sx={{ display: "inline-block" }}>
      <Typography
        variant="body2"
        fontWeight={emphasizeDate ? 600 : undefined}
        className={crudPrimitives.tabularNums}
      >
        {primaryLabel}
      </Typography>
      <Typography variant="caption" color="text.secondary" className={crudPrimitives.tabularNums}>
        {parsed.timeLabel}
      </Typography>
    </Box>
  );
}

export default DateTimeValue;
