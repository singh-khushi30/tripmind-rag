import {
  Document,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { formatCurrency, formatDurationMinutes, formatTripDate } from "@/lib/format";
import { TRIP_PDF_DISCLAIMER, type TripPdfData } from "@/lib/pdf/types";

const colors = {
  brand: "#0F766E",
  brandSoft: "#CCFBF1",
  ink: "#1C1917",
  muted: "#78716C",
  line: "#E7E5E4",
  paper: "#FFFbf7",
  card: "#FFFFFF",
  warn: "#9A3412",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.ink,
    backgroundColor: colors.paper,
  },
  headerBar: {
    backgroundColor: colors.brand,
    marginHorizontal: -40,
    marginTop: -48,
    paddingHorizontal: 40,
    paddingVertical: 22,
    marginBottom: 18,
  },
  brandEyebrow: {
    color: colors.brandSoft,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },
  brandSubtitle: {
    color: "#E2E8F0",
    fontSize: 10,
    marginTop: 4,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.brand,
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryItem: {
    width: "48%",
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: colors.ink,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.45,
    color: colors.ink,
  },
  muted: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 1.4,
  },
  disclaimer: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  disclaimerText: {
    fontSize: 8.5,
    color: colors.warn,
    lineHeight: 1.4,
  },
  dayBlock: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  dayHeader: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    marginBottom: 2,
  },
  dayMeta: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 8,
  },
  activity: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  activityTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  activityTime: {
    fontSize: 9,
    color: colors.brand,
    fontFamily: "Helvetica-Bold",
  },
  activityTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.ink,
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
    marginBottom: 2,
  },
  badge: {
    fontSize: 7.5,
    color: colors.brand,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.muted,
  },
  sourceItem: {
    marginBottom: 6,
  },
  link: {
    color: colors.brand,
    fontSize: 9,
    textDecoration: "underline",
  },
});

