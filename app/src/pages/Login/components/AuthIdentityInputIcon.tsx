import type { ReactElement } from "react";
import {
  AlternateEmail as AlternateEmailIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
} from "@mui/icons-material";
import type { AuthIdentityKind } from "../../../utilities/contact-validation.util";
import formStyles from "../styles/LoginFormShared.module.scss";

interface AuthIdentityInputIconProps {
  readonly identityKind: AuthIdentityKind;
  readonly fontSize?: "small" | "inherit" | "medium" | "large";
}

export function AuthIdentityInputIcon({
  identityKind,
  fontSize,
}: AuthIdentityInputIconProps): ReactElement {
  const className = formStyles.inputIcon;

  if (identityKind === "mobile") {
    return <PhoneIcon className={className} fontSize={fontSize} />;
  }

  if (identityKind === "email") {
    return <AlternateEmailIcon className={className} fontSize={fontSize} />;
  }

  return <PersonIcon className={className} fontSize={fontSize} />;
}
