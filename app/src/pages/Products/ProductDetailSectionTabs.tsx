import { type ReactElement } from "react";

import SegmentFilterTabs from "../../shared/tabs/SegmentFilterTabs";
import { PRODUCT_SECTION_TABS, type ProductSectionTab } from "./product-section-tabs.shared";

export type ProductDetailSectionTab = ProductSectionTab;

type ProductDetailSectionTabsProps = {
  readonly activeTab: ProductDetailSectionTab;
  readonly onChange: (tab: ProductDetailSectionTab) => void;
  readonly tabs?: ReadonlyArray<{
    readonly value: ProductDetailSectionTab;
    readonly label: string;
  }>;
};

const ProductDetailSectionTabs = ({
  activeTab,
  onChange,
  tabs = PRODUCT_SECTION_TABS,
}: ProductDetailSectionTabsProps): ReactElement => {
  return (
    <SegmentFilterTabs
      activeTab={activeTab}
      tabs={tabs}
      onChange={onChange}
      ariaLabel="بخش‌های صفحه دوره"
      pinned
      pinnedAnchorId="product-detail-tabs"
      disableScrollToTopOnChange
    />
  );
};

export default ProductDetailSectionTabs;
