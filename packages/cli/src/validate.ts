/**
 * Validation utilities for GTM Kit CLI
 *
 * Validates:
 * - GTM container IDs (GTM-XXXXXX format)
 * - Configuration options
 * - Data layer names
 */

export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Warning message (validation passed but with concerns) */
  warning?: string;
  /** Suggested fix if invalid */
  suggestion?: string;
}

/**
 * Valid GTM container ID pattern
 * Format: GTM-XXXXXX where X is alphanumeric (typically uppercase)
 * Length: GTM- prefix + 6-8 characters
 */
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]{6,8}$/;

/**
 * Common mistakes in GTM IDs
 */
const COMMON_MISTAKES: Array<{ pattern: RegExp; message: string; suggestion: string }> = [
  {
    pattern: /^gtm-[A-Za-z0-9]/,
    message: 'GTM ID should use uppercase "GTM-" prefix',
    suggestion: 'Use uppercase: GTM-XXXXXX'
  },
  {
    pattern: /^G-/,
    message: 'This looks like a GA4 Measurement ID, not a GTM container ID',
    suggestion: 'GTM IDs start with "GTM-", GA4 IDs start with "G-"'
  },
  {
    pattern: /^UA-/,
    message: 'This is a Universal Analytics ID, not a GTM container ID',
    suggestion: 'GTM IDs start with "GTM-", UA IDs start with "UA-"'
  },
  {
    pattern: /^AW-/,
    message: 'This looks like a Google Ads conversion ID, not a GTM container ID',
    suggestion: 'GTM IDs start with "GTM-", Google Ads IDs start with "AW-"'
  },
  {
    pattern: /^DC-/,
    message: 'This looks like a DoubleClick ID, not a GTM container ID',
    suggestion: 'GTM IDs start with "GTM-"'
  },
  {
    pattern: /^GTM-[A-Za-z0-9]{1,5}$/,
    message: 'GTM container ID appears too short',
    suggestion: 'GTM IDs are typically 6-8 characters after the prefix (e.g., GTM-ABCD123)'
  },
  {
    pattern: /^GTM-[A-Za-z0-9]{9,}$/,
    message: 'GTM container ID appears too long',
    suggestion: 'GTM IDs are typically 6-8 characters after the prefix (e.g., GTM-ABCD123)'
  },
  {
    pattern: /\s/,
    message: 'GTM container ID should not contain spaces',
    suggestion: 'Remove any spaces from the ID'
  }
];

/**
 * Validates a GTM container ID
 *
 * @example
 * validateGtmId('GTM-ABC1234') // { valid: true }
 * validateGtmId('G-ABC123')    // { valid: false, error: '...' }
 */
export const validateGtmId = (id: string): ValidationResult => {
  if (!id || typeof id !== 'string') {
    return {
      valid: false,
      error: 'GTM container ID is required',
      suggestion: 'Provide a valid GTM container ID (e.g., GTM-XXXXXX)'
    };
  }

  const trimmedId = id.trim();

  if (trimmedId.length === 0) {
    return {
      valid: false,
      error: 'GTM container ID cannot be empty',
      suggestion: 'Provide a valid GTM container ID (e.g., GTM-XXXXXX)'
    };
  }

  // Check for common mistakes first (better error messages)
  for (const mistake of COMMON_MISTAKES) {
    if (mistake.pattern.test(trimmedId)) {
      return {
        valid: false,
        error: mistake.message,
        suggestion: mistake.suggestion
      };
    }
  }

  // Check against valid pattern
  if (!GTM_ID_PATTERN.test(trimmedId)) {
    // Try to give a specific error
    if (!trimmedId.startsWith('GTM-')) {
      return {
        valid: false,
        error: 'GTM container ID must start with "GTM-"',
        suggestion: `Did you mean: GTM-${trimmedId.replace(/^[A-Za-z]+-?/, '')}?`
      };
    }

    const afterPrefix = trimmedId.slice(4);
    if (/[a-z]/.test(afterPrefix)) {
      return {
        valid: false,
        error: 'GTM container ID should use uppercase letters',
        suggestion: `Did you mean: GTM-${afterPrefix.toUpperCase()}?`
      };
    }

    if (/[^A-Z0-9]/.test(afterPrefix)) {
      return {
        valid: false,
        error: 'GTM container ID should only contain letters and numbers after GTM-',
        suggestion: 'Remove any special characters from the ID'
      };
    }

    return {
      valid: false,
      error: 'Invalid GTM container ID format',
      suggestion: 'GTM container IDs follow the format: GTM-XXXXXX (6-8 alphanumeric characters)'
    };
  }

  return { valid: true };
};

/**
 * Validates multiple GTM container IDs
 */
