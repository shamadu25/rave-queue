import React, { useEffect } from 'react';
import { Hospital, Building2, Stethoscope } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface EnhancedDynamicBrandingProps {
  variant?: 'header' | 'navbar' | 'sidebar' | 'card' | 'minimal' | 'login' | 'queue-display';
  showLogo?: boolean;
  showName?: boolean;
  className?: string;
  logoSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  textSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const EnhancedDynamicBranding: React.FC<EnhancedDynamicBrandingProps> = ({
  variant = 'header',
  showLogo = true,
  showName = true,
  className = '',
  logoSize = 'md',
  textSize = 'lg'
}) => {
  const { settings } = useSystemSettings();

  const hospitalName = settings?.clinic_name?.toString().replace(/"/g, '') || 'Your Hospital Name';
  const hospitalLogo = settings?.clinic_logo_url?.toString().replace(/"/g, '');
  const hasLogo = hospitalLogo && hospitalLogo.trim() !== '';

  // Update browser branding when settings change
  useEffect(() => {
    // Update document title
    document.title = `${hospitalName} - Queue Management System`;

    // Update or create favicon
    if (hasLogo) {
      let favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = hospitalLogo;
      } else {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = hospitalLogo;
        document.head.appendChild(favicon);
      }
    }

    // Update meta tags for better branding
    let metaDescription = document.querySelector("meta[name='description']") as HTMLMetaElement;
    if (metaDescription) {
      metaDescription.content = `${hospitalName} - Advanced Queue Management System`;
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      metaDescription.content = `${hospitalName} - Advanced Queue Management System`;
      document.head.appendChild(metaDescription);
    }

    // Update Open Graph tags
    let ogTitle = document.querySelector("meta[property='og:title']") as HTMLMetaElement;
    if (ogTitle) {
      ogTitle.content = hospitalName;
    }

    let ogDescription = document.querySelector("meta[property='og:description']") as HTMLMetaElement;
    if (ogDescription) {
      ogDescription.content = `${hospitalName} - Professional Queue Management System`;
    }

  }, [hospitalName, hospitalLogo, hasLogo]);

  const getLogoSize = () => {
    switch (logoSize) {
      case 'xs': return 'w-6 h-6';
      case 'sm': return 'w-8 h-8';
      case 'lg': return 'w-16 h-16';
      case 'xl': return 'w-20 h-20';
      default: return 'w-12 h-12';
    }
  };

  const getTextSize = () => {
    switch (textSize) {
      case 'xs': return 'text-xs';
      case 'sm': return 'text-sm';
      case 'md': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      case '3xl': return 'text-3xl';
      default: return 'text-lg';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'login':
        return {
          container: 'flex flex-col items-center gap-4 p-6',
          logo: `${getLogoSize()} text-primary`,
          text: `${getTextSize()} font-bold text-center text-foreground`,
          wrapper: 'flex flex-col items-center'
        };
      
      case 'queue-display':
        return {
          container: 'flex items-center justify-center gap-4',
          logo: `${getLogoSize()} text-primary`,
          text: `${getTextSize()} font-bold text-center`,
          wrapper: 'flex items-center gap-4'
        };
      
      case 'navbar':
        return {
          container: 'flex items-center gap-3',
          logo: `${getLogoSize()} text-primary`,
          text: `${getTextSize()} font-semibold text-foreground`,
          wrapper: 'flex items-center gap-3'
        };
      
      case 'sidebar':
        return {
          container: 'flex items-center gap-2 p-2',
          logo: `${getLogoSize()} text-primary`,
          text: `${textSize === 'xs' ? 'text-xs' : 'text-sm'} font-medium text-foreground`,
          wrapper: 'flex items-center gap-2'
        };
      
      case 'card':
        return {
          container: 'flex items-center gap-2',
          logo: `${getLogoSize()} text-primary`,
          text: `${getTextSize()} font-medium text-foreground`,
          wrapper: 'flex items-center gap-2'
        };
      
      case 'minimal':
        return {
          container: 'flex items-center gap-2',
          logo: `${getLogoSize()} text-muted-foreground`,
          text: `${getTextSize()} text-muted-foreground`,
          wrapper: 'flex items-center gap-2'
        };
      
      default: // header
        return {
          container: 'flex items-center gap-3',
          logo: `${getLogoSize()} text-primary`,
          text: `${getTextSize()} font-bold text-foreground`,
          wrapper: 'flex items-center gap-3'
        };
    }
  };

  const styles = getVariantStyles();

  const renderLogo = () => {
    if (!showLogo) return null;

    if (hasLogo) {
      return (
        <img
          src={hospitalLogo}
          alt={`${hospitalName} Logo`}
          className={`${styles.logo} object-contain`}
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            // Show fallback icon
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
      );
    }

    // Fallback icon based on variant
    const IconComponent = variant === 'queue-display' ? Building2 : 
                        variant === 'login' ? Hospital : 
                        Stethoscope;

    return <IconComponent className={styles.logo} />;
  };

  const renderName = () => {
    if (!showName) return null;

    const displayName = hospitalName === 'Your Hospital Name' ? 'Healthcare Facility' : hospitalName;

    if (variant === 'login') {
      return (
        <div className="text-center">
          <h1 className={styles.text}>{displayName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Queue Management System</p>
        </div>
      );
    }

    if (variant === 'queue-display') {
      return (
        <div className="text-center">
          <h1 className={styles.text}>{displayName}</h1>
        </div>
      );
    }

    return (
      <span className={styles.text}>
        {displayName}
      </span>
    );
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.wrapper}>
        {renderLogo()}
        {/* Fallback icon (hidden by default) */}
        {hasLogo && (
          <Hospital 
            className={`${styles.logo} hidden`} 
            style={{ display: 'none' }}
          />
        )}
        {renderName()}
      </div>
    </div>
  );
};

// Enhanced branding hook with more options
export const useEnhancedBranding = () => {
  const { settings } = useSystemSettings();

  const hospitalName = settings?.clinic_name?.toString().replace(/"/g, '') || 'Your Hospital Name';
  const hospitalLogo = settings?.clinic_logo_url?.toString().replace(/"/g, '');
  const hasLogo = hospitalLogo && hospitalLogo.trim() !== '';
  const footerText = settings?.footer_note?.toString().replace(/"/g, '') || '';
  const hospitalAddress = settings?.clinic_address?.toString().replace(/"/g, '') || '';
  const hospitalPhone = settings?.clinic_phone?.toString().replace(/"/g, '') || '';
  const hospitalEmail = settings?.clinic_email?.toString().replace(/"/g, '') || '';
  const hospitalWebsite = settings?.website_url?.toString().replace(/"/g, '') || '';

  return {
    hospitalName,
    logo: hospitalLogo,
    hasLogo,
    footerText,
    hospitalAddress,
    hospitalPhone,
    hospitalEmail,
    hospitalWebsite,
    footerNote: footerText
  };
};

// Re-export for backward compatibility
export const DynamicBranding = EnhancedDynamicBranding;
export const useBranding = useEnhancedBranding;