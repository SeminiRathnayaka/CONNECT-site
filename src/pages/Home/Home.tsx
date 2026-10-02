import { Hero } from './sections/Hero';
import { WhatIsConnect } from './sections/WhatIsConnect';
import { AICompanions } from './sections/AICompanions';
import { DashboardShowcase } from './sections/DashboardShowcase';
import { FeaturesGrid } from './sections/FeaturesGrid';
import { FamilySection } from './sections/FamilySection';
import { SocialProof } from './sections/SocialProof';

export default function Home() {
  return (
    <>
      <Hero />
      <WhatIsConnect />
      <AICompanions />
      <DashboardShowcase />
      <FeaturesGrid />
      <FamilySection />
      <SocialProof />
    </>
  );
}
