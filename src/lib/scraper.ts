import * as cheerio from "cheerio";
import { IpoData } from "./types";

// Internal type used only within this file to carry the detail-page URL
// for enrichment. Stripped before returning from fetchAllIPOs().
type IpoDataInternal = IpoData & { detailUrl?: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// ─── Existing helpers (unchanged) ─────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function determineStatus(
  openDate?: string,
  closeDate?: string,
  listingDate?: string
): IpoData["status"] {
  const now = new Date();

  if (listingDate) {
    // Listing at ~10:00 AM IST = 04:30 AM UTC on listing date
    const d = new Date(listingDate);
    const listingTime = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 4, 30, 0));
    if (listingTime <= now) return "Listed";
  }
  if (closeDate) {
    // Subscription closes at 3:30 PM IST = 10:00 AM UTC on close date
    const d = new Date(closeDate);
    const closeTime = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 10, 0, 0));
    if (closeTime <= now) return "Closed";
  }
  if (openDate) {
    // Subscription opens at 9:30 AM IST = 04:00 AM UTC on open date
    const d = new Date(openDate);
    const openTime = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 4, 0, 0));
    if (openTime <= now) return "Open";
  }
  return "Upcoming";
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      console.error(`fetchPage: HTTP ${response.status} for ${url}`);
      return null;
    }
    return await response.text();
  } catch (err) {
    console.error(`fetchPage: Failed to fetch ${url}:`, err);
    return null;
  }
}

// ─── Field parsers ────────────────────────────────────────────────────────────

