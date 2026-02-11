import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status"); // Upcoming, Open, Closed, Listed
  const type = searchParams.get("type"); // Mainboard, SME

  try {
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (type) {
      where.ipoType = type;
    }

    const ipos = await prisma.ipo.findMany({
      where,
      include: {
        reviews: {
          orderBy: { publishedAt: "desc" },
        },
      },
      orderBy: [
        { status: "asc" }, // Upcoming and Open first
        { openDate: "desc" },
      ],
    });

    return NextResponse.json(ipos);
  } catch (error) {
    console.error("Error fetching IPOs:", error);
    return NextResponse.json(
      { error: "Failed to fetch IPOs" },
      { status: 500 }
    );
  }
}
