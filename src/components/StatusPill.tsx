"use client";

interface StatusPillProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  Upcoming: "bg-blue-100 text-blue-800",
  Open: "bg-green-100 text-green-800 animate-pulse",
  Closed: "bg-yellow-100 text-yellow-800",
  Listed: "bg-purple-100 text-purple-800",
};

export default function StatusPill({ status }: StatusPillProps) {
  const style = statusStyles[status] || "bg-gray-100 text-gray-800";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {status === "Open" && (
        <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500" />
      )}
      {status}
    </span>
  );
}
