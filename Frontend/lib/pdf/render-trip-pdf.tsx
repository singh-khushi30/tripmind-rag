import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import { loadTripPdfData } from "@/lib/pdf/load-trip-pdf-data";
import { TripPdfDocument } from "@/lib/pdf/trip-pdf-document";

export async function renderTripPdf(tripId: string): Promise<{
  buffer: Buffer;
  filename: string;
}> {
  const data = await loadTripPdfData(tripId);
  const buffer = await renderToBuffer(<TripPdfDocument data={data} />);
  return { buffer: Buffer.from(buffer), filename: data.filename };
}
