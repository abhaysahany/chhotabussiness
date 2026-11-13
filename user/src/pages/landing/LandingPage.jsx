import React from 'react';
import LandingNavbar from './components/LandingNavbar';
import HeroSection from './components/HeroSection';
import CategoriesSection from './components/CategoriesSection';
import HowItWorksSection from './components/HowItWorksSection';
import InfographicSection from './components/InfographicSection';
import BenefitsSection from './components/BenefitsSection';
import WhyChooseUsSection from './components/WhyChooseUsSection';
import StatsSection from './components/StatsSection';
import TestimonialsSection from './components/TestimonialsSection';
import AboutUsSection from './components/AboutUsSection';
import PricingSection from './components/PricingSection';
import FaqSection from './components/FaqSection';
import FinalCtaSection from './components/FinalCtaSection';
import LandingFooter from './components/LandingFooter';
import './landing.css';

function LandingPage({ onLoginClick, onRegisterClick, onNavigateLegal }) {
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="cb-landing-wrapper">
      {/* 1. Sticky Header Navbar */}
      <LandingNavbar
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onNavigateSection={scrollToSection}
      />

      {/* 2. Hero Section */}
      <HeroSection
        onFindServicesClick={() => scrollToSection('categories')}
        onBecomePartnerClick={onRegisterClick}
      />

      {/* 3. Trusted Categories */}
      <CategoriesSection
        onCategorySelect={() => scrollToSection('how-it-works')}
      />

      {/* 4. How It Works (7-Step Timeline) */}
      <HowItWorksSection
        onRegisterClick={onRegisterClick}
      />

      {/* 5. Business Flow Infographic */}
      <InfographicSection />

      {/* 6. Benefits Section (Two-Column Provider vs Client) */}
      <BenefitsSection />

      {/* 7. Why Choose Us (6 Feature Cards) */}
      <WhyChooseUsSection />

      {/* 8. Success Stats (Counters) */}
      <StatsSection />

      {/* 9. Testimonials (Provider & Customer Reviews) */}
      <TestimonialsSection />

      {/* 10. About Us (Company, Mission, Vision, Trajectory) */}
      <AboutUsSection />

      {/* 11. Pricing Section (3 Plan Cards) */}
      <PricingSection
        onSelectPlan={onRegisterClick}
      />

      {/* 12. FAQ Section (Accordion) */}
      <FaqSection />

      {/* 13. Final CTA Banner */}
      <FinalCtaSection
        onRegisterClick={onRegisterClick}
        onContactClick={() => scrollToSection('faq')}
      />

      {/* 14. Footer */}
      <LandingFooter
        onLoginClick={onLoginClick}
        onRegisterClick={onRegisterClick}
        onNavigateLegal={onNavigateLegal}
        onScrollToSection={scrollToSection}
      />
    </div>
  );
}

export default LandingPage;
