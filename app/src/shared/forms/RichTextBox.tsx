import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import {
  Box,
  Divider,
  IconButton,
  MenuItem,
  Select,
  useMediaQuery,
  type SelectChangeEvent,
} from "@mui/material";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import FormatAlignCenterRoundedIcon from "@mui/icons-material/FormatAlignCenterRounded";
import FormatAlignLeftRoundedIcon from "@mui/icons-material/FormatAlignLeftRounded";
import FormatAlignRightRoundedIcon from "@mui/icons-material/FormatAlignRightRounded";
import FormatBoldRoundedIcon from "@mui/icons-material/FormatBoldRounded";
import FormatClearRoundedIcon from "@mui/icons-material/FormatClearRounded";
import FormatIndentDecreaseRoundedIcon from "@mui/icons-material/FormatIndentDecreaseRounded";
import FormatIndentIncreaseRoundedIcon from "@mui/icons-material/FormatIndentIncreaseRounded";
import FormatItalicRoundedIcon from "@mui/icons-material/FormatItalicRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import FormatListNumberedRoundedIcon from "@mui/icons-material/FormatListNumberedRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import FormatUnderlinedRoundedIcon from "@mui/icons-material/FormatUnderlinedRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { useMaxRoutePreview } from "../../hooks/useMaxRoutePreview";
import { MULTILINE_TEXTAREA_MIN_ROWS } from "../../constants/multilineTextarea.constants";
import EntityModalShell from "../crud/EntityModalShell";
import ModalFooterActions from "../crud/ModalFooterActions";
import styles from "./RichTextBox.module.scss";
import AppTooltip from "../AppTooltip";
import { applyBlankTargetToRichTextLinks, hasRichTextContent } from "../../utils/richTextHtml.util";

type RichTextBoxMode = "edit" | "render";
type RichTextEditorMode = "visual" | "markup";
type RichTextBoxProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange?: (nextValue: string) => void;
  readonly placeholder?: string;
  readonly minRows?: number;
  readonly required?: boolean;
  readonly mode?: RichTextBoxMode;
  readonly hideLabel?: boolean;
  readonly renderTitle?: string;
  readonly maximizeLabel?: string;
  /** Parent-owned maximize (e.g. product detail item modal). */
  readonly onPreviewMaximize?: () => void;
  /** Stable id for `/max` route ownership in self-managed maximize. */
  readonly previewId?: string;
};
type ActiveFormats = {
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly unorderedList: boolean;
  readonly orderedList: boolean;
  readonly quote: boolean;
  readonly alignRight: boolean;
  readonly alignCenter: boolean;
  readonly alignLeft: boolean;
  readonly indented: boolean;
};

const indentStepPx = 24;
const blockSelector = "blockquote, div, h1, h2, h3, h4, h5, h6, li, p";
const defaultActiveFormats: ActiveFormats = {
  bold: false,
  italic: false,
  underline: false,
  unorderedList: false,
  orderedList: false,
  quote: false,
  alignRight: false,
  alignCenter: false,
  alignLeft: false,
  indented: false,
};
const fontSizeOptions = [
  { label: "کوچک", value: "13px" },
  { label: "معمولی", value: "15px" },
  { label: "متوسط", value: "17px" },
  { label: "بزرگ", value: "20px" },
  { label: "خیلی بزرگ", value: "24px" },
];

function getClosestBlock(node: Node | null, editable: HTMLElement): HTMLElement | null {
  const element = node instanceof HTMLElement ? node : node?.parentElement;
  const block = element?.closest<HTMLElement>(blockSelector);
  return block && block !== editable && editable.contains(block) ? block : null;
}

function getClosestQuote(node: Node | null, editable: HTMLElement): HTMLElement | null {
  const element = node instanceof HTMLElement ? node : node?.parentElement;
  const quote = element?.closest<HTMLElement>("blockquote");
  return quote && editable.contains(quote) ? quote : null;
}

