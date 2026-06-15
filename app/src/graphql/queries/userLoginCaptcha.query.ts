import { gql } from "@apollo/client";

export const USER_LOGIN_CAPTCHA_QUERY = gql`
  query UserLoginCaptcha {
    userLoginCaptcha {
      captchaId
      imageBase64
      imageMimeType
      expiresAtIso
    }
  }
`;
