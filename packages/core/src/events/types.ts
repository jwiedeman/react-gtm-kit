/**
 * GA4 Recommended Events - These provide autocomplete in editors.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events
 */
export type GA4RecommendedEvent =
  // Ecommerce events
  | 'add_payment_info'
  | 'add_shipping_info'
  | 'add_to_cart'
  | 'add_to_wishlist'
  | 'begin_checkout'
  | 'purchase'
  | 'refund'
  | 'remove_from_cart'
  | 'select_item'
  | 'select_promotion'
  | 'view_cart'
  | 'view_item'
  | 'view_item_list'
  | 'view_promotion'
  // Engagement events
  | 'earn_virtual_currency'
  | 'join_group'
  | 'login'
  | 'search'
  | 'select_content'
  | 'share'
  | 'sign_up'
  | 'spend_virtual_currency'
  | 'tutorial_begin'
  | 'tutorial_complete'
  | 'unlock_achievement'
  // Gaming events
  | 'level_end'
  | 'level_start'
  | 'level_up'
  | 'post_score'
  // Content events
  | 'page_view'
  | 'screen_view'
  | 'scroll'
  | 'view_search_results'
  // Lead generation
  | 'generate_lead'
  // Ads conversion
  | 'conversion';

/**
 * GTM internal events.
 */
export type GtmInternalEvent = 'gtm.js' | 'gtm.dom' | 'gtm.load' | 'gtm.click' | 'gtm.linkClick' | 'gtm.formSubmit';

// =============================================================================
// BOOKING / RESERVATION EVENT NAMES (defined early for EventName)
// =============================================================================

/**
 * Common booking event names for travel, hospitality, appointments, and reservations.
 * These are not official GA4 events but are commonly used across industries.
 */
export type BookingEventName =
  | 'booking_requested'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_modified'
  | 'reservation_created'
  | 'reservation_confirmed'
  | 'reservation_cancelled'
  | 'appointment_scheduled'
  | 'appointment_cancelled'
  | 'appointment_rescheduled';

// =============================================================================
// VIDEO EVENT NAMES (defined early for EventName)
// =============================================================================

/**
 * Video tracking event names.
 * Compatible with YouTube, Vimeo, HTML5 video, and custom video players.
 */
export type VideoEventName =
  | 'video_start'
  | 'video_progress'
  | 'video_complete'
  | 'video_pause'
  | 'video_resume'
  | 'video_seek'
  | 'video_error'
  | 'video_quality_change'
  | 'video_fullscreen';

// =============================================================================
// FORM EVENT NAMES (defined early for EventName)
// =============================================================================

/**
 * Form interaction event names for detailed form analytics.
 * Goes beyond GA4's generate_lead to track the full form lifecycle.
 */
export type FormEventName =
  | 'form_start'
  | 'form_submit'
  | 'form_submit_success'
  | 'form_submit_failure'
  | 'form_error'
  | 'form_abandon'
  | 'form_field_focus'
  | 'form_field_blur'
  | 'form_field_change'
  | 'form_step_complete';

// =============================================================================
// SAAS / SUBSCRIPTION EVENT NAMES (defined early for EventName)
// =============================================================================

/**
 * SaaS and subscription-related event names.
 * Essential for software products, subscription services, and freemium models.
 */
export type SaaSEventName =
  | 'trial_start'
  | 'trial_end'
  | 'trial_convert'
  | 'subscription_start'
  | 'subscription_cancel'
  | 'subscription_renew'
  | 'subscription_upgrade'
  | 'subscription_downgrade'
  | 'subscription_pause'
  | 'subscription_resume'
  | 'plan_select'
  | 'feature_used'
  | 'limit_reached'
  | 'onboarding_start'
  | 'onboarding_step'
  | 'onboarding_complete'
  | 'invite_sent'
  | 'invite_accepted';

/**
 * Extended event names for industry-specific tracking.
 * These complement GA4 recommended events with comprehensive event coverage.
 */
export type ExtendedEventName =
  | BookingEventName
  | VideoEventName
  | FormEventName
  | SaaSEventName
  | ErrorEventName
  | FileEventName
  | AuthEventName
  | EngagementEventName
  | CommunicationEventName
  | SocialEventName
  | SearchFilterEventName
  | GamingEventName;

/**
 * Event name type that provides autocomplete for GA4/GTM events
 * while still accepting custom event names as strings.
 *
 * @example
 * ```ts
 * // Autocomplete works for GA4 events
 * pushEvent(client, 'page_view', { page_title: 'Home' });
 * pushEvent(client, 'purchase', { transaction_id: '123' });
 *
 * // Autocomplete works for extended events
 * pushEvent(client, 'booking_confirmed', { booking_id: 'BK-123' });
 * pushEvent(client, 'video_start', { video_id: 'abc123' });
 * pushEvent(client, 'form_submit', { form_id: 'contact' });
 * pushEvent(client, 'subscription_start', { plan_id: 'pro' });
 *
 * // Custom events still work
 * pushEvent(client, 'custom_button_click', { button_id: 'cta' });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/ban-types -- (string & {}) pattern enables string autocompletion while allowing arbitrary strings
export type EventName = GA4RecommendedEvent | GtmInternalEvent | ExtendedEventName | (string & {});

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

/**
 * Payload for login event.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#login
 */
