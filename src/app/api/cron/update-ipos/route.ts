import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchAllIPOs } from "@/lib/scraper";

export async function POST(request: Request) {
  // Protect cron endpoint with a secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ipos = await fetchAllIPOs();

    if (ipos.length === 0) {
      return NextResponse.json({
        message: "No IPOs found from scrapers",
        count: 0,
      });
    }

    let upsertCount = 0;

    for (const ipo of ipos) {
      await prisma.ipo.upsert({
        where: { slug: ipo.slug },
        update: {
          companyName: ipo.companyName,
          ipoType: ipo.ipoType,
          priceBandLow: ipo.priceBandLow,
          priceBandHigh: ipo.priceBandHigh,
          lotSize: ipo.lotSize,
          issueSize: ipo.issueSize,
          openDate: ipo.openDate ? new Date(ipo.openDate) : null,
          closeDate: ipo.closeDate ? new Date(ipo.closeDate) : null,
          listingDate: ipo.listingDate ? new Date(ipo.listingDate) : null,
          gmp: ipo.gmp,
          gmpUpdatedAt: ipo.gmp ? new Date() : undefined,
          subscriptionRetail: ipo.subscriptionRetail,
          subscriptionNii: ipo.subscriptionNii,
          subscriptionQib: ipo.subscriptionQib,
          subscriptionTotal: ipo.subscriptionTotal,
          listingPrice: ipo.listingPrice,
          listingGainPercent: ipo.listingGainPercent,
          status: ipo.status,
        },
        create: {
          companyName: ipo.companyName,
          slug: ipo.slug,
          ipoType: ipo.ipoType,
          priceBandLow: ipo.priceBandLow,
          priceBandHigh: ipo.priceBandHigh,
          lotSize: ipo.lotSize,
          issueSize: ipo.issueSize,
          openDate: ipo.openDate ? new Date(ipo.openDate) : null,
          closeDate: ipo.closeDate ? new Date(ipo.closeDate) : null,
          listingDate: ipo.listingDate ? new Date(ipo.listingDate) : null,
          gmp: ipo.gmp,
          gmpUpdatedAt: ipo.gmp ? new Date() : null,
          subscriptionRetail: ipo.subscriptionRetail,
          subscriptionNii: ipo.subscriptionNii,
          subscriptionQib: ipo.subscriptionQib,
          subscriptionTotal: ipo.subscriptionTotal,
          listingPrice: ipo.listingPrice,
          listingGainPercent: ipo.listingGainPercent,
          status: ipo.status,
        },
      });
      upsertCount++;
    }

    return NextResponse.json({
      message: "IPO data updated successfully",
      count: upsertCount,
    });
  } catch (error) {
    console.error("Cron update-ipos error:", error);
    return NextResponse.json(
      { error: "Failed to update IPO data" },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing in browser
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Re-use POST logic by creating a fake request
  const fakeRequest = new Request(request.url, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
  });

  return POST(fakeRequest);
}
