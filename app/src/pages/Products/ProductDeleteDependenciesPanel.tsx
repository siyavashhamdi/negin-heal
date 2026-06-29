import { type ReactElement, type ReactNode } from "react";
import {
  ArchiveOutlined as ArchiveOutlinedIcon,
  DeleteOutlineRounded as DeleteOutlineRoundedIcon,
  GroupsRounded as GroupsRoundedIcon,
  LocalOfferOutlined as LocalOfferOutlinedIcon,
  NotificationsNoneRounded as NotificationsNoneRoundedIcon,
  PermMediaOutlined as PermMediaOutlinedIcon,
  RateReviewOutlined as RateReviewOutlinedIcon,
  WarningAmberRounded as WarningAmberRoundedIcon,
} from "@mui/icons-material";
import { Skeleton } from "@mui/material";
import { useTranslation } from "../../hooks/useTranslation";
import {
  groupProductDeleteDependenciesByImpact,
  type ProductDeleteDependencyBreakdownRow,
  type ProductDeleteDependencyGroupRow,
  type ProductDeleteDependencyImpact,
  type ProductDeleteDependenciesRow,
} from "./product-delete-dependencies.api";
import styles from "./styles/ProductDeleteDependenciesPanel.module.scss";

interface ProductDeleteDependenciesPanelProps {
  readonly dependencies?: ProductDeleteDependenciesRow | null;
  readonly loading?: boolean;
  readonly error?: boolean;
}

const formatCount = (value: number): string =>
  value.toLocaleString("fa-IR").replace(/\u066c/g, ",");

const GROUP_ICON_BY_KEY: Record<string, ReactElement> = {
  enrollments: <GroupsRoundedIcon />,
  reviews: <RateReviewOutlinedIcon />,
  coupons: <LocalOfferOutlinedIcon />,
  notifications: <NotificationsNoneRoundedIcon />,
  files: <PermMediaOutlinedIcon />,
};

const ProductDeleteDependenciesPanel = ({
  dependencies,
  loading = false,
  error = false,
}: ProductDeleteDependenciesPanelProps): ReactElement => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={styles.panel} aria-busy="true" aria-live="polite">
        <Skeleton variant="rounded" height={34} className={styles.skeletonBlock} />
        <Skeleton variant="rounded" height={108} className={styles.skeletonBlock} />
        <Skeleton variant="rounded" height={108} className={styles.skeletonBlock} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <p className={styles.errorState}>
          {t("pages.products.deleteDialog.dependenciesLoadError")}
        </p>
        <p className={styles.footnote}>{t("pages.products.deleteDialog.footnote")}</p>
      </div>
    );
  }

  if (!dependencies) {
    return null;
  }

  const { retained, removed } = groupProductDeleteDependenciesByImpact(dependencies.groups);
  const hasAnyDependencies =
    dependencies.summary.hasRetainedDependencies || dependencies.summary.hasRemovedDependencies;

  return (
    <div className={styles.panel}>
      <div className={styles.summaryRow}>
        {dependencies.summary.hasRetainedDependencies ? (
          <span className={`${styles.summaryChip} ${styles.summaryChipRetained}`}>
            <ArchiveOutlinedIcon fontSize="inherit" />
            {t("pages.products.deleteDialog.summaryRetained", {
              count: formatCount(dependencies.summary.retainedCount),
            })}
          </span>
        ) : null}
        {dependencies.summary.hasRemovedDependencies ? (
          <span className={`${styles.summaryChip} ${styles.summaryChipRemoved}`}>
            <DeleteOutlineRoundedIcon fontSize="inherit" />
            {t("pages.products.deleteDialog.summaryRemoved", {
              count: formatCount(dependencies.summary.removedCount),
            })}
          </span>
        ) : null}
        {!hasAnyDependencies ? (
          <span className={`${styles.summaryChip} ${styles.summaryChipNeutral}`}>
            {t("pages.products.deleteDialog.summaryNoDependencies")}
          </span>
        ) : null}
      </div>

      {!hasAnyDependencies ? (
        <p className={styles.emptyState}>
          {t("pages.products.deleteDialog.noDependenciesMessage")}
        </p>
      ) : null}

      {retained.length > 0 ? (
        <DependencySection
          impact="RETAINED"
          groups={retained}
          title={t("pages.products.deleteDialog.retainedSectionTitle")}
          icon={<WarningAmberRoundedIcon className={styles.sectionHeadingIcon} />}
          translateGroupTitle={(key) => t(`pages.products.deleteDialog.groups.${key}.title`)}
          translateGroupDescription={(key) =>
            t(`pages.products.deleteDialog.groups.${key}.description`)
          }
          translateBreakdownLabel={(groupKey, breakdownKey) =>
            t(`pages.products.deleteDialog.groups.${groupKey}.breakdown.${breakdownKey}`, {
              defaultValue: breakdownKey,
            })
          }
          translateHiddenSamples={(groupKey, count) =>
            t(`pages.products.deleteDialog.groups.${groupKey}.hiddenSamples`, {
              count: formatCount(count),
            })
          }
        />
      ) : null}

      {removed.length > 0 ? (
        <DependencySection
          impact="REMOVED"
          groups={removed}
          title={t("pages.products.deleteDialog.removedSectionTitle")}
          icon={<DeleteOutlineRoundedIcon className={styles.sectionHeadingIcon} />}
          translateGroupTitle={(key) => t(`pages.products.deleteDialog.groups.${key}.title`)}
          translateGroupDescription={(key) =>
            t(`pages.products.deleteDialog.groups.${key}.description`)
          }
          translateBreakdownLabel={(groupKey, breakdownKey) =>
            t(`pages.products.deleteDialog.groups.${groupKey}.breakdown.${breakdownKey}`, {
              defaultValue: breakdownKey,
            })
          }
          translateHiddenSamples={(groupKey, count) =>
            t(`pages.products.deleteDialog.groups.${groupKey}.hiddenSamples`, {
              count: formatCount(count),
            })
          }
        />
      ) : null}

      <p className={styles.footnote}>{t("pages.products.deleteDialog.footnote")}</p>
    </div>
  );
};

