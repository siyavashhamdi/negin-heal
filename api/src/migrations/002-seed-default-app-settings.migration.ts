import { BaseMigration, registerMigration } from "./core";
import { AppSettingValueType, UserProductPaymentMethod } from "../enums";
import { APP_SETTING_KEY } from "../constants";
import {
  PASSWORD_RESET_EMAIL_HTML,
  PASSWORD_RESET_EMAIL_SUBJECT,
} from "../modules/email/password-reset-email.template";
import {
  WELCOME_EMAIL_HTML,
  WELCOME_EMAIL_SUBJECT,
} from "../modules/email/welcome-email.template";
import {
  VERIFY_EMAIL_HTML,
  VERIFY_EMAIL_SUBJECT,
} from "../modules/email/verify-email.template";

type DefaultAppSettingSeed = {
  key: string;
  label: string;
  value: unknown;
  valueType: AppSettingValueType;
  description?: string;
  isActive: boolean;
};

const DEFAULT_PAYMENT_CARDS_VALUE = [
  {
    cardNumber: "1111-1111-1111-1111",
    cardHolderName: "ایکس ایکسی",
    bankName: "بلو بانک",
  },
  {
    cardNumber: "2222-2222-2222-2222",
    cardHolderName: "ایکس ایکسی",
    bankName: "بانک تجارت",
  },
  {
    cardNumber: "3333-3333-3333-3333",
    cardHolderName: "ایکس ایکسی",
    bankName: "بانک ملت",
  },
];

const DEFAULT_USDT_WALLETS_VALUE = [
  {
    network: "TRC20",
    address: "TJRy6k7QwZb9v5k8h2mR3pLxA1nC7dF8Gh",
  },
  {
    network: "BEP20",
    address: "0x4E9ce36E442e55EcD9025B9a6E0D88485d628A67",
  },
];

const DEFAULT_USDT_IRT_RATE_VALUE = {
  valueIrt: 172000,
  feeUsdt: 0.7,
  coefficient: 1,
};

const DEFAULT_ZARINPAL_CONFIG_VALUE = {
  merchantId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  requestUrl: "https://payment.zarinpal.com/pg/v4/payment/request.json",
  verifyUrl: "https://payment.zarinpal.com/pg/v4/payment/verify.json",
  startPayUrl: "https://www.zarinpal.com/pg/StartPay",
  minAmountIrr: 10000,
  proxyBaseUrl: "",
  proxyApiKey: "",
};

const DEFAULT_EMAIL_SMTP_CONFIG_VALUE = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  username: "neginheal.manager@gmail.com",
  password: "mutq tcvi nxqe jszy",
  fromName: "Negin Heal",
  fromEmail: "neginheal.manager@gmail.com",
};

const DEFAULT_BACKUP_CONFIG_VALUE = {
  rarPassword: "example-backup-rar-password",
};

const DEFAULT_TELEGRAM_CONFIG_VALUE = {
  botToken: "1234567890:AAExampleBotTokenReplaceInAppSettings",
  chatId: "-1001234567890",
  apiBaseUrl: "https://api.telegram.org",
};

const DEFAULT_EMAIL_TEMPLATES_VALUE = [
  {
    name: "PASSWORD_RESET",
    subject: PASSWORD_RESET_EMAIL_SUBJECT,
    html: PASSWORD_RESET_EMAIL_HTML,
  },
  {
    name: "WELCOME",
    subject: WELCOME_EMAIL_SUBJECT,
    html: WELCOME_EMAIL_HTML,
  },
  {
    name: "VERIFY_EMAIL",
    subject: VERIFY_EMAIL_SUBJECT,
    html: VERIFY_EMAIL_HTML,
  },
];