export const validateGtmIds = (ids: string[]): ValidationResult => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return {
      valid: false,
      error: 'At least one GTM container ID is required',
      suggestion: 'Provide at least one valid GTM container ID'
    };
  }

  const results = ids.map((id, index) => ({
    index,
    id,
    result: validateGtmId(id)
  }));

  const invalid = results.filter((r) => !r.result.valid);

  if (invalid.length > 0) {
    const errors = invalid.map((r) => `  [${r.index}] ${r.id}: ${r.result.error}`).join('\n');
    return {
      valid: false,
      error: `Invalid GTM container ID(s):\n${errors}`,
      suggestion: invalid[0].result.suggestion
    };
  }

  // Warn about duplicates
  const uniqueIds = new Set(ids);
  if (uniqueIds.size < ids.length) {
    return {
      valid: true,
      warning: 'Duplicate GTM container IDs detected. Each container should only be listed once.'
    };
  }

  return { valid: true };
};

/**
 * Valid data layer name pattern (JavaScript variable name)
 */
const DATA_LAYER_NAME_PATTERN = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

/**
 * Reserved JavaScript keywords that can't be used as data layer names
 */
const RESERVED_KEYWORDS = new Set([
  'break',
  'case',
  'catch',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'finally',
  'for',
  'function',
  'if',
  'in',
  'instanceof',
  'new',
  'return',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'class',
  'const',
  'enum',
  'export',
  'extends',
  'import',
  'super',
  'implements',
  'interface',
  'let',
  'package',
  'private',
  'protected',
  'public',
  'static',
  'yield',
  'null',
  'true',
  'false',
  'undefined',
  'NaN',
  'Infinity'
]);

/**
 * Validates a data layer name
 */
export const validateDataLayerName = (name: string): ValidationResult => {
  if (!name || typeof name !== 'string') {
    return {
      valid: false,
      error: 'Data layer name is required',
      suggestion: 'Use the default "dataLayer" or provide a valid JavaScript variable name'
    };
  }

  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return {
      valid: false,
      error: 'Data layer name cannot be empty',
      suggestion: 'Use the default "dataLayer"'
    };
  }

  if (RESERVED_KEYWORDS.has(trimmedName)) {
    return {
      valid: false,
      error: `"${trimmedName}" is a reserved JavaScript keyword`,
      suggestion: 'Use a different name like "dataLayer" or "customDataLayer"'
    };
  }

  if (!DATA_LAYER_NAME_PATTERN.test(trimmedName)) {
    if (/^\d/.test(trimmedName)) {
      return {
        valid: false,
        error: 'Data layer name cannot start with a number',
        suggestion: `Did you mean: _${trimmedName} or dataLayer${trimmedName}?`
      };
    }

    if (/\s/.test(trimmedName)) {
      return {
        valid: false,
        error: 'Data layer name cannot contain spaces',
        suggestion: `Did you mean: ${trimmedName.replace(/\s+/g, '_')}?`
      };
    }

    if (/-/.test(trimmedName)) {
      return {
        valid: false,
        error: 'Data layer name cannot contain hyphens',
        suggestion: `Did you mean: ${trimmedName.replace(/-/g, '_')}?`
      };
    }

    return {
      valid: false,
      error: 'Invalid data layer name - must be a valid JavaScript variable name',
      suggestion: 'Use only letters, numbers, underscores, and dollar signs (cannot start with a number)'
    };
  }

  // Warn about non-standard names
  if (trimmedName !== 'dataLayer') {
    return {
      valid: true,
      warning:
        'Using a custom data layer name. Make sure your GTM container is configured to use the same name.'
    };
  }

  return { valid: true };
};

/**
 * Configuration validation options
 */
export interface ValidateConfigOptions {
  containers: string | string[];
  dataLayerName?: string;
  host?: string;
}

/**
 * Validates the full GTM Kit configuration
 */
export const validateConfig = (config: ValidateConfigOptions): ValidationResult => {
  // Validate containers
  const containerIds = Array.isArray(config.containers) ? config.containers : [config.containers];
  const containerResult = validateGtmIds(containerIds);
  if (!containerResult.valid) {
    return containerResult;
  }

  // Validate data layer name if provided
  if (config.dataLayerName !== undefined) {
    const dataLayerResult = validateDataLayerName(config.dataLayerName);
    if (!dataLayerResult.valid) {
      return dataLayerResult;
    }
    if (dataLayerResult.warning) {
      return dataLayerResult;
    }
  }

  // Validate host if provided
  if (config.host !== undefined) {
    if (typeof config.host !== 'string') {
      return {
        valid: false,
        error: 'Host must be a string',
        suggestion: 'Provide a valid URL like "https://www.googletagmanager.com"'
      };
    }

    try {
      const url = new URL(config.host);
      if (!['http:', 'https:'].includes(url.protocol)) {
        return {
          valid: false,
          error: 'Host must use HTTP or HTTPS protocol',
          suggestion: 'Use a URL starting with http:// or https://'
        };
      }
    } catch {
      return {
        valid: false,
        error: 'Invalid host URL',
        suggestion: 'Provide a valid URL like "https://www.googletagmanager.com"'
      };
    }
  }

  // Return container warning if present
  if (containerResult.warning) {
    return containerResult;
  }

  return { valid: true };
};
