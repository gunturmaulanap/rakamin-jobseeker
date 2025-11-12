"use client";

import * as React from "react";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdOutlineKeyboardDoubleArrowLeft,
  MdOutlineKeyboardDoubleArrowRight,
} from "react-icons/md";

// English month names
const ENGLISH_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// English day names (single letter)
const ENGLISH_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

function CalendarContent({
  value,
  onChange,
  onClose,
}: {
  value?: string;
  onChange?: (date: string) => void;
  onClose: () => void;
}) {
  const [currentDate, setCurrentDate] = React.useState(() => {
    return value ? new Date(value) : new Date();
  });
  const [selectedDate, setSelectedDate] = React.useState(value);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);
  const startingDayOfWeek = getDay(firstDayOfMonth);

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    const dateString = newDate.toISOString().split("T")[0];
    setSelectedDate(dateString);
    onChange?.(dateString);
    onClose();
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handlePreviousYear = () => {
    setCurrentDate(new Date(currentYear - 1, currentMonth, 1));
  };

  const handleNextYear = () => {
    setCurrentDate(new Date(currentYear + 1, currentMonth, 1));
  };

  const renderCalendarDays = () => {
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected =
        selectedDate ===
        format(new Date(currentYear, currentMonth, day), "yyyy-MM-dd");
      const isToday =
        format(new Date(), "yyyy-MM-dd") ===
        format(new Date(currentYear, currentMonth, day), "yyyy-MM-dd");

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={cn(
            "h-8 w-8 rounded-full text-sm font-medium transition-colors",
            isSelected && "bg-[#01959F] text-white",
            isToday && !isSelected && "bg-gray-100 text-[#01959F]",
            !isSelected && !isToday && "hover:bg-gray-100 text-gray-900"
          )}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousYear}
            className="p-1"
            title="Previous year"
          >
            <MdOutlineKeyboardDoubleArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
            className="p-1"
            title="Previous month"
          >
            <MdKeyboardArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {ENGLISH_MONTHS[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="p-1"
            title="Next month"
          >
            <MdKeyboardArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextYear}
            className="p-1"
            title="Next year"
          >
            <MdOutlineKeyboardDoubleArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {ENGLISH_DAYS.map((day, index) => (
          <div
            key={index}
            className="h-8 w-8 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">{renderCalendarDays()}</div>
    </div>
  );
}

export function DatePicker({
  value,
  onChange,
  placeholder = "DD MM YYYY",
  className,
  error = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return placeholder;
    try {
      const date = new Date(dateString);
      const day = format(date, "dd");
      const month = ENGLISH_MONTHS[date.getMonth()];
      const year = format(date, "yyyy");
      return `${day} ${month} ${year}`;
    } catch {
      return placeholder;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white border focus:outline-none focus:ring-2",
            !value && "text-gray-500",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300 focus:border-[#01959F] focus:ring-[#01959F]/20",
            className
          )}
        >
          <CalendarIcon
            className={cn("mr-2 h-4 w-4", !value && "text-gray-600")}
          />
          {formatDateDisplay(value || "")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 shadow-lg border-0" align="start">
        <CalendarContent
          value={value}
          onChange={onChange}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
