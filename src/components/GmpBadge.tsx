"use client";

interface GmpBadgeProps {
  gmp: number | null | undefined;
  priceHigh: number | null | undefined;
}

export default function GmpBadge({ gmp, priceHigh }: GmpBadgeProps) {
  if (gmp === null || gmp === undefined) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        GMP: N/A
      </span>
    );
  }

  const gmpPercent = priceHigh ? ((gmp / priceHigh) * 100).toFixed(1) : null;
  const isPositive = gmp > 0;
  const isNegative = gmp < 0;

  const colorClasses = isPositive
    ? "bg-green-100 text-green-800"
    : isNegative
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClasses}`}
    >
      GMP: ₹{gmp}
      {gmpPercent && (
        <span className="ml-1 opacity-75">({gmpPercent}%)</span>
      )}
    </span>
  );
}