export interface LoginPayload extends EventPayload {
  method?: string;
}

export type LoginEvent = GtmEvent<'login', LoginPayload>;

/**
 * Payload for sign_up event.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#sign_up
 */
export interface SignUpPayload extends EventPayload {
  method?: string;
}

export type SignUpEvent = GtmEvent<'sign_up', SignUpPayload>;

/**
 * Payload for search event.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#search
 */
export interface SearchPayload extends EventPayload {
  search_term: string;
}

export type SearchEvent = GtmEvent<'search', SearchPayload>;

/**
 * Payload for select_content event.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#select_content
 */
export interface SelectContentPayload extends EventPayload {
  content_type?: string;
  item_id?: string;
}

export type SelectContentEvent = GtmEvent<'select_content', SelectContentPayload>;

/**
 * Payload for share event.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#share
 */
export interface SharePayload extends EventPayload {
  method?: string;
  content_type?: string;
  item_id?: string;
}

export type ShareEvent = GtmEvent<'share', SharePayload>;

/**
 * Payload for generate_lead event.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#generate_lead
 */
export interface GenerateLeadPayload extends EventPayload {
  currency?: string;
  value?: number;
}

export type GenerateLeadEvent = GtmEvent<'generate_lead', GenerateLeadPayload>;

/**
 * Payload for view_search_results event.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#view_search_results
 */
export interface ViewSearchResultsPayload extends EventPayload {
  search_term: string;
}

export type ViewSearchResultsEvent = GtmEvent<'view_search_results', ViewSearchResultsPayload>;

/**
 * Payload for screen_view event (mobile/app).
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#screen_view
 */
export interface ScreenViewPayload extends EventPayload {
  screen_name: string;
  screen_class?: string;
}

export type ScreenViewEvent = GtmEvent<'screen_view', ScreenViewPayload>;

/**
 * Payload for scroll event.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events#scroll
 */
export interface ScrollPayload extends EventPayload {
  percent_scrolled?: number;
}

export type ScrollEvent = GtmEvent<'scroll', ScrollPayload>;

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

// =============================================================================
// BOOKING / RESERVATION PAYLOADS
// =============================================================================

/**
 * Payload for booking/reservation events.
 * Designed to work with travel, hospitality, healthcare, and service industries.
 *
 * @example
 * ```ts
 * pushEvent(client, 'booking_confirmed', {
 *   booking_id: 'BK-12345',
 *   booking_type: 'hotel',
 *   value: 450.00,
 *   currency: 'USD',
 *   check_in_date: '2024-03-15',
 *   check_out_date: '2024-03-18',
 *   guests: 2,
 *   room_type: 'deluxe_suite'
 * });
 * ```
 */
export interface BookingPayload extends EventPayload {
  /** Unique booking/reservation identifier */
  booking_id?: string;
  /** Type of booking: hotel, flight, restaurant, appointment, service, etc. */
  booking_type?: string;
  /** Monetary value of the booking */
  value?: number;
  /** Currency code (ISO 4217) */
  currency?: string;
  /** Start date/time (ISO 8601 format recommended) */
  check_in_date?: string;
  start_date?: string;
  start_time?: string;
  /** End date/time (ISO 8601 format recommended) */
  check_out_date?: string;
  end_date?: string;
  end_time?: string;
  /** Number of guests/attendees */
  guests?: number;
  party_size?: number;
  /** Number of nights (for hotels) */
  nights?: number;
  /** Room/service type */
  room_type?: string;
  service_type?: string;
  /** Location/venue */
  location?: string;
  destination?: string;
  /** Provider/vendor name */
  provider?: string;
  /** Promo/discount code applied */
  coupon?: string;
  /** Payment method used */
  payment_method?: string;
  /** Lead time in days (how far in advance the booking was made) */
  lead_time_days?: number;
  /** Cancellation reason (for cancelled bookings) */
  cancellation_reason?: string;
}

export type BookingRequestedEvent = GtmEvent<'booking_requested', BookingPayload>;
export type BookingConfirmedEvent = GtmEvent<'booking_confirmed', BookingPayload>;
export type BookingCancelledEvent = GtmEvent<'booking_cancelled', BookingPayload>;
export type BookingModifiedEvent = GtmEvent<'booking_modified', BookingPayload>;
export type ReservationCreatedEvent = GtmEvent<'reservation_created', BookingPayload>;
export type ReservationConfirmedEvent = GtmEvent<'reservation_confirmed', BookingPayload>;
export type ReservationCancelledEvent = GtmEvent<'reservation_cancelled', BookingPayload>;
export type AppointmentScheduledEvent = GtmEvent<'appointment_scheduled', BookingPayload>;
export type AppointmentCancelledEvent = GtmEvent<'appointment_cancelled', BookingPayload>;
export type AppointmentRescheduledEvent = GtmEvent<'appointment_rescheduled', BookingPayload>;

// =============================================================================
// VIDEO PAYLOADS
// =============================================================================

