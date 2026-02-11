import { IpoData } from "./types";

// Utility to create a URL-friendly slug from company name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Determine IPO status based on dates
function determineStatus(
  openDate?: string,
  closeDate?: string,
  listingDate?: string
): IpoData["status"] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (listingDate) {
    const listing = new Date(listingDate);
    if (listing <= now) return "Listed";
  }
  if (closeDate) {
    const close = new Date(closeDate);
    if (close < now) return "Closed";
  }
  if (openDate) {
    const open = new Date(openDate);
    if (open <= now) return "Open";
  }
  return "Upcoming";
}

/**
 * ETHICAL APPROACH: Instead of scraping third-party websites, we use:
 *
 * 1. Manual data entry via the admin/cron API (you add IPO data yourself)
 * 2. Sample seed data to demonstrate the app
 * 3. Future: integrate with official NSE/BSE APIs if they provide public endpoints
 *
 * WHY: Scraping websites like InvestorGain or Chittorgarh without permission
 * may violate their Terms of Service. We respect content creators and data owners.
 */

/**
 * Returns sample/seed IPO data for demonstration purposes.
 * In production, you'd enter IPO data manually via an admin panel or API,
 * or integrate with official stock exchange APIs.
 */
export async function fetchAllIPOs(): Promise<IpoData[]> {
  // Sample IPO data for demonstration — replace with real data manually
  const sampleIPOs: IpoData[] = [
    {
      companyName: "Sample Tech Ltd",
      slug: slugify("Sample Tech Ltd"),
      ipoType: "Mainboard",
      priceBandLow: 300,
      priceBandHigh: 320,
      lotSize: 46,
      issueSize: "₹1,200 Cr",
      openDate: "2026-02-15",
      closeDate: "2026-02-18",
      listingDate: "2026-02-21",
      gmp: 45,
      status: determineStatus("2026-02-15", "2026-02-18", "2026-02-21"),
    },
    {
      companyName: "Green Energy Solutions",
      slug: slugify("Green Energy Solutions"),
      ipoType: "Mainboard",
      priceBandLow: 180,
      priceBandHigh: 195,
      lotSize: 76,
      issueSize: "₹800 Cr",
      openDate: "2026-02-20",
      closeDate: "2026-02-24",
      status: determineStatus("2026-02-20", "2026-02-24"),
      gmp: 30,
    },
    {
      companyName: "Digital Payments India",
      slug: slugify("Digital Payments India"),
      ipoType: "SME",
      priceBandLow: 90,
      priceBandHigh: 95,
      lotSize: 1600,
      issueSize: "₹50 Cr",
      openDate: "2026-02-12",
      closeDate: "2026-02-14",
      listingDate: "2026-02-19",
      status: determineStatus("2026-02-12", "2026-02-14", "2026-02-19"),
      gmp: 15,
    },
  ];

  return sampleIPOs;
}

/**
 * Helper to create an IPO data object from manually provided information.
 * Use this when adding real IPO data via the admin API.
 */
export function createIpoData(params: {
  companyName: string;
  ipoType?: "Mainboard" | "SME";
  priceBandLow?: number;
  priceBandHigh?: number;
  lotSize?: number;
  issueSize?: string;
  openDate?: string;
  closeDate?: string;
  listingDate?: string;
  gmp?: number;
}): IpoData {
  return {
    companyName: params.companyName,
    slug: slugify(params.companyName),
    ipoType: params.ipoType ?? "Mainboard",
    priceBandLow: params.priceBandLow,
    priceBandHigh: params.priceBandHigh,
    lotSize: params.lotSize,
    issueSize: params.issueSize,
    openDate: params.openDate,
    closeDate: params.closeDate,
    listingDate: params.listingDate,
    gmp: params.gmp,
    status: determineStatus(params.openDate, params.closeDate, params.listingDate),
  };
}
