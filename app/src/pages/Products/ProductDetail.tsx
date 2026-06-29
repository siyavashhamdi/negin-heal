import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import PhotoRoundedIcon from "@mui/icons-material/PhotoRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import { CHAPTER_UNLOCK_COUNTDOWN_THRESHOLD_MS } from "../../constants/product.constants";
import { useAuth } from "../../contexts/AuthContext";
import { isMobileAppLayoutViewport } from "../../hooks/useMobileAppLayout";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import { PRODUCT_ROUTE_ID_PARAM, PRODUCTS_ROUTE_PATH } from "../../routing/product-route-path";
import {
  buildCloseMaxRouteLocation,
  buildMaxRouteLocation,
  isMaxRoutePathname,
} from "../../routing/max-route.util";
import { setMaxRouteOwner, clearMaxRouteOwner } from "../../routing/max-route-owner.store";
import {
  buildProductLoginReturnState,
  buildProductPostLoginRedirect,
  setPostLoginRedirect,
} from "../../routing/post-login-redirect";
import { resolveFileAccessUrl, buildExistingFilePreview } from "../../utils/fileAccessUrl.util";
import { CachedFileImage } from "../../shared/display/CachedFileImage";
import { useCachedFileAccessUrl } from "../../hooks/useCachedFileAccessUrl";
import PageBackNavigation from "../../shared/PageBackNavigation";
import { applyBlankTargetToRichTextLinks } from "../../utils/richTextHtml.util";
import { USER_PRODUCT_DETAIL_QUERY } from "../../graphql/queries/userProductDetail.query";
import { PRODUCT_CHAPTER_COMPLETE_MUTATION } from "../../graphql/mutations/productChapterComplete.mutation";
import { useProductPaymentStatusNotificationRefetch } from "../../hooks/useProductPaymentStatusNotificationRefetch";
import { useSnackbar } from "../../hooks/useSnackbar";
import { usePageSeoOverride } from "../../hooks/usePageSeoOverride";
import { useTranslation } from "../../hooks/useTranslation";
import { API_CONFIG } from "../../config";
import {
  buildBreadcrumbStructuredData,
  buildProductStructuredData,
} from "../../seo/build-structured-data";
import { resolveAppBaseUrl } from "../../seo/build-page-seo";
import type { PageSeoOverride } from "../../seo/seo.types";
import { buildSeoDescription, htmlToPlainText, resolveAbsoluteUrl } from "../../seo/seo-text.util";
import {
  resolveErrorMessageFromCode,
  showErrorIfNotQueued,
} from "../../utilities/graphql-error.util";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import { ChapterCompletionCheckpoint } from "./ChapterCompletionCheckpoint";
import { ProductPurchaseDialog } from "./ProductPurchaseDialog";
import ProductDetailSectionTabs, { type ProductDetailSectionTab } from "./ProductDetailSectionTabs";
import ProductReviewsSection from "./ProductReviewsSection";
import {
  canUseAdminProductReviewList,
  isStaffProductReviewer,
  resolveCanSubmitProductReview,
} from "./product-reviews.api";
import { useProductReviewList } from "./useProductReviewList";
import {
  resolveProductDetailSectionFromScroll,
  scrollToProductDetailSection,
} from "./product-detail-section-scroll.util";
import {
  resolveActiveChapterKeyFromScroll,
  scrollToProductChapter,
} from "./product-chapter-path.util";
import { PRODUCT_SECTION_TABS } from "./product-section-tabs.shared";
import {
  formatChapterUnlockCountdown,
  formatChapterUnlockRelativeMessage,
  formatProductPrice,
  getChapterUnlockRemainingMs,
  getProductContentAccessNoteText,
  getProductContentIntroText,
  getDiscountedPrice,
  getPurchaseCardAccessCaption,
  isGradualChapterLock,
  shouldShowChapterUnlockCountdown,
  type ProductDetailItem,
  type ProductChapterCompleteMutation,
  type ProductChapterCompleteMutationVariables,
  type UserProductDetailQuery,
  type UserProductDetailQueryVariables,
} from "./product-detail.api";
import RichTextBox from "../../shared/forms/RichTextBox";
import FileUploadField from "../../shared/forms/FileUploadField";
import richTextStyles from "../../shared/forms/RichTextBox.module.scss";
import type { ProductItemType } from "./product-list.api";
import { buildProductItemPreviewId } from "./product-item-preview.util";
import styles from "./styles/ProductDetail.module.scss";

const ITEM_TYPE_ICON: Record<ProductItemType, ReactElement> = {
  ARTICLE: <AutoStoriesRoundedIcon fontSize="small" />,
  VIDEO: <OndemandVideoRoundedIcon fontSize="small" />,
  VOICE: <VolumeUpRoundedIcon fontSize="small" />,
  IMAGE: <PhotoRoundedIcon fontSize="small" />,
};

type ProductItemViewer = {
  readonly previewId: string;
  readonly title: string;
  readonly article: string;
};

function buildArticleViewer(item: ProductDetailItem, previewId: string): ProductItemViewer | null {
  const article = item.article?.trim();
  if (!article) {
    return null;
  }

  return {
    previewId,
    title: item.title,
    article,
  };
}