function money(amount: number | undefined, currency: string) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  try {
    return formatCurrency(amount, currency);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

function PageFooter({ destination }: { destination: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>TripMind · {destination}</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
}

export function TripPdfDocument({ data }: { data: TripPdfData }) {
  const { trip, citations, routeSummary, generatedAt } = data;
  const weatherLines = trip.itinerary
    .filter((day) => day.weather?.summary || day.weather?.temp_max != null)
    .map((day) => {
      const parts = [
        `Day ${day.day_number}`,
        day.calendar_date ?? null,
        day.weather?.summary ?? null,
        day.weather?.temp_min != null && day.weather?.temp_max != null
          ? `${Math.round(day.weather.temp_min)}–${Math.round(day.weather.temp_max)}°C`
          : null,
        day.weather?.precipitation_probability != null
          ? `${Math.round(day.weather.precipitation_probability)}% rain`
          : null,
      ].filter(Boolean);
      return parts.join(" · ");
    });

  return (
    <Document
      title={`TripMind · ${trip.destination}`}
      author="TripMind"
      subject={`Itinerary for ${trip.destination}`}
      creator="TripMind"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerBar}>
          <Text style={styles.brandEyebrow}>TripMind</Text>
          <Text style={styles.brandTitle}>{trip.destination}</Text>
          <Text style={styles.brandSubtitle}>
            {trip.country ? `${trip.country} · ` : ""}
            Personalized itinerary export
          </Text>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{TRIP_PDF_DISCLAIMER}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip summary</Text>
          <Text style={styles.body}>{trip.summary}</Text>
          <View style={[styles.summaryGrid, { marginTop: 8 }]}>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Travel dates</Text>
              <Text style={styles.value}>
                {trip.startDate
                  ? `${formatTripDate(trip.startDate)} · ${trip.days} days`
                  : `${trip.days} days (start date not set)`}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Travelers</Text>
              <Text style={styles.value}>{trip.travelers}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Travel style</Text>
              <Text style={styles.value}>
                {trip.travelStyle} · {trip.pace}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Interests</Text>
              <Text style={styles.value}>
                {trip.interests.length ? trip.interests.join(", ") : "General"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Total budget</Text>
              <Text style={styles.value}>
                {money(trip.budget.total, trip.budget.currency)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Estimated spend</Text>
              <Text style={styles.value}>
                {money(trip.budget.estimatedTotalCost, trip.budget.currency)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Remaining</Text>
              <Text style={styles.value}>
                {money(trip.budget.remainingBudget, trip.budget.currency)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Utilization</Text>
              <Text style={styles.value}>
                {typeof trip.budget.percentageUsed === "number"
                  ? `${Math.round(trip.budget.percentageUsed)}% · ${trip.budget.extendedStatus ?? trip.budget.budgetStatus}`
                  : trip.budget.budgetStatus}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Currencies</Text>
              <Text style={styles.value}>
                Local {trip.budget.destinationLocalCurrency ?? "—"} · Display{" "}
                {trip.budget.currency}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.label}>Exchange</Text>
              <Text style={styles.value}>
                {trip.budget.exchangeStatus ??
                  trip.budget.conversionStatus ??
                  "—"}
                {trip.budget.exchangeRate != null
                  ? ` · rate ${trip.budget.exchangeRate}`
                  : ""}
              </Text>
            </View>
          </View>
          {trip.budget.warning ? (
            <Text style={[styles.muted, { marginTop: 4 }]}>
              {trip.budget.warning}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather</Text>
          {weatherLines.length > 0 ? (
            weatherLines.map((line) => (
              <Text key={line} style={styles.body}>
                {line}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>
              {trip.weather?.message ??
                (trip.startDate
                  ? "Weather forecast unavailable for these dates."
                  : "Add travel dates to include weather-aware planning.")}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route summary</Text>
          {routeSummary.map((line) => (
            <Text key={line} style={styles.muted}>
              • {line}
            </Text>
          ))}
        </View>

        <PageFooter destination={trip.destination} />
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.sectionTitle}>Day-by-day itinerary</Text>

        {trip.itinerary.map((day) => (
          <View key={day.day_number} style={styles.dayBlock}>
            <View wrap={false}>
              <Text style={styles.dayHeader}>
                Day {day.day_number}
                {day.calendar_date ? ` · ${formatTripDate(day.calendar_date)}` : ""}
                {" · "}
                {day.title}
              </Text>
              <Text style={styles.dayMeta}>
                {day.summary}
                {" · Est. "}
                {money(day.estimated_day_cost, trip.budget.currency)}
                {day.weather?.summary ? ` · ${day.weather.summary}` : ""}
              </Text>
            </View>

            {day.activities.map((activity, index) => {
              const displayCost =
                activity.estimated_cost_display ?? activity.estimated_cost;
              const showLocal =
                trip.budget.destinationLocalCurrency &&
                trip.budget.destinationLocalCurrency !== trip.budget.currency &&
                activity.estimated_cost_display != null;

              return (
                <View
                  key={`${day.day_number}-${index}-${activity.title}`}
                  style={styles.activity}
                  wrap={false}
                >
                  <View style={styles.activityTop}>
                    <Text style={styles.activityTime}>{activity.start_time}</Text>
                    <Text style={styles.muted}>
                      {formatDurationMinutes(activity.duration_minutes)}
                    </Text>
                  </View>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.muted}>
                    {activity.location_name}
                    {activity.neighborhood ? ` · ${activity.neighborhood}` : ""}
                  </Text>
                  <Text style={[styles.body, { marginTop: 3 }]}>
                    {activity.description}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.badge}>{activity.indoor_outdoor}</Text>
                    <Text style={styles.badge}>{activity.category}</Text>
                    {activity.reservation_required ? (
                      <Text style={styles.badge}>Reservation advised</Text>
                    ) : null}
                    {activity.weather_fit ? (
                      <Text style={styles.badge}>
                        Weather: {activity.weather_fit}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.muted}>
                    Est.{" "}
                    {displayCost === 0
                      ? "Free"
                      : money(displayCost, trip.budget.currency)}
                    {showLocal
                      ? ` · ${money(
                          activity.estimated_cost,
                          trip.budget.destinationLocalCurrency!,
                        )} local`
                      : ""}
                    {" (estimate)"}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        <PageFooter destination={trip.destination} />
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sources & citations</Text>
          {citations.length === 0 ? (
            <Text style={styles.muted}>
              No source citations were saved with this itinerary.
            </Text>
          ) : (
            citations.map((citation) => (
              <View key={citation.citation_key} style={styles.sourceItem} wrap={false}>
                <Text style={styles.body}>
                  {citation.source_title}
                  {citation.section_title ? ` — ${citation.section_title}` : ""}
                  {` (${citation.source_type})`}
                </Text>
                {citation.source_url ? (
                  <Link src={citation.source_url} style={styles.link}>
                    {citation.source_url}
                  </Link>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Export notes</Text>
          <Text style={styles.muted}>
            Generated {formatTripDate(generatedAt.slice(0, 10))} via TripMind.
            Interactive maps are omitted from this PDF; use the route summary and
            activity locations above.
          </Text>
          <Text style={[styles.disclaimerText, { marginTop: 8 }]}>
            {TRIP_PDF_DISCLAIMER}
          </Text>
        </View>

        <PageFooter destination={trip.destination} />
      </Page>
    </Document>
  );
}