/**
 * Payload for video tracking events.
 * Designed for comprehensive video analytics across platforms.
 *
 * @example
 * ```ts
 * pushEvent(client, 'video_progress', {
 *   video_id: 'abc123',
 *   video_title: 'Product Demo',
 *   video_provider: 'youtube',
 *   video_percent: 50,
 *   video_current_time: 120,
 *   video_duration: 240
 * });
 * ```
 */
export interface VideoPayload extends EventPayload {
  /** Unique video identifier */
  video_id?: string;
  /** Video title */
  video_title?: string;
  /** Video URL */
  video_url?: string;
  /** Provider: youtube, vimeo, html5, wistia, etc. */
  video_provider?: string;
  /** Total video duration in seconds */
  video_duration?: number;
  /** Current playback position in seconds */
  video_current_time?: number;
  /** Percentage watched (0-100) */
  video_percent?: number;
  /** Whether the video is muted */
  video_muted?: boolean;
  /** Playback volume (0-100) */
  video_volume?: number;
  /** Video quality: 1080p, 720p, 480p, auto, etc. */
  video_quality?: string;
  /** Playback speed: 0.5, 1, 1.5, 2, etc. */
  video_playback_rate?: number;
  /** Whether playing in fullscreen */
  video_fullscreen?: boolean;
  /** Whether captions/subtitles are enabled */
  video_captions?: boolean;
  /** Caption language if enabled */
  video_caption_language?: string;
  /** Content category or type */
  video_category?: string;
  /** Error message (for video_error events) */
  video_error_message?: string;
  /** Whether this is a live stream */
  video_is_live?: boolean;
  /** Playlist ID if part of a playlist */
  playlist_id?: string;
  /** Position in playlist (1-indexed) */
  playlist_position?: number;
}

export type VideoStartEvent = GtmEvent<'video_start', VideoPayload>;
export type VideoProgressEvent = GtmEvent<'video_progress', VideoPayload>;
export type VideoCompleteEvent = GtmEvent<'video_complete', VideoPayload>;
export type VideoPauseEvent = GtmEvent<'video_pause', VideoPayload>;
export type VideoResumeEvent = GtmEvent<'video_resume', VideoPayload>;
export type VideoSeekEvent = GtmEvent<'video_seek', VideoPayload>;
export type VideoErrorEvent = GtmEvent<'video_error', VideoPayload>;

// =============================================================================
// FORM PAYLOADS
// =============================================================================

/**
 * Payload for form tracking events.
 * Enables detailed form funnel analysis and optimization.
 *
 * @example
 * ```ts
 * pushEvent(client, 'form_submit_success', {
 *   form_id: 'contact-form',
 *   form_name: 'Contact Us',
 *   form_type: 'contact',
 *   form_fields_count: 5,
 *   time_to_complete_ms: 45000
 * });
 *
 * pushEvent(client, 'form_error', {
 *   form_id: 'signup-form',
 *   field_name: 'email',
 *   error_type: 'validation',
 *   error_message: 'Invalid email format'
 * });
 * ```
 */
export interface FormPayload extends EventPayload {
  /** Unique form identifier (HTML id or custom) */
  form_id?: string;
  /** Human-readable form name */
  form_name?: string;
  /** Form type: contact, signup, checkout, survey, newsletter, etc. */
  form_type?: string;
  /** Form destination/action URL */
  form_destination?: string;
  /** Number of fields in the form */
  form_fields_count?: number;
  /** Number of required fields */
  form_required_fields?: number;
  /** Number of fields filled */
  form_fields_filled?: number;
  /** Current step (for multi-step forms) */
  form_step?: number;
  /** Total steps (for multi-step forms) */
  form_total_steps?: number;
  /** Step name or label */
  form_step_name?: string;
  /** Time spent on form in milliseconds */
  time_to_complete_ms?: number;
  /** Field name (for field-level events) */
  field_name?: string;
  /** Field type: text, email, tel, select, checkbox, etc. */
  field_type?: string;
  /** Field label */
  field_label?: string;
  /** Field position in form (1-indexed) */
  field_position?: number;
  /** Whether the field is required */
  field_required?: boolean;
  /** Error type: validation, server, network, etc. */
  error_type?: string;
  /** Error message */
  error_message?: string;
  /** Number of validation errors */
  error_count?: number;
  /** Field names that have errors */
  error_fields?: string[];
  /** Submission attempt number */
  submission_attempt?: number;
  /** Lead value (if applicable) */
  value?: number;
  /** Currency for lead value */
  currency?: string;
}

export type FormStartEvent = GtmEvent<'form_start', FormPayload>;
export type FormSubmitEvent = GtmEvent<'form_submit', FormPayload>;
export type FormSubmitSuccessEvent = GtmEvent<'form_submit_success', FormPayload>;
export type FormSubmitFailureEvent = GtmEvent<'form_submit_failure', FormPayload>;
export type FormErrorEvent = GtmEvent<'form_error', FormPayload>;
export type FormAbandonEvent = GtmEvent<'form_abandon', FormPayload>;
export type FormStepCompleteEvent = GtmEvent<'form_step_complete', FormPayload>;

