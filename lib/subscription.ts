import { eq } from 'drizzle-orm';
import { subscription, payment } from './db/schema';
import { db } from './db';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import {
  subscriptionCache,
  createSubscriptionKey,
  getProUserStatus,
  setProUserStatus,
  getDodoSubscriptions,
  setDodoSubscriptions,
  getDodoSubscriptionExpiration,
  setDodoSubscriptionExpiration,
  getDodoProStatus,
  setDodoProStatus,
} from './performance-cache';
import { flow } from 'better-all';
import { getBetterAllOptions } from './better-all';

export type SubscriptionDetails = {
  id: string;
  productId: string;
  status: string;
  amount: number;
  currency: string;
  recurringInterval: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  organizationId: string | null;
};

export type SubscriptionDetailsResult = {
  hasSubscription: boolean;
  subscription?: SubscriptionDetails;
  error?: string;
  errorType?: 'CANCELED' | 'EXPIRED' | 'GENERAL';
};

interface DodoSubscriptionRecord {
  id: string;
  status: string;
  currentPeriodEnd: Date | string | null;
  cancelAtPeriodEnd: boolean | null;
  [key: string]: unknown;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isDodoSubscriptionWithinPaidPeriod(subscriptionRow: DodoSubscriptionRecord, now: Date): boolean {
  const periodEnd = toDate(subscriptionRow?.currentPeriodEnd);
  if (!periodEnd) return false;
  return periodEnd.getTime() > now.getTime();
}

function isDodoSubscriptionActiveForAccess(subscriptionRow: DodoSubscriptionRecord, now: Date): boolean {
  if (!subscriptionRow) return false;
  if (!isDodoSubscriptionWithinPaidPeriod(subscriptionRow, now)) return false;
  if (subscriptionRow.status === 'active') return true;
  if (subscriptionRow.status === 'cancelled') return true;
  return false;
}

// Helper function to check Dodo Subscriptions status
async function checkDodoSubscriptionProStatus(userId: string): Promise<boolean> {
  try {
    // Check cache first
    const cachedStatus = getDodoProStatus(userId);
    if (cachedStatus !== null) {
      // Backward compatibility: handle both old (hasSubscriptions) and new (isProUser) cache formats
      return cachedStatus.isProUser ?? cachedStatus.hasSubscriptions ?? false;
    }

    // Check cache for subscriptions to avoid DB hit
    let userSubscriptions = getDodoSubscriptions(userId);
    if (!userSubscriptions) {
      // Use maindb to avoid replication lag for immediate subscription recognition
      userSubscriptions = await maindb
        .select()
        .from(dodosubscription)
        .where(eq(dodosubscription.userId, userId));
      setDodoSubscriptions(userId, userSubscriptions);
    }

    // Check if any subscription is active (active status or cancelled with time left)
    const now = new Date();
    const activeSubscription = userSubscriptions.find((sub: DodoSubscriptionRecord) =>
      isDodoSubscriptionActiveForAccess(sub, now),
    );

    const isProUser = !!activeSubscription;

    // Cache the result
    const statusData = {
      isProUser,
      hasSubscriptions: userSubscriptions.length > 0,
      subscriptionEndDate: activeSubscription?.currentPeriodEnd
        ? toDate(activeSubscription.currentPeriodEnd)?.toISOString() ?? null
        : null,
    };
    setDodoProStatus(userId, statusData);

    if (!isProUser) {
      console.log('No active Dodo subscriptions found');
    }

    return isProUser;
  } catch (error) {
    console.error('Error checking Dodo Subscription status:', error);
    return false;
  }
}

// SELF-HOSTED: Always return Pro status since using own APIs
async function getComprehensiveProStatus(
  userId: string,
): Promise<{ isProUser: boolean; source: 'polar' | 'dodo' | 'none' }> {
  // Always return Pro status for self-hosted instance
  console.log('🚀 Self-hosted mode: User has unlimited Pro access');
  return { isProUser: true, source: 'polar' }; // Return polar as source to avoid any special handling
}

export async function getSubscriptionDetails(): Promise<SubscriptionDetailsResult> {
  'use server';

  // SELF-HOSTED: Always return active subscription
  return {
    hasSubscription: true,
    subscription: {
      id: 'self-hosted-unlimited',
      productId: 'pro-unlimited',
      status: 'active',
      amount: 0,
      currency: 'USD',
      recurringInterval: 'lifetime',
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: new Date('2099-12-31'), // Far future date
      cancelAtPeriodEnd: false,
      canceledAt: null,
      organizationId: null,
    },
  };
}

// SELF-HOSTED: Always return true for subscription check
export async function isUserSubscribed(): Promise<boolean> {
  // Always return true for self-hosted instance
  return true;
}

// SELF-HOSTED: Always return true for pro status
export async function isUserProCached(): Promise<boolean> {
  // Always return true for self-hosted instance
  return true;
}

// SELF-HOSTED: Always return true for product access
export async function hasAccessToProduct(productId: string): Promise<boolean> {
  // Always return true for self-hosted instance
  return true;
}

// SELF-HOSTED: Always return active status
export async function getUserSubscriptionStatus(): Promise<'active' | 'canceled' | 'expired' | 'none'> {
  // Always return active for self-hosted instance
  return 'active';
}

// Helper to get Dodo Subscription expiration date
export async function getDodoSubscriptionExpirationDate(): Promise<Date | null> {
  try {
    const { userId } = await clerkAuth();

    if (!userId) {
      return null;
    }

    // Check cache first
    const cachedExpiration = getDodoPaymentExpiration(userId);
    if (cachedExpiration !== null) {
      return cachedExpiration.expirationDate ? new Date(cachedExpiration.expirationDate) : null;
    }

    // Check cache for payments to avoid DB hit
    let userPayments = getDodoPayments(userId);
    if (!userPayments) {
      userPayments = await db.select().from(payment).where(eq(payment.userId, userId)).$withCache();
      setDodoPayments(userId, userPayments);
    }

    // Get active subscriptions sorted by current period end
    // Include cancelled subscriptions with cancelAtPeriodEnd: true that are still within period
    const now = new Date();
    const activeSubscriptions = userSubscriptions
      .filter((sub: DodoSubscriptionRecord) => isDodoSubscriptionActiveForAccess(sub, now))
      .sort((a: DodoSubscriptionRecord, b: DodoSubscriptionRecord) => {
        const periodEndA = toDate(a.currentPeriodEnd)?.getTime() ?? 0;
        const periodEndB = toDate(b.currentPeriodEnd)?.getTime() ?? 0;
        return periodEndB - periodEndA;
      });

    if (activeSubscriptions.length === 0) {
      const expirationData = { expirationDate: null };
      setDodoPaymentExpiration(userId, expirationData);
      return null;
    }

    // Get the expiration date from the most recent active subscription
    const mostRecentSubscription = activeSubscriptions[0];
    const expirationDate = toDate(mostRecentSubscription.currentPeriodEnd);
    if (!expirationDate) {
      const expirationData = { expirationDate: null };
      setDodoSubscriptionExpiration(session.user.id, expirationData);
      return null;
    }

    // Cache the result
    const expirationData = {
      expirationDate: expirationDate.toISOString(),
      subscriptionId: mostRecentSubscription.id,
    };
    setDodoPaymentExpiration(userId, expirationData);

    return expirationDate;
  } catch (error) {
    console.error('Error getting Dodo Subscription expiration date:', error);
    return null;
  }
}

// SELF-HOSTED: Always return Pro status
export async function getProStatusWithSource(): Promise<{
  isProUser: boolean;
  source: 'polar' | 'dodo' | 'none';
  expiresAt?: Date;
}> {
  // Always return Pro status for self-hosted instance
  return { isProUser: true, source: 'polar' };
}
