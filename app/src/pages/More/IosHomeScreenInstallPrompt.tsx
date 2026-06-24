import AddToHomeScreenRoundedIcon from "@mui/icons-material/AddToHomeScreenRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import { Dialog } from "@mui/material";
import { useState, type ReactElement } from "react";

import { useTranslation } from "../../hooks/useTranslation";
import { shouldShowIosHomeScreenInstallPrompt } from "../../utils/iosHomeScreenInstall.util";
import styles from "./styles/more.module.scss";
import { opaqueShellProps } from "../../shared/opaqueShell";

const IOS_INSTALL_STEPS = [
  {
    icon: IosShareRoundedIcon,
    titleKey: "pages.more.iosInstall.steps.share.title",
    descriptionKey: "pages.more.iosInstall.steps.share.description",
  },
  {
    icon: AddToHomeScreenRoundedIcon,
    titleKey: "pages.more.iosInstall.steps.add.title",
    descriptionKey: "pages.more.iosInstall.steps.add.description",
  },
  {
    icon: PhoneIphoneRoundedIcon,
    titleKey: "pages.more.iosInstall.steps.open.title",
    descriptionKey: "pages.more.iosInstall.steps.open.description",
  },
] as const;

const IosHomeScreenInstallPrompt = (): ReactElement | null => {
  const { t } = useTranslation();
  const [guideOpen, setGuideOpen] = useState(false);

  if (!shouldShowIosHomeScreenInstallPrompt()) {
    return null;
  }

  return (
    <>
      <section
        className={styles.iosInstallCard}
        aria-label={t("pages.more.iosInstall.cardAriaLabel")}
        {...opaqueShellProps}
      >
        <div className={styles.iosInstallIcon} aria-hidden="true">
          <AddToHomeScreenRoundedIcon />
        </div>
        <div className={styles.iosInstallContent}>
          <strong>{t("pages.more.iosInstall.cardTitle")}</strong>
          <p>{t("pages.more.iosInstall.cardDescription")}</p>
          <button
            type="button"
            className={styles.iosInstallButton}
            onClick={() => setGuideOpen(true)}
          >
            {t("pages.more.iosInstall.openGuideButton")}
          </button>
        </div>
      </section>

      <Dialog
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        fullWidth
        maxWidth="xs"
        classes={{ paper: styles.iosInstallDialogPaper }}
        PaperProps={{ "data-opaque-shell": true }}
        aria-labelledby="ios-install-guide-title"
      >
        <div className={styles.iosInstallDialogHeader}>
          <div>
            <p className={styles.iosInstallDialogEyebrow}>
              {t("pages.more.iosInstall.guideEyebrow")}
            </p>
            <h3 id="ios-install-guide-title">{t("pages.more.iosInstall.guideTitle")}</h3>
          </div>
        </div>

        <div className={styles.iosInstallDialogBody}>
          <p className={styles.iosInstallDialogIntro}>{t("pages.more.iosInstall.guideIntro")}</p>

          <ol className={styles.iosInstallSteps}>
            {IOS_INSTALL_STEPS.map((step, index) => {
              const StepIcon = step.icon;

              return (
                <li key={step.titleKey} className={styles.iosInstallStep}>
                  <span className={styles.iosInstallStepNumber} aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className={styles.iosInstallStepIcon} aria-hidden="true">
                    <StepIcon />
                  </span>
                  <div className={styles.iosInstallStepText}>
                    <strong>{t(step.titleKey)}</strong>
                    <p>{t(step.descriptionKey)}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className={styles.iosInstallSafariHint} aria-hidden="true">
            <span className={styles.iosInstallSafariBar} />
            <span className={styles.iosInstallSafariShare}>
              <IosShareRoundedIcon />
            </span>
          </div>

          <p className={styles.iosInstallDialogNote}>{t("pages.more.iosInstall.guideNote")}</p>

          <button
            type="button"
            className={styles.iosInstallDialogButton}
            onClick={() => setGuideOpen(false)}
          >
            {t("pages.more.iosInstall.guideDoneButton")}
          </button>
        </div>
      </Dialog>
    </>
  );
};

export default IosHomeScreenInstallPrompt;
