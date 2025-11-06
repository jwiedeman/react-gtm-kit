import { createServer } from 'node:http';

const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
};

const port = parseInteger(process.env.PORT, 4001);
const requestTimeoutMs = parseInteger(process.env.REQUEST_TIMEOUT_MS, 5000);
const taggingServerUrl = process.env.TAGGING_SERVER_URL;
const measurementId = process.env.GTM_MEASUREMENT_ID;
const apiSecret = process.env.GTM_API_SECRET;
const containerId = process.env.GTM_CONTAINER_ID;
const gtmPreview = process.env.GTM_PREVIEW;
const gtmAuth = process.env.GTM_AUTH;
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
const debugEnabled = process.env.DEBUG === '1' || process.env.DEBUG === 'true';

if (!taggingServerUrl) {
  throw new Error('TAGGING_SERVER_URL environment variable is required.');
}

if (!measurementId) {
  throw new Error('GTM_MEASUREMENT_ID environment variable is required.');
}

const log = (level, message, details) => {
  if (level === 'debug' && !debugEnabled) {
    return;
  }

  const timestamp = new Date().toISOString();
  if (details) {
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, details);
  } else {
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
};

const MAX_BODY_SIZE = 512 * 1024; // 512 KiB

const isPlainObject = (value) => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const createClientId = () => `${Date.now()}.${Math.floor(Math.random() * 1_000_000_000)}`;

const normalizeValue = (value) => {
  if (value === null) {
    return null;
  }

  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    const normalized = value.map((entry) => normalizeValue(entry)).filter((entry) => entry !== undefined);
    return normalized;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value)
      .map(([key, entry]) => [key, normalizeValue(entry)])
      .filter(([, entry]) => entry !== undefined);

    return Object.fromEntries(entries);
  }

  return undefined;
};

const sanitizeParams = (params) => {
  const entries = Object.entries(params)
    .map(([key, value]) => [key, normalizeValue(value)])
    .filter(([, value]) => value !== undefined);

  return Object.fromEntries(entries);
};

const normalizeEvents = (input) => {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('At least one event is required.');
  }

  return input.map((raw, index) => {
    if (!isPlainObject(raw)) {
      throw new Error(`Event at index ${index} must be an object.`);
    }

    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    if (!name) {
      throw new Error(`Event at index ${index} is missing a non-empty name.`);
    }

    const params = isPlainObject(raw.params) ? sanitizeParams(raw.params) : {};
    const timestampValue = raw.timestampMicros ?? raw.timestamp_micros;
    let timestampMicros;
    if (timestampValue !== undefined && timestampValue !== null) {
      const parsed = Number(timestampValue);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Event \"${name}\" has an invalid timestampMicros value.`);
      }
      timestampMicros = Math.trunc(parsed);
    }

    return {
      name,
      params,
      timestampMicros
    };
  });
};

const normalizeConsent = (value) => {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const entries = Object.entries(value).filter(([, consentValue]) => typeof consentValue === 'string');
  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
};

const normalizeClient = (value) => {
  if (!isPlainObject(value)) {
    return {
      clientId: createClientId()
    };
  }

  const clientId = typeof value.id === 'string' && value.id.trim().length > 0 ? value.id.trim() : createClientId();

  const userId = typeof value.userId === 'string' && value.userId.trim().length > 0 ? value.userId.trim() : undefined;

  const sessionRaw = value.sessionId ?? value.session_id;
  let sessionId;
  if (typeof sessionRaw === 'number' && Number.isFinite(sessionRaw)) {
    sessionId = Math.trunc(sessionRaw);
  } else if (typeof sessionRaw === 'string' && sessionRaw.trim().length > 0) {
    const parsed = Number.parseInt(sessionRaw, 10);
    if (Number.isFinite(parsed)) {
      sessionId = parsed;
    }
  }

  const userAgent = typeof value.userAgent === 'string' && value.userAgent.length > 0 ? value.userAgent : undefined;
  const ip = typeof value.ip === 'string' && value.ip.length > 0 ? value.ip : undefined;
  const nonPersonalizedAds = value.nonPersonalizedAds === true || value.non_personalized_ads === true;

  return {
    clientId,
    userId,
    sessionId,
    userAgent,
    ip,
    nonPersonalizedAds
  };
};

const applyCors = (req, res) => {
  const origin = req.headers.origin;

  if (allowedOrigins.length > 0) {
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    } else if (origin) {
      return false;
    }
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Max-Age', '300');

  return true;
};

