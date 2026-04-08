import { supabase } from './supabase';

type EventName =
  | 'share_card_generated'
  | 'share_card_shared'
  | 'share_card_opened'
  | 'cut_search'
  | 'shop_view'
  | 'price_flag'
  | 'review_submit'
  | 'onboarding_complete'
  | 'language_switch';

export async function trackEvent(event: EventName, properties: Record<string, unknown> = {}) {
  try {
    await supabase.rpc('log_event', {
      p_event: event,
      p_properties: properties,
    });
  } catch {
    // Analytics should never block the user — fail silently
  }
}