const DEFAULT_SUPPORT_FAQ_PAGE_VALUE = {
  eyebrow: "راهنمای سریع",
  heading: "سوالات پرتکرار",
  subtitle:
    "پاسخ‌های کوتاه و کاربردی درباره ورود، دوره‌ها، پرداخت، پشتیبانی و مشکلات فنی. سوال‌ها به صورت دسته‌بندی‌شده و قابل باز و بسته شدن آماده شده‌اند.",
  searchLabel: "جستجو در سوالات پرتکرار",
  searchPlaceholder: "مثلا پرداخت ناموفق، قفل بودن دوره، کد یکبارمصرف...",
  resultCountLabel: "پاسخ مرتبط پیدا شد.",
  noResultsLabel: "برای این عبارت نتیجه‌ای پیدا نشد.",
  emptyTitle: "پاسخی پیدا نشد",
  emptyDescription:
    "عبارت کوتاه‌تری را جستجو کنید یا از مسیر تیکت، سوال خود را برای تیم پشتیبانی ارسال کنید.",
  emptyActionLabel: "تیکت پشتیبانی",
  sections: [
    {
      id: "account",
      title: "حساب کاربری و ورود",
      description: "ورود، ثبت‌نام، کد یکبارمصرف و دسترسی امن به حساب.",
      items: [
        {
          id: "account-login-methods",
          question: "چطور می‌توانم وارد حساب کاربری شوم؟",
          answer:
            "در صفحه ورود می‌توانید با موبایل، ایمیل یا نام کاربری شروع کنید. اگر حساب شما وجود داشته باشد، وارد مرحله تایید می‌شوید و بسته به تنظیمات حساب، گذرواژه یا کد یکبارمصرف را وارد می‌کنید.",
        },
        {
          id: "account-signup",
          question: "اگر حساب نداشته باشم چه اتفاقی می‌افتد؟",
          answer:
            "بعد از وارد کردن شناسه، اگر حسابی پیدا نشود، فرم ثبت‌نام نمایش داده می‌شود. در ثبت‌نام، اطلاعات پایه مثل نام، نام خانوادگی، نام کاربری و راه ارتباطی تکمیل می‌شود.",
        },
        {
          id: "account-otp",
          question: "کد یکبارمصرف برای چه زمانی است؟",
          answer:
            "کد یکبارمصرف برای تایید سریع و امن هویت استفاده می‌شود. اگر ورود با موبایل فعال باشد، کد را در همان مرحله تایید وارد می‌کنید.",
        },
        {
          id: "account-product-login",
          question: "چرا برای خرید دوره باید وارد حساب شوم؟",
          answer:
            "دسترسی دوره‌ها، رسید پرداخت، وضعیت خرید و تیکت‌های پشتیبانی به حساب شما متصل می‌شوند. برای همین قبل از خرید یا پیگیری پرداخت باید وارد حساب باشید.",
        },
      ],
    },
    {
      id: "products",
      title: "دوره‌ها و دسترسی به محتوا",
      description: "قفل دوره‌ها، فصل‌های رایگان، شروع دوره و انواع محتوا.",
      items: [
        {
          id: "products-public-list",
          question: "آیا می‌توانم دوره‌ها را بدون ورود ببینم؟",
          answer:
            "بله، لیست دوره‌ها و صفحه معرفی هر دوره عمومی است. برای خرید، شروع محتوای پولی یا پیگیری وضعیت دسترسی باید وارد حساب شوید.",
        },
        {
          id: "products-locked",
          question: "چرا بعضی فصل‌ها یا آیتم‌ها قفل هستند؟",
          answer:
            "اگر دوره پولی باشد، محتوای اصلی بعد از پرداخت موفق باز می‌شود. فصل‌هایی که رایگان تعریف شده‌اند ممکن است قبل از خرید هم قابل مشاهده باشند.",
        },
        {
          id: "products-pending",
          question: "بعد از پرداخت دستی چرا دوره هنوز باز نشده است؟",
          answer:
            "پرداخت کارت به کارت و رمزارز نیاز به بررسی تیم پشتیبانی دارد. تا زمانی که وضعیت پرداخت تایید نشود، خرید در حالت در انتظار تایید می‌ماند.",
        },
        {
          id: "products-content-types",
          question: "چه نوع محتوایی داخل دوره‌ها وجود دارد؟",
          answer:
            "دوره‌ها می‌توانند شامل ویدیو، صوت، تصویر و مقاله باشند. محتوای قابل دسترسی داخل همان صفحه دوره نمایش داده می‌شود.",
        },
        {
          id: "products-start",
          question: "وقتی دوره برایم فعال شد از کجا شروع کنم؟",
          answer:
            "در صفحه دوره، دکمه شروع دوره شما را به بخش فصل‌ها و آیتم‌های آموزشی می‌برد. آیتم‌های باز با توجه به وضعیت خرید یا رایگان بودن نمایش داده می‌شوند.",
        },
      ],
    },
    {
      id: "payments",
      title: "پرداخت و خرید",
      description: "درگاه، کارت به کارت، رمزارز، کد تخفیف و وضعیت پرداخت.",
      items: [
        {
          id: "payments-methods",
          question: "چه روش‌های پرداختی پشتیبانی می‌شود؟",
          answer:
            "پرداخت آنلاین از طریق درگاه، کارت به کارت و پرداخت رمزارزی USDT پشتیبانی می‌شود. روش‌های قابل نمایش و فعال بودن آن‌ها از تنظیمات سامانه کنترل می‌شود.",
        },
        {
          id: "payments-gateway",
          question: "پرداخت آنلاین چه زمانی دسترسی را فعال می‌کند؟",
          answer:
            "اگر پرداخت در درگاه با موفقیت تایید شود، دسترسی دوره به صورت خودکار فعال می‌شود و به صفحه دوره برمی‌گردید.",
        },
        {
          id: "payments-card",
          question: "برای کارت به کارت چه اطلاعاتی لازم است؟",
          answer:
            "در پرداخت کارت به کارت باید رسید پرداخت را بارگذاری کنید و در صورت نیاز شناسه یا توضیح پرداخت را وارد کنید تا تیم پشتیبانی بتواند آن را بررسی کند.",
        },
        {
          id: "payments-crypto",
          question: "پرداخت رمزارز چگونه بررسی می‌شود؟",
          answer:
            "مبلغ USDT بر اساس نرخ تنظیم‌شده محاسبه می‌شود. بعد از انتقال، شناسه تراکنش یا TxID را ثبت می‌کنید و تیم پشتیبانی وضعیت را بررسی می‌کند.",
        },
        {
          id: "payments-coupon",
          question: "کد تخفیف را کجا وارد کنم؟",
          answer:
            "در پنجره خرید دوره بخشی برای وارد کردن کد تخفیف وجود دارد. پس از اعتبارسنجی، مبلغ نهایی قبل از ثبت پرداخت به‌روزرسانی می‌شود.",
        },
        {
          id: "payments-failed",
          question: "اگر پرداخت ناموفق یا لغو شد چه کار کنم؟",
          answer:
            "ابتدا به صفحه دوره برگردید و وضعیت خرید را بررسی کنید. اگر مبلغی از حساب شما کم شده یا وضعیت نامشخص است، با شماره سفارش، زمان پرداخت و رسید بانکی تیکت ثبت کنید.",
        },
      ],
    },
    {
      id: "support",
      title: "پشتیبانی و تیکت",
      description: "ثبت درخواست، پیگیری پیام‌ها، دسته‌بندی و پیوست‌ها.",
      items: [
        {
          id: "support-ticket-when",
          question: "چه زمانی بهتر است تیکت ثبت کنم؟",
          answer:
            "برای موضوعاتی که نیاز به پیگیری دقیق دارند، مثل پرداخت، دسترسی دوره، مشکل حساب یا خطای فنی، تیکت بهترین مسیر است چون سابقه گفتگو و پیوست‌ها در حساب شما باقی می‌ماند.",
        },
        {
          id: "support-ticket-category",
          question: "دسته‌بندی تیکت را چطور انتخاب کنم؟",
          answer:
            "اگر موضوع مربوط به پرداخت است، دسته پرداخت را انتخاب کنید. برای دسترسی و محتوای دوره از دسته دوره، برای ورود یا حساب از دسته حساب، برای خطاهای پخش یا سامانه از دسته فنی و برای سایر موارد از سایر استفاده کنید.",
        },
        {
          id: "support-ticket-follow",
          question: "چطور تیکت خود را پیگیری کنم؟",
          answer:
            "از مسیر پشتیبانی و سپس تیکت پشتیبانی، لیست تیکت‌ها و آخرین پیام‌ها را می‌بینید. اگر تیکت بسته شده باشد و پیام جدیدی ارسال کنید، دوباره برای بررسی باز می‌شود.",
        },
        {
          id: "support-ticket-attachment",
          question: "آیا می‌توانم فایل یا تصویر ارسال کنم؟",
          answer:
            "بله، در تیکت می‌توانید پیوست ارسال کنید. برای خطاهای فنی، تصویر صفحه، زمان رخداد و توضیح کوتاه باعث می‌شود بررسی سریع‌تر انجام شود.",
        },
        {
          id: "support-response-time",
          question: "زمان پاسخ‌گویی چقدر است؟",
          answer:
            "زمان پاسخ‌گویی در صفحه پشتیبانی نمایش داده می‌شود و ممکن است با توجه به ساعات کاری و حجم درخواست‌ها تغییر کند.",
        },
      ],
    },
    {
      id: "technical",
      title: "پخش محتوا و مشکلات فنی",
      description: "ویدیو، صوت، مرورگر، اینترنت و خطاهای رایج.",
      items: [
        {
          id: "technical-playback",
          question: "اگر ویدیو یا صوت پخش نشد چه کنم؟",
          answer:
            "ابتدا اینترنت، مرورگر و خاموش بودن VPN یا افزونه‌های محدودکننده را بررسی کنید. سپس صفحه را دوباره بارگذاری کنید. اگر مشکل ادامه داشت، نام دوره، عنوان آیتم و اسکرین‌شات را در تیکت ارسال کنید.",
        },
        {
          id: "technical-browser",
          question: "کدام مرورگر برای استفاده بهتر است؟",
          answer:
            "مرورگرهای به‌روز مثل Chrome، Safari، Firefox و Edge پیشنهاد می‌شوند. اگر مرورگر از پخش ویدیو یا صوت پشتیبانی نکند، پیام خطا داخل صفحه نمایش داده می‌شود.",
        },
        {
          id: "technical-download",
          question: "آیا امکان دانلود محتوای دوره وجود دارد؟",
          answer:
            "در حال حاضر محتوا داخل صفحه دوره و از طریق پخش آنلاین نمایش داده می‌شود. اگر برای دسترسی یا پخش مشکل دارید، از مسیر تیکت اطلاع دهید.",
        },
        {
          id: "technical-mobile",
          question: "آیا پنل روی موبایل هم قابل استفاده است؟",
          answer:
            "بله، صفحات اصلی برای موبایل طراحی شده‌اند و منوی پایین موبایل دسترسی سریع به دوره‌ها، پشتیبانی و پروفایل را فراهم می‌کند.",
        },
      ],
    },
    {
      id: "security",
      title: "امنیت و اطلاعات",
      description: "پرداخت امن، رسیدها، اطلاعات حساب و حریم خصوصی.",
      items: [
        {
          id: "security-gateway",
          question: "آیا پرداخت آنلاین امن است؟",
          answer:
            "پرداخت آنلاین از مسیر درگاه پرداخت انجام می‌شود و نتیجه پرداخت بعد از بازگشت از درگاه در سامانه تایید می‌شود.",
        },
        {
          id: "security-receipts",
          question: "رسیدهای پرداخت دستی برای چه استفاده می‌شوند؟",
          answer:
            "رسید یا شناسه تراکنش فقط برای بررسی وضعیت پرداخت و فعال‌سازی دسترسی دوره استفاده می‌شود. بهتر است اطلاعات غیرضروری را در رسید یا توضیحات وارد نکنید.",
        },
        {
          id: "security-account",
          question: "برای امنیت حساب چه نکاتی را رعایت کنم؟",
          answer:
            "گذرواژه خود را در اختیار دیگران نگذارید، از دستگاه‌های عمومی خارج شوید و اگر ورود یا خرید مشکوکی دیدید از بخش پشتیبانی تیکت ثبت کنید.",
        },
      ],
    },
    {
      id: "other",
      title: "دیگر",
      description: "سوال‌هایی که در دسته‌های اصلی قرار نمی‌گیرند.",
      items: [
        {
          id: "other-profile-edit",
          question: "چطور اطلاعات پروفایل خود را تغییر دهم؟",
          answer:
            "صفحه پروفایل اطلاعات حساب را نمایش می‌دهد. اگر نیاز به تغییر اطلاعات حساس دارید و گزینه مستقیم در دسترس نبود، از مسیر پشتیبانی تیکت ثبت کنید.",
        },
        {
          id: "other-theme",
          question: "آیا امکان تغییر حالت روشن و تاریک وجود دارد؟",
          answer:
            "بله، از ابزارهای بالای پنل یا بخش سایر می‌توانید حالت روشن و تاریک را تغییر دهید.",
        },
        {
          id: "other-notifications",
          question: "اعلان‌ها را از کجا ببینم؟",
          answer:
            "از منوی پایین موبایل یا منوی اصلی می‌توانید وارد بخش اعلان‌ها شوید. اعلان‌های مهم مربوط به حساب، دوره‌ها و پیگیری‌ها در همان بخش نمایش داده می‌شوند.",
        },
      ],
    },
  ],
};