// =============================================================================
// SAAS / SUBSCRIPTION PAYLOADS
// =============================================================================

/**
 * Payload for SaaS/subscription events.
 * Designed for subscription lifecycle, feature usage, and onboarding tracking.
 *
 * @example
 * ```ts
 * pushEvent(client, 'subscription_start', {
 *   plan_id: 'pro_monthly',
 *   plan_name: 'Pro Plan',
 *   billing_period: 'monthly',
 *   value: 29.99,
 *   currency: 'USD',
 *   is_upgrade: false,
 *   trial_converted: true
 * });
 *
 * pushEvent(client, 'feature_used', {
 *   feature_id: 'export_csv',
 *   feature_name: 'CSV Export',
 *   feature_category: 'data_export',
 *   usage_count: 5
 * });
 * ```
 */
export interface SaaSPayload extends EventPayload {
  /** Unique subscription/account ID */
  subscription_id?: string;
  /** Plan identifier */
  plan_id?: string;
  /** Plan display name */
  plan_name?: string;
  /** Plan tier: free, starter, pro, enterprise, etc. */
  plan_tier?: string;
  /** Billing period: monthly, yearly, lifetime, etc. */
  billing_period?: string;
  /** Subscription value/price */
  value?: number;
  /** Monthly recurring revenue */
  mrr?: number;
  /** Annual recurring revenue */
  arr?: number;
  /** Currency code */
  currency?: string;
  /** Whether user was on trial before conversion */
  trial_converted?: boolean;
  /** Trial length in days */
  trial_days?: number;
  /** Days remaining in trial */
  trial_days_remaining?: number;
  /** Whether this is an upgrade */
  is_upgrade?: boolean;
  /** Whether this is a downgrade */
  is_downgrade?: boolean;
  /** Previous plan ID (for upgrades/downgrades) */
  previous_plan_id?: string;
  /** Previous plan name */
  previous_plan_name?: string;
  /** Cancellation reason */
  cancellation_reason?: string;
  /** Discount/coupon code */
  coupon?: string;
  /** Discount amount */
  discount_amount?: number;
  /** Payment method */
  payment_method?: string;
  /** Feature identifier */
  feature_id?: string;
  /** Feature display name */
  feature_name?: string;
  /** Feature category */
  feature_category?: string;
  /** Number of times feature was used */
  usage_count?: number;
  /** Limit type that was reached */
  limit_type?: string;
  /** Current usage amount */
  current_usage?: number;
  /** Maximum allowed usage */
  max_usage?: number;
  /** Onboarding step number */
  onboarding_step?: number;
  /** Total onboarding steps */
  onboarding_total_steps?: number;
  /** Onboarding step name */
  onboarding_step_name?: string;
  /** Team/workspace size */
  team_size?: number;
  /** Invite recipient email domain */
  invite_domain?: string;
  /** Number of invites sent */
  invites_sent?: number;
}

export type TrialStartEvent = GtmEvent<'trial_start', SaaSPayload>;
export type TrialEndEvent = GtmEvent<'trial_end', SaaSPayload>;
export type TrialConvertEvent = GtmEvent<'trial_convert', SaaSPayload>;
export type SubscriptionStartEvent = GtmEvent<'subscription_start', SaaSPayload>;
export type SubscriptionCancelEvent = GtmEvent<'subscription_cancel', SaaSPayload>;
export type SubscriptionRenewEvent = GtmEvent<'subscription_renew', SaaSPayload>;
export type SubscriptionUpgradeEvent = GtmEvent<'subscription_upgrade', SaaSPayload>;
export type SubscriptionDowngradeEvent = GtmEvent<'subscription_downgrade', SaaSPayload>;
export type PlanSelectEvent = GtmEvent<'plan_select', SaaSPayload>;
export type FeatureUsedEvent = GtmEvent<'feature_used', SaaSPayload>;
export type LimitReachedEvent = GtmEvent<'limit_reached', SaaSPayload>;
export type OnboardingStartEvent = GtmEvent<'onboarding_start', SaaSPayload>;
export type OnboardingStepEvent = GtmEvent<'onboarding_step', SaaSPayload>;
export type OnboardingCompleteEvent = GtmEvent<'onboarding_complete', SaaSPayload>;
export type InviteSentEvent = GtmEvent<'invite_sent', SaaSPayload>;
export type InviteAcceptedEvent = GtmEvent<'invite_accepted', SaaSPayload>;

// =============================================================================
// ERROR / EXCEPTION EVENTS
// =============================================================================

/**
 * Error and exception event names for application monitoring.
 * Track JavaScript errors, API failures, and user-facing errors.
 */
export type ErrorEventName =
  | 'error'
  | 'exception'
  | 'api_error'
  | 'validation_error'
  | 'page_not_found'
  | 'permission_denied'
  | 'timeout'
  | 'network_error';

/**
 * Payload for error/exception events.
 * Designed for comprehensive error tracking and debugging.
 *
 * @example
 * ```ts
 * pushEvent(client, 'exception', {
 *   error_message: 'Failed to load user data',
 *   error_type: 'api_error',
 *   error_code: '500',
 *   error_stack: 'Error: Failed to load...',
 *   fatal: false
 * });
 * ```
 */
