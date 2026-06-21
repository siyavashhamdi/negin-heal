import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import HelpCenterRoundedIcon from "@mui/icons-material/HelpCenterRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PhoneInTalkRoundedIcon from "@mui/icons-material/PhoneInTalkRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import TelegramIcon from "@mui/icons-material/Telegram";
import TipsAndUpdatesRoundedIcon from "@mui/icons-material/TipsAndUpdatesRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useQuery } from "@apollo/client/react";
import { useMemo, type ComponentType, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { SUPPORT_CONTACT_QUERY } from "../../graphql/queries/supportContactConfig.query";
import {
  EMPTY_SUPPORT_CONTACT,
  isInternalSupportHref,
  type SupportContactChannel,
  type SupportContactChannelType,
  type SupportContactConfig,
  type SupportContactConfigQuery,
} from "./support-contact.api";
import styles from "./styles/support.module.scss";
import { opaqueShellProps } from "../../shared/opaqueShell";

type ChannelIcon = ComponentType<{ className?: string }>;

const CHANNEL_ICONS: Record<SupportContactChannelType, ChannelIcon> = {
  WHATSAPP: WhatsAppIcon,
  TELEGRAM: TelegramIcon,
  TICKET: ConfirmationNumberRoundedIcon,
  EMAIL: EmailRoundedIcon,
  PHONE: PhoneInTalkRoundedIcon,
};

function hasText(value?: string | null): boolean {
  return value?.trim().length ? true : false;
}

function getVisibleChannels(config: SupportContactConfig): readonly SupportContactChannel[] {
  return [...config.channels]
    .filter((channel) => channel.isActive && hasText(channel.label) && hasText(channel.href))
    .sort((first, second) => Number(second.isPrimary) - Number(first.isPrimary));
}

const Support = (): ReactElement => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data, loading } = useQuery<SupportContactConfigQuery>(SUPPORT_CONTACT_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const supportConfig = data?.supportContactConfig ?? EMPTY_SUPPORT_CONTACT;
  const visibleChannels = useMemo(() => getVisibleChannels(supportConfig), [supportConfig]);
  const ticketChannel = isAuthenticated
    ? visibleChannels.find((channel) => channel.type === "TICKET")
    : undefined;
  const contactChannels = visibleChannels.filter((channel) => channel.type !== "TICKET");
  const hasFaqCard = hasText(supportConfig.faqTitle);
  const hasMainCards = hasFaqCard || ticketChannel != null;
  const quickTips = useMemo(
    () => supportConfig.quickTips.filter((tip) => hasText(tip)),
    [supportConfig.quickTips],
  );
  const hasContactSectionHeading =
    hasText(supportConfig.contactSectionEyebrow) ||
    hasText(supportConfig.contactSectionHeading) ||
    hasText(supportConfig.contactSectionSubtitle);
  const hasTipsSectionHeading =
    hasText(supportConfig.tipsEyebrow) || hasText(supportConfig.tipsHeading);

  const openChannel = (channel: SupportContactChannel): void => {
    if (isInternalSupportHref(channel.href)) {
      navigate(channel.href);
      return;
    }

    window.open(channel.href, "_blank", "noopener,noreferrer");
  };

  return (
    <section className={styles.page} aria-busy={loading}>
      <div className={styles.hero} {...opaqueShellProps}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>
            <HelpCenterRoundedIcon />
          </div>
          <div className={styles.heroText}>
            {hasText(supportConfig.eyebrow) ? <p>{supportConfig.eyebrow}</p> : null}
            {hasText(supportConfig.heading) ? <h2>{supportConfig.heading}</h2> : null}
            {hasText(supportConfig.subtitle) ? <span>{supportConfig.subtitle}</span> : null}
          </div>
        </div>

        {hasText(supportConfig.availabilityLabel) || hasText(supportConfig.responseTimeLabel) ? (
          <div className={styles.heroMeta}>
            {hasText(supportConfig.availabilityLabel) ? (
              <span>
                <ScheduleRoundedIcon />
                {supportConfig.availabilityLabel}
              </span>
            ) : null}
            {hasText(supportConfig.responseTimeLabel) ? (
              <span>
                <SecurityRoundedIcon />
                {supportConfig.responseTimeLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {hasMainCards ? (
        <div className={styles.grid}>
          {hasFaqCard ? (
            <button type="button" className={styles.card} {...opaqueShellProps} onClick={() => navigate("/support/faq")}>
              <span className={styles.cardIcon}>
                <HelpCenterRoundedIcon />
              </span>
              <span className={styles.cardBody}>
                <strong>{supportConfig.faqTitle}</strong>
                {hasText(supportConfig.faqDescription) ? (
                  <small>{supportConfig.faqDescription}</small>
                ) : null}
              </span>
              <OpenInNewRoundedIcon className={styles.cardArrow} />
            </button>
          ) : null}

          {ticketChannel ? (
            <button
              type="button"
              className={`${styles.card} ${styles.cardPrimary}`}
              {...opaqueShellProps}
              onClick={() => openChannel(ticketChannel)}
            >
              <span className={styles.cardIcon}>
                <ConfirmationNumberRoundedIcon />
              </span>
              <span className={styles.cardBody}>
                <strong>{ticketChannel.label}</strong>
                {hasText(ticketChannel.description) ? (
                  <small>{ticketChannel.description}</small>
                ) : null}
              </span>
              <OpenInNewRoundedIcon className={styles.cardArrow} />
            </button>
          ) : null}
        </div>
      ) : null}

      {contactChannels.length > 0 ? (
        <>
          {hasContactSectionHeading ? (
            <div className={styles.sectionHeading}>
              <div>
                {hasText(supportConfig.contactSectionEyebrow) ? (
                  <p>{supportConfig.contactSectionEyebrow}</p>
                ) : null}
                {hasText(supportConfig.contactSectionHeading) ? (
                  <h3>{supportConfig.contactSectionHeading}</h3>
                ) : null}
              </div>
              {hasText(supportConfig.contactSectionSubtitle) ? (
                <span>{supportConfig.contactSectionSubtitle}</span>
              ) : null}
            </div>
          ) : null}

          <div className={styles.grid}>
            {contactChannels.map((channel) => {
              const Icon = CHANNEL_ICONS[channel.type] ?? ChatRoundedIcon;
              return (
                <button
                  key={`${channel.type}-${channel.href}`}
                  type="button"
                  className={styles.card}
                  {...opaqueShellProps}
                  onClick={() => openChannel(channel)}
                >
                  <span className={styles.cardIcon}>
                    <Icon />
                  </span>
                  <span className={styles.cardBody}>
                    <strong>{channel.label}</strong>
                    {hasText(channel.description) ? (
                      <small>{channel.description}</small>
                    ) : null}
                    {hasText(channel.value) && channel.value !== channel.label ? (
                      <b dir="ltr" lang="en">
                        {channel.value}
                      </b>
                    ) : null}
                  </span>
                  <OpenInNewRoundedIcon className={styles.cardArrow} />
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {quickTips.length > 0 ? (
        <div className={styles.supportPanel} {...opaqueShellProps}>
          {hasTipsSectionHeading ? (
            <div className={styles.panelIntro}>
              <TipsAndUpdatesRoundedIcon />
              <div>
                {hasText(supportConfig.tipsEyebrow) ? <p>{supportConfig.tipsEyebrow}</p> : null}
                {hasText(supportConfig.tipsHeading) ? <h3>{supportConfig.tipsHeading}</h3> : null}
              </div>
            </div>
          ) : null}
          <ul className={styles.tipList}>
            {quickTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};

export default Support;