function RichTextBoxRender({
  label,
  value,
  hideLabel,
  renderTitle,
  maximizeLabel = "بزرگ‌نمایی",
  previewId,
  onPreviewMaximize,
}: {
  readonly label: string;
  readonly value: string;
  readonly hideLabel: boolean;
  readonly renderTitle?: string;
  readonly maximizeLabel?: string;
  readonly previewId?: string;
  readonly onPreviewMaximize?: () => void;
}): ReactElement {
  const autoOwnerId = useId();
  const ownerId = previewId?.trim() || autoOwnerId;
  const maxRoutePreview = useMaxRoutePreview(ownerId, !onPreviewMaximize);
  const renderedHtml = useMemo(() => applyBlankTargetToRichTextLinks(value), [value]);
  const dialogTitle = renderTitle?.trim() || label.trim() || "نمایش محتوا";
  const usesExternalPreview = Boolean(onPreviewMaximize);
  const showInternalModal = !usesExternalPreview && maxRoutePreview.isOpen;

  const handleMaximize = (): void => {
    if (onPreviewMaximize) {
      onPreviewMaximize();
      return;
    }
    maxRoutePreview.open();
  };

  const handleCloseModal = (): void => {
    maxRoutePreview.close();
  };

  return (
    <>
      <Box className={styles.root}>
        <div className={styles.inputFrame}>
          {!hideLabel && label.trim() ? <span className={styles.label}>{label}</span> : null}
          <div
            className={`${styles.modeSwitch} ${styles.modeSwitchSingle}`}
            aria-label="عملیات نمایش"
          >
            <AppTooltip title={maximizeLabel} arrow>
              <IconButton
                size="small"
                className={styles.modeButton}
                aria-label={maximizeLabel}
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleMaximize}
              >
                <OpenInFullRoundedIcon fontSize="small" />
              </IconButton>
            </AppTooltip>
          </div>
          <div
            className={styles.renderContent}
            dir="rtl"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </div>
      </Box>

      {!usesExternalPreview ? (
        <EntityModalShell
          open={showInternalModal}
          onClose={handleCloseModal}
          title={dialogTitle}
          subtitle="پیش‌نمایش و ویرایش متن"
          maxWidth="lg"
          disableAutoFocus
          disableRestoreFocus
          showVisibleScrollbar
          footer={
            <ModalFooterActions
              actions={[
                {
                  key: "close",
                  isCloseButton: true,
                  onClick: handleCloseModal,
                },
              ]}
            />
          }
        >
          <div
            className={`${styles.renderDialogContent} ${styles.renderDialogContentMax}`}
            dir="rtl"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </EntityModalShell>
      ) : null}
    </>
  );
}

const RichTextBox = ({
  label,
  value,
  onChange,
  placeholder,
  minRows = MULTILINE_TEXTAREA_MIN_ROWS,
  required = false,
  mode = "edit",
  hideLabel = false,
  renderTitle,
  maximizeLabel,
  previewId,
  onPreviewMaximize,
}: RichTextBoxProps): ReactElement | null => {
  if (mode === "render") {
    if (!hasRichTextContent(value)) {
      return null;
    }

    return (
      <RichTextBoxRender
        label={label}
        value={value}
        hideLabel={hideLabel}
        renderTitle={renderTitle}
        maximizeLabel={maximizeLabel}
        previewId={previewId}
        onPreviewMaximize={onPreviewMaximize}
      />
    );
  }

  return (
    <RichTextBoxEditor
      label={label}
      value={value}
      onChange={onChange ?? (() => undefined)}
      placeholder={placeholder}
      minRows={minRows}
      required={required}
      previewId={previewId}
    />
  );
};

type RichTextBoxEditorProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (nextValue: string) => void;
  readonly placeholder?: string;
  readonly minRows: number;
  readonly required: boolean;
  readonly previewId?: string;
};