const DEFAULT_SUPPORT_CONTACT_VALUE = {
  eyebrow: "مرکز پشتیبانی",
  heading: "چطور می‌توانیم کمک کنیم؟",
  subtitle:
    "سریع‌ترین مسیر ارتباطی را انتخاب کنید؛ تیم پشتیبانی درخواست شما را تا رسیدن به پاسخ روشن پیگیری می‌کند.",
  availabilityLabel: "پاسخ‌گویی شنبه تا پنجشنبه، ۹ تا ۱۸",
  responseTimeLabel: "میانگین پاسخ کمتر از ۲ ساعت کاری",
  whatsapp: "https://wa.me/989000000000",
  telegram: "https://t.me/neginheal_support",
  instagram: "https://instagram.com/neginheal",
  faqTitle: "سوالات پرتکرار",
  faqDescription: "پاسخ سریع به سوال‌های رایج قبل از ارسال درخواست پشتیبانی.",
  ticketTitle: "ثبت تیکت پشتیبانی",
  ticketDescription:
    "برای مسائل حساب، دوره‌ها و پرداخت که نیاز به پیگیری دقیق دارند.",
  contactSectionEyebrow: "راه‌های ارتباطی",
  contactSectionHeading: "مسیر مناسب را انتخاب کنید",
  contactSectionSubtitle: "پشتیبانی دقیق، سریع و قابل پیگیری",
  tipsEyebrow: "برای پاسخ سریع‌تر",
  tipsHeading: "قبل از ارسال پیام این موارد را آماده کنید",
  email: "neginheal.manager@gmail.com",
  phone: "0900-0000000",
  quickTips: [
    "شماره سفارش، نام دوره یا شناسه پرداخت را در پیام خود بنویسید.",
    "برای خطاهای فنی، اسکرین‌شات و زمان رخداد را ارسال کنید.",
    "پیگیری‌های حساس را از مسیر تیکت انجام دهید تا سابقه کامل باقی بماند.",
  ],
  faqPage: DEFAULT_SUPPORT_FAQ_PAGE_VALUE,
};

