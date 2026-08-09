import { WebhookEventPayload, UnifiedOrderDTO } from '../types/integration.types';
import { normalizeTikTokOrderPayload } from '../adapters/tiktok.adapter';

/**
 * Handle TikTok Shop Real-time Webhook Events
 */
export function handleTikTokWebhookEvent(payload: WebhookEventPayload): UnifiedOrderDTO | null {
  if (payload.eventType !== 'ORDER_STATUS_CHANGE' && payload.eventType !== 'PACKAGE_STATUS_CHANGE') {
    return null;
  }

  const rawOrderData = payload.data || {};
  return normalizeTikTokOrderPayload(rawOrderData, 'PRODUCTION');
}
