import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import { Alert, Button, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { API_CONFIG } from "../../config/env";
import { COURSE_REVIEW_SUBMIT_MUTATION } from "../../graphql/mutations/courseReviewSubmit.mutation";
import { useMutationWithSnackbar } from "../../hooks/useMutationWithSnackbar";
import { useSnackbar } from "../../hooks/useSnackbar";
import { extractGraphQLErrorCode } from "../../utilities/graphql-error.util";
import { LoginCaptchaField } from "../Login/components/LoginCaptchaField";
import StarRating from "../../shared/rating/StarRating";
import {
  type CourseReviewSubmitMutation,
  type CourseReviewSubmitMutationVariables,
  type EndUserCourseReviewRecord,
} from "./course-reviews.api";
import styles from "./styles/CourseReviewsSection.module.scss";

const MAX_COMMENT_LENGTH = 2000;
const CAPTCHA_ERROR_CODES = new Set(["CAPTCHA_REQUIRED", "CAPTCHA_EXPIRED", "CAPTCHA_INVALID"]);

type CourseReviewSubmitFormProps = {
  readonly courseId: string;
  readonly existingReview?: EndUserCourseReviewRecord | null;
  readonly onSubmitted: () => void;
};

const CourseReviewSubmitForm = ({
  courseId,
  existingReview,
  onSubmitted,
}: CourseReviewSubmitFormProps): ReactElement => {
  const { showError, showSuccess } = useSnackbar();
  const captchaEnabled = API_CONFIG.CAPTCHA_ENABLED;
  const successMessageRef = useRef("ثبت با موفقیت انجام شد.");
  const [stars, setStars] = useState(existingReview?.rating?.stars ?? 0);
  const [comment, setComment] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");
  const [captchaValid, setCaptchaValid] = useState(false);
  const [captchaVersion, setCaptchaVersion] = useState(0);

  useEffect(() => {
    setStars(existingReview?.rating?.stars ?? 0);
  }, [existingReview?.id, existingReview?.rating?.stars]);

  const resetCaptcha = useCallback((): void => {
    setCaptchaId("");
    setCaptchaValue("");
    setCaptchaValid(false);
    setCaptchaVersion((previous) => previous + 1);
  }, []);

  const [submitReview, submitResult] = useMutationWithSnackbar<
    CourseReviewSubmitMutation,
    CourseReviewSubmitMutationVariables
  >(COURSE_REVIEW_SUBMIT_MUTATION, {
    onSuccess: () => {
      showSuccess(successMessageRef.current);
      setComment("");
      if (captchaEnabled) {
        resetCaptcha();
      }
      onSubmitted();
    },
    onError: (error) => {
      const errorCode = extractGraphQLErrorCode(error);
      if (captchaEnabled && typeof errorCode === "string" && CAPTCHA_ERROR_CODES.has(errorCode)) {
        resetCaptcha();
      }
    },
  });

  const hasExistingRating = Boolean(existingReview?.rating);
  const trimmedComment = comment.trim();
  const canSubmit =
    stars >= 1 && stars <= 5 && !submitResult.loading && (!captchaEnabled || captchaValid);

  const handleCaptchaChange = useCallback(
    (input: { captchaId: string; value: string; isValid: boolean }): void => {
      setCaptchaId(input.captchaId);
      setCaptchaValue(input.value);
      setCaptchaValid(input.isValid);
    },
    []
  );

  const resolveSuccessMessage = (): string => {
    if (!hasExistingRating) {
      return trimmedComment ? "نظر شما ثبت شد." : "امتیاز شما ثبت شد.";
    }

    if (trimmedComment) {
      return "نظر جدید ثبت شد.";
    }

    return "امتیاز شما به‌روزرسانی شد.";
  };

  const handleSubmit = (): void => {
    if (!canSubmit) {
      if (captchaEnabled && !captchaValid) {
        showError("لطفاً کد امنیتی را وارد کنید.");
      }
      return;
    }

    successMessageRef.current = resolveSuccessMessage();

    void submitReview({
      variables: {
        input: {
          courseId,
          stars,
          comment: trimmedComment || undefined,
          captchaId: captchaEnabled ? captchaId : undefined,
          captchaValue: captchaEnabled ? captchaValue : undefined,
        },
      },
    });
  };

  return (
    <section className={styles.submitPanel} aria-labelledby="course-review-submit-title">
      <div className={styles.submitPanelHeader}>
        <RateReviewRoundedIcon fontSize="small" />
        <div>
          <Typography
            id="course-review-submit-title"
            component="h3"
            className={styles.submitPanelTitle}
          >
            {hasExistingRating ? "ویرایش امتیاز یا ثبت نظر" : "ثبت امتیاز و نظر"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasExistingRating
              ? "امتیاز خود را می‌توانید تغییر دهید. متن جدید به‌صورت نظر جداگانه ثبت می‌شود."
              : "تجربه خود از این دوره را با دیگر شرکت‌کنندگان به اشتراک بگذارید."}
          </Typography>
        </div>
      </div>

      <div className={styles.submitStarsRow}>
        <Typography component="span" variant="body2">
          امتیاز شما
        </Typography>
        <StarRating
          mode="input"
          value={stars}
          onChange={setStars}
          disabled={submitResult.loading}
        />
      </div>

      <TextField
        fullWidth
        multiline
        minRows={3}
        maxRows={6}
        label={hasExistingRating ? "ثبت نظر جدید (اختیاری)" : "متن نظر (اختیاری)"}
        placeholder={
          hasExistingRating
            ? "نظر جدید خود را بنویسید…"
            : "نکات مفید، نقاط قوت یا پیشنهادهای خود را بنویسید…"
        }
        value={comment}
        disabled={submitResult.loading}
        onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
        helperText={`${comment.length.toLocaleString("fa-IR")} / ${MAX_COMMENT_LENGTH.toLocaleString("fa-IR")}`}
      />

      {stars < 1 ? (
        <Alert severity="info" className={styles.submitHint}>
          برای ثبت نظر، ابتدا امتیاز ۱ تا ۵ ستاره را انتخاب کنید.
        </Alert>
      ) : null}

      {captchaEnabled ? (
        <LoginCaptchaField
          key={`course-review-captcha-${captchaVersion}`}
          required
          disabled={submitResult.loading}
          onCaptchaChange={handleCaptchaChange}
        />
      ) : null}

      <Button
        variant="contained"
        size="large"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className={styles.submitButton}
      >
        {hasExistingRating ? (trimmedComment ? "ثبت نظر جدید" : "ذخیره امتیاز") : "ثبت نظر"}
      </Button>
    </section>
  );
};

export default CourseReviewSubmitForm;
