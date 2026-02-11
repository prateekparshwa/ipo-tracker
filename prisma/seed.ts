import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma 7 requires a driver adapter — can't use bare PrismaClient()
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const youtubers = [
  // Tier 1 — Top Experts
  {
    name: "Anil Singhvi - Zee Business",
    channelId: "UCkKRCGMjCxMqRMRSCRURgJQ",
    channelUrl: "https://www.youtube.com/@ZeeBusinessTV",
    subscriberCount: "10M+",
    tier: 1,
    platform: "TV",
  },
  {
    name: "CA Rachana Ranade",
    channelId: "UCpnkqOkGJCN2kPFqnBbgFJA",
    channelUrl: "https://www.youtube.com/@CArachanaranade",
    subscriberCount: "4.88M",
    tier: 1,
    platform: "YouTube",
  },
  {
    name: "Akshat Shrivastava",
    channelId: "UCqW8jxh4tH1Z1sWPbkGWL4g",
    channelUrl: "https://www.youtube.com/@AkshatShrivastava",
    subscriberCount: "1.9M",
    tier: 1,
    platform: "YouTube",
  },
  {
    name: "Pranjal Kamra",
    channelId: "UCkRD0HIdgMlITYnvvpBtFzg",
    channelUrl: "https://www.youtube.com/@praborker",
    subscriberCount: "6.06M",
    tier: 1,
    platform: "YouTube",
  },
  // Tier 2 — Popular YouTubers
  {
    name: "Asset Yogi",
    channelId: "UCjoMZ0qm-UR1Nnof97Y9RnQ",
    channelUrl: "https://www.youtube.com/@AssetYogi",
    subscriberCount: "3.81M",
    tier: 2,
    platform: "YouTube",
  },
  {
    name: "Shashank Udupa",
    channelId: "UC9y8Q2FHjl3PLNZ0WdKzdkQ",
    channelUrl: "https://www.youtube.com/@ShashankUdupa",
    subscriberCount: "500K+",
    tier: 2,
    platform: "YouTube",
  },
  {
    name: "PR Sundar",
    channelId: "UCPFQqFE8RAu1GfH-G7CNqrQ",
    channelUrl: "https://www.youtube.com/@PRSundar",
    subscriberCount: "1.15M",
    tier: 2,
    platform: "YouTube",
  },
  {
    name: "Labour Law Advisor",
    channelId: "UCdhKBjE6-_7FdPCBIZ8Ueyg",
    channelUrl: "https://www.youtube.com/@LabourLawAdvisor",
    subscriberCount: "3.77M",
    tier: 2,
    platform: "YouTube",
  },
];

async function main() {
  console.log("Seeding youtubers...");

  for (const yt of youtubers) {
    await prisma.youtuber.upsert({
      where: { channelId: yt.channelId },
      update: {
        name: yt.name,
        channelUrl: yt.channelUrl,
        subscriberCount: yt.subscriberCount,
        tier: yt.tier,
        platform: yt.platform,
      },
      create: {
        name: yt.name,
        channelId: yt.channelId,
        channelUrl: yt.channelUrl,
        subscriberCount: yt.subscriberCount,
        tier: yt.tier,
        platform: yt.platform,
      },
    });
    console.log(`  Seeded: ${yt.name}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