const RichTextBoxEditor = ({
  label,
  value,
  onChange,
  placeholder,
  minRows: _minRows,
  required,
  previewId,
}: RichTextBoxEditorProps): ReactElement => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const autoOwnerId = useId();
  const ownerId = previewId?.trim() || autoOwnerId;
  const maxRoutePreview = useMaxRoutePreview(ownerId);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editableRef = useRef<HTMLDivElement | null>(null);
  const pendingHtmlRef = useRef<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [mode, setMode] = useState<RichTextEditorMode>("visual");
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(defaultActiveFormats);
  const shouldFloatLabel = isFocused || hasRichTextContent(value);

  const syncEditableHtml = useCallback(
    (editable: HTMLDivElement): void => {
      if (mode !== "visual") {
        return;
      }
      const nextHtml = pendingHtmlRef.current ?? value;
      pendingHtmlRef.current = null;
      if (editable.innerHTML !== nextHtml) {
        editable.innerHTML = nextHtml;
      }
    },
    [mode, value]
  );

  const setEditableRef = useCallback(
    (node: HTMLDivElement | null): void => {
      editableRef.current = node;
      if (node) {
        syncEditableHtml(node);
      }
    },
    [syncEditableHtml]
  );

  useLayoutEffect(() => {
    const editable = editableRef.current;
    if (editable) {
      syncEditableHtml(editable);
    }
  }, [maxRoutePreview.isOpen, syncEditableHtml]);

  const flushEditableValue = useCallback((): void => {
    const editable = editableRef.current;
    if (!editable || mode !== "visual") {
      return;
    }
    if (editable.innerHTML !== value) {
      onChange(editable.innerHTML);
    }
  }, [mode, onChange, value]);

  const handleOpenMaximize = useCallback((): void => {
    const editable = editableRef.current;
    if (editable && mode === "visual") {
      pendingHtmlRef.current = editable.innerHTML;
      if (editable.innerHTML !== value) {
        onChange(editable.innerHTML);
      }
    }
    maxRoutePreview.open();
  }, [maxRoutePreview, mode, onChange, value]);

  const handleCloseMaximize = useCallback((): void => {
    flushEditableValue();
    maxRoutePreview.close();
  }, [flushEditableValue, maxRoutePreview]);

  const fieldHeightStyle = {
    minHeight: "var(--app-multiline-textarea-min-height)",
    maxHeight: "var(--app-multiline-textarea-max-height)",
    overflowY: "auto" as const,
  };

  const getSelectedBlocks = useCallback((editable: HTMLElement): HTMLElement[] => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return [];
    }

    const range = selection.getRangeAt(0);
    const selectedBlocks = new Set<HTMLElement>();
    const startBlock = getClosestBlock(range.startContainer, editable);
    const endBlock = getClosestBlock(range.endContainer, editable);

    if (startBlock) {
      selectedBlocks.add(startBlock);
    }
    if (endBlock) {
      selectedBlocks.add(endBlock);
    }

    editable.querySelectorAll<HTMLElement>(blockSelector).forEach((block) => {
      if (range.intersectsNode(block)) {
        selectedBlocks.add(block);
      }
    });

    return [...selectedBlocks];
  }, []);

  const updateActiveFormats = useCallback((): void => {
    const editable = editableRef.current;
    const selection = window.getSelection();
    const anchorNode = selection?.anchorNode;
    const anchorElement =
      anchorNode instanceof HTMLElement ? anchorNode : anchorNode?.parentElement;

    if (
      mode !== "visual" ||
      !editable ||
      !selection ||
      selection.rangeCount === 0 ||
      !anchorNode ||
      (anchorNode !== editable && (!anchorElement || !editable.contains(anchorElement)))
    ) {
      setActiveFormats(defaultActiveFormats);
      return;
    }

    const selectedBlocks = getSelectedBlocks(editable);
    const queryState = (command: string): boolean => {
      try {
        return document.queryCommandState(command);
      } catch {
        return false;
      }
    };

    setActiveFormats({
      bold: queryState("bold"),
      italic: queryState("italic"),
      underline: queryState("underline"),
      unorderedList: queryState("insertUnorderedList"),
      orderedList: queryState("insertOrderedList"),
      quote: Boolean(getClosestQuote(selection.getRangeAt(0).startContainer, editable)),
      alignRight: queryState("justifyRight"),
      alignCenter: queryState("justifyCenter"),
      alignLeft: queryState("justifyLeft"),
      indented: selectedBlocks.some(
        (block) =>
          block.tagName === "LI" ||
          (Number.parseFloat(block.style.getPropertyValue("margin-inline-start")) || 0) > 0
      ),
    });
  }, [getSelectedBlocks, mode]);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () => document.removeEventListener("selectionchange", updateActiveFormats);
  }, [updateActiveFormats]);

  const applyCommand = (
    command:
      | "bold"
      | "italic"
      | "underline"
      | "insertUnorderedList"
      | "insertOrderedList"
      | "formatBlock"
      | "justifyRight"
      | "justifyCenter"
      | "justifyLeft"
      | "indent"
      | "outdent"
      | "removeFormat",
    value?: string
  ): void => {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }
    editable.focus();
    document.execCommand(command, false, value);
    onChange(editable.innerHTML);
    updateActiveFormats();
  };

  const applyIndentChange = (direction: 1 | -1): void => {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }

    editable.focus();

    let selectedBlocks = getSelectedBlocks(editable);
    if (selectedBlocks.length === 0) {
      document.execCommand("formatBlock", false, "div");
      selectedBlocks = getSelectedBlocks(editable);
    }

    if (selectedBlocks.some((block) => block.tagName === "LI")) {
      document.execCommand(direction > 0 ? "indent" : "outdent");
      onChange(editable.innerHTML);
      updateActiveFormats();
      return;
    }

    selectedBlocks.forEach((block) => {
      const currentIndent =
        Number.parseFloat(block.style.getPropertyValue("margin-inline-start")) || 0;
      const nextIndent = Math.max(0, currentIndent + direction * indentStepPx);

      if (nextIndent === 0) {
        block.style.removeProperty("margin-inline-start");
        return;
      }

      block.style.setProperty("margin-inline-start", `${nextIndent}px`);
    });

    onChange(editable.innerHTML);
    updateActiveFormats();
  };

  const toggleQuote = (): void => {
    const editable = editableRef.current;
    const selection = window.getSelection();
    if (!editable || !selection || selection.rangeCount === 0) {
      return;
    }

    editable.focus();

    const quote = getClosestQuote(selection.getRangeAt(0).startContainer, editable);
    if (!quote) {
      document.execCommand("formatBlock", false, "<blockquote>");
      onChange(editable.innerHTML);
      updateActiveFormats();
      return;
    }

    const paragraph = document.createElement("div");
    paragraph.innerHTML = quote.innerHTML;
    quote.replaceWith(paragraph);
    onChange(editable.innerHTML);
    updateActiveFormats();
  };

  const applyFontSize = (event: SelectChangeEvent<string>): void => {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }
    editable.focus();
    document.execCommand("fontSize", false, "7");
    editable.querySelectorAll("font[size='7']").forEach((fontElement) => {
      const span = document.createElement("span");
      span.style.fontSize = event.target.value as string;
      span.innerHTML = fontElement.innerHTML;
      fontElement.replaceWith(span);
    });
    onChange(editable.innerHTML);
    updateActiveFormats();
  };

  const handleInput = (): void => {
    const editable = editableRef.current;
    if (!editable) {
      return;
    }
    onChange(editable.innerHTML);
    updateActiveFormats();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>): void => {
    const root = rootRef.current;
    const next = event.relatedTarget;
    if (root && next instanceof Node && root.contains(next)) {
      return;
    }

    setIsFocused(false);
    const editable = event.currentTarget;
    onChange(editable.innerHTML.trim());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Tab") {
      event.preventDefault();
      document.execCommand("insertText", false, "  ");
      handleInput();
    }
  };

  const keepEditorSelection = (event: { preventDefault: () => void }): void => {
    event.preventDefault();
  };

  const rootClassName = [
    styles.root,
    shouldFloatLabel ? styles.rootFloating : "",
    isFocused ? styles.rootFocused : "",
  ]
    .filter(Boolean)
    .join(" ");

  const renderToolbar = (): ReactElement | null =>
    mode === "visual" ? (
      <div className={styles.actions}>
        <Select
          size="small"
          displayEmpty
          value=""
          className={styles.fontSizeSelect}
          onMouseDown={keepEditorSelection}
          onChange={applyFontSize}
          renderValue={() => "اندازه"}
        >
          {fontSizeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        <Divider orientation="vertical" flexItem className={styles.toolbarDivider} />
        <AppTooltip title="پررنگ" arrow>
          <IconButton
            size="small"
            color={activeFormats.bold ? "primary" : "default"}
            onMouseDown={keepEditorSelection}
            onClick={() => applyCommand("bold")}
          >
            <FormatBoldRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <AppTooltip title="مورب" arrow>
          <IconButton
            size="small"
            color={activeFormats.italic ? "primary" : "default"}
            onMouseDown={keepEditorSelection}
            onClick={() => applyCommand("italic")}
          >
            <FormatItalicRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <AppTooltip title="زیرخط" arrow>
          <IconButton
            size="small"
            color={activeFormats.underline ? "primary" : "default"}
            onMouseDown={keepEditorSelection}
            onClick={() => applyCommand("underline")}
          >
            <FormatUnderlinedRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <Divider orientation="vertical" flexItem className={styles.toolbarDivider} />
        <AppTooltip title="لیست بولت‌دار" arrow>
          <IconButton
            size="small"
            color={activeFormats.unorderedList ? "primary" : "default"}
            onMouseDown={keepEditorSelection}
            onClick={() => applyCommand("insertUnorderedList")}
          >
            <FormatListBulletedRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <AppTooltip title="لیست شماره‌دار" arrow>
          <IconButton
            size="small"
            color={activeFormats.orderedList ? "primary" : "default"}
            onMouseDown={keepEditorSelection}
            onClick={() => applyCommand("insertOrderedList")}
          >
            <FormatListNumberedRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <AppTooltip title="نقل قول" arrow>
          <IconButton
            size="small"
            color={activeFormats.quote ? "primary" : "default"}
            onMouseDown={keepEditorSelection}
            onClick={toggleQuote}
          >
            <FormatQuoteRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <Divider orientation="vertical" flexItem className={styles.toolbarDivider} />
        <AppTooltip title="راست‌چین" arrow>
          <IconButton
            size="small"
            color={activeFormats.alignRight ? "primary" : "default"}
            onMouseDown={keepEditorSelection}
            onClick={() => applyCommand("justifyRight")}
          >
            <FormatAlignRightRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <AppTooltip title="وسط‌چین" arrow>
          <IconButton
            size="small"
            color={activeFormats.alignCenter ? "primary" : "default"}
            onMouseDown={keepEditorSelection}
            onClick={() => applyCommand("justifyCenter")}
          >
            <FormatAlignCenterRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <AppTooltip title="چپ‌چین" arrow>
          <IconButton
            size="small"
            color={activeFormats.alignLeft ? "primary" : "default"}
            onMouseDown={keepEditorSelection}
            onClick={() => applyCommand("justifyLeft")}
          >
            <FormatAlignLeftRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <Divider orientation="vertical" flexItem className={styles.toolbarDivider} />
        <AppTooltip title="تورفتگی بیشتر" arrow>
          <IconButton
            size="small"
            color={activeFormats.indented ? "primary" : "default"}
            onMouseDown={keepEditorSelection}
            onClick={() => applyIndentChange(1)}
          >
            <FormatIndentIncreaseRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <AppTooltip title="تورفتگی کمتر" arrow>
          <IconButton
            size="small"
            onMouseDown={keepEditorSelection}
            onClick={() => applyIndentChange(-1)}
          >
            <FormatIndentDecreaseRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
        <AppTooltip title="پاک کردن قالب‌بندی" arrow>
          <IconButton
            size="small"
            onMouseDown={keepEditorSelection}
            onClick={() => applyCommand("removeFormat")}
          >
            <FormatClearRoundedIcon fontSize="small" />
          </IconButton>
        </AppTooltip>
      </div>
    ) : null;

  const renderEditorSurface = (variant: "inline" | "modal"): ReactElement => {
    const editorClassName =
      variant === "modal" ? `${styles.editor} ${styles.editorMax}` : styles.editor;
    const markupClassName =
      variant === "modal"
        ? `${styles.markupEditor} ${styles.markupEditorMax}`
        : styles.markupEditor;
    const editorStyle = variant === "modal" ? { minHeight: "100%" } : fieldHeightStyle;

    return (
      <>
        <div className={styles.header}>{renderToolbar()}</div>
        <div className={variant === "modal" ? styles.inputFrameMax : styles.inputFrame}>
          {variant === "inline" ? (
            <span className={styles.label}>
              {label}
              {required ? <span className={styles.requiredMark}> *</span> : null}
            </span>
          ) : null}
          <div
            className={`${styles.modeSwitch}${isMobile ? ` ${styles.modeSwitchMobile}` : ""}`}
            aria-label="حالت ویرایش متن"
          >
            <AppTooltip title="ویرایش نمایشی" arrow>
              <IconButton
                size="small"
                className={styles.modeButton}
                color={mode === "visual" ? "primary" : "default"}
                onClick={() => setMode("visual")}
              >
                <VisibilityRoundedIcon fontSize="small" />
              </IconButton>
            </AppTooltip>
            <AppTooltip title="ویرایش HTML" arrow>
              <IconButton
                size="small"
                className={styles.modeButton}
                color={mode === "markup" ? "primary" : "default"}
                onClick={() => setMode("markup")}
              >
                <CodeRoundedIcon fontSize="small" />
              </IconButton>
            </AppTooltip>
            {variant === "inline" ? (
              <AppTooltip title="بزرگ‌نمایی" arrow>
                <IconButton
                  size="small"
                  className={styles.modeButton}
                  aria-label="بزرگ‌نمایی"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleOpenMaximize}
                >
                  <OpenInFullRoundedIcon fontSize="small" />
                </IconButton>
              </AppTooltip>
            ) : null}
          </div>
          {mode === "visual" ? (
            <div
              ref={setEditableRef}
              className={editorClassName}
              contentEditable
              role="textbox"
              aria-multiline
              suppressContentEditableWarning
              data-placeholder={isFocused ? (placeholder ?? "") : ""}
              style={editorStyle}
              onFocus={() => setIsFocused(true)}
              onInput={handleInput}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <textarea
              className={markupClassName}
              value={value}
              placeholder={isFocused ? "HTML را وارد کنید" : ""}
              style={editorStyle}
              dir="ltr"
              spellCheck={false}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(event) => onChange(event.target.value)}
            />
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <Box ref={rootRef} className={rootClassName}>
        {maxRoutePreview.isOpen ? (
          <div className={styles.inlineEditorPlaceholder} style={fieldHeightStyle} aria-hidden />
        ) : (
          renderEditorSurface("inline")
        )}
      </Box>

      <EntityModalShell
        open={maxRoutePreview.isOpen}
        onClose={handleCloseMaximize}
        title={label}
        subtitle="پیش‌نمایش و ویرایش متن"
        maxWidth="lg"
        disableAutoFocus
        disableRestoreFocus
        showVisibleScrollbar
        footer={
          <ModalFooterActions
            actions={[
              {
                key: "close",
                isCloseButton: true,
                onClick: handleCloseMaximize,
              },
            ]}
          />
        }
      >
        <Box className={styles.modalEditorRoot}>{renderEditorSurface("modal")}</Box>
      </EntityModalShell>
    </>
  );
};

export default RichTextBox;
