export type EventName = string;

export type EventPayload = Record<string, unknown>;

export type GtmEvent<TName extends EventName = EventName, TPayload extends EventPayload = EventPayload> = Readonly<
  {
    event: TName;
  } & TPayload
>;

export type CustomEvent<TName extends EventName, TPayload extends EventPayload = EventPayload> = GtmEvent<
  TName,
  TPayload
>;

export interface PageViewPayload extends EventPayload {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  send_to?: string;
}

export type PageViewEvent = GtmEvent<'page_view', PageViewPayload>;

export interface AdsConversionPayload extends EventPayload {
  send_to: string;
  value?: number;
  currency?: string;
  transaction_id?: string;
  user_data?: Record<string, unknown>;
}

export type AdsConversionEvent = GtmEvent<'conversion', AdsConversionPayload>;

export interface EcommerceItem extends EventPayload {
  item_id?: string;
  item_name?: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_category3?: string;
  item_category4?: string;
  item_category5?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  coupon?: string;
  discount?: number;
}

export interface EcommercePayload extends EventPayload {
  affiliation?: string;
  coupon?: string;
  currency?: string;
  items: readonly EcommerceItem[];
  shipping?: number;
  tax?: number;
  transaction_id?: string;
  value?: number;
}

export type EcommerceEventName =
  | 'add_payment_info'
  | 'add_shipping_info'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'purchase'
  | 'refund'
  | 'remove_from_cart'
  | 'select_item'
  | 'select_promotion'
  | 'view_cart'
  | 'view_item'
  | 'view_item_list'
  | 'view_promotion';

export type EcommerceEvent<
  TName extends EventName = EcommerceEventName,
  TExtras extends EventPayload = EventPayload
> = GtmEvent<TName, { ecommerce: EcommercePayload } & TExtras>;

export type EventForName<TName extends EventName> = TName extends 'page_view'
  ? PageViewEvent
  : TName extends 'conversion'
    ? AdsConversionEvent
    : TName extends EcommerceEventName
      ? EcommerceEvent<TName>
      : CustomEvent<TName>;
