import { FinalCta } from "@/components/marketing/cta";
import { Faq } from "@/components/marketing/faq";
import { FeaturesBento } from "@/components/marketing/features-bento";
import { Hero } from "@/components/marketing/hero";
import { LogoStrip } from "@/components/marketing/logo-strip";
import { PricingSection } from "@/components/marketing/pricing-section";
import { Testimonials } from "@/components/marketing/testimonials";
import { getPlans } from "@/lib/plans-server";

export default async function LandingPage() {
  const plans = await getPlans();

  return (
    <>
      <Hero />
      <LogoStrip />
      <FeaturesBento />
      <PricingSection plans={plans} />
      <Testimonials />
      <Faq />
      <FinalCta />
    </>
  );
}