const DEFAULT_APP_ABOUT_PAGE_HTML = `
<article>
  <h2>Negin Heal</h2>
  <p>
    Negin Heal یک سامانه آموزشی و مدیریتی برای ارائه محتوای سلامت، دوره‌های چندرسانه‌ای
    و تجربه یادگیری منظم است. این پنل مسیر مشاهده دوره‌ها، خرید، پیگیری پرداخت‌ها،
    پشتیبانی و مدیریت کاربران را در یک فضای یکپارچه فراهم می‌کند.
  </p>
  <h3>امکانات اصلی سامانه</h3>
  <ul>
    <li>مدیریت دوره‌ها، فصل‌ها و محتوای ویدیویی، صوتی، تصویری و متنی.</li>
    <li>پشتیبانی از پرداخت آنلاین، کارت به کارت، رمزارز و فعال‌سازی دسترسی دوره.</li>
    <li>ثبت و پیگیری تیکت‌های پشتیبانی برای موضوعات حساب، دوره، پرداخت و خطاهای فنی.</li>
    <li>مدیریت کاربران و نقش‌ها برای کنترل دسترسی مدیران، ادمین‌ها و کاربران نهایی.</li>
  </ul>
  <h3>هدف محصول</h3>
  <p>
    هدف Negin Heal ساختن تجربه‌ای قابل اتکا برای یادگیری و مراقبت سلامت است؛ جایی که
    کاربر بتواند محتوای مورد نیاز خود را پیدا کند، دسترسی خود را مدیریت کند و در صورت
    نیاز از مسیرهای پشتیبانی داخل سامانه کمک بگیرد.
  </p>
</article>
`.trim();

