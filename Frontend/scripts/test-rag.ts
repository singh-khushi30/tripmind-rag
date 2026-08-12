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
  type TripPlannerInput =
    import("@/lib/gemini/types").TripPlannerInput;
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
  print("wikipedia_status", ingestion.source_status.wikipedia);
  print("wikivoyage_status", ingestion.source_status.wikivoyage);
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

  if (ingestion.source_status.wikipedia === "failed") {
    print("wikipedia_ingestion", "failed");
  } else if (ingestion.reused_existing) {
    print("wikipedia_ingestion", "skipped (fresh cache)");
  } else {
    print(
      "wikipedia_ingestion",
      ingestion.source_status.wikipedia === "ok" ? "passed" : "skipped",
    );
  }

  if (ingestion.source_status.wikivoyage === "failed") {
    print("wikivoyage_ingestion", "failed");
  } else if (ingestion.reused_existing) {
    print("wikivoyage_ingestion", "skipped (fresh cache)");
  } else {
    print(
      "wikivoyage_ingestion",
      ingestion.source_status.wikivoyage === "ok" ? "passed" : "skipped",
    );
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
    // Smoke test has no user session; admin bypasses RLS for read-only RPC verify.
    retrieval = await retrieveTravelContextWithClient(admin, plannerInput);
  } catch (error) {
    fail("retrieval", error);
  }

  print("retrieved_chunk_count", retrieval.chunks.length);
  print("citation_ids", retrieval.citationKeys.join(", "));

  console.log("top_source_titles:");
  for (const chunk of retrieval.chunks.slice(0, 8)) {
    console.log(
      `  - ${chunk.source_title} (${chunk.source_type}) sim=${chunk.similarity.toFixed(3)} [${chunk.citation_key}]`,
    );
  }

  console.log("similarity_scores:");
  for (const chunk of retrieval.chunks) {
    console.log(`  - ${chunk.citation_key}: ${chunk.similarity.toFixed(4)}`);
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