/** Parses "Dec 22, 2025" → "2025-12-22" */
function parseLongDate(raw: string): string | undefined {
  const cleaned = raw.trim();
  if (!cleaned || cleaned === "-" || cleaned === "N/A") return undefined;
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

/** Parses "25-27 Feb" or "28 Feb-03 Mar" → { openDate, closeDate } in YYYY-MM-DD */
function parseShortDateRange(
  raw: string,
  baseYear: number
): { openDate?: string; closeDate?: string } {
  const cleaned = raw.trim();
  if (!cleaned || cleaned === "-") return {};

  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // "25-27 Feb" — same month
  const sameMonth = cleaned.match(/^(\d{1,2})-(\d{1,2})\s+([A-Za-z]{3})$/);
  if (sameMonth) {
    const [, startDay, endDay, monthStr] = sameMonth;
    const month = MONTH_MAP[monthStr];
    if (month === undefined) return {};
    const testDate = new Date(baseYear, month, parseInt(startDay));
    const year =
      testDate < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        ? baseYear + 1
        : baseYear;
    return {
      openDate: fmt(year, month, parseInt(startDay)),
      closeDate: fmt(year, month, parseInt(endDay)),
    };
  }

  // "28 Feb-03 Mar" — cross-month
  const crossMonth = cleaned.match(
    /^(\d{1,2})\s+([A-Za-z]{3})-(\d{1,2})\s+([A-Za-z]{3})$/
  );
  if (crossMonth) {
    const [, startDay, startMonthStr, endDay, endMonthStr] = crossMonth;
    const sm = MONTH_MAP[startMonthStr];
    const em = MONTH_MAP[endMonthStr];
    if (sm === undefined || em === undefined) return {};
    const endYear = em < sm ? baseYear + 1 : baseYear;
    return {
      openDate: fmt(baseYear, sm, parseInt(startDay)),
      closeDate: fmt(endYear, em, parseInt(endDay)),
    };
  }

  return {};
}

/** Parses "₹216 to ₹227" or "₹114" → { low, high } */
function parsePriceBand(raw: string): { low?: number; high?: number } {
  const cleaned = raw.replace(/₹|,|\s/g, "");
  const range = cleaned.match(/^(\d+(?:\.\d+)?)to(\d+(?:\.\d+)?)$/i);
  if (range) return { low: parseFloat(range[1]), high: parseFloat(range[2]) };
  const fixed = parseFloat(cleaned);
  if (!isNaN(fixed) && fixed > 0) return { low: fixed, high: fixed };
  return {};
}

/** Normalises "₹250.80 Cr." → "₹250.80 Cr" */
function parseIssueSize(raw: string): string | undefined {
  const cleaned = raw.trim();
  if (!cleaned || cleaned === "-") return undefined;
  return cleaned.replace(/Cr\.$/, "Cr").trim();
}

/** Parses "₹1.5" or "₹-2" → number; returns undefined for 0 or missing */
function parseGmp(raw: string): number | undefined {
  const cleaned = raw.replace(/₹|,|\s/g, "").trim();
  if (!cleaned || cleaned === "-") return undefined;
  const val = parseFloat(cleaned);
  if (isNaN(val) || val === 0) return undefined;
  return val;
}

/** Parses "5.26%" or "-3.65%" → number */
function parsePercent(raw: string): number | undefined {
  const cleaned = raw.replace(/%|\s/g, "").trim();
  if (!cleaned || cleaned === "-") return undefined;
  const val = parseFloat(cleaned);
  return isNaN(val) ? undefined : val;
}

/** Parses "₹120" → number */
function parsePrice(raw: string): number | undefined {
  const cleaned = raw.replace(/₹|,|\s/g, "").trim();
  if (!cleaned || cleaned === "-") return undefined;
  const val = parseFloat(cleaned);
  return isNaN(val) || val <= 0 ? undefined : val;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateBySlug(ipos: IpoData[]): IpoData[] {
  const map = new Map<string, IpoData>();
  for (const ipo of ipos) {
    const existing = map.get(ipo.slug);
    if (!existing) {
      map.set(ipo.slug, ipo);
    } else {
      const merged: IpoData = { ...existing };
      for (const key of Object.keys(ipo) as (keyof IpoData)[]) {
        if (ipo[key] !== undefined) {
          (merged as unknown as Record<string, unknown>)[key] = ipo[key];
        }
      }
      map.set(ipo.slug, merged);
    }
  }
  return Array.from(map.values());
}

/**
 * Secondary deduplication: catches the same IPO appearing under slightly
 * different names across tables (e.g. "Gaudium IVF" in the upcoming table
 * vs "Gaudium IVF & Women Health" in the listed table).
 *
 * Rule: if one slug is a strict prefix of another (e.g. "gaudium-ivf" is a
 * prefix of "gaudium-ivf-women-health") AND they share the same open or close
 * date, they are the same IPO. The shorter-named entry is removed and its
 * non-null fields fill any gaps in the longer-named entry.
 */
function fuzzyDeduplicateByPrefix(ipos: IpoDataInternal[]): IpoDataInternal[] {
  const result = [...ipos];
  const toRemove = new Set<number>();

  for (let i = 0; i < result.length; i++) {
    for (let j = 0; j < result.length; j++) {
      if (i === j || toRemove.has(i) || toRemove.has(j)) continue;
      const a = result[i];
      const b = result[j];

      // One slug must be a strict prefix of the other (separated by a dash)
      const aIsPrefix = b.slug.startsWith(a.slug + "-");
      const bIsPrefix = a.slug.startsWith(b.slug + "-");
      if (!aIsPrefix && !bIsPrefix) continue;

      // Must share the same open or close date to confirm it's the same IPO
      const sameOpen = a.openDate && b.openDate && a.openDate === b.openDate;
      const sameClose = a.closeDate && b.closeDate && a.closeDate === b.closeDate;
      if (!sameOpen && !sameClose) continue;

      // Keep the longer (more specific) name; remove the shorter one.
      // Merge any non-null fields from the shorter into the longer.
      const shorterIdx = aIsPrefix ? i : j;
      const longerIdx = aIsPrefix ? j : i;
      const shorter = result[shorterIdx];

      for (const key of Object.keys(shorter) as (keyof IpoDataInternal)[]) {
        if (shorter[key] !== undefined && result[longerIdx][key] === undefined) {
          (result[longerIdx] as unknown as Record<string, unknown>)[key] = shorter[key];
        }
      }
      toRemove.add(shorterIdx);
      console.log(
        `Merged duplicate: "${shorter.companyName}" → "${result[longerIdx].companyName}"`
      );
    }
  }

  return result.filter((_, idx) => !toRemove.has(idx));
}

// ─── Table scrapers ───────────────────────────────────────────────────────────

/**
 * Scrapes tablepress-17 (Mainboard listed) or tablepress-18 (SME listed).
 * Columns: company | openDate | closeDate | issueSize | priceBand | gmp | listingPrice | listingGain
 */
function scrapeListedIposTable(
  html: string,
  tableId: string,
  ipoType: "Mainboard" | "SME"
): IpoDataInternal[] {
  const $ = cheerio.load(html);
  const results: IpoDataInternal[] = [];

  $(`#${tableId} tbody tr`).each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 8) return;

    const companyName = $(cells[0]).text().trim();
    if (!companyName) return;

    const detailUrl = $(cells[0]).find("a").first().attr("href") || undefined;
    const openDate = parseLongDate($(cells[1]).text());
    const closeDate = parseLongDate($(cells[2]).text());
    const issueSize = parseIssueSize($(cells[3]).text());
    const { low: priceBandLow, high: priceBandHigh } = parsePriceBand($(cells[4]).text());
    const gmp = parseGmp($(cells[5]).text());
    const listingPrice = parsePrice($(cells[6]).text());
    const listingGainPercent = parsePercent($(cells[7]).text());

    // If listingPrice exists the IPO has listed
    const status: IpoData["status"] = listingPrice
      ? "Listed"
      : determineStatus(openDate, closeDate, undefined);

    results.push({
      companyName,
      slug: slugify(companyName),
      ipoType,
      openDate,
      closeDate,
      issueSize,
      priceBandLow,
      priceBandHigh,
      gmp,
      listingPrice,
      listingGainPercent,
      status,
      detailUrl,
    });
  });

  return results;
}