function ProductItemContent({
  item,
  chapterKey,
  itemIndex,
  onOpenArticle,
}: {
  readonly item: ProductDetailItem;
  readonly chapterKey: string;
  readonly itemIndex: number;
  readonly onOpenArticle: (viewer: ProductItemViewer) => void;
}): ReactElement | null {
  const previewId = buildProductItemPreviewId(chapterKey, itemIndex);

  if (item.type === "ARTICLE" && item.article?.trim()) {
    const openArticleViewer = (): void => {
      const viewer = buildArticleViewer(item, previewId);
      if (viewer) {
        onOpenArticle(viewer);
      }
    };

    return (
      <RichTextBox
        mode="render"
        label=""
        renderTitle={item.title.trim() || undefined}
        value={item.article.trim()}
        hideLabel
        onPreviewMaximize={openArticleViewer}
      />
    );
  }

  const existingFile = buildExistingFilePreview(item.fileAccessUrl, item.title.trim() || "فایل");
  if (!existingFile) {
    return null;
  }

  return (
    <FileUploadField
      previewId={previewId}
      readOnly
      hideLabel
      fullWidth
      label={existingFile.name}
      file={null}
      onChange={() => undefined}
      existingFile={existingFile}
      accept="*/*"
      allowedFormatsLabel=""
      maxSizeLabel=""
      dropTitle=""
      dropHint=""
      removeLabel=""
      invalidLabel=""
    />
  );
}

