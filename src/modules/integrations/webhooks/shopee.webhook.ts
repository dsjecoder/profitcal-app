import { WebhookEventPayload, UnifiedOrderDTO } from '../types/integration.types';
import { normalizeShopeeOrderPayload } from '../adapters/shopee.adapter';

/**
 * Handle Shopee Real-time Webhook Events
 */
export function handleShopeeWebhookEvent(payload: WebhookEventPayload): UnifiedOrderDTO | null {
  if (payload.eventType !== 'ORDER_STATUS_UPDATE') {
    return null;
  }

  const rawOrderData = payload.data || {};
  return normalizeShopeeOrderPayload(rawOrderData, 'PRODUCTION');
}
