import { useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { Chip } from "@mui/material";
import { getProductTagChipSx } from "./product-tag-colors.util";
import styles from "./styles/ProductTagInput.module.scss";

type ProductTagInputProps = {
  readonly label: string;
  readonly value: string[];
  readonly onChange: (nextValue: string[]) => void;
  readonly placeholder: string;
};

function normalizeTag(rawValue: string): string {
  return rawValue.trim().replace(/\s+/g, " ");
}

const ProductTagInput = ({
  label,
  value,
  onChange,
  placeholder,
}: ProductTagInputProps): ReactElement => {
  const [draft, setDraft] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shouldFloatLabel = isFocused || value.length > 0 || draft.trim().length > 0;

  const addTags = (rawValue: string): void => {
    const nextTags = rawValue.split(",").map(normalizeTag).filter(Boolean);

    if (nextTags.length === 0) {
      setDraft("");
      return;
    }

    const existingTags = new Set(value.map((tag) => tag.toLowerCase()));
    const uniqueNextTags = nextTags.filter((tag) => {
      const key = tag.toLowerCase();
      if (existingTags.has(key)) {
        return false;
      }
      existingTags.add(key);
      return true;
    });

    onChange([...value, ...uniqueNextTags]);
    setDraft("");
  };

  const removeTag = (targetTag: string): void => {
    onChange(value.filter((tag) => tag !== targetTag));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTags(draft);
      return;
    }

    if (event.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className={`${styles.root}${shouldFloatLabel ? ` ${styles.rootFloating}` : ""}`}>
      <div
        className={styles.inputShell}
        onMouseDown={(event) => {
          if (event.target === inputRef.current) {
            return;
          }
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <span className={styles.label}>{label}</span>
        {value.map((tag) => (
          <Chip
            key={tag}
            size="small"
            label={tag}
            variant="outlined"
            onDelete={() => removeTag(tag)}
            className={styles.tagChip}
            sx={getProductTagChipSx(tag)}
          />
        ))}
        <input
          ref={inputRef}
          className={styles.input}
          value={draft}
          placeholder={isFocused && value.length === 0 ? placeholder : ""}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            addTags(draft);
          }}
        />
      </div>
    </div>
  );
};

export default ProductTagInput;
