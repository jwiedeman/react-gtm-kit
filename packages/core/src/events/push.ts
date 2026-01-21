import type { GtmClient } from '../types';
import type {
  EcommerceEvent,
  EcommerceEventName,
  EcommercePayload,
  EventForName,
  EventPayload,
  GtmEvent
} from './types';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const clonePayload = <TPayload extends EventPayload | undefined>(payload: TPayload): TPayload => {
  if (!payload) {
    return payload;
  }

  return { ...payload } as TPayload;
};

export const pushEvent = <TName extends string, TPayload extends EventPayload = EventPayload>(
  client: Pick<GtmClient, 'push'>,
  name: TName,
  payload?: TPayload
): EventForName<TName> => {
  if (!name) {
    throw new Error(
      'An event name is required when pushing to the dataLayer. ' +
        'Example: pushEvent(client, "page_view", { page_path: "/home" })'
    );
  }

  if (payload !== undefined && !isRecord(payload)) {
    throw new Error(
      'Event payloads must be plain objects when pushing to the dataLayer. ' +
        `Received: ${typeof payload}. ` +
        'Example: pushEvent(client, "click", { button_name: "cta" })'
    );
  }

  const event = {
    event: name,
    ...(clonePayload(payload) ?? {})
  } as GtmEvent<TName, TPayload>;

  client.push(event);
  return event as EventForName<TName>;
};

export interface PushEcommerceOptions<TExtras extends EventPayload = EventPayload> {
  extras?: TExtras;
}

export const pushEcommerce = <TName extends EcommerceEventName, TExtras extends EventPayload = EventPayload>(
  client: Pick<GtmClient, 'push'>,
  name: TName,
  ecommerce: EcommercePayload,
  options?: PushEcommerceOptions<TExtras>
): EcommerceEvent<TName, TExtras> => {
  if (!isRecord(ecommerce)) {
    throw new Error(
      'Ecommerce payload must be an object. ' +
        `Received: ${ecommerce === null ? 'null' : typeof ecommerce}. ` +
        'Example: pushEcommerce(client, "purchase", { transaction_id: "T123", value: 99.99, items: [...] })'
    );
  }

  const extras = options?.extras ?? {};

  if (!isRecord(extras)) {
    throw new Error(
      'Ecommerce extras must be an object when provided. ' +
        `Received: ${typeof extras}. ` +
        'Example: pushEcommerce(client, "purchase", ecommerce, { extras: { user_id: "123" } })'
    );
  }

  const payload = { ...extras, ecommerce } as { ecommerce: EcommercePayload } & TExtras;
  return pushEvent(client, name, payload) as EcommerceEvent<TName, TExtras>;
};
