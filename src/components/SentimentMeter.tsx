"use client";

interface SentimentMeterProps {
  reviews: {
    verdict?: string | null;
    youtuberName: string;
  }[];
}

export default function SentimentMeter({ reviews }: SentimentMeterProps) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
        No expert reviews yet
      </div>
    );
  }

  const applyCount = reviews.filter(
    (r) => r.verdict === "Apply" || r.verdict === "Risky Apply"
  ).length;
  const avoidCount = reviews.filter((r) => r.verdict === "Avoid").length;
  const neutralCount = reviews.filter((r) => r.verdict === "Neutral").length;
  const total = reviews.length;
  const applyPercent = Math.round((applyCount / total) * 100);

  let sentiment: string;
  let sentimentColor: string;
  let bgColor: string;

  if (applyPercent >= 70) {
    sentiment = "Strong Apply";
    sentimentColor = "text-green-700";
    bgColor = "bg-green-500";
  } else if (applyPercent >= 50) {
    sentiment = "Moderate Apply";
    sentimentColor = "text-green-600";
    bgColor = "bg-green-400";
  } else if (applyPercent >= 30) {
    sentiment = "Mixed Opinions";
    sentimentColor = "text-yellow-600";
    bgColor = "bg-yellow-400";
  } else {
    sentiment = "Mostly Avoid";
    sentimentColor = "text-red-600";
    bgColor = "bg-red-500";
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Expert Consensus</h3>
        <span className={`text-sm font-bold ${sentimentColor}`}>{sentiment}</span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${bgColor}`}
          style={{ width: `${applyPercent}%` }}
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs text-gray-500">
        <span className="text-green-600 font-medium">
          {applyCount} Apply
        </span>
        <span className="text-yellow-600 font-medium">
          {neutralCount} Neutral
        </span>
        <span className="text-red-600 font-medium">
          {avoidCount} Avoid
        </span>
      </div>

      <p className="mt-2 text-center text-lg font-bold text-gray-800">
        {applyCount} out of {total} experts say Apply
      </p>
    </div>
  );
}
