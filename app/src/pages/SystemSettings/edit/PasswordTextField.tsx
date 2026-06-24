import { useState, type ReactElement } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { IconButton, InputAdornment, TextField, type TextFieldProps } from "@mui/material";

type PasswordTextFieldProps = Omit<TextFieldProps, "type">;

const PasswordTextField = (props: PasswordTextFieldProps): ReactElement => {
  const [showPassword, setShowPassword] = useState(false);
  const { InputProps, ...textFieldProps } = props;

  return (
    <TextField
      {...textFieldProps}
      type={showPassword ? "text" : "password"}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <>
            {InputProps?.endAdornment}
            <InputAdornment position="end">
              <IconButton
                aria-label="نمایش یا پنهان‌سازی گذرواژه"
                onClick={() => setShowPassword((previous) => !previous)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          </>
        ),
      }}
    />
  );
};

export default PasswordTextField;