const DEFAULT_APP_PRIVACY_POLICY_PAGE_HTML = `
<article>
  <h2>سیاست حریم خصوصی Negin Heal</h2>
  <p>
    Negin Heal برای ارائه تجربه آموزشی امن و قابل پیگیری، برخی اطلاعات حساب کاربری،
    دسترسی دوره‌ها، پرداخت‌ها و درخواست‌های پشتیبانی را نگهداری می‌کند. این اطلاعات
    فقط برای مدیریت سامانه، ارائه خدمات، پشتیبانی و بهبود تجربه کاربری استفاده می‌شود.
  </p>
  <h3>اطلاعاتی که نگهداری می‌شود</h3>
  <ul>
    <li>اطلاعات حساب مانند نام، نام کاربری، شماره موبایل یا ایمیل.</li>
    <li>سوابق خرید، وضعیت پرداخت، رسیدها و دسترسی دوره‌ها.</li>
    <li>پیام‌ها، پیوست‌ها و تاریخچه تیکت‌های پشتیبانی.</li>
    <li>اطلاعات فنی مورد نیاز برای امنیت، عیب‌یابی و پایداری سامانه.</li>
  </ul>
  <h3>نحوه استفاده از اطلاعات</h3>
  <p>
    اطلاعات کاربران برای فعال‌سازی دوره‌ها، بررسی پرداخت، پاسخ‌گویی به درخواست‌ها،
    جلوگیری از سوءاستفاده و نگهداری امن حساب‌ها استفاده می‌شود. اطلاعات شخصی بدون
    نیاز عملیاتی یا الزام قانونی در اختیار اشخاص غیرمرتبط قرار نمی‌گیرد.
  </p>
  <h3>امنیت و کنترل کاربر</h3>
  <p>
    دسترسی به اطلاعات حساس محدود به نقش‌های مجاز سامانه است. کاربران می‌توانند برای
    پیگیری، اصلاح یا طرح سوال درباره اطلاعات حساب خود از مسیر پشتیبانی داخل سامانه
    درخواست ثبت کنند.
  </p>
</article>
`.trim();

const DEFAULT_APP_TERMS_OF_USE_PAGE_HTML = `
<article>
  <h2>شرایط استفاده از Negin Heal</h2>
  <p>
    با ورود، ثبت‌نام، خرید دوره یا استفاده از بخش‌های مختلف Negin Heal، شما می‌پذیرید
    که از سامانه مطابق این شرایط، قوانین جاری و دستورالعمل‌های اعلام‌شده داخل پنل
    استفاده کنید.
  </p>
  <h3>۱. حساب کاربری</h3>
  <p>
    مسئولیت نگهداری اطلاعات ورود و فعالیت‌هایی که از حساب شما انجام می‌شود بر عهده
    شماست. وارد کردن اطلاعات صحیح برای ثبت‌نام، خرید، پشتیبانی و فعال‌سازی دوره‌ها
    ضروری است.
  </p>
  <h3>۲. استفاده مجاز از محتوا</h3>
  <ul>
    <li>محتوای دوره‌ها برای استفاده شخصی و آموزشی کاربر ثبت‌نام‌شده ارائه می‌شود.</li>
    <li>بازنشر، فروش، ضبط، اشتراک‌گذاری یا در اختیار قرار دادن محتوای دوره‌ها بدون مجوز ممنوع است.</li>
    <li>هرگونه تلاش برای دور زدن محدودیت‌های دسترسی یا اختلال در سامانه مجاز نیست.</li>
  </ul>
  <h3>۳. پرداخت و دسترسی دوره‌ها</h3>
  <p>
    دسترسی دوره‌ها پس از پرداخت موفق یا تایید پرداخت دستی فعال می‌شود. در پرداخت‌های
    کارت به کارت یا رمزارزی، بررسی رسید و اطلاعات تراکنش ممکن است نیازمند زمان باشد.
    وضعیت نهایی هر خرید از داخل سامانه قابل پیگیری است.
  </p>
  <h3>۴. پشتیبانی و پیگیری درخواست‌ها</h3>
  <p>
    برای موضوعات مرتبط با حساب، دوره، پرداخت یا مشکلات فنی، مسیر رسمی پیگیری تیکت
    پشتیبانی داخل سامانه است. ارسال اطلاعات کامل، شماره سفارش، رسید یا تصویر خطا به
    پاسخ‌گویی سریع‌تر کمک می‌کند.
  </p>
  <h3>۵. تغییرات شرایط</h3>
  <p>
    Negin Heal ممکن است برای بهبود خدمات، الزامات عملیاتی یا تغییرات محصول، این شرایط
    را به‌روزرسانی کند. ادامه استفاده از سامانه پس از انتشار نسخه جدید به معنی پذیرش
    شرایط به‌روزشده است.
  </p>
</article>
`.trim();

