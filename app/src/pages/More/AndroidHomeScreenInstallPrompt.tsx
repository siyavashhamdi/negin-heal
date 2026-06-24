import AddToHomeScreenRoundedIcon from "@mui/icons-material/AddToHomeScreenRounded";
import AndroidRoundedIcon from "@mui/icons-material/AndroidRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { Dialog } from "@mui/material";
import { useState, type ReactElement } from "react";

import { useTranslation } from "../../hooks/useTranslation";
import { useAndroidHomeScreenInstallPrompt } from "../../hooks/useAndroidHomeScreenInstallPrompt";
import { opaqueShellProps } from "../../shared/opaqueShell";
import styles from "./styles/more.module.scss";

const ANDROID_INSTALL_STEPS = [
  {
    icon: MoreVertRoundedIcon,
    titleKey: "pages.more.androidInstall.steps.menu.title",
    descriptionKey: "pages.more.androidInstall.steps.menu.description",
  },
  {
    icon: AddToHomeScreenRoundedIcon,
    titleKey: "pages.more.androidInstall.steps.add.title",
    descriptionKey: "pages.more.androidInstall.steps.add.description",
  },
  {
    icon: AndroidRoundedIcon,
    titleKey: "pages.more.androidInstall.steps.open.title",
    descriptionKey: "pages.more.androidInstall.steps.open.description",
  },
] as const;

const AndroidHomeScreenInstallPrompt = (): ReactElement | null => {
  const { t } = useTranslation();
  const [guideOpen, setGuideOpen] = useState(false);
  const { shouldShow, canPromptInstall, promptInstall } = useAndroidHomeScreenInstallPrompt();

  if (!shouldShow) {
    return null;
  }

  return (
    <>
      <section
        className={styles.androidHomeInstallCard}
        aria-label={t("pages.more.androidInstall.cardAriaLabel")}
        {...opaqueShellProps}
      >
        <div className={styles.androidHomeInstallIcon} aria-hidden="true">
          <AddToHomeScreenRoundedIcon />
        </div>
        <div className={styles.androidHomeInstallContent}>
          <strong>{t("pages.more.androidInstall.cardTitle")}</strong>
          <p>{t("pages.more.androidInstall.cardDescription")}</p>
          <div className={styles.androidHomeInstallButtonRow}>
            {canPromptInstall ? (
              <button
                type="button"
                className={styles.androidHomeInstallButton}
                onClick={() => void promptInstall()}
              >
                {t("pages.more.androidInstall.installButton")}
              </button>
            ) : null}
            <button
              type="button"
              className={`${styles.androidHomeInstallButton} ${canPromptInstall ? styles.androidHomeInstallButtonSecondary : ""}`}
              onClick={() => setGuideOpen(true)}
            >
              {t("pages.more.androidInstall.openGuideButton")}
            </button>
          </div>
        </div>
      </section>

      <Dialog
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        fullWidth
        maxWidth="xs"
        classes={{ paper: styles.androidHomeInstallDialogPaper }}
        PaperProps={{ "data-opaque-shell": true }}
        aria-labelledby="android-install-guide-title"
      >
        <div className={styles.androidHomeInstallDialogHeader}>
          <div>
            <p className={styles.androidHomeInstallDialogEyebrow}>
              {t("pages.more.androidInstall.guideEyebrow")}
            </p>
            <h3 id="android-install-guide-title">{t("pages.more.androidInstall.guideTitle")}</h3>
          </div>
        </div>

        <div className={styles.androidHomeInstallDialogBody}>
          <p className={styles.androidHomeInstallDialogIntro}>
            {t("pages.more.androidInstall.guideIntro")}
          </p>

          <ol className={styles.androidHomeInstallSteps}>
            {ANDROID_INSTALL_STEPS.map((step, index) => {
              const StepIcon = step.icon;

              return (
                <li key={step.titleKey} className={styles.androidHomeInstallStep}>
                  <span className={styles.androidHomeInstallStepNumber} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className={styles.androidHomeInstallStepIcon} aria-hidden="true">
                    <StepIcon />
                  </span>
                  <div className={styles.androidHomeInstallStepText}>
                    <strong>{t(step.titleKey)}</strong>
                    <p>{t(step.descriptionKey)}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className={styles.androidHomeInstallDialogNote}>
            {t("pages.more.androidInstall.guideNote")}
          </p>

          <button
            type="button"
            className={styles.androidHomeInstallDialogButton}
            onClick={() => setGuideOpen(false)}
          >
            {t("pages.more.androidInstall.guideDoneButton")}
          </button>
        </div>
      </Dialog>
    </>
  );
};

export default AndroidHomeScreenInstallPrompt;
