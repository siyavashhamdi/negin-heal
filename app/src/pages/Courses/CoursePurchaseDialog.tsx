import { useEffect, useMemo, useState, type ReactElement } from "react";
import {
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import CurrencyBitcoinRoundedIcon from "@mui/icons-material/CurrencyBitcoinRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import FileUploadField from "../../shared/forms/FileUploadField";
import EnamadTrustSeal from "../../shared/EnamadTrustSeal";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import { COURSE_PURCHASE_SUBMIT_MUTATION } from "../../graphql/mutations/coursePurchaseSubmit.mutation";
import { PAYMENT_CHECKOUT_CONFIG_QUERY } from "../../graphql/queries/paymentCheckoutConfig.query";
import { COUPON_VALIDATE_QUERY } from "../../graphql/queries/couponValidate.query";
import { showErrorIfNotQueued } from "../../utilities/graphql-error.util";
import { getFileIdFromAccessUrl } from "../../utils/fileAccessUrl.util";
import { uploadFile } from "../../utils/fileUpload.util";
import {
  FILE_UPLOAD_POLICY,
  FILE_UPLOAD_POLICY_MAX_SIZE_BYTES,
} from "../../constants/fileUploadPolicies";
import {
  formatCoursePrice,
  type CourseDetailRecord,
  type CoursePurchaseSubmitMutation,
  type CoursePurchaseSubmitMutationVariables,
  type PaymentCheckoutConfigQuery,
  type CouponValidateQuery,
  type CouponValidateQueryVariables,
  type CouponValidateRecord,
  type UsdtIrtRateConfig,
  type UserCoursePaymentMethod,
} from "./course-detail.api";
import styles from "./styles/CoursePurchaseDialog.module.scss";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";

type CoursePurchaseDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onPurchaseSuccess?: () => void;
  readonly course: CourseDetailRecord;
  readonly displayPrice: number | null;
  readonly originalPrice?: number | null;
  readonly discountLabel?: string | null;
  readonly coverImageUrl?: string | null;
};

type PaymentMethodOption = {
  readonly value: UserCoursePaymentMethod;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly actionLabel: string;
  readonly icon: ReactElement;
  readonly badge?: string;
  readonly isActive: boolean;
};

const PAYMENT_METHOD_OPTIONS: readonly PaymentMethodOption[] = [
  {
    value: "GATEWAY",
    title: "درگاه پرداخت آنلاین",
    subtitle: "سریع، امن و پیشنهادی",
    description:
      "پرداخت مستقیم با کارت بانکی شتابی. پس از تایید تراکنش، دسترسی دوره به‌صورت خودکار فعال می‌شود.",
    actionLabel: "پرداخت از طریق درگاه امن",
    icon: <CreditCardRoundedIcon />,
    badge: "پیشنهادی",
    isActive: true,
  },
  {
    value: "CARD_TO_CARD",
    title: "کارت به کارت",
    subtitle: "مناسب پرداخت دستی",
    description:
      "مبلغ را به شماره کارت زیر واریز کنید و رسید پرداخت را بارگذاری کنید. تایید نهایی توسط تیم پشتیبانی انجام می‌شود.",
    actionLabel: "ثبت رسید و ارسال درخواست",
    icon: <AccountBalanceRoundedIcon />,
    isActive: true,
  },
  {
    value: "CRYPTOCURRENCY",
    title: "رمزارز",
    subtitle: "پرداخت بین‌المللی",
    description:
      "برای کاربران خارج از کشور؛ مبلغ معادل را به آدرس کیف پول ارسال کنید و شناسه تراکنش را ثبت نمایید. تایید نهایی توسط تیم پشتیبانی انجام می‌شود.",
    actionLabel: "ثبت تراکنش رمزارز",
    icon: <CurrencyBitcoinRoundedIcon />,
    isActive: true,
  },
] as const;

const DEFAULT_PAYMENT_METHOD_OPTION = PAYMENT_METHOD_OPTIONS[0] as PaymentMethodOption;

type CryptoPriceSummary = {
  readonly originalUsdtPrice: number | null;
  readonly finalUsdtPrice: number | null;
};