export const DEFAULT_PAYMENT_METHODS_VALUE = [
  {
    method: UserProductPaymentMethod.GATEWAY,
    isVisible: true,
    isActive: true,
    isRecommended: true,
  },
  {
    method: UserProductPaymentMethod.CARD_TO_CARD,
    isVisible: true,
    isActive: true,
    isRecommended: false,
  },
  {
    method: UserProductPaymentMethod.CRYPTOCURRENCY,
    isVisible: true,
    isActive: true,
    isRecommended: false,
  },
];

const DEFAULT_APP_SETTINGS: readonly DefaultAppSettingSeed[] = [
  {
    key: APP_SETTING_KEY.PAYMENT_CARDS,
    label: "شماره کارت‌های پرداخت",
    value: DEFAULT_PAYMENT_CARDS_VALUE,
    valueType: AppSettingValueType.JSON,
    description: "لیست شماره کارت‌ها، نام صاحبان کارت و نام بانک‌ها",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.PAYMENT_METHODS,
    label: "روش‌های پرداخت",
    value: DEFAULT_PAYMENT_METHODS_VALUE,
    valueType: AppSettingValueType.JSON,
    description: "وضعیت نمایش، فعال بودن و پیشنهادی بودن روش‌های پرداخت",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.USDT_WALLETS,
    label: "کیف پول‌های USDT",
    value: DEFAULT_USDT_WALLETS_VALUE,
    valueType: AppSettingValueType.JSON,
    description: "لیست آدرس‌های کیف پول USDT و شبکه‌های آن‌ها",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.USDT_IRT_RATE,
    label: "نرخ تبدیل تومان به دلار امریکا",
    value: DEFAULT_USDT_IRT_RATE_VALUE,
    valueType: AppSettingValueType.JSON,
    description:
      "تنظیمات نرخ تبدیل تومان به USDT شامل نرخ پایه، کارمزد و ضریب محاسبه",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.ZARINPAL_CONFIG,
    label: "تنظیمات درگاه زرین‌پال",
    value: DEFAULT_ZARINPAL_CONFIG_VALUE,
    valueType: AppSettingValueType.JSON,
    description:
      "تنظیمات اتصال زرین‌پال شامل مرچنت آیدی، آدرس‌های request، verify، StartPay، حداقل مبلغ ریالی و (اختیاری) آدرس پروکسی و کلید API پروکسی",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.EMAIL_SMTP_CONFIG,
    label: "تنظیمات سرویس ایمیل",
    value: DEFAULT_EMAIL_SMTP_CONFIG_VALUE,
    valueType: AppSettingValueType.JSON,
    description: "تنظیمات ارسال ایمیل شامل SMTP، نام فرستنده و ایمیل فرستنده",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.BACKUP_CONFIG,
    label: "تنظیمات پشتیبان‌گیری",
    value: DEFAULT_BACKUP_CONFIG_VALUE,
    valueType: AppSettingValueType.JSON,
    description: "تنظیمات پشتیبان‌گیری شامل رمز آرشیو RAR",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.TELEGRAM_CONFIG,
    label: "تنظیمات ربات تلگرام پشتیبان",
    value: DEFAULT_TELEGRAM_CONFIG_VALUE,
    valueType: AppSettingValueType.JSON,
    description:
      "تنظیمات ارسال پشتیبان و اعلان‌ها به تلگرام شامل توکن ربات، شناسه چت و آدرس API",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.EMAIL_TEMPLATES,
    label: "قالب‌های ایمیل",
    value: DEFAULT_EMAIL_TEMPLATES_VALUE,
    valueType: AppSettingValueType.JSON,
    description:
      "لیست قالب‌های ایمیل شامل نام، موضوع و HTML با جای‌گذارهای @@@<PLACE_HOLDER>@@@",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.PASSWORD_RESET_TOKEN_TTL_MINUTES,
    label: "مدت اعتبار کد بازیابی گذرواژه",
    value: 30,
    valueType: AppSettingValueType.NUMBER,
    description: "مدت اعتبار کد بازیابی گذرواژه به دقیقه",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.TICKET_AUTO_CLOSE_AFTER_ANSWERED_HOURS,
    label: "بستن خودکار تیکت پاسخ‌داده‌شده",
    value: 24,
    valueType: AppSettingValueType.NUMBER,
    description: "مدت زمان (به ساعت) پس از پاسخ پشتیبانی تا بستن خودکار تیکت",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.SUPPORT_CONTACT,
    label: "تنظیمات راه‌های ارتباطی پشتیبانی",
    value: DEFAULT_SUPPORT_CONTACT_VALUE,
    valueType: AppSettingValueType.JSON,
    description:
      "تنظیمات صفحه پشتیبانی شامل واتساپ، تلگرام، اینستاگرام، ایمیل، تلفن و نکات راهنما",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.APP_ABOUT_PAGE,
    label: "محتوای صفحه درباره سامانه",
    value: DEFAULT_APP_ABOUT_PAGE_HTML,
    valueType: AppSettingValueType.STRING,
    description: "HTML قابل نمایش در صفحه درباره سامانه",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.APP_PRIVACY_POLICY_PAGE,
    label: "محتوای صفحه سیاست حریم خصوصی",
    value: DEFAULT_APP_PRIVACY_POLICY_PAGE_HTML,
    valueType: AppSettingValueType.STRING,
    description: "HTML قابل نمایش در صفحه سیاست حریم خصوصی",
    isActive: true,
  },
  {
    key: APP_SETTING_KEY.APP_TERMS_OF_USE_PAGE,
    label: "محتوای صفحه شرایط استفاده",
    value: DEFAULT_APP_TERMS_OF_USE_PAGE_HTML,
    valueType: AppSettingValueType.STRING,
    description: "HTML قابل نمایش در صفحه شرایط استفاده",
    isActive: true,
  },
] as const;

