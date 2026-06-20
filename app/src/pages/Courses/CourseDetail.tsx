import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
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
import { CHAPTER_UNLOCK_COUNTDOWN_THRESHOLD_MS } from "../../constants/course.constants";
import { useAuth } from "../../contexts/AuthContext";
import { isMobileAppLayoutViewport } from "../../hooks/useMobileAppLayout";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import { setPostLoginRedirect } from "../../routing/post-login-redirect";
import { resolveFileAccessUrl } from "../../utils/fileAccessUrl.util";
import { USER_COURSE_DETAIL_QUERY } from "../../graphql/queries/userCourseDetail.query";
import { COURSE_CHAPTER_COMPLETE_MUTATION } from "../../graphql/mutations/courseChapterComplete.mutation";
import { useSnackbar } from "../../hooks/useSnackbar";
import EntityModalShell from "../../shared/crud/EntityModalShell";
import ModalFooterActions from "../../shared/crud/ModalFooterActions";
import {
  ChapterCompletionCheckpoint,
  CourseProgressSummary,
} from "./ChapterCompletionCheckpoint";
import { CoursePurchaseDialog } from "./CoursePurchaseDialog";
import {
  formatChapterUnlockCountdown,
  formatChapterUnlockRelativeMessage,
  formatCoursePrice,
  getChapterUnlockRemainingMs,
  getDiscountedPrice,
  isGradualChapterLock,
  shouldShowChapterUnlockCountdown,
  type CourseDetailItem,
  type CourseChapterCompleteMutation,
  type CourseChapterCompleteMutationVariables,
  type UserCourseDetailQuery,
  type UserCourseDetailQueryVariables,
} from "./course-detail.api";
import type { CourseItemType } from "./courses-list.api";
import styles from "./styles/CourseDetail.module.scss";

const ITEM_TYPE_ICON: Record<CourseItemType, ReactElement> = {
  ARTICLE: <AutoStoriesRoundedIcon fontSize="small" />,
  VIDEO: <OndemandVideoRoundedIcon fontSize="small" />,
  VOICE: <VolumeUpRoundedIcon fontSize="small" />,
  IMAGE: <PhotoRoundedIcon fontSize="small" />,
};

type CourseMediaViewer = {
  readonly slug: string;
  readonly title: string;
  readonly type: Exclude<CourseItemType, "ARTICLE">;
  readonly url: string;
};

function buildMediaSlug(title: string): string {
  return encodeURIComponent(title.trim());
}

function CourseItemContent({
  item,
  onOpenMedia,
}: {
  readonly item: CourseDetailItem;
  readonly onOpenMedia: (media: CourseMediaViewer) => void;
}): ReactElement | null {
  if (item.type === "ARTICLE" && item.article?.trim()) {
    return <p className={styles.articlePreview}>{item.article.trim()}</p>;
  }

  const fileUrl = resolveFileAccessUrl(item.fileAccessUrl);
  if (!fileUrl) {
    return null;
  }

  if (item.type === "IMAGE") {
    return (
      <img
        src={fileUrl}
        alt={item.title}
        className={styles.itemImage}
        loading="lazy"
        onClick={() =>
          onOpenMedia({
            slug: buildMediaSlug(item.title),
            title: item.title,
            type: "IMAGE",
            url: fileUrl,
          })
        }
      />
    );
  }

  if (item.type === "VIDEO") {
    return (
      <video
        className={styles.itemVideo}
        src={fileUrl}
        controls
        preload="metadata"
        onClick={() =>
          onOpenMedia({
            slug: buildMediaSlug(item.title),
            title: item.title,
            type: "VIDEO",
            url: fileUrl,
          })
        }
      >
        مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
      </video>
    );
  }

  if (item.type === "VOICE") {
    return (
      <audio
        className={styles.itemAudio}
        src={fileUrl}
        controls
        preload="metadata"
        onClick={() =>
          onOpenMedia({
            slug: buildMediaSlug(item.title),
            title: item.title,
            type: "VOICE",
            url: fileUrl,
          })
        }
      >
        مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
      </audio>
    );
  }

  return null;
}

