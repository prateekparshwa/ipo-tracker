export interface IpoData {
  id?: number;
  companyName: string;
  slug: string;
  ipoType: "Mainboard" | "SME";
  priceBandLow?: number;
  priceBandHigh?: number;
  lotSize?: number;
  issueSize?: string;
  openDate?: string;
  closeDate?: string;
  listingDate?: string;
  gmp?: number;
  gmpUpdatedAt?: string;
  subscriptionRetail?: number;
  subscriptionNii?: number;
  subscriptionQib?: number;
  subscriptionTotal?: number;
  listingPrice?: number;
  listingGainPercent?: number;
  status: "Upcoming" | "Open" | "Closed" | "Listed";
}

export interface ReviewData {
  id?: number;
  ipoId: number;
  youtuberName: string;
  channelId?: string;
  videoUrl?: string;
  videoTitle?: string;
  verdict?: "Apply" | "Avoid" | "Neutral" | "Risky Apply";
  thumbnailUrl?: string;
  publishedAt?: string;
}

export interface YoutuberData {
  id?: number;
  name: string;
  channelId: string;
  channelUrl?: string;
  subscriberCount?: string;
  avatarUrl?: string;
  tier: 1 | 2;
  platform: "YouTube" | "TV";
  isActive: boolean;
}

export interface IpoWithReviews extends IpoData {
  reviews: ReviewData[];
}
