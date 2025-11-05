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

let instanceCounter = 0;

export class GtmClientImpl implements GtmClient {
  private readonly logger = createLogger(this.options.logger);
  private readonly resolvedDataLayerName = this.options.dataLayerName ?? DEFAULT_DATA_LAYER_NAME;
  private readonly containers = Array.isArray(this.options.containers)
    ? this.options.containers.map(normalizeContainer)
    : [normalizeContainer(this.options.containers)];
  private readonly queue: DataLayerValue[] = [];
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

  constructor(private readonly options: CreateGtmClientOptions, private readonly instanceId: string) {
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
      const value = this.queue.shift();
      if (value !== undefined) {
        pushToDataLayer(this.dataLayerState, value);
      }
    }
  }

  private deliverToDataLayer(value: DataLayerValue): boolean {
    if (this.initialized && this.dataLayerState) {
      pushToDataLayer(this.dataLayerState, value);
      return true;
    }

    this.queue.push(value);
    return false;
  }

  private pushStartEvent(): void {
    if (!this.dataLayerState) {
      return;
    }

    const startEvent = { 'gtm.start': this.startTimestamp, event: 'gtm.js' } as const;
    pushToDataLayer(this.dataLayerState, startEvent);
  }
}

export const createGtmClient = (options: CreateGtmClientOptions): GtmClient => {
  const instanceId = `gtm-kit-${++instanceCounter}`;
  return new GtmClientImpl(options, instanceId);
};