export interface ErrorPayload extends EventPayload {
  /** Error message */
  error_message?: string;
  /** Error type/category */
  error_type?: string;
  /** Error code (HTTP status, app error code, etc.) */
  error_code?: string;
  /** Stack trace (truncated for privacy) */
  error_stack?: string;
  /** File/component where error occurred */
  error_file?: string;
  /** Line number */
  error_line?: number;
  /** Column number */
  error_column?: number;
  /** Whether the error is fatal/blocking */
  fatal?: boolean;
  /** URL where error occurred */
  error_url?: string;
  /** User action that triggered the error */
  user_action?: string;
  /** API endpoint (for API errors) */
  api_endpoint?: string;
  /** HTTP method (for API errors) */
  http_method?: string;
  /** Request ID for tracing */
  request_id?: string;
  /** Browser/app version */
  app_version?: string;
}

export type ErrorEvent = GtmEvent<'error', ErrorPayload>;
export type ExceptionEvent = GtmEvent<'exception', ErrorPayload>;
export type ApiErrorEvent = GtmEvent<'api_error', ErrorPayload>;
export type ValidationErrorEvent = GtmEvent<'validation_error', ErrorPayload>;
export type PageNotFoundEvent = GtmEvent<'page_not_found', ErrorPayload>;

// =============================================================================
// FILE / DOWNLOAD EVENTS
// =============================================================================

/**
 * File and download event names.
 * Track document downloads, file uploads, and resource interactions.
 */
export type FileEventName =
  | 'file_download'
  | 'file_upload'
  | 'file_view'
  | 'file_share'
  | 'file_print'
  | 'document_open'
  | 'document_save';

/**
 * Payload for file/download events.
 * Designed for tracking document and file interactions.
 *
 * @example
 * ```ts
 * pushEvent(client, 'file_download', {
 *   file_name: 'annual-report-2024.pdf',
 *   file_extension: 'pdf',
 *   file_type: 'document',
 *   file_size_bytes: 2500000,
 *   link_url: '/downloads/annual-report-2024.pdf'
 * });
 * ```
 */
export interface FilePayload extends EventPayload {
  /** File name */
  file_name?: string;
  /** File extension (pdf, xlsx, docx, etc.) */
  file_extension?: string;
  /** File type category (document, image, video, archive, etc.) */
  file_type?: string;
  /** File size in bytes */
  file_size_bytes?: number;
  /** Download/view URL */
  link_url?: string;
  /** Link text if applicable */
  link_text?: string;
  /** Content category/topic */
  content_category?: string;
  /** Content ID */
  content_id?: string;
  /** Whether file is gated (requires form fill) */
  is_gated?: boolean;
  /** MIME type */
  mime_type?: string;
  /** Upload source (local, cloud, url, etc.) */
  upload_source?: string;
  /** Storage destination (for uploads) */
  storage_destination?: string;
}

export type FileDownloadEvent = GtmEvent<'file_download', FilePayload>;
export type FileUploadEvent = GtmEvent<'file_upload', FilePayload>;
export type FileViewEvent = GtmEvent<'file_view', FilePayload>;
export type DocumentOpenEvent = GtmEvent<'document_open', FilePayload>;

// =============================================================================
// AUTHENTICATION EVENTS (Extended)
// =============================================================================

/**
 * Extended authentication event names beyond login/signup.
 * Track the complete auth lifecycle.
 */
export type AuthEventName =
  | 'password_reset_request'
  | 'password_reset_complete'
  | 'password_change'
  | 'email_verification_sent'
  | 'email_verification_complete'
  | 'phone_verification_sent'
  | 'phone_verification_complete'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  | 'two_factor_challenge'
  | 'two_factor_success'
  | 'two_factor_failure'
  | 'session_start'
  | 'session_end'
  | 'logout'
  | 'account_created'
  | 'account_deleted'
  | 'account_locked'
  | 'account_unlocked'
  | 'profile_updated'
  | 'email_changed'
  | 'sso_login';

/**
 * Payload for authentication events.
 * Designed for complete auth flow tracking.
 *
 * @example
 * ```ts
 * pushEvent(client, 'two_factor_success', {
 *   method: 'authenticator_app',
 *   user_id: 'usr_123',
 *   is_new_device: true
 * });
 * ```
 */
export interface AuthPayload extends EventPayload {
  /** Auth method: email, google, facebook, sso, magic_link, etc. */
  method?: string;
  /** User ID (hashed/anonymized) */
  user_id?: string;
  /** SSO provider name */
  sso_provider?: string;
  /** Whether this is a new device */
  is_new_device?: boolean;
  /** Device type */
  device_type?: string;
  /** 2FA method: sms, email, authenticator_app, hardware_key */
  two_factor_method?: string;
  /** Session duration in seconds */
  session_duration_seconds?: number;
  /** Whether user selected "remember me" */
  remember_me?: boolean;
  /** Failure reason (for failed events) */
  failure_reason?: string;
  /** Number of attempts */
  attempt_count?: number;
  /** Account age in days */
  account_age_days?: number;
  /** User role/tier */
  user_role?: string;
}

