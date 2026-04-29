/**
 * Type definitions for Forge Remote invocation payloads.
 *
 * When Forge calls your Remote backend, it sends an HTTP POST with a JSON
 * payload containing context about the invocation. This module provides
 * TypeScript types for that payload and a factory function for creating
 * a ForgeRemoteAdapter from it.
 *
 * ## Payload Shape
 *
 * The exact shape of the Forge Remote payload is documented at:
 * https://developer.atlassian.com/platform/forge/remote/
 *
 * Key fields relevant to API calls:
 * - `installationId` — identifies this app installation
 * - `appSystemToken` — short-lived token for authenticating egress proxy requests
 * - `context.accountId` — the Atlassian account ID of the invoking user (if any)
 *
 * @see https://developer.atlassian.com/platform/forge/remote/
 */

import { ForgeRemoteAdapter, type ForgeRemoteAdapterOptions } from './ForgeRemoteAdapter.js';

/**
 * The context object within a Forge Remote invocation payload.
 * Contains information about the user and site that triggered the invocation.
 */
export interface ForgeInvocationContext {
  /** The Atlassian account ID of the user who triggered the invocation, if any */
  accountId?: string;
  /** The Atlassian cloud ID of the site */
  cloudId?: string;
  /** The site URL (e.g. https://your-site.atlassian.net) */
  siteUrl?: string;
  /** The environment type (development, staging, production) */
  environmentType?: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  /** The environment ID */
  environmentId?: string;
  /** The app version */
  appVersion?: string;
  /** The module key that was invoked */
  moduleKey?: string;
}

/**
 * The top-level Forge Remote invocation payload.
 *
 * This represents what Forge sends as the request body when calling your
 * Remote backend. The payload is signed and verified by Forge before delivery.
 *
 * Note: This type covers the fields documented by Atlassian. The actual payload
 * may contain additional undocumented fields that vary by invocation context.
 */
export interface ForgeInvocationPayload {
  /**
   * The installation ID for this app installation.
   * Use this to identify which installation is making the request.
   */
  installationId: string;

  /**
   * Short-lived app system token for authenticating requests through the
   * Forge egress proxy (FORGE_EGRESS_PROXY_URL).
   *
   * This token:
   * - Is specific to this invocation
   * - Has a short TTL (typically minutes, not hours)
   * - Must be passed in the `forge-proxy-authorization` header
   */
  appSystemToken: string;

  /**
   * Invocation context — user, site, and app information.
   */
  context: ForgeInvocationContext;

  /**
   * The payload sent by the Forge module that triggered this invocation.
   * Shape depends on the module type (webtrigger, custom-ui, etc.)
   */
  payload?: unknown;

  /**
   * Additional properties — Forge may include extra fields depending on
   * the invocation context and module type.
   */
  [key: string]: unknown;
}

/**
 * Options for the adapterFromForgePayload() factory function.
 */
export interface AdapterFromPayloadOptions
  extends Omit<ForgeRemoteAdapterOptions, 'installationId' | 'appSystemToken' | 'proxyUrl'> {
  /**
   * Override the egress proxy URL. Defaults to process.env.FORGE_EGRESS_PROXY_URL.
   * Useful for testing with a mock proxy.
   */
  proxyUrl?: string;
}

/**
 * Create a ForgeRemoteAdapter from a Forge Remote invocation payload.
 *
 * This is the recommended way to create an adapter in a Forge Remote handler —
 * it extracts `installationId` and `appSystemToken` from the payload automatically
 * and reads `FORGE_EGRESS_PROXY_URL` from the environment.
 *
 * @example
 * ```typescript
 * import { adapterFromForgePayload, type ForgeInvocationPayload } from '@forge-clients/core';
 * import { getIssue } from '@forge-clients/jira/v3';
 *
 * export async function handler(payload: ForgeInvocationPayload) {
 *   const client = adapterFromForgePayload(payload, 'jira');
 *   return getIssue(client, { issueIdOrKey: 'PROJ-123' });
 * }
 * ```
 *
 * @param payload - The Forge Remote invocation payload
 * @param product - The Atlassian product to make requests to
 * @param options - Optional overrides (e.g. proxyUrl for testing)
 * @throws {Error} if FORGE_EGRESS_PROXY_URL is not set and no proxyUrl override is provided
 */
export function adapterFromForgePayload(
  payload: ForgeInvocationPayload,
  product: 'jira' | 'confluence',
  options?: AdapterFromPayloadOptions,
): ForgeRemoteAdapter {
  const proxyUrl =
    options?.proxyUrl ??
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (typeof globalThis.process !== 'undefined'
      ? globalThis.process.env['FORGE_EGRESS_PROXY_URL']
      : undefined);

  if (!proxyUrl) {
    throw new Error(
      'adapterFromForgePayload: FORGE_EGRESS_PROXY_URL environment variable is not set. ' +
        'Pass a proxyUrl option explicitly if testing outside the Forge runtime.',
    );
  }

  if (!payload.installationId) {
    throw new Error(
      'adapterFromForgePayload: payload.installationId is missing. ' +
        'Ensure your Forge Remote is receiving the correct invocation payload.',
    );
  }

  if (!payload.appSystemToken) {
    throw new Error(
      'adapterFromForgePayload: payload.appSystemToken is missing. ' +
        'Ensure your Forge Remote is receiving the correct invocation payload.',
    );
  }

  return new ForgeRemoteAdapter({
    product,
    proxyUrl,
    installationId: payload.installationId,
    appSystemToken: payload.appSystemToken,
    ...options,
  });
}

/**
 * Extract the invoking user's account ID from a Forge Remote payload.
 * Returns undefined if the invocation was not triggered by a user
 * (e.g. scheduled triggers, webtriggers without a session).
 */
export function getInvokingUserId(payload: ForgeInvocationPayload): string | undefined {
  return payload.context?.accountId;
}
