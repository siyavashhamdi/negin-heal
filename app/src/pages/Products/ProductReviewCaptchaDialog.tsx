import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from "@mui/material";
import { type ReactElement } from "react";

import { appSurfacePaperSx } from "../../shared/crud/modalThemeSx";
import StarRating from "../../shared/rating/StarRating";
import { LoginCaptchaField } from "../Login/components/LoginCaptchaField";
import styles from "./styles/ProductReviewsSection.module.scss";

type ProductReviewCaptchaDialogProps = {
  readonly open: boolean;
  readonly captchaVersion: number;
  readonly submitting: boolean;
  readonly canConfirm: boolean;
  readonly selectedStars: number;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly onCaptchaChange: (input: { captchaId: string; value: string; isValid: boolean }) => void;
};

const ProductReviewCaptchaDialog = ({
  open,
  captchaVersion,
  submitting,
  canConfirm,
  selectedStars,
  onClose,
  onConfirm,
  onCaptchaChange,
}: ProductReviewCaptchaDialogProps): ReactElement => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      scroll="paper"
      PaperProps={{
        className: styles.captchaDialogPaper,
        "data-opaque-shell": true,
        sx: {
          ...appSurfacePaperSx(theme),
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          m: 2,
          inlineSize: "100%",
          maxInlineSize: "24rem",
          maxBlockSize: "min(90dvh, 45rem)",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle className={styles.captchaDialogTitle}>
        <Box className={styles.captchaDialogTitleRow}>
          <SecurityRoundedIcon fontSize="small" />
          <span>تأیید امنیتی</span>
        </Box>
      </DialogTitle>

      <DialogContent className={styles.captchaDialogContent}>
        {selectedStars >= 1 ? (
          <Box className={styles.captchaDialogStarsRow}>
            <Typography component="span" variant="body2" className={styles.captchaDialogStarsLabel}>
              امتیاز شما:
            </Typography>
            <StarRating value={selectedStars} size="medium" ariaLabel={`امتیاز ${selectedStars}`} />
          </Box>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            className={styles.captchaDialogStarsEmpty}
          >
            هنوز امتیازی ثبت نکرده‌اید.
          </Typography>
        )}

        <Typography
          variant="body2"
          color="text.secondary"
          className={styles.captchaDialogDescription}
        >
          برای ثبت امتیاز یا نظر، کد امنیتی زیر را وارد کنید.
        </Typography>

        {open ? (
          <LoginCaptchaField
            key={`product-review-captcha-dialog-${captchaVersion}`}
            required
            disabled={submitting}
            onCaptchaChange={onCaptchaChange}
          />
        ) : null}
      </DialogContent>

      <DialogActions className={styles.captchaDialogActions}>
        <Button onClick={onClose} disabled={submitting}>
          انصراف
        </Button>
        <Button
          variant="contained"
          disabled={!canConfirm || submitting}
          onClick={onConfirm}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          تأیید و ثبت
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductReviewCaptchaDialog;