interface DependencySectionProps {
  readonly impact: ProductDeleteDependencyImpact;
  readonly groups: ProductDeleteDependencyGroupRow[];
  readonly title: string;
  readonly icon: ReactNode;
  readonly translateGroupTitle: (groupKey: string) => string;
  readonly translateGroupDescription: (groupKey: string) => string;
  readonly translateBreakdownLabel: (groupKey: string, breakdownKey: string) => string;
  readonly translateHiddenSamples: (groupKey: string, count: number) => string;
}

const DependencySection = ({
  impact,
  groups,
  title,
  icon,
  translateGroupTitle,
  translateGroupDescription,
  translateBreakdownLabel,
  translateHiddenSamples,
}: DependencySectionProps): ReactElement => {
  const isRetained = impact === "RETAINED";

  return (
    <section className={styles.section}>
      <h3
        className={`${styles.sectionHeading} ${
          isRetained ? styles.sectionHeadingRetained : styles.sectionHeadingRemoved
        }`}
      >
        {icon}
        <span>{title}</span>
      </h3>

      <div className={styles.groupList}>
        {groups.map((group) => (
          <DependencyGroupCard
            key={group.key}
            group={group}
            impact={impact}
            translateGroupTitle={translateGroupTitle}
            translateGroupDescription={translateGroupDescription}
            translateBreakdownLabel={translateBreakdownLabel}
            translateHiddenSamples={translateHiddenSamples}
          />
        ))}
      </div>
    </section>
  );
};

interface DependencyGroupCardProps {
  readonly group: ProductDeleteDependencyGroupRow;
  readonly impact: ProductDeleteDependencyImpact;
  readonly translateGroupTitle: (groupKey: string) => string;
  readonly translateGroupDescription: (groupKey: string) => string;
  readonly translateBreakdownLabel: (groupKey: string, breakdownKey: string) => string;
  readonly translateHiddenSamples: (groupKey: string, count: number) => string;
}

const DependencyGroupCard = ({
  group,
  impact,
  translateGroupTitle,
  translateGroupDescription,
  translateBreakdownLabel,
  translateHiddenSamples,
}: DependencyGroupCardProps): ReactElement => {
  const isRetained = impact === "RETAINED";
  const icon = GROUP_ICON_BY_KEY[group.key] ?? <WarningAmberRoundedIcon />;

  return (
    <article
      className={`${styles.groupCard} ${
        isRetained ? styles.groupCardRetained : styles.groupCardRemoved
      }`}
    >
      <div className={styles.groupHeader}>
        <div className={styles.groupTitleWrap}>
          <span
            className={`${styles.groupIcon} ${
              isRetained ? styles.groupIconRetained : styles.groupIconRemoved
            }`}
          >
            {icon}
          </span>
          <div>
            <p className={styles.groupTitle}>{translateGroupTitle(group.key)}</p>
            <p className={styles.groupDescription}>{translateGroupDescription(group.key)}</p>
          </div>
        </div>
        <span
          className={`${styles.countBadge} ${
            isRetained ? styles.countBadgeRetained : styles.countBadgeRemoved
          }`}
        >
          {formatCount(group.totalCount)}
        </span>
      </div>

      {group.breakdown.length > 0 ? (
        <BreakdownList
          groupKey={group.key}
          breakdown={group.breakdown}
          translateBreakdownLabel={translateBreakdownLabel}
        />
      ) : null}

      {group.samples.length > 0 ? (
        <div className={styles.sampleList}>
          {group.samples.map((sample) => (
            <div
              key={sample.id ?? `${sample.label}-${sample.meta ?? ""}`}
              className={styles.sampleRow}
            >
              <span className={styles.sampleLabel}>{sample.label}</span>
              {sample.meta ? <span className={styles.sampleMeta}>{sample.meta}</span> : null}
            </div>
          ))}
        </div>
      ) : null}

      {group.hiddenSampleCount > 0 ? (
        <p className={styles.hiddenSampleNote}>
          {translateHiddenSamples(group.key, group.hiddenSampleCount)}
        </p>
      ) : null}
    </article>
  );
};

interface BreakdownListProps {
  readonly groupKey: string;
  readonly breakdown: ProductDeleteDependencyBreakdownRow[];
  readonly translateBreakdownLabel: (groupKey: string, breakdownKey: string) => string;
}

const BreakdownList = ({
  groupKey,
  breakdown,
  translateBreakdownLabel,
}: BreakdownListProps): ReactElement => (
  <div className={styles.breakdownList}>
    {breakdown.map((item) => (
      <span key={`${groupKey}-${item.key}`} className={styles.breakdownChip}>
        <span>{translateBreakdownLabel(groupKey, item.key)}</span>
        <strong>{formatCount(item.count)}</strong>
      </span>
    ))}
  </div>
);

export default ProductDeleteDependenciesPanel;
