import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import HelpCenterRoundedIcon from "@mui/icons-material/HelpCenterRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
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
import { API_CONFIG } from "../../config";
import { SUPPORT_CONTACT_QUERY } from "../../graphql/queries/supportContactConfig.query";
import { usePageSeoOverride } from "../../hooks/usePageSeoOverride";
import { useTranslation } from "../../hooks/useTranslation";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import {
  buildBreadcrumbStructuredData,
  buildDefaultStructuredData,
  buildStructuredDataLogoUrl,
} from "../../seo/build-structured-data";
import { resolveAppBaseUrl } from "../../seo/build-page-seo";
import { buildSeoDescription, resolveAbsoluteUrl } from "../../seo/seo-text.util";
import AppTooltip from "../../shared/AppTooltip";
import { useAuth } from "../../contexts/AuthContext";
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
  INSTAGRAM: InstagramIcon,
  TICKET: ConfirmationNumberRoundedIcon,
  EMAIL: EmailRoundedIcon,
  PHONE: PhoneInTalkRoundedIcon,
};

const CONTACT_CHANNEL_ORDER: readonly SupportContactChannelType[] = [
  "INSTAGRAM",
  "TELEGRAM",
  "WHATSAPP",
  "EMAIL",
  "PHONE",
];

function hasText(value?: string | null): boolean {
  return value?.trim().length ? true : false;
}

function getVisibleChannels(config: SupportContactConfig): readonly SupportContactChannel[] {
  return [...config.channels]
    .filter((channel) => channel.isActive && hasText(channel.label) && hasText(channel.href))
    .sort((first, second) => Number(second.isPrimary) - Number(first.isPrimary));
}

function buildChannelTooltip(channel: SupportContactChannel): string {
  const showValue = hasText(channel.value) && channel.value !== channel.label;
  const lines = [channel.label];

  if (hasText(channel.description)) {
    lines.push(channel.description);
  }

  if (showValue) {
    lines.push("");
    lines.push(channel.value);
  }

  return lines.join("\n");
}

interface ContactIconLinkProps {
  readonly channel: SupportContactChannel;
  readonly Icon: ChannelIcon;
  readonly onOpen: (channel: SupportContactChannel) => void;
}

const ContactIconLink = ({ channel, Icon, onOpen }: ContactIconLinkProps): ReactElement => {
  const isInternal = isInternalSupportHref(channel.href);
  const tooltip = buildChannelTooltip(channel);
  const icon = <Icon className={styles.contactIconGlyph} />;

  if (isInternal) {
    return (
      <AppTooltip
        title={tooltip}
        arrow
        placement="top"
        slotProps={{
          tooltip: {
            sx: { whiteSpace: "pre-line", textAlign: "start" },
          },
        }}
      >
        <button
          type="button"
          className={styles.contactIconButton}
          aria-label={channel.label}
          onClick={() => onOpen(channel)}
        >
          {icon}
        </button>
      </AppTooltip>
    );
  }

  return (
    <AppTooltip
      title={tooltip}
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: { whiteSpace: "pre-line", textAlign: "start" },
        },
      }}
    >
      <a
        className={styles.contactIconButton}
        href={channel.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={channel.label}
      >
        {icon}
      </a>
    </AppTooltip>
  );
};

const Support = (): ReactElement => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data, loading } = useQuery<SupportContactConfigQuery>(SUPPORT_CONTACT_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const supportConfig = data?.supportContactConfig ?? EMPTY_SUPPORT_CONTACT;

  const pageSeoOverride = useMemo(() => {
    const appUrl = resolveAppBaseUrl(API_CONFIG.APP_URL);
    const canonicalPath = APP_SHELL_ROUTES.support;
    const canonicalUrl = resolveAbsoluteUrl(appUrl, canonicalPath);
    const siteName = t("seo.brand.name");
    const description = hasText(supportConfig.subtitle)
      ? buildSeoDescription(supportConfig.subtitle)
      : buildSeoDescription(t("seo.pages.support.description"));
    const logoUrl = buildStructuredDataLogoUrl(appUrl, "/icons/icon-512.png");

    return {
      ...(hasText(supportConfig.heading) ? { title: supportConfig.heading } : {}),
      description,
      canonicalPath,
      jsonLd: [
        ...buildDefaultStructuredData({
          t,
          appUrl,
          canonicalUrl,
          siteName,
          description,
          logoUrl,
        }),
        ...buildBreadcrumbStructuredData({
          appUrl,
          items: [
            {
              name: t("app.pageTitles.support"),
              url: canonicalUrl,
            },
          ],
        }),
      ],
    };
  }, [supportConfig.heading, supportConfig.subtitle, t]);

  usePageSeoOverride(pageSeoOverride);

  const visibleChannels = useMemo(() => getVisibleChannels(supportConfig), [supportConfig]);
  const ticketChannel = isAuthenticated
    ? visibleChannels.find((channel) => channel.type === "TICKET")
    : undefined;
  const contactChannels = useMemo(
    () =>
      visibleChannels
        .filter((channel) => channel.type !== "TICKET")
        .sort(
          (first, second) =>
            CONTACT_CHANNEL_ORDER.indexOf(first.type) - CONTACT_CHANNEL_ORDER.indexOf(second.type)
        ),
    [visibleChannels]
  );
  const hasFaqCard = hasText(supportConfig.faqTitle);
  const hasMainCards = hasFaqCard || ticketChannel != null;
  const quickTips = useMemo(
    () => supportConfig.quickTips.filter((tip) => hasText(tip)),
    [supportConfig.quickTips]
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

      <div className={styles.contentStack}>
        {hasMainCards ? (
          <div className={styles.grid}>
            {hasFaqCard ? (
              <button
                type="button"
                className={styles.card}
                {...opaqueShellProps}
                onClick={() => navigate("/support/faq")}
              >
                <span className={styles.cardBody}>
                  <span className={styles.cardHeading}>
                    <span className={styles.cardIcon}>
                      <HelpCenterRoundedIcon />
                    </span>
                    <strong>{supportConfig.faqTitle}</strong>
                  </span>
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
                <span className={styles.cardBody}>
                  <span className={styles.cardHeading}>
                    <span className={styles.cardIcon}>
                      <ConfirmationNumberRoundedIcon />
                    </span>
                    <strong>{ticketChannel.label}</strong>
                  </span>
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
          <div className={styles.contactSection} {...opaqueShellProps}>
            {hasContactSectionHeading ? (
              <div className={styles.contactSectionIntro}>
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

            <div
              className={styles.contactIconRow}
              role="list"
              aria-label={supportConfig.contactSectionHeading || "راه‌های ارتباطی"}
            >
              {contactChannels.map((channel) => {
                const Icon = CHANNEL_ICONS[channel.type] ?? ChatRoundedIcon;
                return (
                  <div
                    key={`${channel.type}-${channel.href}`}
                    className={styles.contactIconItem}
                    role="listitem"
                  >
                    <ContactIconLink channel={channel} Icon={Icon} onOpen={openChannel} />
                  </div>
                );
              })}
            </div>
          </div>
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
      </div>
    </section>
  );
};

export default Support;
