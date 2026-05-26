/**
 * Home Page — あさの歯科
 * Design: Soft Minimalism × Japanese Breathing Space
 * - Assembles all sections in order
 * - Mobile-first responsive layout
 */
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import NewsSection from "@/components/NewsSection";
import FeaturesSection from "@/components/FeaturesSection";
import ServicesSection from "@/components/ServicesSection";
import PricingSection from "@/components/PricingSection";
import HoursSection from "@/components/HoursSection";
import DoctorSection from "@/components/DoctorSection";
import RecruitSection from "@/components/RecruitSection";
import AccessSection from "@/components/AccessSection";
import Footer from "@/components/Footer";
import MobileFixedBar from "@/components/MobileFixedBar";

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Fixed Header */}
      <Header />

      {/* Main Content */}
      <main className="compact-mobile">
        {/* 1. Hero / Main Visual */}
        <HeroSection />

        {/* 2. News / Announcements */}
        <NewsSection />

        {/* 3. 3 Features */}
        <FeaturesSection />

        {/* 4. Services */}
        <ServicesSection />

        {/* 5. Pricing */}
        <PricingSection />

        {/* 6. Hours */}
        <HoursSection />

        {/* 7. Doctor Introduction */}
        <DoctorSection />

        {/* 8. Recruitment */}
        <RecruitSection />

        {/* 9. Access / Map */}
        <AccessSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Fixed CTA Bar */}
      <MobileFixedBar />
    </div>
  );
}