function ChapterUnlockNotice({
  unlocksAt,
  fallbackMessage,
  onExpired,
}: {
  readonly unlocksAt?: string | null;
  readonly fallbackMessage: string;
  readonly onExpired: () => void;
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
      timeoutId = window.setTimeout(
        startTicker,
        remaining - CHAPTER_UNLOCK_COUNTDOWN_THRESHOLD_MS,
      );
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
            این فصل به‌زودی قابل مشاهده خواهد بود.
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

const CourseDetail = (): ReactElement => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusChapterKey = searchParams.get("chapter")?.trim() || null;
  const { isAuthenticated } = useAuth();
  const { showError, showSuccess, showWarning } = useSnackbar();
  const purchaseCardRef = useRef<HTMLElement | null>(null);
  const { data, loading, error, refetch } = useQuery<
    UserCourseDetailQuery,
    UserCourseDetailQueryVariables
  >(USER_COURSE_DETAIL_QUERY, {
    variables: { input: { id: courseId || "" } },
    skip: !courseId,
    fetchPolicy: "network-only",
  });

  const course = data?.course;
  const coverImageUrl = resolveFileAccessUrl(course?.coverImageAccessUrl);
  const discountedPrice = course
    ? getDiscountedPrice(course.priceIrt, course.discount)
    : null;
  const displayPrice = discountedPrice ?? course?.priceIrt ?? null;
  const discountLabel =
    course?.discount && discountedPrice != null
      ? course.discount.type === "PERCENTAGE"
        ? `${Math.min(course.discount.value, 100).toLocaleString("fa-IR")}٪ تخفیف`
        : `${formatCoursePrice(course.discount.value)} تخفیف`
      : null;
  const isPaidPurchase = course?.purchaseStatus === "PAID" || course?.isPurchased === true;
  const hasPendingPurchase = course?.isFree !== true && course?.purchaseStatus === "PENDING";
  const canAccessCourse = course?.isFree === true || isPaidPurchase;
  const shouldShowPrice = !isPaidPurchase;
  const shouldShowMobilePinnedPriceBar = !canAccessCourse && !hasPendingPurchase;
  const totalItems =
    course?.chapters.reduce((sum, chapter) => sum + (chapter.items?.length ?? 0), 0) ?? 0;
  const defaultExpandedChapterKey = useMemo(() => {
    if (!course?.chapters.length) {
      return null;
    }

    if (course.isPurchased) {
      const lastUnlockedChapter = [...course.chapters]
        .reverse()
        .find((chapter) => !chapter.isLocked);
      return lastUnlockedChapter?.key ?? course.chapters[0]?.key ?? null;
    }

    return course.chapters[0]?.key ?? null;
  }, [course]);
  const hasGradualLockedChapters =
    course?.releaseType === "GRADUAL" &&
    course.chapters.some((chapter) => isGradualChapterLock(chapter));
  const [expandedChapterKeys, setExpandedChapterKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [isMobilePriceBarVisible, setIsMobilePriceBarVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<CourseMediaViewer | null>(null);
  const [completingChapterKey, setCompletingChapterKey] = useState<string | null>(null);
  const isPurchaseDialogOpen = location.pathname.endsWith("/purchase");
  const mediaRouteMatch = /^\/courses\/[^/]+\/view\/(.+)$/.exec(location.pathname);
  const mediaSlugFromRoute = mediaRouteMatch?.[1] ? decodeURIComponent(mediaRouteMatch[1]) : null;
  const isUnlockRefetchingRef = useRef(false);
  const purchaseIntentHandledRef = useRef(false);

  useEffect(() => {
    purchaseIntentHandledRef.current = false;
  }, [courseId]);

  const [completeChapter] = useMutation<
    CourseChapterCompleteMutation,
    CourseChapterCompleteMutationVariables
  >(COURSE_CHAPTER_COMPLETE_MUTATION);

  const handleChapterUnlockExpired = useCallback(() => {
    if (isUnlockRefetchingRef.current) {
      return;
    }

    isUnlockRefetchingRef.current = true;
    void refetch().finally(() => {
      isUnlockRefetchingRef.current = false;
    });
  }, [refetch]);

  useEffect(() => {
    if (purchaseIntentHandledRef.current) {
      return;
    }

    const locationState = location.state as { openCoursePurchase?: boolean } | null;
    if (!locationState?.openCoursePurchase) {
      return;
    }

    if (!isAuthenticated || loading || !course || canAccessCourse || hasPendingPurchase) {
      return;
    }

    purchaseIntentHandledRef.current = true;
    navigate(`${APP_SHELL_ROUTES.courses}/${courseId}/purchase`, { replace: true });
  }, [
    canAccessCourse,
    course,
    hasPendingPurchase,
    isAuthenticated,
    loading,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);

  useEffect(() => {
    if (!course) {
      return;
    }

    if (focusChapterKey) {
      const chapterExists = course.chapters.some(
        (chapter) => chapter.key === focusChapterKey,
      );

      if (chapterExists) {
        setExpandedChapterKeys(new Set([focusChapterKey]));
        return;
      }
    }

    setExpandedChapterKeys(
      defaultExpandedChapterKey ? new Set([defaultExpandedChapterKey]) : new Set(),
    );
  }, [course, defaultExpandedChapterKey, focusChapterKey]);

  useEffect(() => {
    if (!focusChapterKey || !course?.chapters.some((chapter) => chapter.key === focusChapterKey)) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(`course-chapter-${focusChapterKey}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [course, focusChapterKey, expandedChapterKeys]);

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
          : "پرداخت با موفقیت انجام شد و دسترسی دوره فعال شد.",
      );
      void refetch();
    } else if (paymentStatus === "cancelled") {
      showWarning("پرداخت لغو شد.");
    } else {
      showError(reason ? `پرداخت ناموفق بود: ${reason}` : "پرداخت ناموفق بود.");
    }

    setSearchParams({}, { replace: true });
  }, [refetch, searchParams, setSearchParams, showError, showSuccess, showWarning]);

  useEffect(() => {
    setIsMobilePriceBarVisible(false);

    if (!course || canAccessCourse || hasPendingPurchase) {
      return;
    }

    let animationFrameId = 0;
    const mobileMediaQuery = window.matchMedia("(max-width: 37.5rem)");

    const updatePinnedPriceBar = (): void => {
      const purchaseCard = purchaseCardRef.current;
      if (!purchaseCard || !mobileMediaQuery.matches) {
        setIsMobilePriceBarVisible(false);
        return;
      }

      setIsMobilePriceBarVisible(purchaseCard.getBoundingClientRect().bottom <= 0);
    };

    const requestPinnedPriceBarUpdate = (): void => {
      if (animationFrameId) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = 0;
        updatePinnedPriceBar();
      });
    };

    updatePinnedPriceBar();
    window.addEventListener("scroll", requestPinnedPriceBarUpdate, { passive: true });
    window.addEventListener("resize", requestPinnedPriceBarUpdate);
    mobileMediaQuery.addEventListener("change", updatePinnedPriceBar);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener("scroll", requestPinnedPriceBarUpdate);
      window.removeEventListener("resize", requestPinnedPriceBarUpdate);
      mobileMediaQuery.removeEventListener("change", updatePinnedPriceBar);
    };
  }, [canAccessCourse, course, hasPendingPurchase]);

  const handlePrimaryCourseAction = (): void => {
    if (canAccessCourse) {
      document.getElementById("course-content")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (hasPendingPurchase) {
      return;
    }

    if (!isAuthenticated) {
      const coursePath = `${APP_SHELL_ROUTES.courses}/${courseId}`;
      setPostLoginRedirect({ pathname: coursePath, openCoursePurchase: true });
      const loginPath = isMobileAppLayoutViewport()
        ? APP_SHELL_ROUTES.profileLogin
        : APP_SHELL_ROUTES.login;
      navigate(loginPath, { state: { from: coursePath } });
      return;
    }

    navigate(`${APP_SHELL_ROUTES.courses}/${courseId}/purchase`);
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

  const closeMediaViewer = (): void => {
    if (!courseId) {
      return;
    }
    setSelectedMedia(null);
    navigate(`${APP_SHELL_ROUTES.courses}/${courseId}`);
  };

  const openMediaViewer = (media: CourseMediaViewer): void => {
    if (!courseId) {
      return;
    }
    setSelectedMedia(media);
    navigate(`${APP_SHELL_ROUTES.courses}/${courseId}/view/${media.slug}`);
  };

  useEffect(() => {
    if (!course || !mediaSlugFromRoute) {
      if (!mediaSlugFromRoute) {
        setSelectedMedia(null);
      }
      return;
    }

    if (selectedMedia?.slug === mediaSlugFromRoute) {
      return;
    }

    for (const chapter of course.chapters) {
      for (const item of chapter.items ?? []) {
        if (item.type === "ARTICLE" || buildMediaSlug(item.title) !== mediaSlugFromRoute) {
          continue;
        }
        const fileUrl = resolveFileAccessUrl(item.fileAccessUrl);
        if (!fileUrl || item.type === "ARTICLE") {
          continue;
        }
        setSelectedMedia({
          slug: mediaSlugFromRoute,
          title: item.title,
          type: item.type,
          url: fileUrl,
        });
        return;
      }
    }
  }, [course, mediaSlugFromRoute, selectedMedia?.slug]);

  const closePurchaseDialog = (): void => {
    if (!courseId) {
      return;
    }
    navigate(`${APP_SHELL_ROUTES.courses}/${courseId}`);
  };

  const handlePurchaseSuccess = (): void => {
    closePurchaseDialog();
    void refetch();
  };

  const canTrackChapterProgress = canAccessCourse && isAuthenticated && isPaidPurchase;

  const handleChapterComplete = async (chapterKey: string, chapterTitle: string): Promise<void> => {
    if (!courseId || completingChapterKey) {
      return;
    }

    setCompletingChapterKey(chapterKey);
    try {
      const result = await completeChapter({
        variables: {
          input: {
            courseId,
            chapterKey,
          },
        },
      });

      const completedCount = result.data?.courseChapterComplete.completedChapterCount ?? 0;
      const accessibleCount =
        result.data?.courseChapterComplete.accessibleChapterCount ?? 0;

      showSuccess(
        accessibleCount > 0 && completedCount >= accessibleCount
          ? `فصل «${chapterTitle}» تکمیل شد. همه فصل‌های در دسترس را به پایان رساندید!`
          : `فصل «${chapterTitle}» با موفقیت تکمیل شد.`,
      );
      await refetch();
    } catch {
      showError("ثبت تکمیل فصل انجام نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setCompletingChapterKey(null);
    }
  };

  const handleGoToNextChapter = (nextChapterKey: string): void => {
    setExpandedChapterKeys(new Set([nextChapterKey]));
    window.requestAnimationFrame(() => {
      document.getElementById(`course-chapter-${nextChapterKey}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  if (!courseId) {
    return (
      <Alert severity="error" className={styles.alert}>
        شناسه دوره معتبر نیست.
      </Alert>
    );
  }

  if (loading && !course) {
    return (
      <section className={styles.page}>
        <Skeleton variant="rounded" height={320} />
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={180} />
      </section>
    );
  }

  if (error || !course) {
    return (
      <section className={styles.page}>
        <Alert
          severity="error"
          className={styles.alert}
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
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
    <section className={styles.page}>
      <div className={styles.topBar}>
        <Button
          component={RouterLink}
          to="/courses"
          variant="text"
          startIcon={<ArrowBackRoundedIcon />}
        >
          بازگشت به دوره‌ها
        </Button>
      </div>
      <IconButton
        component={RouterLink}
        to="/courses"
        className={styles.mobileTopBackButton}
        aria-label="بازگشت به دوره‌ها"
      >
        <ArrowBackRoundedIcon />
      </IconButton>

      <Paper className={styles.hero} elevation={0}>
        <div className={styles.heroMedia}>
          {coverImageUrl ? (
            <img src={coverImageUrl} alt={course.title} className={styles.heroCoverImage} />
          ) : (
            <>
              <div className={styles.heroGlow} />
              <AutoStoriesRoundedIcon className={styles.heroIcon} />
            </>
          )}
          <div className={styles.heroStats}>
            <span>
              {course.chapters.length.toLocaleString("fa-IR")} فصل /{" "}
              {totalItems.toLocaleString("fa-IR")} آیتم
            </span>
          </div>
        </div>

        <div className={styles.heroBody}>
          <div className={styles.kickerRow}>
            <Chip
              size="small"
              variant="outlined"
              label={course.releaseType === "GRADUAL" ? "انتشار تدریجی" : "انتشار فوری"}
            />
          </div>

          <h1>{course.title}</h1>
          {course.description?.trim() ? <p>{course.description.trim()}</p> : null}

          {course.tags.length > 0 ? (
            <div className={styles.tags}>
              {course.tags.map((tag) => (
                <Chip key={tag} size="small" label={tag} variant="outlined" />
              ))}
            </div>
          ) : null}
        </div>

        <aside ref={purchaseCardRef} className={styles.purchaseCard}>
          {shouldShowPrice ? (
            <>
              {!course.isFree ? <span className={styles.purchaseEyebrow}>قیمت دوره</span> : null}
              <strong className={styles.currentPrice}>
                {course.isFree ? "دسترسی رایگان" : formatCoursePrice(displayPrice)}
              </strong>
            </>
          ) : (
            <Typography variant="body2" color="success.main" fontWeight={800}>
              شما این دوره را خریده‌اید.
            </Typography>
          )}
          {shouldShowPrice && discountedPrice != null ? (
            <div className={styles.discountLine}>
              <span className={styles.originalPrice}>{formatCoursePrice(course.priceIrt)}</span>
              {discountLabel ? <span className={styles.discountBadge}>{discountLabel}</span> : null}
            </div>
          ) : null}
          <Button
            variant="contained"
            size="large"
            startIcon={canAccessCourse ? <PlayCircleRoundedIcon /> : <ShoppingCartRoundedIcon />}
            onClick={handlePrimaryCourseAction}
            disabled={hasPendingPurchase}
          >
            {canAccessCourse ? "شروع دوره" : hasPendingPurchase ? "در انتظار تایید پرداخت" : "خرید دوره"}
          </Button>
          {hasPendingPurchase ? (
            <Typography variant="caption" color="text.secondary">
              درخواست پرداخت شما ثبت شده و در حال بررسی است. پس از تایید، دسترسی دوره فعال می‌شود.
            </Typography>
          ) : !canAccessCourse ? (
            <Typography variant="caption" color="text.secondary">
              بعد از خرید، فصل‌ها و آیتم‌های دوره طبق زمان‌بندی انتشار در دسترس قرار می‌گیرند.
            </Typography>
          ) : hasGradualLockedChapters ? (
            <Typography variant="caption" color="text.secondary">
              برخی فصل‌ها طبق زمان‌بندی انتشار تدریجی به‌تدریج باز می‌شوند.
            </Typography>
          ) : null}
        </aside>
      </Paper>

      {shouldShowMobilePinnedPriceBar ? (
        <div
          className={`${styles.mobilePinnedPriceBar}${
            isMobilePriceBarVisible ? ` ${styles.mobilePinnedPriceBarVisible}` : ""
          }`}
          aria-hidden={!isMobilePriceBarVisible}
        >
          <div className={styles.mobilePinnedPriceInfo}>
            <span>{course.isFree ? "دسترسی رایگان" : "قیمت دوره"}</span>
            <div className={styles.mobilePinnedPriceLine}>
              <strong>{formatCoursePrice(displayPrice)}</strong>
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
            onClick={handlePrimaryCourseAction}
          >
            خرید
          </Button>
        </div>
      ) : null}

      <div id="course-content" className={styles.contentLayout}>
        <div className={styles.contentHeader}>
          <div>
            <h2>مسیر یادگیری دوره</h2>
            <p>
              فصل‌ها را به ترتیب جلو ببرید.
              {course.releaseType === "GRADUAL"
                ? " فصل‌های زمان‌بندی‌شده پس از خرید، در زمان مقرر باز می‌شوند."
                : " فصل‌های قفل‌شده بعد از خرید دوره باز می‌شوند."}
            </p>
            <CourseProgressSummary
              completedChapterCount={course.completedChapterCount ?? 0}
              accessibleChapterCount={course.accessibleChapterCount ?? 0}
              visible={canTrackChapterProgress}
            />
          </div>
          {loading ? <CircularProgress size={22} /> : null}
        </div>

        <div className={styles.chapterList}>
          {course.chapters.map((chapter, chapterIndex) => {
            const isExpanded = expandedChapterKeys.has(chapter.key);
            const isGradualLock = isGradualChapterLock(chapter);
            const chapterItems = chapter.items ?? [];
            const nextUnlockedChapter = course.chapters
              .slice(chapterIndex + 1)
              .find((entry) => !entry.isLocked);
            const showChapterCompletion = canTrackChapterProgress && !chapter.isLocked;

            return (
              <Paper
                key={chapter.key}
                id={`course-chapter-${chapter.key}`}
                className={[
                  styles.chapterCard,
                  chapter.isLocked ? styles.chapterLocked : "",
                  chapter.isCompleted ? styles.chapterCompleted : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                elevation={0}
              >
                <button
                  type="button"
                  className={styles.chapterPathButton}
                  aria-label={`رفتن به ابتدای فصل ${chapter.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    event.currentTarget
                      .closest(`.${styles.chapterCard}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
                <button
                  type="button"
                  className={styles.chapterHeader}
                  onClick={() => toggleChapter(chapter.key)}
                  aria-expanded={isExpanded}
                  aria-controls={`chapter-panel-${chapter.key}`}
                >
                  <span
                    className={[
                      styles.chapterStep,
                      chapter.isCompleted ? styles.chapterStepCompleted : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className={styles.chapterNumber}>
                      {(chapterIndex + 1).toLocaleString("fa-IR")}
                    </span>
                    {chapter.isCompleted ? (
                      <span className={styles.chapterStepTick} aria-label="تکمیل شده">
                        <CheckRoundedIcon />
                      </span>
                    ) : null}
                  </span>
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
                    <span className={styles.chapterDescription}>{chapter.description.trim()}</span>
                  ) : null}
                </button>

                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
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
                            fallbackMessage="این فصل طبق زمان‌بندی انتشار تدریجی به‌زودی قابل مشاهده خواهد بود."
                            onExpired={handleChapterUnlockExpired}
                          />
                        ) : (
                          <>
                            <LockRoundedIcon />
                            <span>برای مشاهده آیتم‌های این فصل، دوره را خریداری کنید.</span>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className={styles.itemList}>
                        {chapterItems.length === 0 ? (
                          <p className={styles.emptyItems}>آیتمی برای این فصل ثبت نشده است.</p>
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
                                <CourseItemContent item={item} onOpenMedia={openMediaViewer} />
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

      <Button className={styles.mobileBackButton} variant="outlined" onClick={() => navigate("/courses")}>
        بازگشت به لیست دوره‌ها
      </Button>

      <EntityModalShell
        open={selectedMedia != null || mediaSlugFromRoute != null}
        onClose={closeMediaViewer}
        title={selectedMedia?.title ?? "نمایش رسانه"}
        maxWidth="lg"
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: closeMediaViewer,
              },
            ]}
          />
        }
      >
        {selectedMedia?.type === "IMAGE" ? (
          <img
            src={selectedMedia.url}
            alt={selectedMedia.title}
            className={styles.mediaDialogImage}
          />
        ) : null}
        {selectedMedia?.type === "VIDEO" ? (
          <video className={styles.mediaDialogVideo} src={selectedMedia.url} controls autoPlay>
            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
          </video>
        ) : null}
        {selectedMedia?.type === "VOICE" ? (
          <audio className={styles.mediaDialogAudio} src={selectedMedia.url} controls autoPlay>
            مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
          </audio>
        ) : null}
      </EntityModalShell>

      <CoursePurchaseDialog
        open={isPurchaseDialogOpen}
        onClose={closePurchaseDialog}
        onPurchaseSuccess={handlePurchaseSuccess}
        course={course}
        displayPrice={displayPrice}
        originalPrice={course.priceIrt}
        discountLabel={discountLabel}
        coverImageUrl={coverImageUrl}
      />
    </section>
  );
};

export default CourseDetail;
