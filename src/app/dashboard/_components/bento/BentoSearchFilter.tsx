"use client";

import React from 'react';
import CustomDateRangePicker from './CustomDateRangePicker';

interface BentoSearchFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isRangeMode: boolean;
  onToggleRangeMode: (isRange: boolean) => void;
  singleDate: string;
  fromDate: string;
  toDate: string;
  onSingleDateChange: (date: string) => void;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onClearDate: () => void;
  availableDates?: string[];
}

export default function BentoSearchFilter({
  searchQuery,
  onSearchChange,
  isRangeMode,
  onToggleRangeMode,
  singleDate,
  fromDate,
  toDate,
  onSingleDateChange,
  onFromDateChange,
  onToDateChange,
  onClearDate,
  availableDates = [],
}: BentoSearchFilterProps) {
  return (
    <div className="bento-search-filter-bar">
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input-field"
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <CustomDateRangePicker
        isRangeMode={isRangeMode}
        onToggleRangeMode={onToggleRangeMode}
        singleDate={singleDate}
        fromDate={fromDate}
        toDate={toDate}
        onSingleDateChange={onSingleDateChange}
        onFromDateChange={onFromDateChange}
        onToDateChange={onToDateChange}
        onClear={onClearDate}
        availableDates={availableDates}
      />
    </div>
  );
}