/**
 * Scrapes tablepress-22 (Mainboard upcoming) or tablepress-23 (SME upcoming).
 * Columns: company | dateRange | issueSize | priceBand | [platform] | [link]
 * Both tables live on the same page — share the loaded $ instance.
 */
function scrapeUpcomingIposTable(
  $: ReturnType<typeof cheerio.load>,
  tableId: string,
  ipoType: "Mainboard" | "SME"
): IpoDataInternal[] {
  const results: IpoDataInternal[] = [];
  const currentYear = new Date().getFullYear();

  $(`#${tableId} tbody tr`).each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 4) return;

    const companyName = $(cells[0]).text().trim();
    if (!companyName) return;

    const detailUrl = $(cells[0]).find("a").first().attr("href") || undefined;
    const { openDate, closeDate } = parseShortDateRange(
      $(cells[1]).text(),
      currentYear
    );
    const issueSize = parseIssueSize($(cells[2]).text());
    const { low: priceBandLow, high: priceBandHigh } = parsePriceBand($(cells[3]).text());

    const status = determineStatus(openDate, closeDate, undefined);

    results.push({
      companyName,
      slug: slugify(companyName),
      ipoType,
      openDate,
      closeDate,
      issueSize,
      priceBandLow,
      priceBandHigh,
      status,
      detailUrl,
    });
  });

  return results;
}

// ─── Detail-page enrichment ───────────────────────────────────────────────────

/**
 * Fetches an IPO's detail page and extracts listing date + lot size.
 * Uses a short timeout so one slow page can't stall the whole cron job.
 */
