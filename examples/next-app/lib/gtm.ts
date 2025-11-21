import type { ContainerConfigInput } from '@react-gtm-kit/core';

export const GTM_CONTAINERS: ContainerConfigInput[] = [
  { id: 'GTM-NEXTAPP' }
];

export const DEFAULT_CONSENT = {
  ad_storage: 'denied',
  analytics_storage: 'denied',
  ad_personalization: 'denied',
  ad_user_data: 'denied'
} as const;

export const GRANTED_CONSENT = {
  ad_storage: 'granted',
  analytics_storage: 'granted',
  ad_personalization: 'granted',
  ad_user_data: 'granted'
} as const;
