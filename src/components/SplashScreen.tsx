import React from 'react';

interface SplashScreenProps {
  quote: {
    ur: string;
    en: string;
  };
  isLoading?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ quote, isLoading }) => (
  <div className="splash-screen">
    <div className="splash-content">
      <div className="splash-logo">Shukr</div>
      <div className="splash-quote">
        <div className="splash-quote-ur">{quote.ur}</div>
        <div className="splash-quote-en">{quote.en}</div>
      </div>
      
      {isLoading && (
        <div className="splash-loader">
          <div className="loader-spinner"></div>
          <div className="loader-text">
            <span>تیار ہو رہا ہے...</span>
            <span className="loader-text-en">Preparing your space...</span>
          </div>
        </div>
      )}
    </div>
  </div>
);
