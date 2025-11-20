export type DataLayerValue =
  | Record<string, unknown>
  | ((...args: unknown[]) => unknown)
  | unknown[];

export interface DataLayerState {
  name: string;
  dataLayer: DataLayerValue[];
  created: boolean;
  restore(): void;
}

export interface Logger {
  debug(message: string, details?: Record<string, unknown>): void;
  info(message: string, details?: Record<string, unknown>): void;
  warn(message: string, details?: Record<string, unknown>): void;
  error(message: string, details?: Record<string, unknown>): void;
}

export type PartialLogger = Partial<Logger>;

export type ScriptAttributeValue = string | boolean | null | undefined;

export interface ScriptAttributes {
  async?: boolean;
  defer?: boolean;
  nonce?: string;
  [attribute: string]: ScriptAttributeValue;
}

export type ScriptLoadStatus = 'loaded' | 'failed' | 'skipped';

export interface ScriptLoadState {
  containerId: string;
  src?: string;
  status: ScriptLoadStatus;
  fromCache?: boolean;
  error?: string;
}

export interface ContainerDescriptor {
  id: string;
  queryParams?: Record<string, string | number | boolean>;
}

export type ContainerConfigInput = string | ContainerDescriptor;

export interface CreateGtmClientOptions {
  containers: ContainerConfigInput[] | ContainerConfigInput;
  dataLayerName?: string;
  host?: string;
  defaultQueryParams?: Record<string, string | number | boolean>;
  scriptAttributes?: ScriptAttributes;
  logger?: PartialLogger;
}

export interface GtmClient {
  readonly dataLayerName: string;
  init(): void;
  push(value: DataLayerValue): void;
  setConsentDefaults(state: import('./consent').ConsentState, options?: import('./consent').ConsentRegionOptions): void;
  updateConsent(state: import('./consent').ConsentState, options?: import('./consent').ConsentRegionOptions): void;
  teardown(): void;
  isInitialized(): boolean;
  whenReady(): Promise<ScriptLoadState[]>;
  onReady(callback: (state: ScriptLoadState[]) => void): () => void;
}
