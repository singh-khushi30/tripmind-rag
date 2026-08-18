import { NextResponse } from "next/server";

import { TripPdfAuthError } from "@/lib/pdf/types";
import { renderTripPdf } from "@/lib/pdf/render-trip-pdf";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const { buffer, filename } = await renderTripPdf(id);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof TripPdfAuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[tripmind:pdf]", error);
    return NextResponse.json(
      { error: "We couldn’t prepare your itinerary PDF. Please try again." },
      { status: 500 },
    );
  }
}