const DEFAULT_APP_SETTING_KEYS = DEFAULT_APP_SETTINGS.map(
  (setting) => setting.key,
);

/**
 * Migration: Seed Default App Settings
 *
 * Seeds default app settings used by checkout, support, and static app pages.
 * This migration is idempotent and skips settings that already exist.
 */
export class Migration002_SeedDefaultAppSettings extends BaseMigration {
  version = 2;
  name = "SeedDefaultAppSettings";

  async up(): Promise<void> {
    if (!this.connection?.db) {
      throw new Error("Database connection not available");
    }

    const appSettingsCollection = this.connection.db.collection("app_settings");

    console.log(
      `🔄 Starting migration ${this.version} (${this.name}) - Seeding ${DEFAULT_APP_SETTINGS.length} app settings...`,
    );

    let createdCount = 0;
    let skippedCount = 0;

    for (const setting of DEFAULT_APP_SETTINGS) {
      const existingSetting = await appSettingsCollection.findOne({
        key: setting.key,
      });

      if (existingSetting) {
        if (setting.key === APP_SETTING_KEY.EMAIL_TEMPLATES) {
          const existingValue =
            typeof existingSetting.value === "string"
              ? this.parseJsonSettingValue(existingSetting.value)
              : existingSetting.value;
          const upgradedTemplates = this.upgradeEmailTemplates(existingValue);

          if (
            upgradedTemplates &&
            JSON.stringify(upgradedTemplates) !== JSON.stringify(existingValue)
          ) {
            await appSettingsCollection.updateOne(
              { _id: existingSetting._id },
              {
                $set: {
                  value: upgradedTemplates,
                  "audit.updatedAt": new Date(),
                },
              },
            );
            console.log(
              `🔁 Upgraded app setting ${setting.key} password reset template`,
            );
          }
        } else if (setting.valueType === AppSettingValueType.JSON) {
          const existingValue =
            typeof existingSetting.value === "string"
              ? this.parseJsonSettingValue(existingSetting.value)
              : existingSetting.value;

          if (
            this.isPlainObject(existingValue) &&
            this.isPlainObject(setting.value)
          ) {
            const mergedValue = this.mergeMissingJsonKeys(
              existingValue as Record<string, unknown>,
              setting.value as Record<string, unknown>,
            );
            const hasChanges =
              JSON.stringify(mergedValue) !== JSON.stringify(existingValue);

            if (hasChanges) {
              await appSettingsCollection.updateOne(
                { _id: existingSetting._id },
                {
                  $set: {
                    value: mergedValue,
                    "audit.updatedAt": new Date(),
                  },
                },
              );
              console.log(
                `🔁 Upgraded app setting ${setting.key} with missing defaults`,
              );
            }
          } else if (
            typeof existingSetting.value === "string" &&
            existingValue !== null &&
            this.isPlainObject(existingValue)
          ) {
            await appSettingsCollection.updateOne(
              { _id: existingSetting._id },
              {
                $set: {
                  value: existingValue,
                  "audit.updatedAt": new Date(),
                },
              },
            );
            console.log(`🔁 Converted app setting ${setting.key} to JSON`);
          }
        }

        console.log(`ℹ️  App setting ${setting.key} already exists, skipping`);
        skippedCount++;
        continue;
      }

      await appSettingsCollection.insertOne({
        key: setting.key,
        label: setting.label,
        value: setting.value,
        valueType: setting.valueType,
        description: setting.description ?? null,
        isActive: setting.isActive,
        audit: {
          createdAt: new Date(),
        },
        deletedAt: null,
        deletedBy: null,
      });

      console.log(`✅ Created app setting: ${setting.key}`);
      createdCount++;
    }

    console.log(
      `✅ Migration ${this.version} (${this.name}) completed successfully - Created: ${createdCount}, Skipped: ${skippedCount}`,
    );
  }

