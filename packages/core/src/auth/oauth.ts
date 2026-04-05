/**
 * @file auth/oauth.ts
 * @description OAuth 2.0 provider abstraction for Google and GitHub.
 *
 * Each provider implements a common interface:
 * - `getAuthorizationUrl()` — generate the OAuth redirect URL
 * - `exchangeCode()` — exchange an authorization code for tokens
 * - `getUserProfile()` — fetch and normalize the user profile
 *
 * @example
 * ```ts
 * import { GoogleProvider, GitHubProvider } from '@volqan/core/auth';
 *
 * const google = new GoogleProvider({
 *   clientId: process.env.GOOGLE_CLIENT_ID!,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
 *   redirectUri: 'https://example.com/auth/callback/google',
 * });
 *
 * // Step 1: redirect user
 * const { url, state } = google.getAuthorizationUrl();
 * redirect(url);
 *
 * // Step 2: handle callback
 * const profile = await google.exchangeCode(code);
 * ```
 */

import { randomBytes } from 'node:crypto';
import type { OAuthProfile, OAuthProviderName } from './types.js';
import { AuthError } from './types.js';

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

/**
 * Common configuration accepted by all OAuth providers.
 */
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  /** Additional OAuth scopes to request beyond the defaults */
  extraScopes?: string[];
}

/**
 * Result of generating an authorization URL.
 */
export interface AuthorizationResult {
  /** Full URL the user should be redirected to */
  url: string;
  /** CSRF state parameter — store in session and verify on callback */
  state: string;
}

/**
 * Raw token response from an OAuth token endpoint.
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

// ---------------------------------------------------------------------------
// Base provider (abstract)
// ---------------------------------------------------------------------------

/**
 * Abstract base class defining the OAuth provider contract.
 */
export abstract class OAuthProvider {
  readonly name: OAuthProviderName;
  protected config: OAuthProviderConfig;

  constructor(name: OAuthProviderName, config: OAuthProviderConfig) {
    this.name = name;
    this.config = config;
  }

  /**
   * Generates a cryptographically random state parameter.
   */
  protected generateState(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Builds the authorization URL for this provider.
   * @returns URL and state to store in session
   */
  abstract getAuthorizationUrl(opts?: { state?: string }): AuthorizationResult;

  /**
   * Exchanges an authorization code for a normalised {@link OAuthProfile}.
   * This is a single step combining token exchange + profile fetch.
   *
   * @param code - The code received in the callback query string
   * @returns Normalized {@link OAuthProfile}
   */
  abstract exchangeCode(code: string): Promise<OAuthProfile>;

  /**
   * Fetches and normalizes the user profile using a valid access token.
   *
   * @param accessToken - A valid access token for this provider
   * @returns Normalized {@link OAuthProfile}
   */
  abstract getUserProfile(accessToken: string): Promise<OAuthProfile>;

  /**
   * Helper: performs a token endpoint POST request.
   */
  protected async fetchTokens(
    tokenEndpoint: string,
    code: string,
  ): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new AuthError(
        'OAUTH_ERROR',
        `OAuth token exchange failed (${response.status}): ${text}`,
      );
    }

    return response.json() as Promise<TokenResponse>;
  }

  /**
   * Helper: performs an authenticated GET request to a provider API.
   */
  protected async fetchProfile<T>(
    url: string,
    accessToken: string,
    headers: Record<string, string> = {},
  ): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new AuthError(
        'OAUTH_ERROR',
        `Failed to fetch profile from ${this.name} (${response.status}): ${text}`,
      );
    }

    return response.json() as Promise<T>;
  }
}

// ---------------------------------------------------------------------------
// Google Provider
// ---------------------------------------------------------------------------

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_PROFILE_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const GOOGLE_DEFAULT_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

interface GoogleUserInfo {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
  [key: string]: unknown;
}

/**
 * Google OAuth 2.0 provider.
 *
 * @example
 * ```ts
 * const google = new GoogleProvider({
 *   clientId: process.env.GOOGLE_CLIENT_ID!,
 *   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
 *   redirectUri: 'https://myapp.com/auth/callback/google',
 * });
 * ```
 */
export class GoogleProvider extends OAuthProvider {
  constructor(config: OAuthProviderConfig) {
    super('google', config);
  }

  getAuthorizationUrl(opts: { state?: string } = {}): AuthorizationResult {
    const state = opts.state ?? this.generateState();
    const scopes = [
      ...GOOGLE_DEFAULT_SCOPES,
      ...(this.config.extraScopes ?? []),
    ];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return {
      url: `${GOOGLE_AUTH_URL}?${params.toString()}`,
      state,
    };
  }

