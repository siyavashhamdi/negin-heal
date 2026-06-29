import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import HelpCenterRoundedIcon from "@mui/icons-material/HelpCenterRounded";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import { useQuery } from "@apollo/client/react";
import { useMemo, useState, type ComponentType, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { API_CONFIG } from "../../config";
import { SUPPORT_CONTACT_QUERY } from "../../graphql/queries/supportContactConfig.query";
import { usePageSeoOverride } from "../../hooks/usePageSeoOverride";
import { useTranslation } from "../../hooks/useTranslation";
import { APP_SHELL_ROUTES } from "../../routing/app-shell-routes";
import {
  buildBreadcrumbStructuredData,
  buildDefaultStructuredData,
  buildFaqStructuredData,
  buildStructuredDataLogoUrl,
} from "../../seo/build-structured-data";
import { resolveAppBaseUrl } from "../../seo/build-page-seo";
import { buildSeoDescription, htmlToPlainText, resolveAbsoluteUrl } from "../../seo/seo-text.util";
import {
  EMPTY_SUPPORT_CONTACT,
  type SupportContactConfigQuery,
  type SupportFaqItem,
  type SupportFaqSection,
} from "./support-contact.api";
import styles from "./styles/support.module.scss";
import { opaqueShellProps } from "../../shared/opaqueShell";

const SECTION_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  account: AccountCircleRoundedIcon,
  products: SchoolRoundedIcon,
  payments: PaymentRoundedIcon,
  support: ConfirmationNumberRoundedIcon,
  technical: OndemandVideoRoundedIcon,
  security: SecurityRoundedIcon,
  other: MoreHorizRoundedIcon,
};

const normalizeSearchTerm = (value: string): string => value.trim().toLocaleLowerCase("fa-IR");

const itemMatchesSearch = (item: SupportFaqItem, searchTerm: string): boolean => {
  if (!searchTerm) {
    return true;
  }

  return `${item.question} ${item.answer}`.toLocaleLowerCase("fa-IR").includes(searchTerm);
};

const hasText = (value: string): boolean => value.trim().length > 0;

const getRenderableSections = (
  sections: readonly SupportFaqSection[]
): readonly SupportFaqSection[] =>
  sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasText(item.question) && hasText(item.answer)),
    }))
    .filter((section) => hasText(section.title) && section.items.length > 0);

const getItemPanelId = (itemId: string): string => `faq-panel-${itemId}`;
const getItemButtonId = (itemId: string): string => `faq-button-${itemId}`;

