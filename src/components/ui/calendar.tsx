"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 text-xs", className)}
      classNames={{
        months: "flex flex-col space-y-2",
        month: "space-y-2",
        caption:
          "flex justify-between items-center text-xs font-medium text-neutral-900 px-1",
        caption_label: "font-medium",
        nav: "flex items-center gap-1",
        nav_button:
          "inline-flex h-6 w-6 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-300",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "w-8 text-[10px] font-medium text-neutral-400 flex items-center justify-center",
        row: "flex w-full mt-1",
        cell: "relative flex h-8 w-8 items-center justify-center text-xs",
        day: "h-7 w-7 rounded-md flex items-center justify-center text-xs text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-300 aria-selected:bg-neutral-900 aria-selected:text-white",
        day_today:
          "border border-neutral-300 aria-selected:border-neutral-900",
        day_outside: "text-neutral-300 aria-selected:bg-neutral-100",
        day_disabled: "text-neutral-300 opacity-50",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}

