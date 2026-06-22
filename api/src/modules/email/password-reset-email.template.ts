export const PASSWORD_RESET_EMAIL_SUBJECT =
  "کد بازیابی گذرواژه — @@@<APP_NAME>@@@";

export const PASSWORD_RESET_EMAIL_HTML = `
<div dir="rtl" style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">
  کد بازیابی گذرواژه شما @@@<RESET_CODE>@@@ است. لطفاً در اسرع وقت از آن استفاده کنید.
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
            <div style="margin-top:10px;font-size:15px;font-weight:500;color:rgba(255,255,255,0.92);font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">کد تأیید بازیابی گذرواژه</div>
          </td>
        </tr>
        <tr>
          <td dir="rtl" style="padding:36px 32px 8px;text-align:right;direction:rtl;font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">
            <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#3d2c35;line-height:1.5;text-align:right;">تنظیم گذرواژه جدید</h1>
            <p style="margin:0 0 28px;font-size:15px;line-height:1.9;color:#5c4d55;text-align:right;">
              درخواستی برای بازیابی گذرواژه حساب <strong style="color:#3d2c35">@@@<APP_NAME>@@@</strong> دریافت شد. کد تأیید زیر را در صفحه بازیابی گذرواژه وارد کنید و گذرواژه جدید خود را ثبت نمایید.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fdf8fa;border:1px solid #eadde3;border-radius:14px;">
              <tr>
                <td align="center" style="padding:24px 20px 8px">
                  <div style="font-size:12px;font-weight:700;color:#9b7aad;font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">کد یکبارمصرف</div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:4px 20px 24px">
                  <div dir="ltr" style="display:inline-block;direction:ltr;unicode-bidi:embed;font-size:34px;font-weight:700;letter-spacing:0.42em;padding-left:0.42em;color:#3d2c35;font-family:SFMono-Regular,Consolas,'Liberation Mono',Menlo,Courier,monospace;line-height:1;text-align:center;">@@@<RESET_CODE>@@@</div>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" dir="rtl" style="margin-top:20px;direction:rtl">
              <tr>
                <td style="background-color:#fff9f0;border:1px solid #f0dcc0;border-right:4px solid #e8a54b;border-left:0;border-radius:10px 0 0 10px;padding:14px 16px;text-align:right;">
                  <p style="margin:0;font-size:14px;line-height:1.85;color:#5c4d55;text-align:right;font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">
                    <strong style="color:#3d2c35">این کد مدت محدودی معتبر است.</strong>
                    برای امنیت شما، این کد یک‌بارمصرف است و پس از چند تلاش نادرست باطل می‌شود.
                  </p>
                </td>
              </tr>
            </table>
            <p style="margin:24px 0 0;font-size:14px;line-height:1.85;color:#7a6872;text-align:right;">
              اگر شما این درخواست را ثبت نکرده‌اید، این ایمیل را نادیده بگیرید. گذرواژه شما تغییر نمی‌کند و حساب شما امن باقی می‌ماند.
            </p>
          </td>
        </tr>
        <tr>
          <td dir="rtl" style="padding:20px 32px 28px;border-top:1px solid #eadde3;background-color:#fdf8fa;text-align:center;direction:rtl;">
            <p style="margin:0;font-size:12px;line-height:1.85;color:#a8949e;text-align:center;font-family:'B Yekan',Vazirmatn,Arial,sans-serif;">
              پیام امنیتی خودکار از طرف <strong style="color:#7a6872">@@@<SECURITY_TEAM_NAME>@@@</strong><br />
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

export function isLegacyPasswordResetEmailTemplate(html: string): boolean {
  return (
    html.includes("logo.png") || html.includes("@@@<EXPIRES_IN_MINUTES>@@@")
  );
}
