import React, { useEffect, useState } from 'react';

interface ParticleProps {
  delay: number;
}

const Particle: React.FC<ParticleProps> = ({ delay }) => {
  return (
    <div
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${15 + Math.random() * 10}s`
      }}
    />
  );
};

interface AnimatedBackgroundProps {
  children: React.ReactNode;
  variant?: 'login' | 'monitor' | 'dashboard';
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  children, 
  variant = 'login' 
}) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    // Generate particles with different densities based on variant
    const particleCount = variant === 'monitor' ? 30 : 20;
    setParticles(Array.from({ length: particleCount }, (_, i) => i));
  }, [variant]);

  const getBackgroundClass = () => {
    switch (variant) {
      case 'monitor':
        return 'min-h-screen gradient-animated relative overflow-hidden';
      case 'dashboard':
        return 'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden';
      default:
        return 'min-h-screen gradient-animated relative overflow-hidden flex items-center justify-center';
    }
  };

  return (
    <div className={getBackgroundClass()}>
      {/* Floating particles */}
      <div className="particles">
        {particles.map((i) => (
          <Particle key={i} delay={Math.random() * 15} />
        ))}
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};