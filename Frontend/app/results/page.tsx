import { redirect } from "next/navigation";

type ResultsRedirectProps = {
  searchParams: Promise<{ demo?: string }>;
};

export default async function ResultsRedirectPage({
  searchParams,
}: ResultsRedirectProps) {
  const params = await searchParams;
  const query = params.demo ? `?demo=${params.demo}` : "";
  redirect(`/trip/results${query}`);
}
