import React from 'react';
import { Icon as IconifyIcon } from '@iconify/react';

// Common icon sets - you can expand this based on your needs
export const IconSets = {
  // Tabler icons (material design style)
  tabler: 'tabler',
  // Lucide icons (consistent with your current setup)
  lucide: 'lucide',
  // Heroicons (Tailwind's icon set)
  heroicons: 'heroicons',
  // Solar icons (business/energy focused)
  solar: 'solar',
  // Carbon icons (IBM's icon set)
  carbon: 'carbon',
} as const;

// Common electricity/energy related icons
export const ElectricityIcons = {
  // Power & Energy
  lightning: 'tabler:bolt',
  flash: 'tabler:flash',
  energy: 'tabler:battery-charging',
  power: 'tabler:plug',
  electricity: 'tabler:zap',
  
  // Business & Money
  dollar: 'tabler:currency-dollar',
  savings: 'tabler:coin',
  calculator: 'tabler:calculator',
  chart: 'tabler:chart-line',
  trending: 'tabler:trending-up',
  
  // Green Energy
  solar: 'tabler:solar-panel',
  wind: 'tabler:wind',
  leaf: 'tabler:leaf',
  eco: 'tabler:recycle',
  earth: 'tabler:world',
  
  // UI Elements
  search: 'tabler:search',
  filter: 'tabler:filter',
  menu: 'tabler:menu-2',
  close: 'tabler:x',
  check: 'tabler:check',
  star: 'tabler:star',
  heart: 'tabler:heart',
  shield: 'tabler:shield',
  
  // Navigation
  home: 'tabler:home',
  compare: 'tabler:arrows-left-right',
  shop: 'tabler:shopping-cart',
  location: 'tabler:map-pin',
  info: 'tabler:info-circle',
  
  // User & Account
  user: 'tabler:user',
  users: 'tabler:users',
  profile: 'tabler:user-circle',
  settings: 'tabler:settings',
  
  // Communication
  phone: 'tabler:phone',
  mail: 'tabler:mail',
  message: 'tabler:message',
  chat: 'tabler:message-circle',
  
  // Actions
  download: 'tabler:download',
  upload: 'tabler:upload',
  share: 'tabler:share',
  copy: 'tabler:copy',
  edit: 'tabler:edit',
  delete: 'tabler:trash',
  
  // Status
  success: 'tabler:circle-check',
  error: 'tabler:circle-x',
  warning: 'tabler:alert-triangle',
  loading: 'tabler:loader',
} as const;

interface IconProps {
  icon: string | keyof typeof ElectricityIcons;
  size?: number | string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({
  icon,
  size = 24,
  className = '',
  color,
  style = {},
  onClick,
}) => {
  // If it's a predefined electricity icon, use the mapping
  const iconName = typeof icon === 'string' && icon in ElectricityIcons 
    ? ElectricityIcons[icon as keyof typeof ElectricityIcons]
    : icon;

  return (
    <IconifyIcon
      icon={iconName}
      width={size}
      height={size}
      className={className}
      style={{ color, ...style }}
      onClick={onClick}
    />
  );
};

// Utility component for common electricity icons
export const ElectricityIcon: React.FC<Omit<IconProps, 'icon'> & { name: keyof typeof ElectricityIcons }> = ({
  name,
  ...props
}) => <Icon icon={name} {...props} />;

// Pre-configured icon components for common use cases
export const PowerIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon="lightning" {...props} />;
export const SavingsIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon="savings" {...props} />;
export const GreenIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon="leaf" {...props} />;
export const CompareIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon="compare" {...props} />;
export const LocationIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon="location" {...props} />;

export default Icon;