  async exchangeCode(code: string): Promise<OAuthProfile> {
    const tokens = await this.fetchTokens(GOOGLE_TOKEN_URL, code);
    return this.getUserProfile(tokens.access_token, tokens);
  }

  async getUserProfile(
    accessToken: string,
    tokens?: TokenResponse,
  ): Promise<OAuthProfile> {
    const info = await this.fetchProfile<GoogleUserInfo>(
      GOOGLE_PROFILE_URL,
      accessToken,
    );

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = tokens?.expires_in ? now + tokens.expires_in : null;

    return {
      provider: 'google',
      providerAccountId: info.sub,
      email: info.email,
      name: info.name ?? null,
      avatar: info.picture ?? null,
      accessToken,
      refreshToken: tokens?.refresh_token ?? null,
      expiresAt,
      raw: info as Record<string, unknown>,
    };
  }
}

// ---------------------------------------------------------------------------
// GitHub Provider
// ---------------------------------------------------------------------------

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_PROFILE_URL = 'https://api.github.com/user';
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';

const GITHUB_DEFAULT_SCOPES = ['read:user', 'user:email'];

interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  avatar_url?: string;
  email?: string | null;
  [key: string]: unknown;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

/**
 * GitHub OAuth 2.0 provider.
 *
 * @example
 * ```ts
 * const github = new GitHubProvider({
 *   clientId: process.env.GITHUB_CLIENT_ID!,
 *   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
 *   redirectUri: 'https://myapp.com/auth/callback/github',
 * });
 * ```
 */
export class GitHubProvider extends OAuthProvider {
  constructor(config: OAuthProviderConfig) {
    super('github', config);
  }

  getAuthorizationUrl(opts: { state?: string } = {}): AuthorizationResult {
    const state = opts.state ?? this.generateState();
    const scopes = [
      ...GITHUB_DEFAULT_SCOPES,
      ...(this.config.extraScopes ?? []),
    ];

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(' '),
      state,
    });

    return {
      url: `${GITHUB_AUTH_URL}?${params.toString()}`,
      state,
    };
  }

  async exchangeCode(code: string): Promise<OAuthProfile> {
    const tokens = await this.fetchTokens(GITHUB_TOKEN_URL, code);
    return this.getUserProfile(tokens.access_token, tokens);
  }

  async getUserProfile(
    accessToken: string,
    tokens?: TokenResponse,
  ): Promise<OAuthProfile> {
    const user = await this.fetchProfile<GitHubUser>(
      GITHUB_PROFILE_URL,
      accessToken,
      { 'X-GitHub-Api-Version': '2022-11-28' },
    );

    // GitHub may not expose the email on the profile endpoint;
    // fetch from the emails endpoint if needed.
    let email = user.email ?? null;
    if (!email) {
      try {
        const emails = await this.fetchProfile<GitHubEmail[]>(
          GITHUB_EMAILS_URL,
          accessToken,
          { 'X-GitHub-Api-Version': '2022-11-28' },
        );
        const primary = emails.find((e) => e.primary && e.verified);
        email = primary?.email ?? null;
      } catch {
        // Non-fatal — proceed without email (rare edge case)
      }
    }

    if (!email) {
      throw new AuthError(
        'OAUTH_ERROR',
        'GitHub did not provide a verified email address. ' +
          'Ensure the user has a verified public email or grant user:email scope.',
      );
    }

    return {
      provider: 'github',
      providerAccountId: String(user.id),
      email,
      name: user.name ?? user.login ?? null,
      avatar: user.avatar_url ?? null,
      accessToken,
      refreshToken: tokens?.refresh_token ?? null,
      expiresAt: null, // GitHub tokens don't expire by default
      raw: user as Record<string, unknown>,
    };
  }
}

// ---------------------------------------------------------------------------
// Provider registry
// ---------------------------------------------------------------------------

/**
 * Creates an OAuth provider instance by name.
 *
 * @param name - Provider identifier
 * @param config - Provider credentials and redirect URI
 */
export function createProvider(
  name: OAuthProviderName,
  config: OAuthProviderConfig,
): OAuthProvider {
  switch (name) {
    case 'google':
      return new GoogleProvider(config);
    case 'github':
      return new GitHubProvider(config);
    default:
      throw new Error(`[volqan:oauth] Unknown provider: ${name as string}`);
  }
}