export type PasswordResetRequestEvent = GtmEvent<'password_reset_request', AuthPayload>;
export type PasswordResetCompleteEvent = GtmEvent<'password_reset_complete', AuthPayload>;
export type TwoFactorEnabledEvent = GtmEvent<'two_factor_enabled', AuthPayload>;
export type TwoFactorSuccessEvent = GtmEvent<'two_factor_success', AuthPayload>;
export type LogoutEvent = GtmEvent<'logout', AuthPayload>;
export type ProfileUpdatedEvent = GtmEvent<'profile_updated', AuthPayload>;
export type SsoLoginEvent = GtmEvent<'sso_login', AuthPayload>;

// =============================================================================
// ENGAGEMENT / INTERACTION EVENTS
// =============================================================================

/**
 * User engagement event names for measuring interaction depth.
 * Track how users interact with content beyond page views.
 */
export type EngagementEventName =
  | 'scroll_depth'
  | 'time_on_page'
  | 'engagement_time'
  | 'content_consumed'
  | 'click'
  | 'hover'
  | 'copy_text'
  | 'print_page'
  | 'tab_visible'
  | 'tab_hidden'
  | 'page_unload'
  | 'idle_timeout'
  | 'return_from_idle';

/**
 * Payload for engagement events.
 * Designed for measuring content interaction depth.
 *
 * @example
 * ```ts
 * pushEvent(client, 'scroll_depth', {
 *   percent_scrolled: 75,
 *   pixel_depth: 2400,
 *   content_length: 3200,
 *   time_to_reach_ms: 45000
 * });
 * ```
 */
export interface EngagementPayload extends EventPayload {
  /** Scroll percentage (0-100) */
  percent_scrolled?: number;
  /** Scroll depth in pixels */
  pixel_depth?: number;
  /** Total content length in pixels */
  content_length?: number;
  /** Time spent on page in milliseconds */
  time_on_page_ms?: number;
  /** Engaged time (active interaction) in milliseconds */
  engagement_time_ms?: number;
  /** Time to reach scroll depth in milliseconds */
  time_to_reach_ms?: number;
  /** Element ID that was interacted with */
  element_id?: string;
  /** Element classes */
  element_classes?: string;
  /** Element text (truncated) */
  element_text?: string;
  /** Interaction type */
  interaction_type?: string;
  /** Whether user returned after being idle */
  returned_from_idle?: boolean;
  /** Idle duration in seconds */
  idle_duration_seconds?: number;
  /** Content section reached */
  content_section?: string;
  /** Word count of visible content */
  words_visible?: number;
}

export type ScrollDepthEvent = GtmEvent<'scroll_depth', EngagementPayload>;
export type TimeOnPageEvent = GtmEvent<'time_on_page', EngagementPayload>;
export type ContentConsumedEvent = GtmEvent<'content_consumed', EngagementPayload>;
export type ClickEvent = GtmEvent<'click', EngagementPayload>;

// =============================================================================
// COMMUNICATION EVENTS
// =============================================================================

/**
 * Communication event names for chat, email, and notification tracking.
 */
export type CommunicationEventName =
  | 'chat_started'
  | 'chat_message_sent'
  | 'chat_message_received'
  | 'chat_ended'
  | 'chat_rated'
  | 'chatbot_interaction'
  | 'notification_displayed'
  | 'notification_clicked'
  | 'notification_dismissed'
  | 'notification_permission_granted'
  | 'notification_permission_denied'
  | 'email_link_clicked'
  | 'sms_link_clicked'
  | 'push_notification_opened'
  | 'in_app_message_displayed'
  | 'in_app_message_clicked';

/**
 * Payload for communication events.
 * Designed for chat, messaging, and notification tracking.
 *
 * @example
 * ```ts
 * pushEvent(client, 'chat_started', {
 *   chat_id: 'chat_abc123',
 *   chat_type: 'support',
 *   is_chatbot: false,
 *   department: 'sales'
 * });
 * ```
 */
export interface CommunicationPayload extends EventPayload {
  /** Chat/conversation ID */
  chat_id?: string;
  /** Chat type: support, sales, general, etc. */
  chat_type?: string;
  /** Whether interaction is with a chatbot */
  is_chatbot?: boolean;
  /** Department/team */
  department?: string;
  /** Message count in conversation */
  message_count?: number;
  /** Chat duration in seconds */
  chat_duration_seconds?: number;
  /** Chat rating (1-5) */
  rating?: number;
  /** Rating feedback text */
  rating_feedback?: string;
  /** Notification ID */
  notification_id?: string;
  /** Notification type */
  notification_type?: string;
  /** Notification title */
  notification_title?: string;
  /** Notification channel: push, email, sms, in_app */
  notification_channel?: string;
  /** Campaign ID */
  campaign_id?: string;
  /** Campaign name */
  campaign_name?: string;
  /** Email ID (for email tracking) */
  email_id?: string;
  /** Email subject */
  email_subject?: string;
  /** Response time in seconds (for support) */
  response_time_seconds?: number;
  /** Whether issue was resolved */
  issue_resolved?: boolean;
}