  async down(): Promise<void> {
    if (!this.connection?.db) {
      throw new Error("Database connection not available");
    }

    const appSettingsCollection = this.connection.db.collection("app_settings");

    console.log(
      `🔄 Rolling back migration ${this.version} (${this.name}) - Removing default app settings...`,
    );

    const result = await appSettingsCollection.deleteMany({
      key: { $in: DEFAULT_APP_SETTING_KEYS },
    });

    console.log(
      `✅ Migration ${this.version} (${this.name}) rolled back - Removed ${result.deletedCount} setting(s)`,
    );
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private mergeMissingJsonKeys(
    existingValue: Record<string, unknown>,
    defaultValue: Record<string, unknown>,
  ): Record<string, unknown> {
    const mergedValue = { ...existingValue };

    for (const [key, defaultEntry] of Object.entries(defaultValue)) {
      if (!(key in mergedValue)) {
        mergedValue[key] = defaultEntry;
        continue;
      }

      const currentEntry = mergedValue[key];
      if (
        this.isPlainObject(currentEntry) &&
        this.isPlainObject(defaultEntry)
      ) {
        mergedValue[key] = this.mergeMissingJsonKeys(
          currentEntry,
          defaultEntry,
        );
      }
    }

    return mergedValue;
  }

  private parseJsonSettingValue(value: string): unknown | null {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    try {
      return JSON.parse(trimmedValue) as unknown;
    } catch {
      return null;
    }
  }

  private upgradeEmailTemplates(value: unknown): unknown[] | null {
    if (!Array.isArray(value)) {
      return null;
    }

    const passwordResetDefault = DEFAULT_EMAIL_TEMPLATES_VALUE.find(
      (template) => template.name === "PASSWORD_RESET",
    );
    const welcomeDefault = DEFAULT_EMAIL_TEMPLATES_VALUE.find(
      (template) => template.name === "WELCOME",
    );
    const verifyEmailDefault = DEFAULT_EMAIL_TEMPLATES_VALUE.find(
      (template) => template.name === "VERIFY_EMAIL",
    );
    if (!passwordResetDefault || !welcomeDefault || !verifyEmailDefault) {
      return null;
    }

    let updated = false;
    const withoutRemovedTemplates = value.filter((entry) => {
      if (!this.isPlainObject(entry)) {
        return true;
      }

      const templateName = typeof entry.name === "string" ? entry.name : "";
      if (templateName === "LOGIN_CODE" || templateName === "SAMPLE") {
        updated = true;
        return false;
      }

      return true;
    });

    const nextTemplates = withoutRemovedTemplates.map((entry) => {
      if (!this.isPlainObject(entry)) {
        return entry;
      }

      const html = typeof entry.html === "string" ? entry.html : "";

      if (entry.name === "PASSWORD_RESET") {
        if (
          !html.includes("logo.png") &&
          !html.includes("@@@<EXPIRES_IN_MINUTES>@@@")
        ) {
          return entry;
        }

        updated = true;
        return {
          ...entry,
          subject: passwordResetDefault.subject,
          html: passwordResetDefault.html,
        };
      }

      if (
        entry.name === "WELCOME" &&
        (html.includes("@@@<LOGIN_URL>@@@") ||
          html.includes("فعال‌سازی حساب") ||
          html.includes("برای تکمیل ثبت‌نام") ||
          html.includes("ورود به @@@<APP_NAME>@@@") ||
          !html.includes("@@@<ACTIVATION_URL>@@@"))
      ) {
        updated = true;
        return {
          ...entry,
          subject: welcomeDefault.subject,
          html: welcomeDefault.html,
        };
      }

      return entry;
    });

    if (
      !nextTemplates.some(
        (entry) => this.isPlainObject(entry) && entry.name === "PASSWORD_RESET",
      )
    ) {
      nextTemplates.push({ ...passwordResetDefault });
      updated = true;
    }

    if (
      !nextTemplates.some(
        (entry) => this.isPlainObject(entry) && entry.name === "WELCOME",
      )
    ) {
      nextTemplates.push({ ...welcomeDefault });
      updated = true;
    }

    if (
      !nextTemplates.some(
        (entry) => this.isPlainObject(entry) && entry.name === "VERIFY_EMAIL",
      )
    ) {
      nextTemplates.push({ ...verifyEmailDefault });
      updated = true;
    }

    return updated ? nextTemplates : null;
  }
}

registerMigration(Migration002_SeedDefaultAppSettings);
