"use client";

import Link from "next/link";
import GmpBadge from "./GmpBadge";
import StatusPill from "./StatusPill";

interface IpoCardProps {
  ipo: {
    slug: string;
    companyName: string;
    ipoType: string;
    priceBandLow?: number | null;
    priceBandHigh?: number | null;
    lotSize?: number | null;
    openDate?: string | null;
    closeDate?: string | null;
    listingDate?: string | null;
    gmp?: number | null;
    status: string;
    subscriptionTotal?: number | null;
    reviews?: { verdict?: string | null }[];
  };
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function IpoCard({ ipo }: IpoCardProps) {
  const applyCount =
    ipo.reviews?.filter(
      (r) => r.verdict === "Apply" || r.verdict === "Risky Apply"
    ).length ?? 0;
  const totalReviews = ipo.reviews?.length ?? 0;

  return (
    <Link href={`/ipo/${ipo.slug}`}>
      <div className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
              {ipo.companyName}
            </h3>
            <span className="text-xs text-gray-500">{ipo.ipoType}</span>
          </div>
          <StatusPill status={ipo.status} />
        </div>

        {/* Price & GMP */}
        <div className="mb-3 flex items-center gap-3">
          {ipo.priceBandHigh && (
            <span className="text-sm font-semibold text-gray-700">
              ₹{ipo.priceBandLow !== ipo.priceBandHigh && ipo.priceBandLow
                ? `${ipo.priceBandLow} - ${ipo.priceBandHigh}`
                : ipo.priceBandHigh}
            </span>
          )}
          <GmpBadge gmp={ipo.gmp ? Number(ipo.gmp) : null} priceHigh={ipo.priceBandHigh ? Number(ipo.priceBandHigh) : null} />
        </div>

        {/* Details grid */}
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>
            <span className="text-gray-400">Lot Size:</span>{" "}
            <span className="font-medium">{ipo.lotSize ?? "-"}</span>
          </div>
          <div>
            <span className="text-gray-400">Subscription:</span>{" "}
            <span className="font-medium">
              {ipo.subscriptionTotal ? `${ipo.subscriptionTotal}x` : "-"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Open:</span>{" "}
            <span className="font-medium">{formatDate(ipo.openDate)}</span>
          </div>
          <div>
            <span className="text-gray-400">Close:</span>{" "}
            <span className="font-medium">{formatDate(ipo.closeDate)}</span>
          </div>
        </div>

        {/* Expert verdict summary */}
        {totalReviews > 0 && (
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
            <span className="text-gray-500">Expert Verdict: </span>
            <span className="font-bold text-green-600">
              {applyCount}/{totalReviews} say Apply
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