export type ChatStartedEvent = GtmEvent<'chat_started', CommunicationPayload>;
export type ChatEndedEvent = GtmEvent<'chat_ended', CommunicationPayload>;
export type ChatRatedEvent = GtmEvent<'chat_rated', CommunicationPayload>;
export type NotificationClickedEvent = GtmEvent<'notification_clicked', CommunicationPayload>;
export type NotificationDismissedEvent = GtmEvent<'notification_dismissed', CommunicationPayload>;
export type EmailLinkClickedEvent = GtmEvent<'email_link_clicked', CommunicationPayload>;

// =============================================================================
// SOCIAL ENGAGEMENT EVENTS
// =============================================================================

/**
 * Social engagement event names for social features.
 */
export type SocialEventName =
  | 'social_share'
  | 'social_follow'
  | 'social_unfollow'
  | 'social_like'
  | 'social_unlike'
  | 'social_comment'
  | 'social_comment_reply'
  | 'social_mention'
  | 'social_tag'
  | 'social_save'
  | 'social_unsave'
  | 'social_report'
  | 'social_block'
  | 'social_connect'
  | 'referral_link_created'
  | 'referral_link_shared'
  | 'referral_signup';

/**
 * Payload for social engagement events.
 *
 * @example
 * ```ts
 * pushEvent(client, 'social_share', {
 *   share_method: 'twitter',
 *   content_type: 'article',
 *   content_id: 'post_123',
 *   share_url: 'https://example.com/article'
 * });
 * ```
 */
export interface SocialPayload extends EventPayload {
  /** Share method/platform: twitter, facebook, linkedin, email, copy_link, etc. */
  share_method?: string;
  /** Content type being shared */
  content_type?: string;
  /** Content ID */
  content_id?: string;
  /** Content title */
  content_title?: string;
  /** Share URL */
  share_url?: string;
  /** Target user ID (for follow/mention) */
  target_user_id?: string;
  /** Target username */
  target_username?: string;
  /** Comment ID */
  comment_id?: string;
  /** Comment text (truncated) */
  comment_text?: string;
  /** Parent comment ID (for replies) */
  parent_comment_id?: string;
  /** Referral code */
  referral_code?: string;
  /** Referral source */
  referral_source?: string;
  /** Number of followers/connections */
  follower_count?: number;
  /** Engagement score */
  engagement_score?: number;
}

export type SocialShareEvent = GtmEvent<'social_share', SocialPayload>;
export type SocialFollowEvent = GtmEvent<'social_follow', SocialPayload>;
export type SocialLikeEvent = GtmEvent<'social_like', SocialPayload>;
export type SocialCommentEvent = GtmEvent<'social_comment', SocialPayload>;
export type ReferralSignupEvent = GtmEvent<'referral_signup', SocialPayload>;

// =============================================================================
// SEARCH / FILTERING EVENTS
// =============================================================================

/**
 * Search and filtering event names for discovery tracking.
 */
export type SearchFilterEventName =
  | 'search_started'
  | 'search_autocomplete'
  | 'search_suggestion_clicked'
  | 'search_results_filtered'
  | 'filter_applied'
  | 'filter_removed'
  | 'filter_cleared'
  | 'sort_applied'
  | 'facet_clicked'
  | 'category_selected'
  | 'pagination'
  | 'load_more'
  | 'infinite_scroll_load';

/**
 * Payload for search and filtering events.
 *
 * @example
 * ```ts
 * pushEvent(client, 'filter_applied', {
 *   filter_type: 'price_range',
 *   filter_value: '100-500',
 *   results_count: 42,
 *   search_term: 'wireless headphones'
 * });
 * ```
 */
export interface SearchFilterPayload extends EventPayload {
  /** Search query */
  search_term?: string;
  /** Filter type/category */
  filter_type?: string;
  /** Filter value */
  filter_value?: string;
  /** Multiple filter values */
  filter_values?: string[];
  /** All active filters */
  active_filters?: Record<string, string | string[]>;
  /** Sort field */
  sort_field?: string;
  /** Sort direction: asc, desc */
  sort_direction?: string;
  /** Number of results */
  results_count?: number;
  /** Results page number */
  page_number?: number;
  /** Results per page */
  results_per_page?: number;
  /** Category ID */
  category_id?: string;
  /** Category name */
  category_name?: string;
  /** Autocomplete suggestion selected */
  suggestion_selected?: string;
  /** Position of suggestion in list */
  suggestion_position?: number;
  /** Whether search returned no results */
  no_results?: boolean;
  /** Time to first result in ms */
  time_to_results_ms?: number;
}

export type SearchStartedEvent = GtmEvent<'search_started', SearchFilterPayload>;
export type FilterAppliedEvent = GtmEvent<'filter_applied', SearchFilterPayload>;
export type FilterRemovedEvent = GtmEvent<'filter_removed', SearchFilterPayload>;
export type SortAppliedEvent = GtmEvent<'sort_applied', SearchFilterPayload>;
export type CategorySelectedEvent = GtmEvent<'category_selected', SearchFilterPayload>;
export type PaginationEvent = GtmEvent<'pagination', SearchFilterPayload>;

