export const WELCOME_EMAIL_SUBJECT = "خوش آمدید به @@@<APP_NAME>@@@";

export const WELCOME_EMAIL_HTML = `
<div dir="rtl" style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">
  حساب کاربری شما در @@@<APP_NAME>@@@ ایجاد شد. در صورت تمایل می‌توانید ایمیل خود را از @@@<ACTIVATION_URL>@@@ تأیید کنید.
</div>
<style>
  @font-face {
    font-family: "B Yekan";
    src: url("@@@<APP_URL>@@@/fonts/byekan.ttf") format("truetype");
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: "Vazirmatn";
    src: url("https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.woff2") format("woff2");
    font-weight: 400;
    font-style: normal;
  }
</style>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" dir="rtl" style="background-color:#f8f0f3;margin:0;padding:0;direction:rtl;">
  <tr>
    <td align="center" style="padding:40px 16px 48px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" dir="rtl" style="max-width:560px;background-color:#ffffff;border:1px solid #eadde3;border-radius:16px;overflow:hidden;direction:rtl;">
        <tr>
          <td align="center" style="background-color:#c9567e;padding:32px 32px 28px">
            <a href="@@@<APP_URL>@@@" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block">
              <div style="font-size:24px;font-weight:700;color:#ffffff;font-family:'B Yekan',Vazirmatn,Arial,sans-serif;line-height:1.4;">@@@<APP_NAME>@@@</div>
            </a>
            <div style="margin-top:10px;font-size:15px;font-weight:500;color:rgba(255,255,255,0.92);font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">خوش آمدید</div>
          </td>
        </tr>
        <tr>
          <td dir="rtl" style="padding:36px 32px 8px;text-align:right;direction:rtl;font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">
            <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#3d2c35;line-height:1.5;text-align:right;">خوش آمدید، @@@<USER_FIRST_NAME>@@@</h1>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.9;color:#5c4d55;text-align:right;">
              از همراهی شما بسیار خوشحالیم. حساب شما در <strong style="color:#3d2c35">@@@<APP_NAME>@@@</strong> آماده است و می‌توانید همین حالا از امکانات سامانه بهره‌مند شوید.
            </p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.85;color:#7a6872;text-align:right;">
              در صورت تمایل، می‌توانید آدرس ایمیل خود را تأیید کنید:
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 8px">
              <tr>
                <td align="center" style="border-radius:10px;background-color:#c9567e">
                  <a href="@@@<ACTIVATION_URL>@@@" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">تأیید ایمیل</a>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" dir="rtl" style="margin-top:20px;direction:rtl">
              <tr>
                <td style="background-color:#fff9f0;border:1px solid #f0dcc0;border-right:4px solid #e8a54b;border-left:0;border-radius:10px 0 0 10px;padding:14px 16px;text-align:right;">
                  <p style="margin:0;font-size:14px;line-height:1.85;color:#5c4d55;text-align:right;font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">
                    <strong style="color:#3d2c35">این لینک مدت محدودی معتبر است.</strong>
                    تأیید ایمیل اختیاری است و می‌توانید هر زمان از پروفایل خود درخواست لینک جدید بگیرید.
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:14px;line-height:1.85;color:#7a6872;text-align:right;">
              اگر شما این حساب را ایجاد نکرده‌اید، لطفاً این ایمیل را نادیده بگیرید یا با تیم پشتیبانی تماس بگیرید.
            </p>
          </td>
        </tr>
        <tr>
          <td dir="rtl" style="padding:20px 32px 28px;border-top:1px solid #eadde3;background-color:#fdf8fa;text-align:center;direction:rtl;">
            <p style="margin:0;font-size:12px;line-height:1.85;color:#a8949e;text-align:center;font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">
              پیام خودکار از طرف <strong style="color:#7a6872">@@@<SECURITY_TEAM_NAME>@@@</strong><br />
              لطفاً به این ایمیل پاسخ ندهید.
            </p>
          </td>
        </tr>
      </table>
      <p dir="rtl" style="margin:20px 0 0;font-size:11px;line-height:1.7;color:#a8949e;text-align:center;font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">
        &copy; @@@<APP_NAME>@@@ | تمامی حقوق محفوظ است.
      </p>
    </td>
  </tr>
</table>
`.trim();

export function isLegacyWelcomeEmailTemplate(html: string): boolean {
  return (
    html.includes("@@@<LOGIN_URL>@@@") ||
    html.includes("فعال‌سازی حساب") ||
    html.includes("برای تکمیل ثبت‌نام") ||
    html.includes("ورود به @@@<APP_NAME>@@@") ||
    !html.includes("@@@<ACTIVATION_URL>@@@")
  );
}
