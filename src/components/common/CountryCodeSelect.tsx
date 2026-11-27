import React, { useEffect, useMemo, useRef, useState } from "react";
import countryCodesRaw from "../../assets/countryCodes.json"; // adjust path to your countryCodes.json
import "../../styles/CountryCodeSelect.css";

export interface CountryCodeItem {
  flag: string;
  country: string;
  code: string;
  dial_code: string;
}

interface CountryCodeSelectProps {
  value: string; // e.g. "+91"
  onChange: (dialCode: string, item?: CountryCodeItem) => void;
  onBlur?: () => void;
  disabled?: boolean;
  isInvalid?: boolean;
  ariaLabel?: string;
}

const COUNTRY_LIST = (
  Array.isArray(countryCodesRaw) ? countryCodesRaw : []
).filter((item): item is CountryCodeItem =>
  Boolean(item && typeof item === "object"),
);

const normalizeDial = (val?: string): string => {
  const trimmed = (val || "").trim();
  if (!trimmed) return "+91";
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
};

export const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  isInvalid = false,
  ariaLabel = "Country code",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedValue = normalizeDial(value);

  // Prefer India ("in") when "+91" matches multiple entries, otherwise first dial_code match
  const selectedItem = useMemo<CountryCodeItem | null>(() => {
    const exactIndia = COUNTRY_LIST.find(
      (item) =>
        item.dial_code === normalizedValue && item.code.toLowerCase() === "in",
    );
    if (exactIndia) return exactIndia;
    return (
      COUNTRY_LIST.find((item) => item.dial_code === normalizedValue) || null
    );
  }, [normalizedValue]);

  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRY_LIST;

    const qDigits = q.replace(/[^0-9]/g, "");

    return COUNTRY_LIST.filter((item) => {
      const countryName = String(item.country ?? "").toLowerCase();
      const isoCode = String(item.code ?? "").toLowerCase();
      const dialCode = String(item.dial_code ?? "").toLowerCase();
      const dialDigits = dialCode.replace(/[^0-9]/g, "");

      const nameMatch = countryName.includes(q);
      const isoMatch = isoCode.includes(q);
      const dialMatch = dialCode.includes(q);
      const dialDigitsMatch =
        qDigits.length > 0 && dialDigits.includes(qDigits);

      return nameMatch || isoMatch || dialMatch || dialDigitsMatch;
    });
  }, [search]);
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
        onBlur?.();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
        onBlur?.();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onBlur]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setSearch("");
        onBlur?.();
      }
      return next;
    });
  };

  const handleSelect = (item: CountryCodeItem) => {
    onChange(item.dial_code, item);
    setIsOpen(false);
    setSearch("");
    onBlur?.();
  };

  return (
    <div
      className={`ccs-root ${isOpen ? "is-open" : ""} ${disabled ? "is-disabled" : ""}`}
      ref={rootRef}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        disabled={disabled}
        className={`ccs-trigger ${isInvalid ? "is-invalid" : ""}`}
        onClick={handleToggle}
      >
        {selectedItem?.flag && (
          <img
            src={selectedItem.flag}
            alt={selectedItem.country}
            className="ccs-flag"
            loading="lazy"
          />
        )}
        <span className="ccs-dial">{normalizedValue}</span>
        <span className="ccs-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen && !disabled && (
        <div
          className="ccs-panel"
          role="dialog"
          aria-label="Search country code"
        >
          <div className="ccs-search-wrap">
            <span className="ccs-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="ccs-search-input"
              placeholder="Search country or +code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="ccs-clear-btn"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <ul className="ccs-list" role="listbox">
            {filteredCountries.map((item, idx) => {
              const isSelected =
                selectedItem?.country === item.country &&
                selectedItem?.dial_code === item.dial_code;

              return (
                <li
                  key={`${item.code}-${item.dial_code}-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  className={`ccs-option ${isSelected ? "is-selected" : ""}`}
                  onClick={() => handleSelect(item)}
                >
                  <img
                    src={item.flag}
                    alt={item.country}
                    className="ccs-flag"
                    loading="lazy"
                  />
                  <span className="ccs-country-name">{item.country}</span>
                  <span className="ccs-option-dial">{item.dial_code}</span>
                </li>
              );
            })}

            {filteredCountries.length === 0 && (
              <li className="ccs-empty">No matching country found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelect;
