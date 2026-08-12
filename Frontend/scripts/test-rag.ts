/**
 * Development-only RAG smoke test for Paris.
 * Does not create trip records.
 *
 * Usage: pnpm rag:test
 */

import WS from "ws";

// Supabase JS requires WebSocket in Node < 22.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).WebSocket = WS;

async function main() {
  const { assertValidCitationIds } = await import("@/lib/rag/citations");
  const { GEMINI_EMBEDDING_DIMENSIONS } = await import(
    "@/lib/rag/constants-shared"
  );
  const { ingestDestination } = await import("@/lib/rag/ingest-destination");
  const { retrieveTravelContextWithClient } = await import(
    "@/lib/rag/retrieve"
  );
  const { createAdminClient } = await import("@/lib/supabase/admin");
  type TripPlannerInput = import("@/lib/gemini/types").TripPlannerInput;
  type ItineraryData = import("@/lib/gemini/schema").ItineraryData;

  function print(label: string, value: string | number | boolean) {
    console.log(`${label}: ${value}`);
  }

  function fail(step: string, error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAILED at ${step}: ${message}`);
    process.exit(1);
  }

  if (process.argv.includes("--create-trip")) {
    fail(
      "args",
      "This smoke test does not create trip records. Omit --create-trip.",
    );
  }

  console.log("TripMind RAG smoke test (Paris)");
  console.log("--------------------------------");

  let admin;
  try {
    admin = createAdminClient();
    const { error } = await admin
      .from("travel_sources")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) throw error;
    print("database_connection", "passed");
  } catch (error) {
    fail("database_connection", error);
  }

  let ingestion;
  try {
    ingestion = await ingestDestination("Paris");
  } catch (error) {
    fail("ingestion", error);
  }

  print("destination_key", ingestion.destination_key);
  print("sources_found", ingestion.sources_fetched.join(", ") || "(reused)");
  print("pages_fetched", ingestion.pages_fetched);
  print("chunks_created", ingestion.chunks_created);
  print("chunks_reused", ingestion.chunks_reused);
  print("embedding_count", ingestion.embedding_count);
  print(
    "embedding_dimensions",
    ingestion.embedding_dimensions === GEMINI_EMBEDDING_DIMENSIONS
      ? `${ingestion.embedding_dimensions} (ok)`
      : `${ingestion.embedding_dimensions} (expected ${GEMINI_EMBEDDING_DIMENSIONS})`,
  );

  const { count: parisSourceCount, error: sourceCountError } = await admin
    .from("travel_sources")
    .select("id", { count: "exact", head: true })
    .eq("destination_key", "paris");
  if (sourceCountError) fail("paris_source_count", sourceCountError);

  const { data: parisSources, error: parisSourcesError } = await admin
    .from("travel_sources")
    .select("id")
    .eq("destination_key", "paris");
  if (parisSourcesError) fail("paris_sources", parisSourcesError);

  const sourceIds = (parisSources ?? []).map((source) => source.id);
  let parisChunkCount = 0;
  if (sourceIds.length > 0) {
    const { count, error: chunkCountError } = await admin
      .from("travel_document_chunks")
      .select("id", { count: "exact", head: true })
      .in("source_id", sourceIds);
    if (chunkCountError) fail("paris_chunk_count", chunkCountError);
    parisChunkCount = count ?? 0;
  }

  print("paris_source_rows", parisSourceCount ?? 0);
  print("paris_chunk_rows", parisChunkCount);

  if ((parisSourceCount ?? 0) < 1) {
    fail("paris_source_rows", "Expected at least one Paris travel_sources row");
  }
  if (parisChunkCount < 2) {
    fail("paris_chunk_rows", "Expected multiple Paris travel_document_chunks");
  }

  const plannerInput: TripPlannerInput = {
    destination: "Paris",
    start_date: null,
    number_of_days: 3,
    budget: 2500,
    currency: "USD",
    travelers: 2,
    travel_style: "mid-range",
    travel_pace: "moderate",
    interests: ["food", "culture", "history"],
    food_preference: "local",
    special_notes: null,
    destination_scope: "city",
    selected_cities: [],
    include_accommodation_in_budget: false,
    include_transport_to_destination_in_budget: false,
  };

  let retrieval;
  try {
    retrieval = await retrieveTravelContextWithClient(admin, plannerInput);
  } catch (error) {
    fail("retrieval", error);
  }

  print("retrieved_chunk_count", retrieval.chunks.length);
  print("unique_sources_count", retrieval.uniqueSourceCount);
  print("citation_ids", retrieval.citationKeys.join(", "));

  for (const chunk of retrieval.chunks) {
    if (!chunk.travel_chunk_id || !chunk.travel_source_id) {
      fail("retrieval", "Retrieved chunk missing chunk/source ids");
    }
    if (!sourceIds.includes(chunk.travel_source_id)) {
      fail(
        "retrieval",
        `Retrieved source_id ${chunk.travel_source_id} not in Paris travel_sources`,
      );
    }
  }

  console.log("top_source_titles:");
  for (const chunk of retrieval.chunks.slice(0, 8)) {
    console.log(
      `  - ${chunk.source_title} (${chunk.source_type}) sim=${chunk.similarity.toFixed(3)} chunk=${chunk.travel_chunk_id.slice(0, 8)}…`,
    );
  }

  try {
    const synthetic: ItineraryData = {
      destination: "Paris",
      country: "France",
      summary: "Smoke-test grounded itinerary placeholder.",
      currency: "USD",
      estimated_total_cost: 900,
      budget_status: "within_budget",
      days: [
        {
          day_number: 1,
          title: "Central Paris",
          summary: "Culture and food.",
          estimated_day_cost: 300,
          activities: [
            {
              start_time: "09:00",
              title: "Museum morning",
              description: "Visit a major museum.",
              category: "Culture",
              estimated_cost: 20,
              duration_minutes: 120,
              location_name: "Louvre area",
              neighborhood: "1st",
              indoor_outdoor: "indoor",
              reservation_required: false,
              notes: null,
              citation_ids: [retrieval.citationKeys[0]!],
            },
          ],
        },
      ],
    };

    assertValidCitationIds(synthetic, retrieval.citationKeys);

    try {
      assertValidCitationIds(
        {
          ...synthetic,
          days: [
            {
              ...synthetic.days[0]!,
              activities: [
                {
                  ...synthetic.days[0]!.activities[0]!,
                  citation_ids: ["fabricated_src"],
                },
              ],
            },
          ],
        },
        retrieval.citationKeys,
      );
      fail("citation_validation", "Fabricated citation IDs were not rejected");
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("Fabricated citation")
      ) {
        throw error;
      }
    }

    print("citation_validation", "passed");
    print("citation_count", retrieval.citationKeys.length);
  } catch (error) {
    fail("citation_validation", error);
  }

  console.log("--------------------------------");
  console.log("RAG smoke test completed successfully.");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FAILED at unhandled: ${message}`);
  process.exit(1);
});
