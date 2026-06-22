import { InputAdornment } from "@mui/material";
import type { ReactElement } from "react";

import { resolveAuthIdentityIconKind } from "../../../utilities/auth-identity.util";
import { AuthIdentityInputIcon } from "./AuthIdentityInputIcon";

interface AuthIdentityInputAdornmentProps {
  readonly identity: string;
}

/** Start adornment for combined username/email/mobile identity fields. */
export function AuthIdentityInputAdornment({
  identity,
}: AuthIdentityInputAdornmentProps): ReactElement {
  return (
    <InputAdornment position="start">
      <AuthIdentityInputIcon identityKind={resolveAuthIdentityIconKind(identity)} />
    </InputAdornment>
  );
}
