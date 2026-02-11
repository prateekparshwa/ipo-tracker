"use client";

import Link from "next/link";

interface FilterTabsProps {
  activeStatus: string;
}

const tabs = ["All", "Open", "Upcoming", "Closed", "Listed"];

export default function FilterTabs({ activeStatus }: FilterTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeStatus === tab;
        return (
          <Link
            key={tab}
            href={tab === "All" ? "/" : `/?status=${tab}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {tab}
          </Link>
        );
      })}
    </div>
  );
}
