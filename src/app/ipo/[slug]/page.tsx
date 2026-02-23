import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import VerdictSection from "@/components/VerdictSection";
import GmpBadge from "@/components/GmpBadge";
import StatusPill from "@/components/StatusPill";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatDate(date?: Date | null): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const ipo = await prisma.ipo.findUnique({ where: { slug } });
    if (!ipo) return { title: "IPO Not Found" };
    return {
      title: `${ipo.companyName} IPO - Expert Verdicts | IPO Tracker India`,
      description: `${ipo.companyName} IPO details, GMP, subscription status, and expert opinions from top finance YouTubers.`,
    };
  } catch {
    return { title: "IPO Tracker India" };
  }
}

export default async function IpoDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let ipo;
  try {
    ipo = await prisma.ipo.findUnique({
      where: { slug },
      include: {
        reviews: {
          orderBy: { publishedAt: "desc" },
        },
      },
    });
  } catch {
    notFound();
  }

  if (!ipo) {
    notFound();
  }

  const priceHigh = ipo.priceBandHigh ? Number(ipo.priceBandHigh) : null;
  const priceLow = ipo.priceBandLow ? Number(ipo.priceBandLow) : null;
  const gmp = ipo.gmp != null ? Number(ipo.gmp) : null;
  const expectedListing = priceHigh && gmp ? priceHigh + gmp : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Back to all IPOs
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column — IPO details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company header */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {ipo.companyName}
                  </h1>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {ipo.ipoType}
                    </span>
                    <StatusPill status={ipo.status} />
                  </div>
                </div>
                <GmpBadge gmp={gmp} priceHigh={priceHigh} />
              </div>

              {/* Price info */}
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-500">Price Band</p>
                  <p className="text-lg font-bold text-gray-900">
                    {priceHigh
                      ? `₹${priceLow !== priceHigh && priceLow ? `${priceLow} - ${priceHigh}` : priceHigh}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lot Size</p>
                  <p className="text-lg font-bold text-gray-900">
                    {ipo.lotSize ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Issue Size</p>
                  <p className="text-lg font-bold text-gray-900">
                    {ipo.issueSize ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">
                    Min Investment
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {ipo.lotSize && priceHigh
                      ? `₹${(ipo.lotSize * priceHigh).toLocaleString("en-IN")}`
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Dates & Status */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-800">
                IPO Timeline
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div
                    className={`mx-auto h-3 w-3 rounded-full ${
                      ipo.status === "Open" || ipo.status === "Closed" || ipo.status === "Listed"
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <p className="mt-2 text-xs text-gray-500">Open Date</p>
                  <p className="text-sm font-semibold">
                    {formatDate(ipo.openDate)}
                  </p>
                </div>
                <div className="text-center">
                  <div
                    className={`mx-auto h-3 w-3 rounded-full ${
                      ipo.status === "Closed" || ipo.status === "Listed"
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  <p className="mt-2 text-xs text-gray-500">Close Date</p>
                  <p className="text-sm font-semibold">
                    {formatDate(ipo.closeDate)}
                  </p>
                </div>
                <div className="text-center">
                  <div
                    className={`mx-auto h-3 w-3 rounded-full ${
                      ipo.status === "Listed" ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <p className="mt-2 text-xs text-gray-500">Listing Date</p>
                  <p className="text-sm font-semibold">
                    {formatDate(ipo.listingDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            {(ipo.subscriptionRetail || ipo.subscriptionNii || ipo.subscriptionQib) && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-bold text-gray-800">
                  Subscription Status
                </h2>
                <div className="space-y-3">
                  {[
                    { label: "Retail", value: ipo.subscriptionRetail },
                    { label: "NII (HNI)", value: ipo.subscriptionNii },
                    { label: "QIB", value: ipo.subscriptionQib },
                    { label: "Total", value: ipo.subscriptionTotal },
                  ].map((item) => {
                    const val = item.value ? Number(item.value) : 0;
                    const maxWidth = Math.min(val * 10, 100); // Scale: 10x = 100%
                    return (
                      <div key={item.label}>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-bold text-gray-900">
                            {val ? `${val}x` : "-"}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-blue-500 transition-all"
                            style={{ width: `${maxWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right column — Expert Verdicts */}
          <div className="space-y-6">
            {/* GMP & Expected Listing */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-gray-800">
                Grey Market Premium
              </h2>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {gmp !== null ? `₹${gmp}` : "N/A"}
                </p>
                <p className="mt-1 text-xs text-gray-500">Current GMP</p>
                {expectedListing && (
                  <div className="mt-3 rounded-lg bg-green-50 p-3">
                    <p className="text-xs text-green-600">Expected Listing</p>
                    <p className="text-xl font-bold text-green-700">
                      ₹{expectedListing}
                    </p>
                  </div>
                )}
                {ipo.gmpUpdatedAt && (
                  <p className="mt-2 text-[10px] text-gray-400">
                    Updated: {formatDate(ipo.gmpUpdatedAt)}
                  </p>
                )}
              </div>
            </div>

            {/* Expert Verdicts */}
            <VerdictSection reviews={ipo.reviews} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-400 sm:px-6 lg:px-8">
          <p>
            <strong>Disclaimer:</strong> GMP is unofficial and not regulated by
            SEBI. Expert opinions are their own. This is not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
