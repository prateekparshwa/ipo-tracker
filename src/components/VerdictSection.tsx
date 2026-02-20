"use client";

import Image from "next/image";
import SentimentMeter from "./SentimentMeter";

interface Review {
  id?: number;
  youtuberName: string;
  videoUrl?: string | null;
  videoTitle?: string | null;
  verdict?: string | null;
  thumbnailUrl?: string | null;
  channelId?: string | null;
}

interface VerdictSectionProps {
  reviews: Review[];
}

const verdictColors: Record<string, string> = {
  Apply: "bg-green-100 text-green-800 border-green-300",
  Avoid: "bg-red-100 text-red-800 border-red-300",
  Neutral: "bg-gray-100 text-gray-700 border-gray-300",
  "Risky Apply": "bg-yellow-100 text-yellow-800 border-yellow-300",
};

// Tier 1 experts get a highlighted card
const TIER_1_EXPERTS = [
  "Anil Singhvi - Zee Business",
  "CA Rachana Ranade",
  "Akshat Shrivastava",
  "Pranjal Kamra",
];

export default function VerdictSection({ reviews }: VerdictSectionProps) {
  // Sort: Tier 1 experts first, then the rest
  const sorted = [...reviews].sort((a, b) => {
    const aIsTier1 = TIER_1_EXPERTS.includes(a.youtuberName) ? 0 : 1;
    const bIsTier1 = TIER_1_EXPERTS.includes(b.youtuberName) ? 0 : 1;
    return aIsTier1 - bIsTier1;
  });

  return (
    <div className="space-y-6">
      <SentimentMeter reviews={reviews} />

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-800">Expert Reviews</h3>

        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500">
            No expert reviews available yet for this IPO.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sorted.map((review, idx) => {
              const isTier1 = TIER_1_EXPERTS.includes(review.youtuberName);
              const verdictStyle =
                verdictColors[review.verdict ?? "Neutral"] ??
                verdictColors["Neutral"];

              return (
                <a
                  key={idx}
                  href={review.videoUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-xl border p-4 transition-all hover:shadow-md ${
                    isTier1
                      ? "border-blue-200 bg-blue-50/50 ring-1 ring-blue-100"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Thumbnail or avatar placeholder */}
                    {review.thumbnailUrl ? (
                      <Image
                        src={review.thumbnailUrl}
                        alt={review.youtuberName}
                        width={112}
                        height={64}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-gray-200 text-2xl">
                        ▶
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {review.youtuberName}
                        </span>
                        {isTier1 && (
                          <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            TOP EXPERT
                          </span>
                        )}
                      </div>

                      {review.videoTitle && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                          {review.videoTitle}
                        </p>
                      )}

                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold ${verdictStyle}`}
                        >
                          {review.verdict ?? "Neutral"}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