function ChapterUnlockNotice({
  unlocksAt,
  fallbackMessage,
  onExpired,
  isSingleChapter = false,
}: {
  readonly unlocksAt?: string | null;
  readonly fallbackMessage: string;
  readonly onExpired: () => void;
  readonly isSingleChapter?: boolean;
}): ReactElement {
  const [now, setNow] = useState(() => new Date());
  const hasExpiredRef = useRef(false);
  const remainingMs = getChapterUnlockRemainingMs(unlocksAt, now);
  const showCountdown = shouldShowChapterUnlockCountdown(unlocksAt, now);

  useEffect(() => {
    hasExpiredRef.current = false;
  }, [unlocksAt]);

  useEffect(() => {
    if (!unlocksAt) {
      return;
    }

    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const startTicker = (): void => {
      setNow(new Date());
      intervalId = window.setInterval(() => {
        setNow(new Date());
      }, 1000);
    };

    const remaining = getChapterUnlockRemainingMs(unlocksAt, new Date());
    if (remaining == null || remaining <= 0) {
      return;
    }

    if (remaining <= CHAPTER_UNLOCK_COUNTDOWN_THRESHOLD_MS) {
      startTicker();
    } else {
      timeoutId = window.setTimeout(startTicker, remaining - CHAPTER_UNLOCK_COUNTDOWN_THRESHOLD_MS);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [unlocksAt]);

  useEffect(() => {
    if (remainingMs == null || remainingMs > 0 || hasExpiredRef.current) {
      return;
    }

    hasExpiredRef.current = true;
    onExpired();
  }, [onExpired, remainingMs]);

  if (showCountdown && remainingMs != null && remainingMs > 0) {
    return (
      <div className={styles.unlockCountdownNotice}>
        <LockRoundedIcon />
        <span className={styles.unlockCountdownMessage}>
          <span className={styles.unlockCountdownLead}>
            {isSingleChapter
              ? "محتوای دوره به‌زودی قابل مشاهده خواهد بود."
              : "این فصل به‌زودی قابل مشاهده خواهد بود."}
          </span>
          <strong className={styles.unlockCountdown} aria-live="polite">
            {formatChapterUnlockCountdown(remainingMs)}
          </strong>
        </span>
      </div>
    );
  }

  const relativeMessage = formatChapterUnlockRelativeMessage(unlocksAt, now);

  return (
    <>
      <LockRoundedIcon />
      <span>{relativeMessage ?? fallbackMessage}</span>
    </>
  );
}

const ProductDetail = (): ReactElement => {
  const params = useParams<Record<typeof PRODUCT_ROUTE_ID_PARAM, string | undefined>>();
  const productId = params[PRODUCT_ROUTE_ID_PARAM] ?? "";
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusChapterKey = searchParams.get("chapter")?.trim() || null;
  const { isAuthenticated, user } = useAuth();
  const { showError, showSuccess, showWarning } = useSnackbar();
  const { t } = useTranslation();
  const purchaseCardRef = useRef<HTMLElement | null>(null);
  const productDetailVariables = useMemo(
    (): UserProductDetailQueryVariables => ({ input: { id: productId || "" } }),
    [productId]
  );

  const { data, previousData, loading, error, refetch } = useQuery<
    UserProductDetailQuery,
    UserProductDetailQueryVariables
  >(USER_PRODUCT_DETAIL_QUERY, {
    variables: productDetailVariables,
    skip: !productId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  const refetchProductDetail = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useProductPaymentStatusNotificationRefetch({
    enabled: isAuthenticated && Boolean(productId),
    productId,
    refetch: () => {
      void refetchProductDetail();
    },
  });

  const product = data?.product ?? previousData?.product;
  const isStaffViewer = isStaffProductReviewer(user?.roles);
  const isReviewsSectionHiddenForEndUser =
    !isStaffViewer && product?.isReviewsSectionVisible === false;

  const reviewList = useProductReviewList({
    productId: productId || "",
    mode: isStaffViewer ? "admin" : "endUser",
    enabled:
      Boolean(productId) &&
      !isReviewsSectionHiddenForEndUser &&
      (isStaffViewer ? isAuthenticated && canUseAdminProductReviewList(user?.roles) : true),
    starsFilter: null,
    scrollRoot: "parent",
  });

  const coverImageNetworkUrl = resolveFileAccessUrl(product?.coverImageAccessUrl);
  const { url: coverImageUrl } = useCachedFileAccessUrl(product?.coverImageAccessUrl);
  const discountedPrice = product ? getDiscountedPrice(product.priceIrt, product.discount) : null;
  const displayPrice = discountedPrice ?? product?.priceIrt ?? null;
  const discountLabel =
    product?.discount && discountedPrice != null
      ? product.discount.type === "PERCENTAGE"
        ? `${Math.min(product.discount.value, 100).toLocaleString("fa-IR")}٪ تخفیف`
        : `${formatProductPrice(product.discount.value)} تخفیف`
      : null;
  const isPaidPurchase = product?.purchaseStatus === "PAID" || product?.isPurchased === true;
  const hasPendingManualReview = product?.isFree !== true && product?.purchaseStatus === "PENDING";
  const hasPendingPurchase = hasPendingManualReview;
  const canAccessProduct = product?.isFree === true || isPaidPurchase;
  const shouldShowPrice = !isPaidPurchase;
  const shouldShowMobilePinnedPriceBar = !canAccessProduct && !hasPendingPurchase;
  const totalItems =
    product?.chapters.reduce((sum, chapter) => sum + (chapter.items?.length ?? 0), 0) ?? 0;
  const isSingleChapter = (product?.chapters.length ?? 0) === 1;
  const chapterKeys = useMemo(
    () => product?.chapters.map((chapter) => chapter.key) ?? [],
    [product?.chapters]
  );
  const isGradualRelease = product?.releaseType === "GRADUAL";
  const hasLockedChapters = product?.chapters.some((chapter) => chapter.isLocked) ?? false;
  const productDetailCopyContext = useMemo(
    () => ({
      isSingleChapter,
      isGradualRelease: isGradualRelease ?? false,
      hasLockedChapters,
      canAccessProduct,
      totalItems,
    }),
    [canAccessProduct, hasLockedChapters, isGradualRelease, isSingleChapter, totalItems]
  );
  const productContentIntroText = getProductContentIntroText(productDetailCopyContext);
  const productContentAccessNoteText = getProductContentAccessNoteText(productDetailCopyContext);
  const purchaseCardAccessCaption = getPurchaseCardAccessCaption(productDetailCopyContext);
  const defaultExpandedChapterKey = useMemo(() => {
    if (!product?.chapters.length) {
      return null;
    }

    if (product.isPurchased) {
      const lastUnlockedChapter = [...product.chapters]
        .reverse()
        .find((chapter) => !chapter.isLocked);
      return lastUnlockedChapter?.key ?? product.chapters[0]?.key ?? null;
    }

    return product.chapters[0]?.key ?? null;
  }, [product]);
  const hasGradualLockedChapters =
    product?.releaseType === "GRADUAL" &&
    product.chapters.some((chapter) => isGradualChapterLock(chapter));
  const [expandedChapterKeys, setExpandedChapterKeys] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [activeChapterKey, setActiveChapterKey] = useState<string | null>(null);
  const [activeSectionTab, setActiveSectionTab] = useState<ProductDetailSectionTab>("intro");

  const [isMobilePriceBarVisible, setIsMobilePriceBarVisible] = useState(false);
  const [selectedItemViewer, setSelectedItemViewer] = useState<ProductItemViewer | null>(null);
  const [completingChapterKey, setCompletingChapterKey] = useState<string | null>(null);
  const isPurchaseDialogOpen = location.pathname.endsWith("/purchase");
  const isMaxRouteOpen = isMaxRoutePathname(location.pathname);

  const pageSeoOverride = useMemo((): PageSeoOverride | null => {
    if (!product) {
      return null;
    }

    const plainDescription = product.description?.trim()
      ? htmlToPlainText(product.description)
      : t("seo.pages.productDetail.description", { title: product.title });
    const seoDescription = buildSeoDescription(plainDescription);
    const appUrl = resolveAppBaseUrl(API_CONFIG.APP_URL);
    const canonicalPath = `${APP_SHELL_ROUTES.products}/${product.id}`;

    return {
      title: isPurchaseDialogOpen ? `${product.title} — تکمیل خرید` : product.title,
      description: seoDescription,
      keywords: [product.title, ...product.tags, "Negin Heal", "دوره آموزشی"].join(", "),
      image: coverImageNetworkUrl ?? undefined,
      imageAlt: product.title,
      canonicalPath,
      ogType: "product",
      noIndex: isPurchaseDialogOpen || isMaxRouteOpen,
      jsonLd: [
        ...buildProductStructuredData({
          appUrl,
          canonicalUrl: resolveAbsoluteUrl(appUrl, canonicalPath),
          productId: product.id,
          title: product.title,
          description: seoDescription,
          imageUrl: coverImageNetworkUrl ?? undefined,
          keywords: product.tags.join(", "),
          isFree: product.isFree,
          priceIrt: displayPrice,
        }),
        ...buildBreadcrumbStructuredData({
          appUrl,
          items: [
            {
              name: t("app.pageTitles.products"),
              url: resolveAbsoluteUrl(appUrl, PRODUCTS_ROUTE_PATH),
            },
            {
              name: product.title,
              url: resolveAbsoluteUrl(appUrl, `${APP_SHELL_ROUTES.products}/${product.id}`),
            },
          ],
        }),
      ],
    };
  }, [product, coverImageNetworkUrl, displayPrice, isMaxRouteOpen, isPurchaseDialogOpen, t]);

  usePageSeoOverride(pageSeoOverride);

  const isUnlockRefetchingRef = useRef(false);
  const purchaseIntentHandledRef = useRef(false);
  const pendingSectionTabRef = useRef<ProductDetailSectionTab | null>(null);
  const pendingSectionTabClearTimerRef = useRef<number | null>(null);
  const pendingChapterNavigationRef = useRef<string | null>(null);
  const pendingChapterNavigationClearTimerRef = useRef<number | null>(null);

  const clearPendingSectionTab = useCallback((): void => {
    const tab = pendingSectionTabRef.current;
    pendingSectionTabRef.current = null;

    if (pendingSectionTabClearTimerRef.current != null) {
      window.clearTimeout(pendingSectionTabClearTimerRef.current);
      pendingSectionTabClearTimerRef.current = null;
    }

    if (tab) {
      setActiveSectionTab(tab);
    }
  }, []);

  const clearPendingChapterNavigation = useCallback((): void => {
    const chapterKey = pendingChapterNavigationRef.current;
    pendingChapterNavigationRef.current = null;

    if (pendingChapterNavigationClearTimerRef.current != null) {
      window.clearTimeout(pendingChapterNavigationClearTimerRef.current);
      pendingChapterNavigationClearTimerRef.current = null;
    }

    if (chapterKey) {
      setActiveChapterKey(chapterKey);
    }
  }, []);

  useEffect(() => {
    purchaseIntentHandledRef.current = false;
  }, [productId]);

  const redirectToLoginForPurchase = useCallback((): void => {
    if (!productId) {
      return;
    }

    const redirect = buildProductPostLoginRedirect(productId);
    setPostLoginRedirect(redirect);
    const loginPath = isMobileAppLayoutViewport()
      ? APP_SHELL_ROUTES.profileLogin
      : APP_SHELL_ROUTES.login;
    navigate(loginPath, { state: buildProductLoginReturnState(productId) });
  }, [productId, navigate]);

  const [completeChapter] = useMutation<
    ProductChapterCompleteMutation,
    ProductChapterCompleteMutationVariables
  >(PRODUCT_CHAPTER_COMPLETE_MUTATION);

  const handleChapterUnlockExpired = useCallback(() => {
    if (isUnlockRefetchingRef.current) {
      return;
    }

    isUnlockRefetchingRef.current = true;
    void refetchProductDetail().finally(() => {
      isUnlockRefetchingRef.current = false;
    });
  }, [refetchProductDetail]);

  useEffect(() => {
    if (purchaseIntentHandledRef.current) {
      return;
    }

    const locationState = location.state as { openProductPurchase?: boolean } | null;
    if (!locationState?.openProductPurchase) {
      return;
    }

    if (!isAuthenticated || loading || !product || canAccessProduct || hasPendingPurchase) {
      return;
    }

    purchaseIntentHandledRef.current = true;
    navigate(`${APP_SHELL_ROUTES.products}/${productId}/purchase`, { replace: true, state: null });
  }, [
    canAccessProduct,
    product,
    productId,
    hasPendingPurchase,
    isAuthenticated,
    loading,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);

  useEffect(() => {
    if (isAuthenticated || !isPurchaseDialogOpen || !productId) {
      return;
    }

    redirectToLoginForPurchase();
  }, [productId, isAuthenticated, isPurchaseDialogOpen, redirectToLoginForPurchase]);

  useEffect(() => {
    if (!product) {
      return;
    }

    if (focusChapterKey) {
      const chapterExists = product.chapters.some((chapter) => chapter.key === focusChapterKey);

      if (chapterExists) {
        setExpandedChapterKeys(new Set([focusChapterKey]));
        setActiveChapterKey(focusChapterKey);
        return;
      }
    }

    setExpandedChapterKeys(
      defaultExpandedChapterKey ? new Set([defaultExpandedChapterKey]) : new Set()
    );
    setActiveChapterKey(defaultExpandedChapterKey);
  }, [product, defaultExpandedChapterKey, focusChapterKey]);

  useEffect(() => {
    if (!focusChapterKey || !product?.chapters.some((chapter) => chapter.key === focusChapterKey)) {
      return;
    }

    pendingChapterNavigationRef.current = focusChapterKey;
    setActiveChapterKey(focusChapterKey);

    const frameId = window.requestAnimationFrame(() => {
      scrollToProductChapter(focusChapterKey);
    });

    const clearTimerId = window.setTimeout(() => {
      clearPendingChapterNavigation();
    }, 900);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(clearTimerId);
    };
  }, [clearPendingChapterNavigation, product, focusChapterKey, expandedChapterKeys]);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (!paymentStatus) {
      return;
    }

    const refId = searchParams.get("refId");
    const reason = searchParams.get("reason");

    if (paymentStatus === "success") {
      showSuccess(
        refId
          ? `پرداخت با موفقیت انجام شد. کد پیگیری: ${refId}`
          : "پرداخت با موفقیت انجام شد و دسترسی دوره فعال شد."
      );
      void refetchProductDetail();
    } else if (paymentStatus === "cancelled") {
      showWarning("پرداخت لغو شد.");
    } else {
      showError(resolveErrorMessageFromCode(reason || "ZARINPAL_VERIFICATION_FAILED"));
    }

    setSearchParams({}, { replace: true });
  }, [refetchProductDetail, searchParams, setSearchParams, showError, showSuccess, showWarning]);

  useEffect(() => {
    setIsMobilePriceBarVisible(false);

    if (!product || canAccessProduct || hasPendingPurchase) {
      return;
    }

    const purchaseCard = purchaseCardRef.current;
    if (!purchaseCard) {
      return;
    }

    const mobileMediaQuery = window.matchMedia("(max-width: 37.5rem)");
    const updatePinnedPriceBar = (): void => {
      if (!mobileMediaQuery.matches) {
        setIsMobilePriceBarVisible(false);
        return;
      }

      const rect = purchaseCard.getBoundingClientRect();
      // Only reveal after the purchase card has scrolled above the viewport, not when it is below the fold.
      setIsMobilePriceBarVisible(rect.bottom <= 0);
    };

    updatePinnedPriceBar();
    window.addEventListener("scroll", updatePinnedPriceBar, { passive: true });
    window.addEventListener("resize", updatePinnedPriceBar);
    mobileMediaQuery.addEventListener("change", updatePinnedPriceBar);

    return () => {
      window.removeEventListener("scroll", updatePinnedPriceBar);
      window.removeEventListener("resize", updatePinnedPriceBar);
      mobileMediaQuery.removeEventListener("change", updatePinnedPriceBar);
    };
  }, [canAccessProduct, product, hasPendingPurchase]);

  const handleSectionTabChange = useCallback(
    (tab: ProductDetailSectionTab): void => {
      pendingSectionTabRef.current = tab;
      setActiveSectionTab(tab);

      if (pendingSectionTabClearTimerRef.current != null) {
        window.clearTimeout(pendingSectionTabClearTimerRef.current);
      }

      scrollToProductDetailSection(tab);

      pendingSectionTabClearTimerRef.current = window.setTimeout(() => {
        clearPendingSectionTab();
      }, 900);
    },
    [clearPendingSectionTab]
  );

  useEffect(() => {
    const handleScrollEnd = (): void => {
      if (pendingSectionTabRef.current) {
        clearPendingSectionTab();
      }

      if (pendingChapterNavigationRef.current) {
        clearPendingChapterNavigation();
      }
    };

    window.addEventListener("scrollend", handleScrollEnd, { passive: true });

    return () => {
      window.removeEventListener("scrollend", handleScrollEnd);
    };
  }, [clearPendingChapterNavigation, clearPendingSectionTab]);

  useEffect(() => {
    if (!product) {
      return undefined;
    }

    const visibleTabs = PRODUCT_SECTION_TABS.map((tab) => tab.value);

    const syncActiveTabFromScroll = (): void => {
      if (pendingSectionTabRef.current) {
        return;
      }

      setActiveSectionTab(resolveProductDetailSectionFromScroll(visibleTabs));
    };

    syncActiveTabFromScroll();
    window.addEventListener("scroll", syncActiveTabFromScroll, { passive: true });
    window.addEventListener("resize", syncActiveTabFromScroll);

    return () => {
      window.removeEventListener("scroll", syncActiveTabFromScroll);
      window.removeEventListener("resize", syncActiveTabFromScroll);
    };
  }, [product]);

  useEffect(() => {
    if (!product || isSingleChapter || chapterKeys.length === 0) {
      return undefined;
    }

    const syncActiveChapterFromScroll = (): void => {
      if (pendingChapterNavigationRef.current) {
        return;
      }

      setActiveChapterKey(resolveActiveChapterKeyFromScroll(chapterKeys));
    };

    syncActiveChapterFromScroll();
    window.addEventListener("scroll", syncActiveChapterFromScroll, { passive: true });
    window.addEventListener("resize", syncActiveChapterFromScroll);

    return () => {
      window.removeEventListener("scroll", syncActiveChapterFromScroll);
      window.removeEventListener("resize", syncActiveChapterFromScroll);
    };
  }, [chapterKeys, product, isSingleChapter]);

  const handlePrimaryProductAction = (): void => {
    if (canAccessProduct) {
      document.getElementById("product-content")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (hasPendingPurchase) {
      return;
    }

    if (!isAuthenticated) {
      redirectToLoginForPurchase();
      return;
    }

    navigate(`${APP_SHELL_ROUTES.products}/${productId}/purchase`);
  };

  const toggleChapter = (chapterKey: string): void => {
    setExpandedChapterKeys((current) => {
      const next = new Set(current);
      if (next.has(chapterKey)) {
        next.delete(chapterKey);
      } else {
        next.add(chapterKey);
      }
      return next;
    });
  };

  const handleChapterNavigate = useCallback(
    (chapterKey: string): void => {
      pendingChapterNavigationRef.current = chapterKey;
      setActiveChapterKey(chapterKey);
      setExpandedChapterKeys((current) => {
        if (current.has(chapterKey)) {
          return current;
        }

        return new Set([...current, chapterKey]);
      });

      if (pendingChapterNavigationClearTimerRef.current != null) {
        window.clearTimeout(pendingChapterNavigationClearTimerRef.current);
      }

      scrollToProductChapter(chapterKey);

      pendingChapterNavigationClearTimerRef.current = window.setTimeout(() => {
        clearPendingChapterNavigation();
      }, 900);
    },
    [clearPendingChapterNavigation]
  );

  const closeItemViewer = (): void => {
    if (selectedItemViewer) {
      clearMaxRouteOwner(selectedItemViewer.previewId);
    }
    setSelectedItemViewer(null);
    navigate(buildCloseMaxRouteLocation(location.pathname, searchParams));
  };

  const openItemViewer = (viewer: ProductItemViewer): void => {
    setMaxRouteOwner(viewer.previewId);
    setSelectedItemViewer(viewer);
    navigate(buildMaxRouteLocation(location.pathname, searchParams));
  };

  useEffect(() => {
    if (!isMaxRouteOpen) {
      setSelectedItemViewer(null);
    }
  }, [isMaxRouteOpen]);

  const closePurchaseDialog = (): void => {
    if (!productId) {
      return;
    }
    navigate(`${APP_SHELL_ROUTES.products}/${productId}`);
  };

  const handlePurchaseSuccess = (): void => {
    closePurchaseDialog();
    void refetchProductDetail();
  };

  const canTrackChapterProgress = canAccessProduct && isAuthenticated && isPaidPurchase;
  const hasProductProgress = (product?.completedChapterCount ?? 0) > 0;

  const handleChapterComplete = async (chapterKey: string, chapterTitle: string): Promise<void> => {
    if (!productId || completingChapterKey) {
      return;
    }

    setCompletingChapterKey(chapterKey);
    try {
      const result = await completeChapter({
        variables: {
          input: {
            productId,
            chapterKey,
          },
        },
      });

      const completedCount = result.data?.productChapterComplete.completedChapterCount ?? 0;
      const accessibleCount = result.data?.productChapterComplete.accessibleChapterCount ?? 0;

      showSuccess(
        isSingleChapter || (accessibleCount > 0 && completedCount >= accessibleCount)
          ? isSingleChapter
            ? "محتوای دوره را با موفقیت به پایان رساندید!"
            : `فصل «${chapterTitle}» تکمیل شد. همه فصل‌های در دسترس را به پایان رساندید!`
          : `فصل «${chapterTitle}» با موفقیت تکمیل شد.`
      );
      await refetchProductDetail();
    } catch (error) {
      showErrorIfNotQueued(showError, error);
    } finally {
      setCompletingChapterKey(null);
    }
  };

  const handleGoToNextChapter = (nextChapterKey: string): void => {
    handleChapterNavigate(nextChapterKey);
  };

  if (!productId) {
    return (
      <Alert severity="error" className={styles.alert}>
        شناسه دوره معتبر نیست.
      </Alert>
    );
  }

  if (loading && !product) {
    return (
      <section className={styles.page}>
        <Skeleton variant="rounded" height={320} />
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={180} />
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className={styles.page}>
        <Alert
          severity="error"
          className={styles.alert}
          action={
            <Button color="inherit" size="small" onClick={() => void refetchProductDetail()}>
              تلاش دوباره
            </Button>
          }
        >
          دریافت جزئیات دوره با خطا مواجه شد.
        </Alert>
      </section>
    );
  }

  return (
    <section className={`${styles.page} ${styles.pageWithSectionTabs}`}>
      <ProductDetailSectionTabs
        activeTab={activeSectionTab}
        onChange={handleSectionTabChange}
        tabs={PRODUCT_SECTION_TABS}
      />

      <Paper
        id="product-intro"
        className={`${styles.hero} ${styles.sectionScrollTarget}`}
        elevation={0}
      >
        <div className={styles.heroBackNav}>
          <PageBackNavigation
            label="بازگشت به دوره‌ها"
            fallbackTo={PRODUCTS_ROUTE_PATH}
            mobileOverlay
          />
        </div>

        <div className={styles.heroMedia}>
          {coverImageUrl ? (
            <CachedFileImage
              accessUrl={product?.coverImageAccessUrl}
              networkUrl={coverImageNetworkUrl}
              alt={product.title}
              className={styles.heroCoverImage}
            />
          ) : (
            <>
              <div className={styles.heroGlow} />
              <AutoStoriesRoundedIcon className={styles.heroIcon} />
            </>
          )}
          <div className={styles.heroStats}>
            <span>
              {isSingleChapter
                ? `${totalItems.toLocaleString("fa-IR")} آیتم`
                : `${product.chapters.length.toLocaleString("fa-IR")} فصل / ${totalItems.toLocaleString("fa-IR")} آیتم`}
            </span>
          </div>
        </div>

        <div className={styles.heroBody}>
          <div className={styles.kickerRow}>
            <Chip
              size="small"
              variant="outlined"
              label={product.releaseType === "GRADUAL" ? "انتشار تدریجی" : "انتشار فوری"}
            />
          </div>

          <h1>{product.title}</h1>
          {product.description?.trim() ? <p>{product.description.trim()}</p> : null}

          {product.tags.length > 0 ? (
            <div className={styles.tags}>
              {product.tags.map((tag) => (
                <Chip key={tag} size="small" label={tag} variant="outlined" />
              ))}
            </div>
          ) : null}
        </div>

        <aside ref={purchaseCardRef} className={styles.purchaseCard}>
          {shouldShowPrice ? (
            <>
              {!product.isFree ? <span className={styles.purchaseEyebrow}>قیمت دوره</span> : null}
              <strong className={styles.currentPrice}>
                {product.isFree ? "دسترسی رایگان" : formatProductPrice(displayPrice)}
              </strong>
            </>
          ) : (
            <Typography variant="body2" color="success.main" fontWeight={800}>
              شما این دوره را خریده‌اید.
            </Typography>
          )}
          {shouldShowPrice && discountedPrice != null ? (
            <div className={styles.discountLine}>
              <span className={styles.originalPrice}>{formatProductPrice(product.priceIrt)}</span>
              {discountLabel ? <span className={styles.discountBadge}>{discountLabel}</span> : null}
            </div>
          ) : null}
          <Button
            variant="contained"
            size="large"
            startIcon={canAccessProduct ? <PlayCircleRoundedIcon /> : <ShoppingCartRoundedIcon />}
            onClick={handlePrimaryProductAction}
            disabled={hasPendingPurchase}
          >
            {canAccessProduct
              ? hasProductProgress
                ? "ادامه دوره"
                : "شروع دوره"
              : hasPendingManualReview
                ? "در انتظار تایید پرداخت"
                : "خرید دوره"}
          </Button>
          {hasPendingManualReview ? (
            <Typography variant="caption" color="text.secondary">
              درخواست پرداخت شما ثبت شده و در حال بررسی است. پس از تایید، دسترسی دوره فعال می‌شود.
            </Typography>
          ) : !canAccessProduct ? (
            <Typography variant="caption" color="text.secondary">
              {purchaseCardAccessCaption}
            </Typography>
          ) : hasGradualLockedChapters ? (
            <Typography variant="caption" color="text.secondary">
              {isSingleChapter
                ? "محتوای دوره طبق زمان‌بندی انتشار تدریجی به‌تدریج باز می‌شود."
                : "برخی فصل‌ها طبق زمان‌بندی انتشار تدریجی به‌تدریج باز می‌شوند."}
            </Typography>
          ) : null}
        </aside>
      </Paper>

      {shouldShowMobilePinnedPriceBar ? (
        <div
          className={`${styles.mobilePinnedPriceBar}${
            isMobilePriceBarVisible ? ` ${styles.mobilePinnedPriceBarVisible}` : ""
          }`}
          data-opaque-shell
          aria-hidden={!isMobilePriceBarVisible}
        >
          <div className={styles.mobilePinnedPriceInfo}>
            <span>{product.isFree ? "دسترسی رایگان" : "قیمت دوره"}</span>
            <div className={styles.mobilePinnedPriceLine}>
              <strong>{formatProductPrice(displayPrice)}</strong>
              {discountedPrice != null ? (
                discountLabel ? (
                  <span className={styles.mobilePinnedDiscountBadge}>{discountLabel}</span>
                ) : null
              ) : null}
            </div>
          </div>
          <Button
            size="small"
            variant="contained"
            startIcon={<ShoppingCartRoundedIcon />}
            tabIndex={isMobilePriceBarVisible ? undefined : -1}
            onClick={handlePrimaryProductAction}
          >
            خرید
          </Button>
        </div>
      ) : null}

      <div id="product-content" className={`${styles.contentLayout} ${styles.sectionScrollTarget}`}>
        <div className={styles.contentHeader}>
          <div>
            <h2>{isSingleChapter ? "محتوای دوره" : "مسیر یادگیری دوره"}</h2>
            <p>
              {productContentIntroText}
              {productContentAccessNoteText}
            </p>
          </div>
          {loading ? <CircularProgress size={22} /> : null}
        </div>

        <div
          className={`${styles.chapterList}${isSingleChapter ? ` ${styles.chapterListSingle}` : ""}`}
        >
          {product.chapters.map((chapter, chapterIndex) => {
            const isExpanded = isSingleChapter || expandedChapterKeys.has(chapter.key);
            const isGradualLock = isGradualChapterLock(chapter);
            const chapterItems = chapter.items ?? [];
            const isActiveChapter = !isSingleChapter && activeChapterKey === chapter.key;
            const isReachedChapter =
              !isSingleChapter &&
              activeChapterKey != null &&
              chapterKeys.indexOf(activeChapterKey) >= chapterIndex;
            const nextUnlockedChapter = product.chapters
              .slice(chapterIndex + 1)
              .find((entry) => !entry.isLocked);
            const showChapterCompletion = canTrackChapterProgress && !chapter.isLocked;

            return (
              <Paper
                key={chapter.key}
                id={`product-chapter-${chapter.key}`}
                className={[
                  styles.chapterCard,
                  isSingleChapter ? styles.chapterCardSingle : "",
                  chapter.isLocked ? styles.chapterLocked : "",
                  chapter.isCompleted ? styles.chapterCompleted : "",
                  isActiveChapter ? styles.chapterCardActive : "",
                  isReachedChapter ? styles.chapterCardReached : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                elevation={0}
              >
                {!isSingleChapter ? (
                  <button
                    type="button"
                    className={[
                      styles.chapterPathButton,
                      isReachedChapter ? styles.chapterPathButtonReached : "",
                      isActiveChapter ? styles.chapterPathButtonActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-label={`رفتن به ابتدای فصل ${chapter.title}`}
                    aria-current={isActiveChapter ? "step" : undefined}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleChapterNavigate(chapter.key);
                    }}
                  />
                ) : null}
                {isSingleChapter ? (
                  <div className={styles.chapterHeaderStatic}>
                    <span className={styles.chapterTitleBlock}>
                      {chapter.title.trim() ? (
                        <span className={styles.chapterTitle}>{chapter.title}</span>
                      ) : null}
                    </span>
                    <span className={styles.chapterMeta}>
                      {chapter.isLocked ? (
                        <Chip
                          size="small"
                          icon={<LockRoundedIcon />}
                          label={isGradualLock ? "زمان‌بندی‌شده" : "قفل"}
                          variant="outlined"
                          className={styles.chapterLockChip}
                        />
                      ) : chapter.isCompleted ? (
                        <Chip
                          size="small"
                          icon={<CheckCircleRoundedIcon />}
                          label="تکمیل‌شده"
                          color="success"
                          variant="filled"
                          className={styles.chapterCompletedChip}
                        />
                      ) : chapter.isFree ? (
                        <Chip
                          size="small"
                          icon={<CardGiftcardRoundedIcon />}
                          label="رایگان"
                          color="success"
                          variant="filled"
                        />
                      ) : null}
                    </span>
                    {chapter.description?.trim() ? (
                      <span className={styles.chapterDescription}>
                        {chapter.description.trim()}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className={styles.chapterHeader}>
                    <span
                      className={[
                        styles.chapterStep,
                        chapter.isCompleted ? styles.chapterStepCompleted : "",
                        isActiveChapter ? styles.chapterStepActive : "",
                        isReachedChapter ? styles.chapterStepReached : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <button
                        type="button"
                        className={styles.chapterStepButton}
                        aria-label={`رفتن به ابتدای فصل ${chapter.title}`}
                        aria-current={isActiveChapter ? "step" : undefined}
                        onClick={() => handleChapterNavigate(chapter.key)}
                      >
                        <span className={styles.chapterNumber}>
                          {(chapterIndex + 1).toLocaleString("fa-IR")}
                        </span>
                      </button>
                      {chapter.isCompleted ? (
                        <span className={styles.chapterStepTick} aria-label="تکمیل شده">
                          <CheckRoundedIcon />
                        </span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      className={styles.chapterHeaderToggle}
                      onClick={() => toggleChapter(chapter.key)}
                      aria-expanded={isExpanded}
                      aria-controls={`chapter-panel-${chapter.key}`}
                    >
                      <span className={styles.chapterTitleBlock}>
                        <span className={styles.chapterTitle}>{chapter.title}</span>
                      </span>
                      <span className={styles.chapterMeta}>
                        {chapter.isLocked ? (
                          <Chip
                            size="small"
                            icon={<LockRoundedIcon />}
                            label={isGradualLock ? "زمان‌بندی‌شده" : "قفل"}
                            variant="outlined"
                            className={styles.chapterLockChip}
                          />
                        ) : chapter.isCompleted ? (
                          <Chip
                            size="small"
                            icon={<CheckCircleRoundedIcon />}
                            label="تکمیل‌شده"
                            color="success"
                            variant="filled"
                            className={styles.chapterCompletedChip}
                          />
                        ) : chapter.isFree ? (
                          <Chip
                            size="small"
                            icon={<CardGiftcardRoundedIcon />}
                            label="رایگان"
                            color="success"
                            variant="filled"
                          />
                        ) : null}
                        <ExpandMoreRoundedIcon
                          className={`${styles.expandIcon}${isExpanded ? ` ${styles.expandIconOpen}` : ""}`}
                        />
                      </span>
                      {chapter.description?.trim() ? (
                        <span className={styles.chapterDescription}>
                          {chapter.description.trim()}
                        </span>
                      ) : null}
                    </button>
                  </div>
                )}

                <Collapse in={isExpanded} timeout="auto" unmountOnExit={!isSingleChapter}>
                  <div id={`chapter-panel-${chapter.key}`} className={styles.chapterPanel}>
                    {chapter.isLocked ? (
                      <div
                        className={`${styles.lockedNotice}${
                          isGradualLock ? ` ${styles.gradualLockedNotice}` : ""
                        }`}
                      >
                        {isGradualLock ? (
                          <ChapterUnlockNotice
                            unlocksAt={chapter.unlocksAt}
                            fallbackMessage={
                              isSingleChapter
                                ? "محتوای دوره طبق زمان‌بندی انتشار تدریجی به‌زودی قابل مشاهده خواهد بود."
                                : "این فصل طبق زمان‌بندی انتشار تدریجی به‌زودی قابل مشاهده خواهد بود."
                            }
                            isSingleChapter={isSingleChapter}
                            onExpired={handleChapterUnlockExpired}
                          />
                        ) : (
                          <>
                            <LockRoundedIcon />
                            <span>
                              {isSingleChapter
                                ? "برای مشاهده آیتم‌های دوره، آن را خریداری کنید."
                                : "برای مشاهده آیتم‌های این فصل، دوره را خریداری کنید."}
                            </span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className={styles.itemList}>
                        {chapterItems.length === 0 ? (
                          <p className={styles.emptyItems}>
                            {isSingleChapter
                              ? "آیتمی برای این دوره ثبت نشده است."
                              : "آیتمی برای این فصل ثبت نشده است."}
                          </p>
                        ) : (
                          chapterItems.map((item, itemIndex) => (
                            <article
                              key={`${chapter.key}-${item.title}-${itemIndex}`}
                              className={styles.itemCard}
                            >
                              <div className={styles.itemMarker}>
                                <div className={styles.itemIcon}>{ITEM_TYPE_ICON[item.type]}</div>
                              </div>
                              <div className={styles.itemBody}>
                                <div className={styles.itemTitleRow}>
                                  <h4>{item.title}</h4>
                                </div>
                              </div>
                              <div className={styles.itemContent}>
                                <ProductItemContent
                                  item={item}
                                  chapterKey={chapter.key}
                                  itemIndex={itemIndex}
                                  onOpenArticle={openItemViewer}
                                />
                              </div>
                            </article>
                          ))
                        )}
                        {showChapterCompletion ? (
                          <ChapterCompletionCheckpoint
                            chapterTitle={chapter.title}
                            isCompleted={chapter.isCompleted}
                            canComplete={showChapterCompletion}
                            isSubmitting={completingChapterKey === chapter.key}
                            hasNextChapter={Boolean(nextUnlockedChapter)}
                            isSingleChapter={isSingleChapter}
                            onConfirm={() => void handleChapterComplete(chapter.key, chapter.title)}
                            onGoToNextChapter={
                              nextUnlockedChapter
                                ? () => handleGoToNextChapter(nextUnlockedChapter.key)
                                : undefined
                            }
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                </Collapse>
              </Paper>
            );
          })}
        </div>
      </div>

      <div className={styles.sectionContentSeparator} role="separator" aria-hidden="true" />

      <section
        id="product-reviews"
        className={`${styles.reviewsSection} ${styles.sectionScrollTarget}${
          isReviewsSectionHiddenForEndUser ? ` ${styles.reviewsSectionDisabled}` : ""
        }`}
        aria-labelledby="product-reviews-heading"
      >
        <div className={styles.reviewsHeader}>
          <h2 id="product-reviews-heading">امتیاز و نظرات</h2>
          <p>امتیاز شرکت‌کنندگان و تجربه واقعی استفاده از دوره</p>
        </div>

        {productId ? (
          <ProductReviewsSection
            productId={productId}
            reviewList={reviewList}
            isFree={product.isFree}
            isReviewsSectionVisible={product.isReviewsSectionVisible !== false}
            isReviewSubmissionEnabled={product.isReviewSubmissionEnabled !== false}
            canSubmitReview={resolveCanSubmitProductReview({
              isAuthenticated,
              isFree: product?.isFree,
              isPurchased: product?.isPurchased,
              purchaseStatus: product?.purchaseStatus,
              roles: user?.roles,
              isReviewsSectionVisible: product?.isReviewsSectionVisible,
              isReviewSubmissionEnabled: product?.isReviewSubmissionEnabled,
            })}
          />
        ) : null}
      </section>

      <EntityModalShell
        open={isMaxRouteOpen && selectedItemViewer != null}
        onClose={closeItemViewer}
        title={selectedItemViewer?.title ?? "نمایش محتوا"}
        subtitle="نمایش کامل محتوای درس"
        maxWidth="lg"
        disableAutoFocus
        disableRestoreFocus
        showVisibleScrollbar
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: closeItemViewer,
              },
            ]}
          />
        }
      >
        {selectedItemViewer?.article ? (
          <div
            className={`${richTextStyles.renderDialogContent} ${richTextStyles.renderDialogContentMax}`}
            dir="rtl"
            dangerouslySetInnerHTML={{
              __html: applyBlankTargetToRichTextLinks(selectedItemViewer.article),
            }}
          />
        ) : null}
      </EntityModalShell>

      <ProductPurchaseDialog
        open={isPurchaseDialogOpen}
        onClose={closePurchaseDialog}
        onPurchaseSuccess={handlePurchaseSuccess}
        product={product}
        displayPrice={displayPrice}
        originalPrice={product.priceIrt}
        discountLabel={discountLabel}
        coverImageUrl={coverImageUrl}
      />
    </section>
  );
};

export default ProductDetail;
