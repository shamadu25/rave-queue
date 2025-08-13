import React from 'react';

interface MarqueeHeaderProps {
  text?: string;
}

const MarqueeHeader: React.FC<MarqueeHeaderProps> = ({ 
  text = "WELCOME TO GLOBE HEALTH ASSESSMENT CLINIC" 
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#002b5c] flex items-center overflow-hidden">
      <div className="animate-marquee whitespace-nowrap">
        <span className="text-white text-2xl md:text-3xl lg:text-4xl font-bold px-8">
          {text}
        </span>
        <span className="text-white text-2xl md:text-3xl lg:text-4xl font-bold px-8">
          {text}
        </span>
        <span className="text-white text-2xl md:text-3xl lg:text-4xl font-bold px-8">
          {text}
        </span>
      </div>
    </div>
  );
};

export default MarqueeHeader;