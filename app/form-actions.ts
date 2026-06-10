'use server';

import { geolocation } from '@vercel/functions';
import { headers } from 'next/headers';
import { getDiscountConfig } from '@/lib/discount';
import { getComprehensiveUserData } from '@/lib/user-data-server';
import { listUserConnections } from '@/lib/connectors';

type DiscountConfigParams = {
  email?: string | null;
  isIndianUser?: boolean;
};

export async function getUserCountryCode() {
  if (process.env.SELF_HOSTED_DISABLE_VERCEL_GEOLOCATION === 'true') return null;

  try {
    const headersList = await headers();
    const locationData = geolocation({ headers: headersList });
    return locationData.country || null;
  } catch (error) {
    console.error('Error getting geolocation:', error);
    return null;
  }
}

export async function getDiscountConfigAction(params?: DiscountConfigParams) {
  try {
    let userEmail = params?.email ?? null;

    if (!userEmail) {
      const user = await getComprehensiveUserData();
      userEmail = user?.email ?? null;
    }

    let isIndianUser = params?.isIndianUser;

    if (isIndianUser === undefined) {
      try {
        const headersList = await headers();
        const locationData = geolocation({ headers: headersList });
        const country = (locationData.country || '').toUpperCase();
        isIndianUser = country === 'IN';
      } catch (geoError) {
        console.warn('Geolocation lookup failed in getDiscountConfigAction:', geoError);
        isIndianUser = false;
      }
    }

    return await getDiscountConfig(userEmail ?? undefined, isIndianUser);
  } catch (error) {
    console.error('Error getting discount configuration:', error);
    return await getDiscountConfig(undefined, false);
  }
}

export async function listUserConnectorsAction() {
  try {
    const user = await getComprehensiveUserData();
    if (!user) {
      return { success: false, error: 'Authentication required', connections: [] };
    }

    const connections = await listUserConnections(user.id);
    return { success: true, connections };
  } catch (error) {
    console.error('Error listing connectors:', error);
    return { success: false, error: 'Failed to list connectors', connections: [] };
  }
}
