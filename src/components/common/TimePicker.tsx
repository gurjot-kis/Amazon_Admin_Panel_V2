import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/TimePicker.css";

interface TimePickerProps {
  id?: string;
  value?: string; // "HH:MM" (24h)
  onChange: (value: string) => void;
  ariaLabel?: string;
  disabled?: boolean;
  isInvalid?: boolean;
  minuteStep?: number; // default 30, still allows typing/selecting any HH:MM
}

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));

const MINUTES = Array.from({ length: 60 }, (_, m) =>
  String(m).padStart(2, "0"),
);

const QUICK_PRESETS = [
  { label: "08:00", value: "08:00" },
  { label: "09:00", value: "09:00" },
  { label: "10:00", value: "10:00" },
  { label: "18:00", value: "18:00" },
  { label: "20:00", value: "20:00" },
  { label: "21:00", value: "21:00" },
  { label: "22:00", value: "22:00" },
];

const parseTimeParts = (val?: string): { hour: string; minute: string } => {
  if (val && /^([01]\d|2[0-3]):[0-5]\d$/.test(val.trim())) {
    const [hour, minute] = val.trim().split(":");
    return { hour, minute };
  }
  return { hour: "09", minute: "00" };
};

export const TimePicker: React.FC<TimePickerProps> = ({
  id,
  value = "",
  onChange,
  ariaLabel,
  disabled = false,
  isInvalid = false,
  minuteStep = 15,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLUListElement>(null);
  const minuteListRef = useRef<HTMLUListElement>(null);

  const { hour: activeHour, minute: activeMinute } = useMemo(
    () => parseTimeParts(value),
    [value],
  );

  const visibleMinutes = useMemo(() => {
    const step = Math.max(1, Math.min(30, minuteStep));
    const list = MINUTES.filter((m) => Number(m) % step === 0);
    if (
      value &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(value) &&
      !list.includes(activeMinute)
    ) {
      return [...list, activeMinute].sort();
    }
    return list;
  }, [minuteStep, value, activeMinute]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Scroll selected hour & minute into view when opened
  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      const activeHourEl = hourListRef.current?.querySelector<HTMLElement>(
        '[data-active="true"]',
      );
      const activeMinEl = minuteListRef.current?.querySelector<HTMLElement>(
        '[data-active="true"]',
      );
      activeHourEl?.scrollIntoView({ block: "center" });
      activeMinEl?.scrollIntoView({ block: "center" });
    });
  }, [isOpen]);

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelectHour = (nextHour: string) => {
    onChange(`${nextHour}:${activeMinute}`);
  };

  const handleSelectMinute = (nextMinute: string) => {
    onChange(`${activeHour}:${nextMinute}`);
    setIsOpen(false);
  };

  const handleSelectPreset = (presetValue: string) => {
    onChange(presetValue);
    setIsOpen(false);
  };

  return (
    <div
      className={`tp-root ${isOpen ? "is-open" : ""} ${disabled ? "is-disabled" : ""}`}
      ref={rootRef}
    >
      <button
        id={id}
        type="button"
        aria-label={ariaLabel || "Select time"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        disabled={disabled}
        className={`tp-trigger ${isInvalid ? "is-invalid" : ""} ${
          !value ? "is-placeholder" : ""
        }`}
        onClick={toggleOpen}
      >
        <span className="tp-value">{value || "--:--"}</span>
        <span className="tp-icon" aria-hidden="true">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15.5 14" />
          </svg>
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="tp-popover" role="dialog" aria-label="Time selector">
          <div className="tp-popover-header">
            <span className="tp-current-readout">
              {activeHour}:{activeMinute}
            </span>
            <button
              type="button"
              className="tp-done-btn"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </div>

          <div className="tp-columns">
            <div className="tp-col">
              <div className="tp-col-label">Hour</div>
              <ul className="tp-list" ref={hourListRef} role="listbox">
                {HOURS.map((h) => {
                  const selected = h === activeHour;
                  return (
                    <li key={h}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-active={selected ? "true" : "false"}
                        className={`tp-option ${selected ? "is-selected" : ""}`}
                        onClick={() => handleSelectHour(h)}
                      >
                        {h}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="tp-col">
              <div className="tp-col-label">Min</div>
              <ul className="tp-list" ref={minuteListRef} role="listbox">
                {visibleMinutes.map((m) => {
                  const selected = m === activeMinute;
                  return (
                    <li key={m}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        data-active={selected ? "true" : "false"}
                        className={`tp-option ${selected ? "is-selected" : ""}`}
                        onClick={() => handleSelectMinute(m)}
                      >
                        {m}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="tp-presets">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                className={`tp-preset-btn ${
                  value === preset.value ? "is-selected" : ""
                }`}
                onClick={() => handleSelectPreset(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
