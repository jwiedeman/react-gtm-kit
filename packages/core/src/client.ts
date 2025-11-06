import { ensureDataLayer, pushToDataLayer } from './data-layer';
import { createConsentCommandValue } from './consent';
import type { ConsentRegionOptions, ConsentState } from './consent';
import { createLogger } from './logger';
import { ScriptManager } from './script-manager';
import type {
  ContainerConfigInput,
  ContainerDescriptor,
  CreateGtmClientOptions,
  DataLayerValue,
  GtmClient
} from './types';

const DEFAULT_DATA_LAYER_NAME = 'dataLayer';

const isString = (value: unknown): value is string => typeof value === 'string';

const normalizeContainer = (input: ContainerConfigInput): ContainerDescriptor => {
  if (isString(input)) {
    return { id: input };
  }

  return input;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const serializeUnknown = (value: unknown): string | null => {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    return JSON.stringify(value);
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (const entry of value) {
      const serialized = serializeUnknown(entry);
      if (serialized === null) {
        return null;
      }
      parts.push(serialized);
    }
    return `[${parts.join(',')}]`;
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    const parts: string[] = [];
    for (const key of keys) {
      const serialized = serializeUnknown((value as Record<string, unknown>)[key]);
      if (serialized === null) {
        return null;
      }
      parts.push(`${JSON.stringify(key)}:${serialized}`);
    }
    return `{${parts.join(',')}}`;
  }

  return null;
};

const serializeDataLayerValue = (value: DataLayerValue): string | null => {
  if (Array.isArray(value)) {
    return serializeUnknown(value);
  }

  if (isPlainObject(value)) {
    return serializeUnknown(value);
  }

  return null;
};

const isConsentCommandValue = (value: DataLayerValue): value is unknown[] =>
  Array.isArray(value) &&
  value.length >= 3 &&
  value[0] === 'consent' &&
  (value[1] === 'default' || value[1] === 'update');

const isConsentDefaultCommandValue = (value: DataLayerValue): boolean =>
  isConsentCommandValue(value) && value[1] === 'default';

const isStartEvent = (value: DataLayerValue): boolean => {
  if (!isPlainObject(value)) {
    return false;
  }

  return (value.event as unknown) === 'gtm.js';
};

interface QueuedEntry {
  value: DataLayerValue;
  signature: string | null;
}

let instanceCounter = 0;

export class GtmClientImpl implements GtmClient {
  private readonly logger = createLogger(this.options.logger);
  private readonly resolvedDataLayerName = this.options.dataLayerName ?? DEFAULT_DATA_LAYER_NAME;
  private readonly containers = Array.isArray(this.options.containers)
    ? this.options.containers.map(normalizeContainer)
    : [normalizeContainer(this.options.containers)];
  private readonly queue: QueuedEntry[] = [];
  private readonly queuedSignatures = new Set<string>();
  private readonly deliveredSignatures = new Set<string>();
  private snapshotSignatures: Set<string> | null = null;
  private readonly scriptManager = new ScriptManager({
    instanceId: this.instanceId,
    host: this.options.host,
    defaultQueryParams: this.options.defaultQueryParams,
    scriptAttributes: this.options.scriptAttributes,
    logger: this.options.logger
  });
  private dataLayerState: ReturnType<typeof ensureDataLayer> | null = null;
  private initialized = false;
  private readonly startTimestamp = Date.now();

  constructor(
    private readonly options: CreateGtmClientOptions,
    private readonly instanceId: string
  ) {
    if (!this.containers.length) {
      throw new Error('At least one GTM container ID is required to initialize the client.');
    }
  }

  init(): void {
    if (this.initialized) {
      this.logger.debug('GTM client already initialized; skipping.');
      return;
    }

    this.logger.info('Initializing GTM client.', {
      containers: this.containers.map((container) => container.id),
      dataLayerName: this.resolvedDataLayerName
    });

    this.dataLayerState = ensureDataLayer(this.resolvedDataLayerName);
    this.captureSnapshotSignatures();
    this.pushStartEvent();
    this.flushQueue();
    this.scriptManager.ensure(this.containers);

    this.initialized = true;
  }

  push(value: DataLayerValue): void {
    if (value === undefined || value === null) {
      this.logger.warn('Ignoring falsy dataLayer push.', { value });
      return;
    }

    const immediate = this.deliverToDataLayer(value);

    if (immediate) {
      this.logger.debug('Pushed value to dataLayer.', { immediate: true });
    } else {
      this.logger.debug('Queued dataLayer value (pre-init).', { queueLength: this.queue.length });
    }
  }

