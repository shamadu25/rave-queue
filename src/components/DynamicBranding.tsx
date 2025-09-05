import React, { useEffect } from 'react';
import { Hospital } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface DynamicBrandingProps {
  variant?: 'header' | 'navbar' | 'sidebar' | 'card' | 'minimal';
  showLogo?: boolean;
  showName?: boolean;
  className?: string;
  logoSize?: 'sm' | 'md' | 'lg';
}

export const DynamicBranding: React.FC<DynamicBrandingProps> = ({
  variant = 'header',
  showLogo = true,
  showName = true,
  className = '',
  logoSize = 'md'
}) => {
  const { settings } = useSystemSettings();

  const hospitalName = settings?.clinic_name || 'Your Hospital Name';
  const hasLogo = settings?.clinic_logo;

  // Update favicon when logo changes
  useEffect(() => {
    if (hasLogo) {
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.clinic_logo;
      } else {
        const newFavicon = document.createElement('link');
        newFavicon.rel = 'icon';
        newFavicon.href = settings.clinic_logo;
        document.head.appendChild(newFavicon);
      }
      
      // Update document title
      document.title = `${hospitalName} - Queue Management`;
    }
  }, [hasLogo, settings?.clinic_logo, hospitalName]);

  const getLogoSize = () => {
    switch (logoSize) {
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-16 h-16';
      default: return 'w-12 h-12';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'navbar':
        return {
          container: 'flex items-center gap-3',
          logo: getLogoSize(),
          name: 'text-xl font-bold text-foreground'
        };
      case 'sidebar':
        return {
          container: 'flex flex-col items-center gap-2 p-4',
          logo: 'w-10 h-10',
          name: 'text-lg font-semibold text-center'
        };
      case 'card':
        return {
          container: 'flex flex-col items-center gap-3 text-center',
          logo: 'w-16 h-16',
          name: 'text-2xl font-bold'
        };
      case 'minimal':
        return {
          container: 'flex items-center gap-2',
          logo: 'w-6 h-6',
          name: 'text-sm font-medium'
        };
      default: // header
        return {
          container: 'flex items-center gap-4',
          logo: getLogoSize(),
          name: 'text-2xl font-bold text-foreground'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className={`${styles.container} ${className}`}>
      {showLogo && (
        <div className={`${styles.logo} flex items-center justify-center rounded-full bg-primary/10 overflow-hidden`}>
          {hasLogo ? (
            <img 
              src={settings.clinic_logo} 
              alt={hospitalName}
              className={`${styles.logo} object-cover`}
            />
          ) : (
            <Hospital className={`${styles.logo === 'w-6 h-6' ? 'w-4 h-4' : styles.logo === 'w-8 h-8' ? 'w-6 h-6' : 'w-8 h-8'} text-primary`} />
          )}
        </div>
      )}
      
      {showName && (
        <h1 className={styles.name}>
          {hospitalName}
        </h1>
      )}
    </div>
  );
};

// Helper hook for branding data
export const useBranding = () => {
  const { settings } = useSystemSettings();
  
  return {
    hospitalName: settings?.clinic_name || 'Your Hospital Name',
    logo: settings?.clinic_logo,
    hasLogo: !!settings?.clinic_logo,
    footerText: settings?.footer_text || `Thank you for visiting ${settings?.clinic_name || 'our hospital'}`
  };
};