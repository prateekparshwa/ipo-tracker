import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchYouTubeReviews } from "@/lib/youtube";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all IPOs that are Upcoming or Open — these need reviews
    const activeIpos = await prisma.ipo.findMany({
      where: {
        status: { in: ["Upcoming", "Open"] },
      },
      select: { id: true, companyName: true },
    });

    if (activeIpos.length === 0) {
      return NextResponse.json({
        message: "No active IPOs to fetch reviews for",
        count: 0,
      });
    }

    let totalReviews = 0;

    for (const ipo of activeIpos) {
      const reviews = await fetchYouTubeReviews(ipo.id, ipo.companyName);

      for (const review of reviews) {
        // Upsert by matching ipo_id + video_url to avoid duplicates
        if (!review.videoUrl) continue;

        const existing = await prisma.review.findFirst({
          where: {
            ipoId: ipo.id,
            videoUrl: review.videoUrl,
          },
        });

        if (!existing) {
          await prisma.review.create({
            data: {
              ipoId: review.ipoId,
              youtuberName: review.youtuberName,
              channelId: review.channelId,
              videoUrl: review.videoUrl,
              videoTitle: review.videoTitle,
              verdict: review.verdict,
              thumbnailUrl: review.thumbnailUrl,
              publishedAt: review.publishedAt
                ? new Date(review.publishedAt)
                : null,
            },
          });
          totalReviews++;
        }
      }
    }

    return NextResponse.json({
      message: "YouTube reviews updated successfully",
      iposChecked: activeIpos.length,
      newReviews: totalReviews,
    });
  } catch (error) {
    console.error("Cron update-reviews error:", error);
    return NextResponse.json(
      { error: "Failed to update reviews" },
      { status: 500 }
    );
  }
}
