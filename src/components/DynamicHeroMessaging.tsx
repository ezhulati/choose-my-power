import React, { useState, useEffect } from 'react';
import { messagingEngine, type MessagingBundle } from '../lib/messaging/temporal-messaging-engine';

export function DynamicHeroMessaging() {
  const [messaging, setMessaging] = useState<MessagingBundle>({
    headline: "Find Your Electricity Provider",
    subheadline: "Compare plans and save on your electric bill"
  });

  useEffect(() => {
    // Set initial messaging using the sophisticated engine
    const initialMessage = messagingEngine.getMessage();
    setMessaging(messagingEngine.getVariant(initialMessage, 30)); // 30% get variant B

    // Update every minute to keep messaging fresh
    const interval = setInterval(() => {
      const newMessage = messagingEngine.getMessage();
      setMessaging(messagingEngine.getVariant(newMessage, 30));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dynamic-hero-messaging mb-8">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 animate-fade-in leading-tight max-w-4xl mx-auto">
        {messaging.headline}
      </h1>
      <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
        {messaging.subheadline}
      </p>
      {messaging.urgencyFlag && (
        <p className="text-sm sm:text-base text-texas-gold mb-4 font-medium max-w-2xl mx-auto">
          {messaging.urgencyFlag}
        </p>
      )}
      {messaging.ctaText && (
        <p className="text-sm sm:text-base text-blue-200 font-semibold uppercase tracking-wide">
          {messaging.ctaText} →
        </p>
      )}
    </div>
  );
}