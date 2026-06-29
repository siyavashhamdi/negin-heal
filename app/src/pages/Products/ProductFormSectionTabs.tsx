import { useCallback, type ReactElement } from "react";

import SegmentFilterTabs from "../../shared/tabs/SegmentFilterTabs";
import { PRODUCT_FORM_SECTION_TABS, type ProductSectionTab } from "./product-section-tabs.shared";

type ProductFormSectionTabsProps = {
  readonly activeTab: ProductSectionTab;
  readonly onChange: (tab: ProductSectionTab) => void;
};

const ProductFormSectionTabs = ({
  activeTab,
  onChange,
}: ProductFormSectionTabsProps): ReactElement => {
  const handleTabChange = useCallback(
    (tab: ProductSectionTab): void => {
      onChange(tab);
    },
    [onChange]
  );

  return (
    <SegmentFilterTabs
      activeTab={activeTab}
      tabs={PRODUCT_FORM_SECTION_TABS}
      onChange={handleTabChange}
      ariaLabel="بخش‌های ویرایش دوره"
      pinned
      pinnedSurface="dialog"
      pinnedAnchorId="product-form-tabs"
      disableScrollToTopOnChange
    />
  );
};

export default ProductFormSectionTabs;
