import type { ReactElement, ReactNode } from "react";

import formStyles from "../styles/LoginFormShared.module.scss";

interface RequiredFieldLabelProps {
  readonly children: ReactNode;
  readonly required?: boolean;
}

/** Visible required marker for RTL login fields where MUI asterisk is clipped. */
export function RequiredFieldLabel({
  children,
  required = false,
}: RequiredFieldLabelProps): ReactElement {
  if (!required) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <span className={formStyles.requiredFieldLabelAsterisk} aria-hidden="true">
        {" *"}
      </span>
    </>
  );
}
