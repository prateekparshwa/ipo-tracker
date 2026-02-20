import { prisma } from "@/lib/prisma";
import type { Ipo, Review } from "@/generated/prisma/client";
import IpoCard from "@/components/IpoCard";
import FilterTabs from "@/components/FilterTabs";

type IpoWithReviews = Ipo & { reviews: Review[] };

// Force dynamic rendering since we fetch from DB
export const dynamic = "force-dynamic";

export const metadata = {
  title: "IPO Tracker India - Upcoming IPOs with Expert Verdicts",
  description:
    "Track upcoming Indian IPOs with Grey Market Premium (GMP), subscription status, and expert opinions from top finance YouTubers like Anil Singhvi, CA Rachana Ranade, and more.",
};

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status;

  let ipos: IpoWithReviews[] = [];
  try {
    // Fetch all IPOs — we filter by recalculated status below
    ipos = await prisma.ipo.findMany({
      include: { reviews: true },
      orderBy: [{ openDate: "desc" }],
    });
  } catch (error) {
    console.error("Failed to fetch IPOs from database:", error);
    ipos = [];
  }

  // Recalculate status dynamically so filter tabs are always accurate
  // regardless of when the cron last ran
  function recalcStatus(ipo: IpoWithReviews): IpoWithReviews {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let status = "Upcoming";
    if (ipo.listingDate) {
      const d = new Date(ipo.listingDate); d.setHours(0, 0, 0, 0);
      if (d <= now) status = "Listed";
    }
    if (status === "Upcoming" && ipo.closeDate) {
      const d = new Date(ipo.closeDate); d.setHours(0, 0, 0, 0);
      if (d < now) status = "Closed";
    }
    if (status === "Upcoming" && ipo.openDate) {
      const d = new Date(ipo.openDate); d.setHours(0, 0, 0, 0);
      if (d <= now) status = "Open";
    }
    return { ...ipo, status };
  }

  const recalculated = ipos.map(recalcStatus);

  // Apply status filter after recalculation
  const filtered =
    statusFilter && statusFilter !== "All"
      ? recalculated.filter((ipo) => ipo.status === statusFilter)
      : recalculated;

  // Separate by status for ordering: Open > Upcoming > Closed > Listed
  const statusOrder = ["Open", "Upcoming", "Closed", "Listed"];
  const sorted = [...filtered].sort((a, b) => {
    const aIdx = statusOrder.indexOf(a.status ?? "Upcoming");
    const bIdx = statusOrder.indexOf(b.status ?? "Upcoming");
    if (aIdx !== bIdx) return aIdx - bIdx;
    const aDate = a.openDate ? new Date(a.openDate).getTime() : 0;
    const bDate = b.openDate ? new Date(b.openDate).getTime() : 0;
    return bDate - aDate;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                IPO Tracker India
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Upcoming IPOs with expert verdicts from top finance YouTubers
              </p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Data updated every 6 hours</p>
              <p>Not financial advice</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter tabs */}
        <FilterTabs activeStatus={statusFilter || "All"} />

        {/* IPO Grid */}
        {sorted.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((ipo) => (
              <IpoCard
                key={ipo.id}
                ipo={{
                  ...ipo,
                  priceBandLow: ipo.priceBandLow
                    ? Number(ipo.priceBandLow)
                    : null,
                  priceBandHigh: ipo.priceBandHigh
                    ? Number(ipo.priceBandHigh)
                    : null,
                  gmp: ipo.gmp ? Number(ipo.gmp) : null,
                  subscriptionTotal: ipo.subscriptionTotal
                    ? Number(ipo.subscriptionTotal)
                    : null,
                  openDate: ipo.openDate?.toISOString() ?? null,
                  closeDate: ipo.closeDate?.toISOString() ?? null,
                  listingDate: ipo.listingDate?.toISOString() ?? null,
                  reviews: ipo.reviews,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center">
            <div className="text-4xl">📊</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-700">
              No IPOs found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {statusFilter && statusFilter !== "All"
                ? `No ${statusFilter.toLowerCase()} IPOs at the moment. Try a different filter.`
                : "Connect your Supabase database and run the data pipeline to see IPOs here."}
            </p>
            <p className="mt-4 text-xs text-gray-400">
              Run the cron endpoint to fetch IPO data:
              <code className="ml-1 rounded bg-gray-100 px-2 py-1">
                GET /api/cron/update-ipos?secret=YOUR_SECRET
              </code>
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-400 sm:px-6 lg:px-8">
          <p>
            <strong>Disclaimer:</strong> GMP (Grey Market Premium) is unofficial
            and sourced from market intelligence. This is not financial advice.
            Always do your own research before investing.
          </p>
          <p className="mt-2">
            Expert verdicts sourced from YouTube. IPO data entered manually.
          </p>
        </div>
      </footer>
    </div>
  );
}
