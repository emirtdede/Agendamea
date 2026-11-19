import { useEffect, useState } from 'react';
import { CATEGORY_COLORS, isValidHexColor, normalizeHexColor } from '../utils/themes';

interface CategoryColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  ariaLabel: string;
}

export function CategoryColorPicker({
  value,
  onChange,
  ariaLabel,
}: CategoryColorPickerProps) {
  const [hexDraft, setHexDraft] = useState(value.toUpperCase());
  const [isEditingHex, setIsEditingHex] = useState(false);

  useEffect(() => {
    if (!isEditingHex) {
      setHexDraft(value.toUpperCase());
    }
  }, [value, isEditingHex]);

  const safePickerValue = isValidHexColor(value) ? value : '#2563eb';

  const handleHexInputChange = (raw: string) => {
    const cleaned = raw.replace(/[^#0-9a-fA-F]/g, '').slice(0, 7);
    setHexDraft(cleaned.toUpperCase());
    const withoutHash = cleaned.startsWith('#') ? cleaned.slice(1) : cleaned;
    if (withoutHash.length === 6) {
      const normalized = normalizeHexColor(cleaned);
      if (normalized) {
        onChange(normalized);
      }
    }
  };

  const handleHexBlur = () => {
    setIsEditingHex(false);
    const normalized = normalizeHexColor(hexDraft);
    if (normalized) {
      onChange(normalized);
      setHexDraft(normalized.toUpperCase());
    } else {
      setHexDraft(safePickerValue.toUpperCase());
    }
  };

  const handleDirectSelect = (hex: string) => {
    const lower = hex.toLowerCase();
    onChange(lower);
    setHexDraft(lower.toUpperCase());
  };

  return (
    <div className="space-y-2">
      {/* 8 Most-Used Primary, Secondary & White Swatches */}
      <div
        className="grid grid-cols-8 gap-1.5"
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {CATEGORY_COLORS.map(({ hex, name }) => {
          const isSelected = value.toLowerCase() === hex.toLowerCase();
          return (
            <button
              key={hex}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Renk seç: ${name}`}
              title={name}
              onClick={() => handleDirectSelect(hex)}
              className={`h-5 w-5 rounded-full border border-black/20 dark:border-white/25 transition-transform ${
                isSelected
                  ? 'scale-110 ring-2 ring-offset-1 ring-[var(--text-primary)] ring-offset-[var(--surface-subtle)]'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: hex }}
            />
          );
        })}
      </div>

      {/* Custom Visual Color Picker + Hex Code Input */}
      <div className="flex items-center gap-2">
        <label
          title="Özel renk seç"
          className="relative flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-[var(--border-strong)]"
          style={{ backgroundColor: safePickerValue }}
        >
          <span className="sr-only">Renk paletinden seç</span>
          <input
            type="color"
            value={safePickerValue}
            onChange={(e) => handleDirectSelect(e.target.value)}
            aria-label="Renk paletinden özel renk seç"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <input
          type="text"
          value={hexDraft}
          onFocus={() => setIsEditingHex(true)}
          onChange={(e) => handleHexInputChange(e.target.value)}
          onBlur={handleHexBlur}
          placeholder="#2563EB"
          maxLength={7}
          spellCheck={false}
          aria-label="Özel renk kodu (HEX)"
          className="h-7 flex-1 min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 font-mono-tabular text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--border-strong)] focus:outline-none"
        />
      </div>
    </div>
  );
}
