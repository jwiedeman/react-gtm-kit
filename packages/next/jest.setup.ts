import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
