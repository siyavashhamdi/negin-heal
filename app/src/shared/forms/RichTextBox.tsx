import {
  useCallback,
  useEffect,
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
  Tooltip,
  useMediaQuery,
  type SelectChangeEvent,
} from "@mui/material";
import CloseFullscreenRoundedIcon from "@mui/icons-material/CloseFullscreenRounded";
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
import styles from "./RichTextBox.module.scss";

type RichTextBoxProps = {
  readonly label: string;
  readonly value: string;
  readonly onChange: (nextValue: string) => void;
  readonly placeholder?: string;
  readonly minRows?: number;
  readonly required?: boolean;
  readonly optionalLabel?: string;
};
type RichTextMode = "visual" | "markup";
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

const rowHeightPx = 24;
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

function hasRichTextContent(value: string): boolean {
  const textContent = value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, "")
    .trim();
  return textContent.length > 0 || value.trim().length > 0;
}

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

const RichTextBox = ({
  label,
  value,
  onChange,
  placeholder,
  minRows = 4,
  required = false,
  optionalLabel,
}: RichTextBoxProps): ReactElement => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const editableRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<RichTextMode>("visual");
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(defaultActiveFormats);
  const shouldFloatLabel = isFocused || hasRichTextContent(value);

  useEffect(() => {
    const editable = editableRef.current;
    if (!editable || mode !== "visual") {
      return;
    }
    if (editable.innerHTML !== value) {
      editable.innerHTML = value;
    }
  }, [mode, value]);

  const minHeight = useMemo(
    () => (isMobile && isExpanded ? "60vh" : `${Math.max(2, minRows) * rowHeightPx}px`),
    [isExpanded, isMobile, minRows],
  );

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
        (block) => block.tagName === "LI" || (Number.parseFloat(block.style.getPropertyValue("margin-inline-start")) || 0) > 0,
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
    value?: string,
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
      const currentIndent = Number.parseFloat(block.style.getPropertyValue("margin-inline-start")) || 0;
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
    isMobile && isExpanded ? styles.rootExpanded : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Box ref={rootRef} className={rootClassName}>
      <span className={styles.label}>
        {label}
        {required ? <span className={styles.requiredMark}> *</span> : null}
        {!required && optionalLabel ? (
          <span className={styles.optionalMark}> {optionalLabel}</span>
        ) : null}
      </span>
      <div className={styles.header}>
        {mode === "visual" ? (
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
            <Tooltip title="پررنگ" arrow>
              <IconButton
                size="small"
                color={activeFormats.bold ? "primary" : "default"}
                onMouseDown={keepEditorSelection}
                onClick={() => applyCommand("bold")}
              >
                <FormatBoldRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="مورب" arrow>
              <IconButton
                size="small"
                color={activeFormats.italic ? "primary" : "default"}
                onMouseDown={keepEditorSelection}
                onClick={() => applyCommand("italic")}
              >
                <FormatItalicRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="زیرخط" arrow>
              <IconButton
                size="small"
                color={activeFormats.underline ? "primary" : "default"}
                onMouseDown={keepEditorSelection}
                onClick={() => applyCommand("underline")}
              >
                <FormatUnderlinedRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem className={styles.toolbarDivider} />
            <Tooltip title="لیست بولت‌دار" arrow>
              <IconButton
                size="small"
                color={activeFormats.unorderedList ? "primary" : "default"}
                onMouseDown={keepEditorSelection}
                onClick={() => applyCommand("insertUnorderedList")}
              >
                <FormatListBulletedRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="لیست شماره‌دار" arrow>
              <IconButton
                size="small"
                color={activeFormats.orderedList ? "primary" : "default"}
                onMouseDown={keepEditorSelection}
                onClick={() => applyCommand("insertOrderedList")}
              >
                <FormatListNumberedRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="نقل قول" arrow>
              <IconButton
                size="small"
                color={activeFormats.quote ? "primary" : "default"}
                onMouseDown={keepEditorSelection}
                onClick={toggleQuote}
              >
                <FormatQuoteRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem className={styles.toolbarDivider} />
            <Tooltip title="راست‌چین" arrow>
              <IconButton
                size="small"
                color={activeFormats.alignRight ? "primary" : "default"}
                onMouseDown={keepEditorSelection}
                onClick={() => applyCommand("justifyRight")}
              >
                <FormatAlignRightRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="وسط‌چین" arrow>
              <IconButton
                size="small"
                color={activeFormats.alignCenter ? "primary" : "default"}
                onMouseDown={keepEditorSelection}
                onClick={() => applyCommand("justifyCenter")}
              >
                <FormatAlignCenterRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="چپ‌چین" arrow>
              <IconButton
                size="small"
                color={activeFormats.alignLeft ? "primary" : "default"}
                onMouseDown={keepEditorSelection}
                onClick={() => applyCommand("justifyLeft")}
              >
                <FormatAlignLeftRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem className={styles.toolbarDivider} />
            <Tooltip title="تورفتگی بیشتر" arrow>
              <IconButton
                size="small"
                color={activeFormats.indented ? "primary" : "default"}
                onMouseDown={keepEditorSelection}
                onClick={() => applyIndentChange(1)}
              >
                <FormatIndentIncreaseRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="تورفتگی کمتر" arrow>
              <IconButton
                size="small"
                onMouseDown={keepEditorSelection}
                onClick={() => applyIndentChange(-1)}
              >
                <FormatIndentDecreaseRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="پاک کردن قالب‌بندی" arrow>
              <IconButton
                size="small"
                onMouseDown={keepEditorSelection}
                onClick={() => applyCommand("removeFormat")}
              >
                <FormatClearRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        ) : null}
      </div>
      <div className={styles.inputFrame}>
        <div
          className={`${styles.modeSwitch}${isMobile ? ` ${styles.modeSwitchMobile}` : ""}`}
          aria-label="حالت ویرایش متن"
        >
          <Tooltip title="ویرایش نمایشی" arrow>
            <IconButton
              size="small"
              className={styles.modeButton}
              color={mode === "visual" ? "primary" : "default"}
              onClick={() => setMode("visual")}
            >
              <VisibilityRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="ویرایش HTML" arrow>
            <IconButton
              size="small"
              className={styles.modeButton}
              color={mode === "markup" ? "primary" : "default"}
              onClick={() => setMode("markup")}
            >
              <CodeRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isMobile ? (
            <Tooltip title={isExpanded ? "کوچک‌سازی" : "بزرگ‌نمایی"} arrow>
              <IconButton
                size="small"
                className={styles.modeButton}
                color={isExpanded ? "primary" : "default"}
                onClick={() => setIsExpanded((previous) => !previous)}
              >
                {isExpanded ? (
                  <CloseFullscreenRoundedIcon fontSize="small" />
                ) : (
                  <OpenInFullRoundedIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          ) : null}
        </div>
        {mode === "visual" ? (
          <div
            ref={editableRef}
            className={styles.editor}
            contentEditable
            role="textbox"
            aria-multiline
            suppressContentEditableWarning
            data-placeholder={isFocused ? placeholder ?? "" : ""}
            style={{ minHeight }}
            onFocus={() => setIsFocused(true)}
            onInput={handleInput}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <textarea
            className={styles.markupEditor}
            value={value}
            placeholder={isFocused ? "HTML را وارد کنید" : ""}
            style={{ minHeight }}
            dir="ltr"
            spellCheck={false}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>
    </Box>
  );
};

export default RichTextBox;
