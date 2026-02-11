import { ReviewData } from "./types";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// Curated list of finance channels with their YouTube channel IDs
export const CURATED_CHANNELS = [
  // Tier 1 — Top Experts (shown first, larger cards)
  {
    name: "Anil Singhvi - Zee Business",
    channelId: "UCkKRCGMjCxMqRMRSCRURgJQ",
    tier: 1,
    platform: "TV" as const,
  },
  {
    name: "CA Rachana Ranade",
    channelId: "UCpnkqOkGJCN2kPFqnBbgFJA",
    tier: 1,
    platform: "YouTube" as const,
  },
  {
    name: "Akshat Shrivastava",
    channelId: "UCqW8jxh4tH1Z1sWPbkGWL4g",
    tier: 1,
    platform: "YouTube" as const,
  },
  {
    name: "Pranjal Kamra",
    channelId: "UCkRD0HIdgMlITYnvvpBtFzg",
    tier: 1,
    platform: "YouTube" as const,
  },
  // Tier 2 — Popular YouTubers
  {
    name: "Asset Yogi",
    channelId: "UCjoMZ0qm-UR1Nnof97Y9RnQ",
    tier: 2,
    platform: "YouTube" as const,
  },
  {
    name: "Shashank Udupa",
    channelId: "UC9y8Q2FHjl3PLNZ0WdKzdkQ",
    tier: 2,
    platform: "YouTube" as const,
  },
  {
    name: "PR Sundar",
    channelId: "UCPFQqFE8RAu1GfH-G7CNqrQ",
    tier: 2,
    platform: "YouTube" as const,
  },
  {
    name: "Labour Law Advisor",
    channelId: "UCdhKBjE6-_7FdPCBIZ8Ueyg",
    tier: 2,
    platform: "YouTube" as const,
  },
];

interface YouTubeSearchResult {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

/**
 * Analyze video title to determine the reviewer's verdict on an IPO.
 * Uses keyword matching on the title text.
 */
function analyzeVerdict(
  title: string
): "Apply" | "Avoid" | "Neutral" | "Risky Apply" {
  const lower = title.toLowerCase();

  // Strong "avoid" signals
  const avoidKeywords = [
    "avoid",
    "don't apply",
    "dont apply",
    "stay away",
    "not recommended",
    "skip",
    "danger",
    "fraud",
    "scam",
    "reject",
    "mat lagao",
  ];
  if (avoidKeywords.some((kw) => lower.includes(kw))) {
    return "Avoid";
  }

  // Strong "apply" signals
  const applyKeywords = [
    "must apply",
    "apply",
    "subscribe",
    "buy",
    "invest",
    "jackpot",
    "blockbuster",
    "multibagger",
    "lagao",
  ];
  // "Risky apply" signals
  const riskyKeywords = [
    "risky",
    "risk",
    "careful",
    "caution",
    "partially",
    "50-50",
  ];

  const hasApply = applyKeywords.some((kw) => lower.includes(kw));
  const hasRisky = riskyKeywords.some((kw) => lower.includes(kw));

  if (hasApply && hasRisky) return "Risky Apply";
  if (hasApply) return "Apply";

  return "Neutral";
}

/**
 * Search YouTube for IPO review videos from a specific channel.
 * Uses the YouTube Data API v3 search endpoint.
 */
async function searchChannelForIPO(
  channelId: string,
  ipoName: string
): Promise<YouTubeSearchResult[]> {
  if (!YOUTUBE_API_KEY) {
    console.warn("YouTube API key not configured");
    return [];
  }

  const query = `${ipoName} IPO`;
  const params = new URLSearchParams({
    part: "snippet",
    channelId,
    q: query,
    type: "video",
    maxResults: "2",
    order: "date",
    key: YOUTUBE_API_KEY,
  });

  try {
    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!response.ok) {
      console.error(`YouTube API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error(`Error searching YouTube for ${ipoName}:`, error);
    return [];
  }
}

/**
 * Fetch IPO reviews from all curated YouTube channels for a given IPO.
 * Returns an array of ReviewData with auto-detected verdicts.
 */
export async function fetchYouTubeReviews(
  ipoId: number,
  ipoName: string
): Promise<ReviewData[]> {
  const reviews: ReviewData[] = [];

  // Search each channel — we do this sequentially to respect API quota
  for (const channel of CURATED_CHANNELS) {
    const results = await searchChannelForIPO(channel.channelId, ipoName);

    for (const result of results) {
      const title = result.snippet.title;
      // Only include if the video title actually mentions the IPO
      if (!title.toLowerCase().includes(ipoName.toLowerCase().split(" ")[0])) {
        continue;
      }

      const thumbnail =
        result.snippet.thumbnails.high?.url ||
        result.snippet.thumbnails.medium?.url ||
        result.snippet.thumbnails.default?.url;

      reviews.push({
        ipoId,
        youtuberName: channel.name,
        channelId: channel.channelId,
        videoUrl: `https://www.youtube.com/watch?v=${result.id.videoId}`,
        videoTitle: title,
        verdict: analyzeVerdict(title),
        thumbnailUrl: thumbnail,
        publishedAt: result.snippet.publishedAt,
      });
    }
  }

  return reviews;
}
