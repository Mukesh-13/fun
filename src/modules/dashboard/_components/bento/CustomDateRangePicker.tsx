"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';

interface CustomDateRangePickerProps {
  isRangeMode: boolean;
  onToggleRangeMode: (isRange: boolean) => void;
  singleDate: string; // "YYYY-MM-DD"
  fromDate: string;   // "YYYY-MM-DD"
  toDate: string;     // "YYYY-MM-DD"
  onSingleDateChange: (date: string) => void;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onClear: () => void;
  availableDates?: string[]; // "DD-MM-YYYY"
}

export default function CustomDateRangePicker({
  isRangeMode,
  onToggleRangeMode,
  singleDate,
  fromDate,
  toDate,
  onSingleDateChange,
  onFromDateChange,
  onToDateChange,
  onClear,
  availableDates = [],
}: CustomDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rangeStep, setRangeStep] = useState<'from' | 'to'>('from');
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Compute exact min and max bounds from available module dates
  const { minDateISO, maxDateISO, minYear, maxYear, minMonth, maxMonth } = useMemo(() => {
    if (!availableDates.length) {
      return {
        minDateISO: '2026-08-18',
        maxDateISO: '2026-09-10',
        minYear: 2026,
        maxYear: 2026,
        minMonth: 7, // August
        maxMonth: 8, // September
      };
    }

    const isoList = availableDates.map((dStr) => {
      const [d, m, y] = dStr.split('-').map(Number);
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      return { iso, y, m: m - 1, d };
    });

    isoList.sort((a, b) => a.iso.localeCompare(b.iso));

    const earliest = isoList[0];
    const latest = isoList[isoList.length - 1];

    return {
      minDateISO: earliest.iso,
      maxDateISO: latest.iso,
      minYear: earliest.y,
      maxYear: latest.y,
      minMonth: earliest.m,
      maxMonth: latest.m,
    };
  }, [availableDates]);

  // View state for Calendar
  const [viewYear, setViewYear] = useState<number>(minYear);
  const [viewMonth, setViewMonth] = useState<number>(minMonth);
  const [typedYearInput, setTypedYearInput] = useState<string>(String(minYear));

  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOffset = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  // Prev / Next month bounded checks
  const canGoPrev = useMemo(() => {
    if (viewYear < minYear) return false;
    if (viewYear === minYear && viewMonth <= minMonth) return false;
    return true;
  }, [viewYear, viewMonth, minYear, minMonth]);

  const canGoNext = useMemo(() => {
    if (viewYear > maxYear) return false;
    if (viewYear === maxYear && viewMonth >= maxMonth) return false;
    return true;
  }, [viewYear, viewMonth, maxYear, maxMonth]);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      const prevY = Math.max(viewYear - 1, minYear);
      setViewYear(prevY);
      setTypedYearInput(String(prevY));
      setViewMonth(11);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      const nextY = Math.min(viewYear + 1, maxYear);
      setViewYear(nextY);
      setTypedYearInput(String(nextY));
      setViewMonth(0);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Clamp year input to [minYear, maxYear]
  const clampAndSetYear = (inputVal: number) => {
    let clampedYear = inputVal;
    if (isNaN(clampedYear) || clampedYear < minYear) {
      clampedYear = minYear;
    } else if (clampedYear > maxYear) {
      clampedYear = maxYear;
    }

    setViewYear(clampedYear);
    setTypedYearInput(String(clampedYear));

    // Also adjust month if current month is out of range for the clamped year
    if (clampedYear === minYear && viewMonth < minMonth) {
      setViewMonth(minMonth);
    } else if (clampedYear === maxYear && viewMonth > maxMonth) {
      setViewMonth(maxMonth);
    }
  };

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypedYearInput(val);

    // Auto-clamp when 4 digits are typed
    if (val.length === 4) {
      const parsed = parseInt(val, 10);
      clampAndSetYear(parsed);
    }
  };

  const handleYearInputBlur = () => {
    const parsed = parseInt(typedYearInput, 10);
    clampAndSetYear(parsed);
  };

  const handleYearInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const parsed = parseInt(typedYearInput, 10);
      clampAndSetYear(parsed);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = Number(e.target.value);
    setViewMonth(newMonth);
  };

  const formatToISO = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const formatDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return isoStr;
  };

  const formatDisplayFull = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoStr;
  };

  const handleSelectDay = (day: number) => {
    const selectedIso = formatToISO(viewYear, viewMonth, day);

    // Disallow if outside min/max
    if (selectedIso < minDateISO || selectedIso > maxDateISO) {
      return;
    }

    if (!isRangeMode) {
      // Single date mode
      onSingleDateChange(selectedIso);
    } else {
      // Range mode
      if (rangeStep === 'from' || !fromDate) {
        onFromDateChange(selectedIso);
        onToDateChange('');
        setRangeStep('to');
      } else {
        if (selectedIso < fromDate) {
          onFromDateChange(selectedIso);
          onToDateChange(fromDate);
        } else {
          onToDateChange(selectedIso);
        }
        setRangeStep('from');
      }
    }
  };

  const hasFilter = isRangeMode ? Boolean(fromDate || toDate) : Boolean(singleDate);

  const getTriggerLabel = () => {
    if (!isRangeMode) {
      if (singleDate) return formatDisplayFull(singleDate);
      return 'Pick Date';
    } else {
      if (fromDate && toDate) {
        return `${formatDisplay(fromDate)} – ${formatDisplay(toDate)}`;
      }
      if (fromDate) return `From ${formatDisplay(fromDate)}`;
      if (toDate) return `Up to ${formatDisplay(toDate)}`;
      return 'Date Range';
    }
  };

  // Check state for a day cell
  const getDayState = (day: number) => {
    const iso = formatToISO(viewYear, viewMonth, day);
    const isDisabled = iso < minDateISO || iso > maxDateISO;

    if (isDisabled) {
      return {
        isSelected: false,
        isFrom: false,
        isTo: false,
        inRange: false,
        isDisabled: true,
      };
    }

    if (!isRangeMode) {
      return {
        isSelected: singleDate === iso,
        isFrom: false,
        isTo: false,
        inRange: false,
        isDisabled: false,
      };
    }

    const isFrom = fromDate === iso;
    const isTo = toDate === iso;
    let inRange = false;

    if (fromDate && toDate) {
      inRange = iso > fromDate && iso < toDate;
    } else if (fromDate && hoverDate && rangeStep === 'to') {
      const start = fromDate < hoverDate ? fromDate : hoverDate;
      const end = fromDate < hoverDate ? hoverDate : fromDate;
      inRange = iso > start && iso < end;
    }

    return {
      isSelected: false,
      isFrom,
      isTo,
      inRange,
      isDisabled: false,
    };
  };

  const hasModuleOnDay = (day: number) => {
    const dStr = `${String(day).padStart(2, '0')}-${String(viewMonth + 1).padStart(2, '0')}-${viewYear}`;
    return availableDates.includes(dStr);
  };

  return (
    <div className="custom-date-selector-wrapper" ref={containerRef}>
      {/* Single Unified Date Selector Trigger Pill */}
      <div className="single-date-trigger-container">
        <button
          type="button"
          className={`single-date-trigger-btn ${isOpen ? 'active-open' : ''} ${hasFilter ? 'has-filter-val' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle calendar date picker"
        >
          <span className="pill-icon-cal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
          <span className="single-date-pill-label">{getTriggerLabel()}</span>
          <span className={`pill-chevron ${isOpen ? 'rotated' : ''}`}>▾</span>
        </button>

        {hasFilter && (
          <button
            type="button"
            className="single-date-clear-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Clear date filter"
            aria-label="Clear date filter"
          >
            ✕
          </button>
        )}
      </div>

      {/* Theme-Matched Custom Calendar Dropdown */}
      {isOpen && (
        <div className="custom-calendar-dropdown unified-cal-popover">
          {/* Mode Toggle Row: Checkbox for Range Mode */}
          <div className="cal-mode-toggle-row">
            <label className="cal-checkbox-label">
              <input
                type="checkbox"
                checked={isRangeMode}
                onChange={(e) => onToggleRangeMode(e.target.checked)}
                className="theme-checkbox-input"
              />
              <span className="theme-custom-checkbox"></span>
              <span className="checkbox-label-text">Date Range Selector</span>
            </label>

            {isRangeMode && (
              <span className="range-step-badge">
                {rangeStep === 'from' ? '1. Pick Start' : '2. Pick End'}
              </span>
            )}
          </div>

          {/* Month & Year Selectable, Scrollable, and Typable Controls */}
          <div className="calendar-nav-header unified-nav-header">
            <button
              type="button"
              className={`cal-nav-btn ${!canGoPrev ? 'disabled' : ''}`}
              onClick={handlePrevMonth}
              disabled={!canGoPrev}
              aria-label="Previous month"
            >
              ‹
            </button>

            <div className="month-year-selectors">
              {/* Scrollable & Selectable Month Dropdown (Bounded by available months) */}
              <select
                value={viewMonth}
                onChange={handleMonthChange}
                className="cal-month-select"
                aria-label="Select month"
              >
                {monthNames.map((m, idx) => {
                  const isMonthDisabled =
                    (viewYear === minYear && idx < minMonth) ||
                    (viewYear === maxYear && idx > maxMonth) ||
                    viewYear < minYear ||
                    viewYear > maxYear;

                  return (
                    <option key={m} value={idx} disabled={isMonthDisabled}>
                      {m}
                    </option>
                  );
                })}
              </select>

              {/* Manually Typable & Auto-Clamped Year Input */}
              <div className="cal-year-input-wrapper">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={typedYearInput}
                  onChange={handleYearInputChange}
                  onBlur={handleYearInputBlur}
                  onKeyDown={handleYearInputKeyDown}
                  className="cal-year-typed-input"
                  aria-label="Type year"
                  title={`Allowed years: ${minYear}${minYear !== maxYear ? ` - ${maxYear}` : ''}`}
                />
              </div>
            </div>

            <button
              type="button"
              className={`cal-nav-btn ${!canGoNext ? 'disabled' : ''}`}
              onClick={handleNextMonth}
              disabled={!canGoNext}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="calendar-weekdays-grid">
            {daysOfWeek.map((d) => (
              <span key={d} className="cal-weekday">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-days-grid" onMouseLeave={() => setHoverDate(null)}>
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <span key={`empty-${idx}`} className="cal-day-empty"></span>
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const iso = formatToISO(viewYear, viewMonth, day);
              const { isSelected, isFrom, isTo, inRange, isDisabled } = getDayState(day);
              const hasModule = hasModuleOnDay(day);

              return (
                <button
                  type="button"
                  key={`day-${day}`}
                  disabled={isDisabled}
                  className={`cal-day-btn ${isDisabled ? 'day-disabled' : ''} ${isSelected ? 'day-single-selected' : ''} ${isFrom ? 'day-from' : ''} ${isTo ? 'day-to' : ''} ${inRange ? 'day-in-range' : ''}`}
                  onClick={() => handleSelectDay(day)}
                  onMouseEnter={() => !isDisabled && setHoverDate(iso)}
                >
                  <span className="day-number">{day}</span>
                  {hasModule && !isDisabled && <span className="day-module-dot" title="Module available"></span>}
                </button>
              );
            })}
          </div>

          {/* Quick Presets & Controls */}
          <div className="calendar-footer-controls">
            <div className="cal-presets">
              <button
                type="button"
                className="cal-preset-btn"
                onClick={() => {
                  setViewYear(2026);
                  setViewMonth(7);
                  if (isRangeMode) {
                    onFromDateChange(minDateISO);
                    onToDateChange('2026-08-31');
                  } else {
                    onSingleDateChange(minDateISO);
                  }
                }}
              >
                Aug 2026
              </button>
              <button
                type="button"
                className="cal-preset-btn"
                onClick={() => {
                  setViewYear(2026);
                  setViewMonth(8);
                  if (isRangeMode) {
                    onFromDateChange('2026-09-01');
                    onToDateChange(maxDateISO);
                  } else {
                    onSingleDateChange('2026-09-02');
                  }
                }}
              >
                Sep 2026
              </button>
            </div>

            <div className="cal-actions">
              {hasFilter && (
                <button type="button" className="cal-reset-btn" onClick={onClear}>
                  Reset
                </button>
              )}
              <button
                type="button"
                className="cal-done-btn"
                onClick={() => setIsOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