  setConsentDefaults(state: ConsentState, options?: ConsentRegionOptions): void {
    const value = createConsentCommandValue({ command: 'default', state, options });
    const immediate = this.deliverToDataLayer(value);

    this.logger.info('Applied consent defaults.', {
      immediate,
      state,
      options
    });
  }

  updateConsent(state: ConsentState, options?: ConsentRegionOptions): void {
    const value = createConsentCommandValue({ command: 'update', state, options });
    const immediate = this.deliverToDataLayer(value);

    this.logger.info('Updated consent state.', {
      immediate,
      state,
      options
    });
  }

  teardown(): void {
    this.logger.info('Tearing down GTM client instance.', { dataLayerName: this.resolvedDataLayerName });
    this.scriptManager.teardown();
    if (this.dataLayerState) {
      this.dataLayerState.restore();
    }
    this.queue.length = 0;
    this.queuedSignatures.clear();
    this.deliveredSignatures.clear();
    this.snapshotSignatures = null;
    this.initialized = false;
    this.dataLayerState = null;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  get dataLayerName(): string {
    return this.resolvedDataLayerName;
  }

  private flushQueue(): void {
    if (!this.dataLayerState) {
      return;
    }

    while (this.queue.length) {
      const entry = this.queue.shift();
      if (!entry) {
        continue;
      }

      this.pushValueToDataLayer(entry.value, entry.signature);

      if (entry.signature) {
        this.queuedSignatures.delete(entry.signature);
      }
    }
  }

  private deliverToDataLayer(value: DataLayerValue): boolean {
    if (this.initialized && this.dataLayerState) {
      this.pushValueToDataLayer(value);
      return true;
    }

    this.queueValue(value);
    return false;
  }

  private pushStartEvent(): void {
    if (!this.dataLayerState) {
      return;
    }

    if (this.hasExistingStartEvent()) {
      this.logger.debug('Detected existing gtm.js event; skipping duplicate start push.');
      return;
    }

    const startEvent = { 'gtm.start': this.startTimestamp, event: 'gtm.js' } as const;
    this.pushValueToDataLayer(startEvent);
  }

  private captureSnapshotSignatures(): void {
    if (!this.dataLayerState) {
      return;
    }

    const snapshot = this.dataLayerState.snapshot ?? [];
    this.snapshotSignatures = new Set<string>();

    for (const value of snapshot) {
      const signature = serializeDataLayerValue(value);
      if (signature) {
        this.snapshotSignatures.add(signature);
        this.deliveredSignatures.add(signature);
      }
    }
  }

  private queueValue(value: DataLayerValue): void {
    const signature = serializeDataLayerValue(value);

    if (signature && this.queuedSignatures.has(signature)) {
      this.logger.debug('Skipping duplicate queued dataLayer value.', { value });
      return;
    }

    const entry: QueuedEntry = { value, signature };

    if (isConsentDefaultCommandValue(value)) {
      const firstNonConsentIndex = this.queue.findIndex((queued) => !isConsentDefaultCommandValue(queued.value));

      if (firstNonConsentIndex === -1) {
        this.queue.push(entry);
      } else {
        this.queue.splice(firstNonConsentIndex, 0, entry);
      }
    } else {
      this.queue.push(entry);
    }

    if (signature) {
      this.queuedSignatures.add(signature);
    }
  }

  private pushValueToDataLayer(value: DataLayerValue, existingSignature?: string | null): void {
    if (!this.dataLayerState) {
      return;
    }

    const signature = existingSignature ?? serializeDataLayerValue(value);
    const seenInSnapshot = signature ? this.snapshotSignatures?.has(signature) : false;
    const alreadyDelivered = signature ? this.deliveredSignatures.has(signature) : false;

    if (signature && (seenInSnapshot || alreadyDelivered)) {
      this.logger.debug('Skipping duplicate dataLayer value detected during hydration.', { value });
      this.deliveredSignatures.add(signature);
      return;
    }

    pushToDataLayer(this.dataLayerState, value);

    if (signature) {
      this.deliveredSignatures.add(signature);
    }
  }

  private hasExistingStartEvent(): boolean {
    if (!this.dataLayerState) {
      return false;
    }

    const snapshot = this.dataLayerState.snapshot ?? [];
    if (snapshot.some(isStartEvent)) {
      return true;
    }

    return this.dataLayerState.dataLayer.some(isStartEvent);
  }
}

export const createGtmClient = (options: CreateGtmClientOptions): GtmClient => {
  const instanceId = `gtm-kit-${++instanceCounter}`;
  return new GtmClientImpl(options, instanceId);
};
