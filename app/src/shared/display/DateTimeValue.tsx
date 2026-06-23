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
  /** When set, absolute date/time renders on one line as «time - date» instead of stacked lines. */
  readonly inlineDateTime?: boolean;
  readonly emptyDisplay?: string;
  readonly className?: string;
}

export function DateTimeValue({
  value,
  emphasizeDate = false,
  inlineDateTime = false,
  emptyDisplay = EMPTY_DISPLAY,
  className,
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
          className={className}
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

  const absoluteInlineLabel = `${parsed.timeLabel} - ${parsed.dateLabel}`;

  return (
    <Box
      component="time"
      dateTime={parsed.date.toISOString()}
      className={className}
      sx={{ display: "inline-block" }}
    >
      <Typography
        variant={inlineDateTime ? "caption" : "body2"}
        color={inlineDateTime ? "text.secondary" : undefined}
        fontWeight={emphasizeDate ? 600 : undefined}
        className={crudPrimitives.tabularNums}
        component="span"
        sx={inlineDateTime ? { whiteSpace: "nowrap" } : undefined}
      >
        {inlineDateTime ? absoluteInlineLabel : primaryLabel}
      </Typography>
      {inlineDateTime ? null : (
        <Typography variant="caption" color="text.secondary" className={crudPrimitives.tabularNums}>
          {parsed.timeLabel}
        </Typography>
      )}
    </Box>
  );
}

export default DateTimeValue;
