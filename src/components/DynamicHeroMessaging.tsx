import React, { useState, useEffect } from 'react';
import { messagingEngine, type MessagingBundle } from '../lib/messaging/temporal-messaging-engine';

export function DynamicHeroMessaging() {
  const [messaging, setMessaging] = useState<MessagingBundle>({
    headline: "Compare Texas Electricity Plans & Rates",
    subheadline: "No more teaser rates that cost 14¢. Clear prices and straight answers."
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
    <div className="dynamic-hero-messaging space-y-2">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight max-w-4xl mx-auto">
        {messaging.headline}
      </h1>
      
      <p className="text-lg md:text-xl text-blue-100/80 font-normal max-w-3xl mx-auto leading-relaxed">
        {messaging.subheadline}
      </p>
    </div>
  );
}