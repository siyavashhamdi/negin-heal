import { type ReactElement } from "react";

import SegmentFilterTabs from "../../shared/tabs/SegmentFilterTabs";

export type EndUserProductTab = "ALL" | "PURCHASED" | "PURCHASABLE" | "FREE";

const END_USER_PRODUCT_TABS: ReadonlyArray<{ value: EndUserProductTab; label: string }> = [
  { value: "ALL", label: "هـمـــــــــه" },
  { value: "PURCHASED", label: "خریداری‌شده" },
  { value: "PURCHASABLE", label: "قابـل خرید" },
  { value: "FREE", label: "رایـگــــان" },
];

type EndUserProductFilterTabsProps = {
  readonly activeTab: EndUserProductTab;
  readonly onChange: (tab: EndUserProductTab) => void;
};

const EndUserProductFilterTabs = ({
  activeTab,
  onChange,
}: EndUserProductFilterTabsProps): ReactElement => {
  return (
    <SegmentFilterTabs
      activeTab={activeTab}
      tabs={END_USER_PRODUCT_TABS}
      onChange={onChange}
      ariaLabel="دسته‌بندی دوره‌ها"
      pinned
    />
  );
};

export default EndUserProductFilterTabs;
