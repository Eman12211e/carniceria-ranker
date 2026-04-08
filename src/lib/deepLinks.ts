import * as Linking from 'expo-linking';
import { supabase } from './supabase';

export interface DeepLinkParams {
  shop?: string;
  cut?: string;
  ref?: string;
  alert?: string;
}

/**
 * Parse a carniceria:// deep link URL into typed params
 */
export function parseDeepLink(url: string): { route: string; params: DeepLinkParams } | null {
  try {
    const parsed = Linking.parse(url);
    if (!parsed.path) return null;

    return {
      route: parsed.path,
      params: {
        shop: parsed.queryParams?.shop as string | undefined,
        cut: parsed.queryParams?.cut as string | undefined,
        ref: parsed.queryParams?.ref as string | undefined,
        alert: parsed.queryParams?.alert as string | undefined,
      },
    };
  } catch {
    return null;
  }
}

/**
 * Log a deep link open for attribution tracking
 */
export async function trackDeepLinkOpen(
  linkType: 'share_card' | 'price_alert' | 'weekly_email',
  shopId?: string,
  cutId?: string,
  referrerId?: string
): Promise<void> {
  try {
    await supabase.rpc('log_deep_link_open', {
      p_link_type: linkType,
      p_shop_id: shopId ?? null,
      p_cut_id: cutId ?? null,
      p_referrer_id: referrerId ?? null,
    });
  } catch (err) {
    console.warn('Failed to track deep link open:', err);
  }
}

/**
 * Generate a shareable deep link URL
 */
export function generateShareLink(shopId: string, cutId?: string): string {
  return Linking.createURL('compare', {
    queryParams: {
      shop: shopId,
      ...(cutId ? { cut: cutId } : {}),
    },
  });
}

/**
 * Generate a price alert deep link
 */
export function generateAlertLink(alertId: string): string {
  return Linking.createURL('alert', {
    queryParams: { alert: alertId },
  });
}
