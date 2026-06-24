import {
  SyntheticEvent,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Box, Tab, Tabs, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { viewModalTabsSx } from "../crud/modalThemeSx";

export interface EntityTabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface EntityTabsProps {
  tabs: readonly EntityTabItem[];
  ariaLabel: string;
  defaultTabId?: string;
  resetKey?: unknown;
  panelClassName?: string;
  onTabChange?: (tabId: string) => void;
}

function resolveInitialTabId(tabs: readonly EntityTabItem[], defaultTabId?: string): string {
  const defaultTab = tabs.find((tab) => tab.id === defaultTabId && tab.disabled !== true);
  if (defaultTab) {
    return defaultTab.id;
  }
  return tabs.find((tab) => tab.disabled !== true)?.id ?? tabs[0]?.id ?? "";
}

const EntityTabs = ({
  tabs,
  ariaLabel,
  defaultTabId,
  resetKey,
  panelClassName,
  onTabChange,
}: EntityTabsProps): ReactElement | null => {
  const theme = useTheme();
  const [activeTabId, setActiveTabId] = useState(() => resolveInitialTabId(tabs, defaultTabId));

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs.find((tab) => tab.disabled !== true),
    [activeTabId, tabs]
  );

  useEffect(() => {
    setActiveTabId(resolveInitialTabId(tabs, defaultTabId));
  }, [defaultTabId, resetKey]);

  useEffect(() => {
    if (tabs.some((tab) => tab.id === activeTabId && tab.disabled !== true)) {
      return;
    }
    setActiveTabId(resolveInitialTabId(tabs, defaultTabId));
  }, [activeTabId, defaultTabId, tabs]);

  if (tabs.length === 0 || !activeTab) {
    return null;
  }

  const handleTabChange = (_event: SyntheticEvent, nextTabId: string): void => {
    setActiveTabId(nextTabId);
    onTabChange?.(nextTabId);
  };

  return (
    <Box>
      <Tabs
        value={activeTab.id}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label={ariaLabel}
        sx={{
          ...(viewModalTabsSx(theme) as Record<string, unknown>),
          px: 0.5,
          "& .MuiTabs-flexContainer": {
            gap: 0.5,
          },
          "& .MuiTab-root": {
            borderRadius: 1.5,
            minHeight: theme.spacing(5.5),
            textTransform: "none",
          },
          "& .MuiTab-root.Mui-selected": {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: 3,
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={`${tab.id}-tab`}
            aria-controls={`${tab.id}-tabpanel`}
            value={tab.id}
            label={tab.label}
            disabled={tab.disabled}
          />
        ))}
      </Tabs>

      <Box
        id={`${activeTab.id}-tabpanel`}
        role="tabpanel"
        aria-labelledby={`${activeTab.id}-tab`}
        className={panelClassName}
      >
        {activeTab.content}
      </Box>
    </Box>
  );
};

export default EntityTabs;