// =============================================================================
// GAMING / ACHIEVEMENT EVENTS (Extended)
// =============================================================================

/**
 * Extended gaming event names beyond GA4 defaults.
 */
export type GamingEventName =
  | 'achievement_unlocked'
  | 'badge_earned'
  | 'quest_started'
  | 'quest_completed'
  | 'quest_abandoned'
  | 'reward_claimed'
  | 'daily_login'
  | 'streak_achieved'
  | 'streak_broken'
  | 'leaderboard_view'
  | 'challenge_started'
  | 'challenge_completed'
  | 'pvp_match_started'
  | 'pvp_match_ended'
  | 'item_crafted'
  | 'item_traded';

/**
 * Payload for gaming/gamification events.
 */
export interface GamingPayload extends EventPayload {
  /** Achievement/badge ID */
  achievement_id?: string;
  /** Achievement name */
  achievement_name?: string;
  /** Achievement category */
  achievement_category?: string;
  /** Points/XP earned */
  points_earned?: number;
  /** Total points/XP */
  total_points?: number;
  /** Current level */
  level?: number;
  /** Quest/challenge ID */
  quest_id?: string;
  /** Quest name */
  quest_name?: string;
  /** Quest difficulty */
  difficulty?: string;
  /** Completion percentage */
  completion_percent?: number;
  /** Time to complete in seconds */
  time_to_complete_seconds?: number;
  /** Reward type */
  reward_type?: string;
  /** Reward value */
  reward_value?: number;
  /** Streak count */
  streak_count?: number;
  /** Leaderboard position */
  leaderboard_position?: number;
  /** Opponent ID (for PvP) */
  opponent_id?: string;
  /** Match result: win, loss, draw */
  match_result?: string;
}

export type AchievementUnlockedEvent = GtmEvent<'achievement_unlocked', GamingPayload>;
export type BadgeEarnedEvent = GtmEvent<'badge_earned', GamingPayload>;
export type QuestCompletedEvent = GtmEvent<'quest_completed', GamingPayload>;
export type RewardClaimedEvent = GtmEvent<'reward_claimed', GamingPayload>;
export type StreakAchievedEvent = GtmEvent<'streak_achieved', GamingPayload>;

/**
 * Discriminated union that maps event names to their specific payload types.
 * Provides better IntelliSense and type checking for event payloads.
 *
 * @example
 * ```ts
 * // TypeScript will infer the correct payload type
 * const event: EventForName<'login'> = { event: 'login', method: 'google' };
 * const search: EventForName<'search'> = { event: 'search', search_term: 'query' };
 * const booking: EventForName<'booking_confirmed'> = { event: 'booking_confirmed', booking_id: 'BK-123' };
 * const video: EventForName<'video_start'> = { event: 'video_start', video_id: 'abc' };
 * ```
 */
export type EventForName<TName extends EventName> =
  // GA4 recommended events
  TName extends 'page_view'
    ? PageViewEvent
    : TName extends 'conversion'
      ? AdsConversionEvent
      : TName extends 'login'
        ? LoginEvent
        : TName extends 'sign_up'
          ? SignUpEvent
          : TName extends 'search'
            ? SearchEvent
            : TName extends 'select_content'
              ? SelectContentEvent
              : TName extends 'share'
                ? ShareEvent
                : TName extends 'generate_lead'
                  ? GenerateLeadEvent
                  : TName extends 'view_search_results'
                    ? ViewSearchResultsEvent
                    : TName extends 'screen_view'
                      ? ScreenViewEvent
                      : TName extends 'scroll'
                        ? ScrollEvent
                        : TName extends EcommerceEventName
                          ? EcommerceEvent<TName>
                          : // Booking events
                            TName extends BookingEventName
                            ? GtmEvent<TName, BookingPayload>
                            : // Video events
                              TName extends VideoEventName
                              ? GtmEvent<TName, VideoPayload>
                              : // Form events
                                TName extends FormEventName
                                ? GtmEvent<TName, FormPayload>
                                : // SaaS events
                                  TName extends SaaSEventName
                                  ? GtmEvent<TName, SaaSPayload>
                                  : // Error events
                                    TName extends ErrorEventName
                                    ? GtmEvent<TName, ErrorPayload>
                                    : // File events
                                      TName extends FileEventName
                                      ? GtmEvent<TName, FilePayload>
                                      : // Auth events
                                        TName extends AuthEventName
                                        ? GtmEvent<TName, AuthPayload>
                                        : // Engagement events
                                          TName extends EngagementEventName
                                          ? GtmEvent<TName, EngagementPayload>
                                          : // Communication events
                                            TName extends CommunicationEventName
                                            ? GtmEvent<TName, CommunicationPayload>
                                            : // Social events
                                              TName extends SocialEventName
                                              ? GtmEvent<TName, SocialPayload>
                                              : // Search/Filter events
                                                TName extends SearchFilterEventName
                                                ? GtmEvent<TName, SearchFilterPayload>
                                                : // Gaming events
                                                  TName extends GamingEventName
                                                  ? GtmEvent<TName, GamingPayload>
                                                  : // Fallback to custom event
                                                    CustomEvent<TName>;