function calculateUsdtPrice(
  priceIrt: number | null | undefined,
  rateConfig?: UsdtIrtRateConfig | null,
): number | null {
  if (!priceIrt || priceIrt <= 0 || !rateConfig?.valueIrt || rateConfig.valueIrt <= 0) {
    return null;
  }

  return (priceIrt / rateConfig.valueIrt) * rateConfig.coefficient + rateConfig.feeUsdt;
}

function formatUsdtPrice(price?: number | null): string {
  if (price == null) {
    return "در انتظار تنظیم نرخ";
  }

  return `${price.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })} USDT`;
}

function formatCouponDiscountLabel(coupon: CouponValidateRecord): string {
  if (coupon.discountType === "PERCENTAGE" && coupon.discountValue != null) {
    return `${Math.min(coupon.discountValue, 100).toLocaleString("fa-IR")}٪ تخفیف`;
  }

  const fixedDiscountAmount = coupon.couponDiscountAmountIrt ?? coupon.discountValue;
  if (fixedDiscountAmount != null) {
    return `${formatCoursePrice(fixedDiscountAmount)} تخفیف`;
  }

  return "تخفیف";
}

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function CoursePurchaseDialog({
  open,
  onClose,
  onPurchaseSuccess,
  course,
  displayPrice,
  originalPrice,
  discountLabel,
  coverImageUrl,
}: CoursePurchaseDialogProps): ReactElement {
  const { showSuccess, showError } = useSnackbar();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<UserCoursePaymentMethod>("GATEWAY");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [cryptoTransactionHash, setCryptoTransactionHash] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidateRecord | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const { data: checkoutConfigData, loading: isCheckoutConfigLoading } =
    useQuery<PaymentCheckoutConfigQuery>(PAYMENT_CHECKOUT_CONFIG_QUERY, {
      skip: !open,
      fetchPolicy: "network-only",
    });
  const [validateCoupon, { loading: isCouponValidating }] = useLazyQuery<
    CouponValidateQuery,
    CouponValidateQueryVariables
  >(COUPON_VALIDATE_QUERY, {
    fetchPolicy: "network-only",
  });
  const [submitPurchase] = useMutationWithSnackbar<
    CoursePurchaseSubmitMutation,
    CoursePurchaseSubmitMutationVariables
  >(COURSE_PURCHASE_SUBMIT_MUTATION);

  const checkoutConfig = checkoutConfigData?.paymentCheckoutConfig;
  const paymentCards = checkoutConfig?.paymentCards ?? [];
  const cryptoWallets = checkoutConfig?.cryptoWallets ?? [];
  const usdtIrtRate = checkoutConfig?.usdtIrtRate ?? null;
  const paymentMethodOptions = useMemo<PaymentMethodOption[]>(() => {
    const configuredMethods = checkoutConfig?.paymentMethods?.length
      ? checkoutConfig.paymentMethods
      : PAYMENT_METHOD_OPTIONS.map((option) => ({
        method: option.value,
        isVisible: true,
        isActive: true,
        isRecommended: option.badge != null,
      }));

    return configuredMethods.reduce<PaymentMethodOption[]>((options, methodConfig) => {
      if (!methodConfig.isVisible) {
        return options;
      }

      const option = PAYMENT_METHOD_OPTIONS.find(
        (paymentOption) => paymentOption.value === methodConfig.method,
      );

      if (!option) {
        return options;
      }

      options.push({
        ...option,
        badge: methodConfig.isRecommended ? "پیشنهادی" : undefined,
        isActive: methodConfig.isActive,
      });

      return options;
    }, []);
  }, [checkoutConfig?.paymentMethods]);

  const selectedPaymentOption = useMemo<PaymentMethodOption>(
    () =>
      paymentMethodOptions.find((option) => option.value === selectedPaymentMethod) ??
      paymentMethodOptions[0] ??
      DEFAULT_PAYMENT_METHOD_OPTION,
    [paymentMethodOptions, selectedPaymentMethod],
  );
  const effectiveDisplayPrice = appliedCoupon?.finalAmountIrt ?? displayPrice ?? null;
  const summaryOriginalPrice = appliedCoupon?.amountIrt ?? originalPrice ?? displayPrice ?? null;
  const summaryDiscountLabel = appliedCoupon
    ? formatCouponDiscountLabel(appliedCoupon)
    : discountLabel;
  const shouldShowSummaryDiscount =
    summaryOriginalPrice != null &&
    effectiveDisplayPrice != null &&
    effectiveDisplayPrice < summaryOriginalPrice &&
    summaryDiscountLabel != null;
  const isFreePurchase = course.isFree || effectiveDisplayPrice === 0;
  const freePurchaseMessage =
    appliedCoupon != null && appliedCoupon.finalAmountIrt === 0
      ? "با اعمال کد تخفیف، مبلغ نهایی این دوره رایگان شد."
      : "مبلغ نهایی این دوره رایگان است و نیازی به پرداخت ندارد.";
  const canApplyCoupon = !course.isFree && displayPrice != null && displayPrice > 0;
  const cryptoPriceSummary = useMemo<CryptoPriceSummary>(() => {
    const originalUsdtPrice = calculateUsdtPrice(summaryOriginalPrice, usdtIrtRate);
    const finalUsdtPrice = calculateUsdtPrice(effectiveDisplayPrice, usdtIrtRate);

    return {
      originalUsdtPrice,
      finalUsdtPrice,
    };
  }, [effectiveDisplayPrice, summaryOriginalPrice, usdtIrtRate]);
  const hasCryptoDiscount =
    cryptoPriceSummary.originalUsdtPrice != null &&
    cryptoPriceSummary.finalUsdtPrice != null &&
    cryptoPriceSummary.finalUsdtPrice < cryptoPriceSummary.originalUsdtPrice;
  const cryptoAmountHint =
    cryptoPriceSummary.finalUsdtPrice != null
      ? `مبلغ نهایی: ${formatUsdtPrice(cryptoPriceSummary.finalUsdtPrice)}`
      : "مبلغ پس از تنظیم نرخ تبدیل محاسبه می‌شود";

  useEffect(() => {
    if (!open || paymentMethodOptions.length === 0) {
      return;
    }

    const selectedOption = paymentMethodOptions.find(
      (option) => option.value === selectedPaymentMethod,
    );
    if (selectedOption?.isActive) {
      return;
    }

    const nextOption =
      paymentMethodOptions.find((option) => option.isActive) ?? paymentMethodOptions[0];
    if (!nextOption) {
      return;
    }
    setSelectedPaymentMethod(nextOption.value);
  }, [open, paymentMethodOptions, selectedPaymentMethod]);

  useEffect(() => {
    if (open) {
      return;
    }

    setSelectedPaymentMethod("GATEWAY");
    setReceiptFile(null);
    setPaymentReference("");
    setCryptoTransactionHash("");
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError(null);
    setIsSubmitting(false);
  }, [open]);

  const handleCouponCodeChange = (value: string): void => {
    setCouponCode(value.toUpperCase());
    if (appliedCoupon || couponError) {
      setAppliedCoupon(null);
      setCouponError(null);
    }
  };

  const handleValidateCoupon = async (): Promise<void> => {
    const normalizedCode = couponCode.trim();
    if (!normalizedCode) {
      setCouponError("کد تخفیف را وارد کنید.");
      setAppliedCoupon(null);
      return;
    }

    setCouponError(null);
    try {
      const { data, error } = await validateCoupon({
        variables: {
          input: {
            courseId: course.id,
            code: normalizedCode,
          },
        },
      });

      if (error) {
        setAppliedCoupon(null);
        setCouponError(error.message || "اعتبارسنجی کد تخفیف با خطا مواجه شد.");
        return;
      }

      const result = data?.couponValidate;
      if (!result?.isValid) {
        setAppliedCoupon(null);
        setCouponError(result?.message || "کد تخفیف معتبر نیست.");
        return;
      }

      setAppliedCoupon(result);
      setCouponCode(result.code ?? normalizedCode);
      showSuccess("کد تخفیف با موفقیت اعمال شد.");
    } catch {
      setAppliedCoupon(null);
      setCouponError("اعتبارسنجی کد تخفیف با خطا مواجه شد.");
    }
  };

  const handleRemoveCoupon = (): void => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const getClearAdornment = (value: string, onClear: () => void): ReactElement | null => {
    if (!value) {
      return null;
    }

    return (
      <InputAdornment position="end">
        <IconButton size="small" aria-label="پاک کردن متن" onClick={onClear} edge="end">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </InputAdornment>
    );
  };

  const handleCopy = async (value: string, label: string): Promise<void> => {
    const copied = await copyToClipboard(value);
    if (copied) {
      showSuccess(`${label} کپی شد.`);
      return;
    }
    showError("کپی در مرورگر شما پشتیبانی نمی‌شود.");
  };

  const uploadReceiptFile = async (file: File): Promise<string | null> => {
    try {
      const uploadedFile = await uploadFile(file, {
        policy: FILE_UPLOAD_POLICY.PAYMENT_RECEIPT,
        accept: "image/*,.pdf",
        maxSizeBytes: FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.PAYMENT_RECEIPT,
      });
      return getFileIdFromAccessUrl(uploadedFile.accessUrl);
    } catch (error) {
      showErrorIfNotQueued(showError, error);
      return null;
    }
  };

  const handleSubmit = async (): Promise<void> => {
    const couponCodeValue = appliedCoupon?.code?.trim() || undefined;

    if (isFreePurchase) {
      setIsSubmitting(true);
      try {
        const { data, error } = await submitPurchase({
          variables: {
            input: {
              courseId: course.id,
              paymentMethod: "FREE",
              couponCode: couponCodeValue,
            },
          },
        });

        if (error) {
          return;
        }

        const purchase = data?.coursePurchaseSubmit;
        if (!purchase) {
          showError("ثبت خرید با خطا مواجه شد.");
          return;
        }

        showSuccess(
          purchase.isPurchased
            ? "خرید رایگان ثبت شد و دسترسی دوره برای شما فعال شد."
            : "درخواست خرید ثبت شد.",
        );
        onPurchaseSuccess?.();
        onClose();
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!selectedPaymentOption.isActive) {
      showError("این روش پرداخت در حال حاضر فعال نیست.");
      return;
    }

    if (selectedPaymentMethod === "CARD_TO_CARD") {
      if (paymentCards.length === 0) {
        showError("شماره کارت پرداخت هنوز تنظیم نشده است.");
        return;
      }
      if (!receiptFile) {
        showError("لطفاً تصویر رسید پرداخت را بارگذاری کنید.");
        return;
      }
      if (!paymentReference.trim()) {
        showError("شماره رسید یا ۴ رقم آخر کارت مبدا را وارد کنید.");
        return;
      }
    }

    if (selectedPaymentMethod === "CRYPTOCURRENCY") {
      if (cryptoWallets.length === 0) {
        showError("آدرس کیف پول هنوز تنظیم نشده است.");
        return;
      }
      if (!cryptoTransactionHash.trim()) {
        showError("شناسه تراکنش (TxID) را وارد کنید.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let uploadedReceiptFileId: string | undefined;
      if (selectedPaymentMethod === "CARD_TO_CARD" && receiptFile) {
        const receiptFileId = await uploadReceiptFile(receiptFile);
        if (!receiptFileId) {
          return;
        }
        uploadedReceiptFileId = receiptFileId;
      }

      const { data, error } = await submitPurchase({
        variables: {
          input: {
            courseId: course.id,
            paymentMethod: selectedPaymentMethod,
            couponCode: couponCodeValue,
            uploadedReceiptFileId,
            paymentReference:
              selectedPaymentMethod === "CARD_TO_CARD"
                ? paymentReference.trim()
                : undefined,
            transactionId:
              selectedPaymentMethod === "CRYPTOCURRENCY"
                ? cryptoTransactionHash.trim()
                : undefined,
          },
        },
      });

      if (error) {
        return;
      }

      const purchase = data?.coursePurchaseSubmit;
      if (!purchase) {
        showError("ثبت خرید با خطا مواجه شد.");
        return;
      }

      if (selectedPaymentMethod === "GATEWAY") {
        if (!purchase.paymentUrl) {
          showError("لینک پرداخت از درگاه دریافت نشد.");
          return;
        }

        window.location.assign(purchase.paymentUrl);
        return;
      }

      if (purchase.isPurchased) {
        showSuccess("خرید با موفقیت ثبت شد و دسترسی دوره برای شما فعال شد.");
      } else if (selectedPaymentMethod === "CARD_TO_CARD") {
        showSuccess("درخواست کارت به کارت ثبت شد. پس از بررسی رسید، دسترسی دوره فعال می‌شود.");
      } else {
        showSuccess("تراکنش رمزارز ثبت شد. پس از تایید شبکه، دسترسی دوره برای شما باز می‌شود.");
      }

      onPurchaseSuccess?.();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EntityModalShell
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title="تکمیل خرید دوره"
      subtitle={course.title}
      maxWidth="md"
      disableAutoFocus
      disableRestoreFocus
      closeOnSave
      footer={
        <ModalFooterActions
          actions={[
            {
              key: "close",
              isCloseButton: true,
              onClick: onClose,
              disabled: isSubmitting,
            },
            {
              key: "submit",
              label: isFreePurchase ? "خرید رایگان" : selectedPaymentOption.actionLabel,
              onClick: () => void handleSubmit(),
              icon: isFreePurchase ? undefined : selectedPaymentOption.icon,
              disabled:
                isSubmitting ||
                (!isFreePurchase &&
                  (isCheckoutConfigLoading ||
                    paymentMethodOptions.length === 0 ||
                    !selectedPaymentOption.isActive)),
            },
          ]}
        />
      }
    >
      <div className={styles.layout}>
          <aside className={styles.summaryPanel}>
            <div className={styles.summaryHero}>
              {coverImageUrl ? (
                <img src={coverImageUrl} alt="" className={styles.summaryCover} />
              ) : (
                <div className={styles.summaryCoverFallback} />
              )}
              <div>
                <span>خلاصه سفارش</span>
                <strong>{formatCoursePrice(effectiveDisplayPrice)}</strong>
                {shouldShowSummaryDiscount ? (
                  <div className={styles.summaryDiscount}>
                    <small>{formatCoursePrice(summaryOriginalPrice)}</small>
                    <b>{summaryDiscountLabel}</b>
                  </div>
                ) : null}
                {selectedPaymentMethod === "CRYPTOCURRENCY" && !isFreePurchase ? (
                  <div className={styles.summaryCryptoPrice}>
                    {hasCryptoDiscount ? (
                      <small className={styles.latinText}>
                        {formatUsdtPrice(cryptoPriceSummary.originalUsdtPrice)}
                      </small>
                    ) : null}
                    <b className={styles.latinText}>
                      {formatUsdtPrice(cryptoPriceSummary.finalUsdtPrice)}
                    </b>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          <section className={styles.checkoutPanel}>
            {canApplyCoupon ? (
              <div className={styles.couponSection}>
                <div className={styles.sectionHeading}>
                  <h3>کد تخفیف</h3>
                  <p>در صورت داشتن کد تخفیف، آن را وارد و اعمال کنید.</p>
                </div>
                <div className={styles.couponForm}>
                  <TextField
                    fullWidth
                    size="small"
                    label="کد تخفیف"
                    value={couponCode}
                    onChange={(event) => handleCouponCodeChange(event.target.value)}
                    placeholder="مثال: SPRING26"
                    disabled={isCouponValidating}
                    error={couponError != null}
                    helperText={couponError ?? undefined}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <LocalOfferRoundedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{
                      className: styles.latinInput,
                      dir: "ltr",
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleValidateCoupon();
                      }
                    }}
                  />
                  {appliedCoupon ? (
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={handleRemoveCoupon}
                      disabled={isCouponValidating}
                    >
                      حذف
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={() => void handleValidateCoupon()}
                      disabled={isCouponValidating || !couponCode.trim()}
                    >
                      {isCouponValidating ? "در حال بررسی..." : "اعمال"}
                    </Button>
                  )}
                </div>
                {appliedCoupon ? (
                  <div className={styles.couponApplied}>
                    <CheckCircleRoundedIcon fontSize="small" />
                    <small>
                      {appliedCoupon.couponDiscountAmountIrt != null
                        ? `${formatCoursePrice(appliedCoupon.couponDiscountAmountIrt)} کسر شد.`
                        : "کد تخفیف اعمال شد."}
                    </small>
                  </div>
                ) : null}
              </div>
            ) : null}

            {isFreePurchase ? (
              <>
                <div className={styles.sectionHeading}>
                  <h3>روش پرداخت</h3>
                  <p>برای این سفارش نیازی به پرداخت نیست.</p>
                </div>
                <div className={styles.methodDetails}>
                  <Typography component="h4" className={styles.methodDetailsTitle}>
                    خرید رایگان
                  </Typography>
                  <Typography className={styles.methodDetailsDescription}>
                    {freePurchaseMessage}
                  </Typography>
                  <div className={styles.freePurchaseNotice}>
                    <CheckCircleRoundedIcon fontSize="small" />
                    <span>با زدن دکمه خرید رایگان، دسترسی دوره برای شما فعال می‌شود.</span>
                  </div>
                </div>
              </>
            ) : null}

            {!isFreePurchase ? (
              <>
                <div className={styles.sectionHeading}>
                  <h3>روش پرداخت</h3>
                  <p>یکی از مسیرهای پرداخت را انتخاب کنید.</p>
                </div>

                <div className={styles.methodGrid}>
                  {paymentMethodOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.methodCard}${
                        selectedPaymentMethod === option.value ? ` ${styles.methodCardActive}` : ""
                      }${!option.isActive ? ` ${styles.methodCardDisabled}` : ""}`}
                      disabled={!option.isActive}
                      onClick={() => {
                        if (option.isActive) {
                          setSelectedPaymentMethod(option.value);
                        }
                      }}
                    >
                      <span className={styles.methodIcon}>{option.icon}</span>
                      <span className={styles.methodText}>
                        <strong>
                          {option.title}
                          {option.badge ? (
                            <span className={styles.methodBadge}>{option.badge}</span>
                          ) : null}
                        </strong>
                        <small>{option.isActive ? option.subtitle : "موقتاً غیرفعال"}</small>
                      </span>
                      {selectedPaymentMethod === option.value ? (
                        <CheckCircleRoundedIcon className={styles.methodSelectedIcon} />
                      ) : null}
                    </button>
                  ))}
                </div>
                {isCheckoutConfigLoading ? (
                  <p className={styles.gatewayHint}>در حال دریافت تنظیمات پرداخت...</p>
                ) : null}
                {!isCheckoutConfigLoading && paymentMethodOptions.length === 0 ? (
                  <p className={styles.gatewayHint}>در حال حاضر هیچ روش پرداختی فعال نیست.</p>
                ) : null}

                <div className={styles.methodDetails}>
                  <Typography component="h4" className={styles.methodDetailsTitle}>
                    {selectedPaymentOption.title}
                  </Typography>
                  <Typography className={styles.methodDetailsDescription}>
                    {selectedPaymentOption.description}
                  </Typography>

                  {selectedPaymentMethod === "GATEWAY" ? (
                    <div className={styles.gatewayPanel}>
                      <div className={styles.gatewayFeature}>
                        <LockRoundedIcon fontSize="small" />
                        <span>اتصال مستقیم به درگاه معتبر بانکی</span>
                      </div>
                      <div className={styles.gatewayFeature}>
                        <ShieldRoundedIcon fontSize="small" />
                        <span>فعال‌سازی خودکار دوره پس از پرداخت موفق</span>
                      </div>
                    </div>
                  ) : null}

                  {selectedPaymentMethod === "CARD_TO_CARD" ? (
                    <div className={styles.manualPaymentPanel}>
                      {paymentCards.length > 0 ? (
                        paymentCards.map((card) => (
                          <button
                            key={`${card.cardNumber}-${card.bankName}`}
                            type="button"
                            className={styles.copyRow}
                            onClick={() => void handleCopy(card.cardNumber, "شماره کارت")}
                          >
                            <div>
                              <span>شماره کارت</span>
                              <strong>{card.cardNumber}</strong>
                              <small>
                                {[
                                  card.holderName ? `به نام ${card.holderName}` : "",
                                  card.bankName,
                                ]
                                  .filter(Boolean)
                                  .join(" - ")}
                              </small>
                            </div>
                            <ContentCopyRoundedIcon fontSize="small" />
                          </button>
                        ))
                      ) : (
                        <p className={styles.gatewayHint}>شماره کارت پرداخت هنوز تنظیم نشده است.</p>
                      )}
                      <TextField
                        fullWidth
                        size="small"
                        label="شماره رسید یا ۴ رقم آخر کارت مبدا"
                        value={paymentReference}
                        onChange={(event) => setPaymentReference(event.target.value)}
                        InputProps={{
                          startAdornment: getClearAdornment(paymentReference, () =>
                            setPaymentReference(""),
                          ),
                        }}
                        inputProps={{
                          className: styles.latinInput,
                          dir: "ltr",
                        }}
                      />
                      <FileUploadField
                        label="رسید پرداخت"
                        file={receiptFile}
                        onChange={setReceiptFile}
                        accept="image/*,.pdf"
                        allowedFormatsLabel="JPG, PNG, PDF"
                        maxSizeLabel="حداکثر ۵ مگابایت"
                        maxSizeBytes={FILE_UPLOAD_POLICY_MAX_SIZE_BYTES.PAYMENT_RECEIPT}
                        dropTitle="رسید پرداخت را اینجا رها کنید"
                        mobileDropTitle="انتخاب رسید پرداخت"
                        dropHint="یا برای انتخاب فایل کلیک کنید"
                        removeLabel="حذف رسید"
                        invalidLabel="فرمت یا حجم فایل معتبر نیست"
                        required
                      />
                    </div>
                  ) : null}

                  {selectedPaymentMethod === "CRYPTOCURRENCY" ? (
                    <div className={styles.manualPaymentPanel}>
                      {cryptoWallets.length > 0 ? (
                        cryptoWallets.map((wallet) => (
                          <button
                            key={`${wallet.network}-${wallet.address}`}
                            type="button"
                            className={styles.copyRow}
                            onClick={() =>
                              void handleCopy(wallet.address, `آدرس کیف پول ${wallet.network}`)
                            }
                          >
                            <div>
                              <span>
                                آدرس کیف پول (
                                <span className={styles.latinText}>USDT / {wallet.network}</span>)
                              </span>
                              <strong className={styles.latinText}>{wallet.address}</strong>
                              <small>
                                {cryptoPriceSummary.finalUsdtPrice != null ? (
                                  <>
                                    مبلغ نهایی:{" "}
                                    <span className={styles.latinText}>
                                      {formatUsdtPrice(cryptoPriceSummary.finalUsdtPrice)}
                                    </span>
                                  </>
                                ) : (
                                  cryptoAmountHint
                                )}
                              </small>
                            </div>
                            <ContentCopyRoundedIcon fontSize="small" />
                          </button>
                        ))
                      ) : (
                        <p className={styles.cryptoHint}>آدرس کیف پول هنوز تنظیم نشده است.</p>
                      )}
                      <TextField
                        fullWidth
                        size="small"
                        label="شناسه تراکنش (TxID)"
                        value={cryptoTransactionHash}
                        onChange={(event) => setCryptoTransactionHash(event.target.value)}
                        placeholder="پس از ارسال رمزارز، شناسه را وارد کنید"
                        InputProps={{
                          startAdornment: getClearAdornment(cryptoTransactionHash, () =>
                            setCryptoTransactionHash(""),
                          ),
                        }}
                        inputProps={{
                          className: styles.latinInput,
                          dir: "ltr",
                        }}
                        required
                      />
                      <p className={styles.cryptoHint}>
                        پس از تایید تراکنش در شبکه و بررسی تیم پشتیبانی، دسترسی دوره برای شما فعال
                        می‌شود.
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

            {selectedPaymentMethod === "GATEWAY" && !isFreePurchase ? (
              <div className={styles.trustSealRow}>
                <EnamadTrustSeal />
              </div>
            ) : null}
          </section>
        </div>
    </EntityModalShell>
  );
}
