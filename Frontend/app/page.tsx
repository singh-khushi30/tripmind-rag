import { FeaturesSection } from "@/components/cards/features-section";
import { HowItWorks } from "@/components/cards/how-it-works";
import { LandingHero } from "@/components/cards/landing-hero";

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <FeaturesSection />
      <HowItWorks />
    </>
  );
}