async function enrichIpoDetails(
  detailUrl: string
): Promise<{ listingDate?: string; lotSize?: number }> {
  try {
    const response = await fetch(detailUrl, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return {};

    const html = await response.text();
    // Strip tags for plain-text regex matching
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    // "IPO to list on ... on March 2, 2026" or "to list on BSE SME on Feb 27, 2026"
    let listingDate: string | undefined;
    const listingMatch = text.match(
      /to list\b[^.]*?\bon\s+([A-Z][a-z]+ \d{1,2},\s*\d{4})/i
    );
    if (listingMatch) {
      const d = new Date(listingMatch[1]);
      if (!isNaN(d.getTime())) listingDate = d.toISOString().slice(0, 10);
    }

    // "minimum market lot is 4,000 shares" or "lot size is 2000 shares"
    let lotSize: number | undefined;
    const lotMatch = text.match(/(?:minimum market )?lot (?:size )?is ([\d,]+)\s*shares/i);
    if (lotMatch) {
      const parsed = parseInt(lotMatch[1].replace(/,/g, ""), 10);
      if (!isNaN(parsed) && parsed > 0) lotSize = parsed;
    }

    return { listingDate, lotSize };
  } catch {
    return {};
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches all current Indian IPO data from ipowatch.in.
 * Scrapes 3 pages concurrently (mainboard listed, SME listed, upcoming).
 * Returns an empty array on any failure — never throws.
 */
export async function fetchAllIPOs(): Promise<IpoData[]> {
  try {
    const [mainboardHtml, smeHtml, upcomingHtml] = await Promise.all([
      fetchPage("https://www.ipowatch.in/mainboard-ipo/"),
      fetchPage("https://www.ipowatch.in/sme-ipo/"),
      fetchPage("https://www.ipowatch.in/upcoming-ipo/"),
    ]);

    const all: IpoDataInternal[] = [];

    if (mainboardHtml) {
      const ipos = scrapeListedIposTable(mainboardHtml, "tablepress-17", "Mainboard");
      console.log(`Scraped ${ipos.length} Mainboard listed IPOs`);
      all.push(...ipos);
    }

    if (smeHtml) {
      const ipos = scrapeListedIposTable(smeHtml, "tablepress-18", "SME");
      console.log(`Scraped ${ipos.length} SME listed IPOs`);
      all.push(...ipos);
    }

    if (upcomingHtml) {
      const $ = cheerio.load(upcomingHtml);
      const mainUpcoming = scrapeUpcomingIposTable($, "tablepress-22", "Mainboard");
      const smeUpcoming = scrapeUpcomingIposTable($, "tablepress-23", "SME");
      console.log(`Scraped ${mainUpcoming.length} Mainboard + ${smeUpcoming.length} SME upcoming IPOs`);
      all.push(...mainUpcoming, ...smeUpcoming);
    }

    const deduped = fuzzyDeduplicateByPrefix(
      deduplicateBySlug(all) as IpoDataInternal[]
    );

    // Enrich Open/Upcoming IPOs with listing date + lot size from their detail pages.
    // Only fetch if the data is actually missing to avoid unnecessary requests.
    const toEnrich = deduped.filter(
      (ipo) =>
        (ipo.status === "Open" || ipo.status === "Upcoming") &&
        ipo.detailUrl &&
        (!ipo.listingDate || !ipo.lotSize)
    );

    if (toEnrich.length > 0) {
      console.log(`Enriching ${toEnrich.length} IPOs with detail-page data...`);
      const enrichResults = await Promise.all(
        toEnrich.map((ipo) => enrichIpoDetails(ipo.detailUrl!))
      );
      for (let i = 0; i < toEnrich.length; i++) {
        const ipo = toEnrich[i];
        const { listingDate, lotSize } = enrichResults[i];
        if (listingDate && !ipo.listingDate) ipo.listingDate = listingDate;
        if (lotSize && !ipo.lotSize) ipo.lotSize = lotSize;
      }
    }

    // Strip internal detailUrl field before returning
    const cleaned: IpoData[] = deduped.map(({ detailUrl: _url, ...rest }) => rest);
    console.log(`fetchAllIPOs: returning ${cleaned.length} total IPOs`);
    return cleaned;
  } catch (err) {
    console.error("fetchAllIPOs: unexpected error:", err);
    return [];
  }
}

/**
 * Helper to create an IpoData object from manually provided information.
 * Useful for one-off manual data entry via the admin API.
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