const SupportFaq = (): ReactElement => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, loading } = useQuery<SupportContactConfigQuery>(SUPPORT_CONTACT_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const faqPage = (data?.supportContactConfig ?? EMPTY_SUPPORT_CONTACT).faqPage;
  const [search, setSearch] = useState("");
  const [openItemIds, setOpenItemIds] = useState<ReadonlySet<string>>(() => new Set());
  const searchTerm = normalizeSearchTerm(search);

  const renderableSections = useMemo(
    () => getRenderableSections(faqPage.sections),
    [faqPage.sections]
  );

  const filteredSections = useMemo(
    () =>
      renderableSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => itemMatchesSearch(item, searchTerm)),
        }))
        .filter((section) => section.items.length > 0),
    [renderableSections, searchTerm]
  );

  const faqStructuredItems = useMemo(
    () =>
      renderableSections.flatMap((section) =>
        section.items.map((item) => ({
          question: item.question,
          answer: htmlToPlainText(item.answer),
        }))
      ),
    [renderableSections]
  );

  const pageSeoOverride = useMemo(() => {
    const appUrl = resolveAppBaseUrl(API_CONFIG.APP_URL);
    const canonicalPath = APP_SHELL_ROUTES.supportFaq;
    const canonicalUrl = resolveAbsoluteUrl(appUrl, canonicalPath);
    const siteName = t("seo.brand.name");
    const description = hasText(faqPage.subtitle)
      ? buildSeoDescription(faqPage.subtitle)
      : buildSeoDescription(t("seo.pages.supportFaq.description"));
    const logoUrl = buildStructuredDataLogoUrl(appUrl, "/icons/icon-512.png");

    return {
      ...(hasText(faqPage.heading) ? { title: faqPage.heading } : {}),
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
              url: resolveAbsoluteUrl(appUrl, APP_SHELL_ROUTES.support),
            },
            {
              name: t("app.pageTitles.supportFaq"),
              url: canonicalUrl,
            },
          ],
        }),
        ...buildFaqStructuredData({
          canonicalUrl,
          items: faqStructuredItems,
        }),
      ],
    };
  }, [faqPage.heading, faqPage.subtitle, faqStructuredItems, t]);

  usePageSeoOverride(pageSeoOverride);

  const visibleItemCount = useMemo(
    () => filteredSections.reduce((total, section) => total + section.items.length, 0),
    [filteredSections]
  );
  const hasSearch = searchTerm.length > 0;
  const hasResults = filteredSections.length > 0;

  const toggleItem = (itemId: string): void => {
    setOpenItemIds((previousOpenItemIds) => {
      const nextOpenItemIds = new Set(previousOpenItemIds);
      if (nextOpenItemIds.has(itemId)) {
        nextOpenItemIds.delete(itemId);
      } else {
        nextOpenItemIds.add(itemId);
      }
      return nextOpenItemIds;
    });
  };

  return (
    <section className={styles.page} aria-busy={loading}>
      <div className={`${styles.hero} ${styles.faqHero}`} {...opaqueShellProps}>
        <div className={styles.faqHeroContent}>
          {hasText(faqPage.eyebrow) ? (
            <p className={styles.faqHeroEyebrow}>{faqPage.eyebrow}</p>
          ) : null}
          {hasText(faqPage.heading) ? (
            <div className={styles.faqHeroHeading}>
              <span className={styles.faqHeroIcon}>
                <HelpCenterRoundedIcon />
              </span>
              <h2>{faqPage.heading}</h2>
            </div>
          ) : null}
          {hasText(faqPage.subtitle) ? (
            <span className={styles.faqHeroSubtitle}>{faqPage.subtitle}</span>
          ) : null}
        </div>
      </div>

      <div className={styles.faqToolbar} {...opaqueShellProps}>
        <label className={styles.faqSearch}>
          <SearchRoundedIcon />
          {hasText(faqPage.searchLabel) ? <span>{faqPage.searchLabel}</span> : null}
          <input
            type="search"
            value={search}
            aria-label={faqPage.searchLabel || "FAQ search"}
            placeholder={faqPage.searchPlaceholder}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      {hasSearch ? (
        <p className={styles.faqResultMeta}>
          {hasResults
            ? `${visibleItemCount.toLocaleString("fa-IR")} ${faqPage.resultCountLabel}`.trim()
            : faqPage.noResultsLabel}
        </p>
      ) : null}

      {hasResults ? (
        <div className={styles.faqSections}>
          {filteredSections.map((section) => {
            const SectionIcon = SECTION_ICONS[section.id] ?? HelpCenterRoundedIcon;
            return (
              <section key={section.id} className={styles.faqSection} {...opaqueShellProps}>
                <div className={styles.faqSectionHeader}>
                  <div className={styles.faqSectionHeading}>
                    <span className={styles.faqSectionIcon}>
                      <SectionIcon />
                    </span>
                    <h3>{section.title}</h3>
                  </div>
                  {hasText(section.description) ? (
                    <p className={styles.faqSectionDescription}>{section.description}</p>
                  ) : null}
                </div>

                <div className={styles.faqItems}>
                  {section.items.map((item) => {
                    const isOpen = openItemIds.has(item.id);
                    return (
                      <article key={item.id} className={styles.faqItem}>
                        <h4>
                          <button
                            type="button"
                            id={getItemButtonId(item.id)}
                            aria-expanded={isOpen}
                            aria-controls={getItemPanelId(item.id)}
                            onClick={() => toggleItem(item.id)}
                          >
                            <span>{item.question}</span>
                            <ExpandMoreRoundedIcon />
                          </button>
                        </h4>
                        <div
                          id={getItemPanelId(item.id)}
                          role="region"
                          aria-labelledby={getItemButtonId(item.id)}
                          hidden={!isOpen}
                          className={styles.faqAnswer}
                        >
                          <p>{item.answer}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className={styles.faqEmpty} {...opaqueShellProps}>
          <HelpCenterRoundedIcon />
          {hasText(faqPage.emptyTitle) ? <h3>{faqPage.emptyTitle}</h3> : null}
          {hasText(faqPage.emptyDescription) ? <p>{faqPage.emptyDescription}</p> : null}
          {hasText(faqPage.emptyActionLabel) ? (
            <button type="button" onClick={() => navigate("/support/tickets")}>
              {faqPage.emptyActionLabel}
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default SupportFaq;