const readBody = async (req) => {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;

    if (size > MAX_BODY_SIZE) {
      throw new Error('Request body exceeds maximum size of 512KiB.');
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
};

const sendJson = (res, status, body) => {
  const json = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(json));
  res.end(json);
};

const forwardEvents = async ({ events, client, consent }) => {
  const url = new URL('/g/collect', taggingServerUrl);
  url.searchParams.set('measurement_id', measurementId);

  if (apiSecret) {
    url.searchParams.set('api_secret', apiSecret);
  }

  if (gtmPreview) {
    url.searchParams.set('gtm_preview', gtmPreview);
  }

  if (gtmAuth) {
    url.searchParams.set('gtm_auth', gtmAuth);
  }

  const payloadEvents = events.map((event) => {
    const params = { ...event.params };
    if (client.sessionId !== undefined && params.session_id === undefined) {
      params.session_id = client.sessionId;
    }

    const entry = {
      name: event.name
    };

    if (Object.keys(params).length > 0) {
      entry.params = params;
    }

    if (event.timestampMicros !== undefined) {
      entry.timestamp_micros = String(event.timestampMicros);
    }

    return entry;
  });

  const payload = {
    client_id: client.clientId,
    events: payloadEvents
  };

  if (client.userId) {
    payload.user_id = client.userId;
  }

  if (client.nonPersonalizedAds) {
    payload.non_personalized_ads = true;
  }

  if (consent) {
    payload.consent = consent;
  }

  const headers = new Headers({ 'content-type': 'application/json' });
  headers.set('user-agent', client.userAgent ?? 'react-gtm-kit-server-example/0.0.0');

  if (client.ip) {
    headers.set('x-forwarded-for', client.ip);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    log('debug', 'Forwarding events to GTM server container.', {
      measurementId,
      containerId,
      url: `${url.origin}${url.pathname}`,
      eventCount: events.length
    });

    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
      signal: controller.signal
    });

    const responseBody = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      body: responseBody
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        status: 0,
        error: 'Request to GTM server container timed out.'
      };
    }

    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Unknown error forwarding events.'
    };
  } finally {
    clearTimeout(timeout);
  }
};

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      const corsOk = applyCors(req, res);
      if (!corsOk) {
        sendJson(res, 403, { error: 'Origin not allowed.' });
        return;
      }

      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.url === '/healthz') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.url !== '/events') {
      sendJson(res, 404, { error: 'Not found.' });
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
      return;
    }

    const corsOk = applyCors(req, res);
    if (!corsOk) {
      sendJson(res, 403, { error: 'Origin not allowed.' });
      return;
    }

    const bodyText = await readBody(req);
    let payload;
    try {
      payload = bodyText ? JSON.parse(bodyText) : {};
    } catch (error) {
      log('warn', 'Received malformed JSON payload.', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      sendJson(res, 400, { error: 'Invalid JSON payload.' });
      return;
    }

    let events;
    try {
      events = normalizeEvents(payload.events);
    } catch (error) {
      sendJson(res, 400, { error: error instanceof Error ? error.message : 'Invalid event payload.' });
      return;
    }

    const consent = normalizeConsent(payload.consent);
    const client = normalizeClient(payload.client);

    const result = await forwardEvents({ events, client, consent });

    if (!result.ok) {
      log('error', 'Failed to forward events to GTM server container.', {
        status: result.status,
        error: result.error,
        response: result.body ? result.body.slice(0, 512) : undefined
      });
      sendJson(res, 502, {
        error: 'Failed to forward events to GTM server container.',
        status: result.status,
        detail: result.error
      });
      return;
    }

    log('info', 'Forwarded events to GTM server container.', {
      status: result.status,
      events: events.map((event) => event.name)
    });

    sendJson(res, 202, {
      forwarded: events.length,
      status: result.status,
      destination: `${taggingServerUrl}/g/collect`,
      measurementId,
      containerId
    });
  } catch (error) {
    log('error', 'Unexpected server error.', { error: error instanceof Error ? error.message : 'Unknown error' });
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Internal server error.' });
    } else {
      res.end();
    }
  }
});

server.on('clientError', (err, socket) => {
  log('warn', 'Client connection error.', { error: err.message });
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(port, () => {
  log('info', 'GTM server relay listening.', {
    port,
    taggingServerUrl,
    measurementId,
    containerId,
    requestTimeoutMs,
    allowedOrigins
  });
});
