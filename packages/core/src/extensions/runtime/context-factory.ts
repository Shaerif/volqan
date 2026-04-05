/**
 * @file extensions/runtime/context-factory.ts
 * @description Creates an ExtensionContext for each extension with:
 * - Database access (stubbed for framework-level; real implementation injected by host)
 * - API route registration
 * - Admin UI registration
 * - Settings access (persistent config store)
 * - Event emitter (cross-extension communication)
 *
 * The factory is designed to be called once per extension per lifecycle phase.
 * Each call returns a fresh, isolated context object.
 */

import type {
  ExtensionContext,
  MenuItem,
  AdminPage,
  Widget,
  RouteDefinition,
  ContentHook,
} from '../types.js';

// ---------------------------------------------------------------------------
// Extended context (beyond the base interface)
// ---------------------------------------------------------------------------

/**
 * ExtendedExtensionContext
 *
 * Full context object with all capabilities. Extensions receive only the
 * base ExtensionContext interface, but the factory returns this richer type
 * for internal framework use.
 */
export interface ExtendedExtensionContext extends ExtensionContext {
  /** Register an API route under /api/extensions/{vendor}/{name} */
  registerRoute: (route: RouteDefinition) => void;

  /** Inject a navigation item into the admin sidebar. */
  registerMenuItem: (item: MenuItem) => void;

  /** Register a full admin page under /admin/* */
  registerAdminPage: (page: AdminPage) => void;

  /** Register a dashboard widget. */
  registerWidget: (widget: Widget) => void;

  /** Register a content lifecycle hook. */
  registerContentHook: (hook: ContentHook) => void;

  /** Retrieve all registered routes from this extension. */
  getRoutes: () => RouteDefinition[];

  /** Retrieve all registered menu items from this extension. */
  getMenuItems: () => MenuItem[];

  /** Retrieve all registered admin pages from this extension. */
  getAdminPages: () => AdminPage[];

  /** Retrieve all registered widgets from this extension. */
  getWidgets: () => Widget[];

  /** Retrieve all registered content hooks from this extension. */
  getContentHooks: () => ContentHook[];
}

// ---------------------------------------------------------------------------
// Global event bus (shared across all extensions in the same process)
// ---------------------------------------------------------------------------

type EventHandler = (payload: unknown) => void | Promise<void>;
const globalEventBus = new Map<string, Set<EventHandler>>();

function emitGlobal(event: string, payload: unknown): void {
  const handlers = globalEventBus.get(event);
  if (!handlers) return;
  for (const handler of handlers) {
    void Promise.resolve(handler(payload)).catch((err: unknown) => {
      console.error(`[event-bus] Handler error for "${event}":`, err);
    });
  }
}

function onGlobal(event: string, handler: EventHandler): void {
  let handlers = globalEventBus.get(event);
  if (!handlers) {
    handlers = new Set();
    globalEventBus.set(event, handlers);
  }
  handlers.add(handler);
}

function offGlobal(event: string, handler: EventHandler): void {
  globalEventBus.get(event)?.delete(handler);
}

// ---------------------------------------------------------------------------
// Persistent config store (in-memory, swappable with DB adapter)
// ---------------------------------------------------------------------------

/** In-memory store. Replace with a DB-backed adapter in production. */
const configStores = new Map<string, Map<string, unknown>>();

function getOrCreateStore(extensionId: string): Map<string, unknown> {
  let store = configStores.get(extensionId);
  if (!store) {
    store = new Map();
    configStores.set(extensionId, store);
  }
  return store;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * createExtensionContext
 *
 * Factory function that produces a fully-featured ExtendedExtensionContext
 * for the given extension and installation.
 *
 * @param extensionId - The extension's unique id (e.g. "acme/blog").
 * @param installationId - The Volqan installation ID.
 * @returns A fresh ExtendedExtensionContext for this extension.
 */
export function createExtensionContext(
  extensionId: string,
  installationId: string,
): ExtendedExtensionContext {
  const store = getOrCreateStore(extensionId);
  const prefix = `[${extensionId}]`;

  // Per-extension registries (populated during onBoot)
  const routes: RouteDefinition[] = [];
  const menuItems: MenuItem[] = [];
  const adminPages: AdminPage[] = [];
  const widgets: Widget[] = [];
  const contentHooks: ContentHook[] = [];

  return {
    // -----------------------------------------------------------------------
    // Base context
    // -----------------------------------------------------------------------

    installationId,

    config: {
      get<T = unknown>(key: string): T | undefined {
        return store.get(key) as T | undefined;
      },
      async set<T = unknown>(key: string, value: T): Promise<void> {
        store.set(key, value);
      },
      async delete(key: string): Promise<void> {
        store.delete(key);
      },
    },

    logger: {
      debug: (msg, meta) => console.debug(`${prefix} ${msg}`, meta ?? ''),
      info: (msg, meta) => console.info(`${prefix} ${msg}`, meta ?? ''),
      warn: (msg, meta) => console.warn(`${prefix} ${msg}`, meta ?? ''),
      error: (msg, error, meta) =>
        console.error(`${prefix} ${msg}`, error ?? '', meta ?? ''),
    },

    events: {
      emit: (event, payload) => emitGlobal(`${extensionId}:${event}`, payload),
      on: (event, handler) => onGlobal(`${extensionId}:${event}`, handler),
      off: (event, handler) => offGlobal(`${extensionId}:${event}`, handler),
    },

    // -----------------------------------------------------------------------
    // Registration API
    // -----------------------------------------------------------------------

    registerRoute(route: RouteDefinition): void {
      routes.push(route);
      console.debug(`${prefix} Registered API route: ${route.method} ${route.path}`);
    },

    registerMenuItem(item: MenuItem): void {
      menuItems.push(item);
      console.debug(`${prefix} Registered menu item: ${item.label}`);
    },

    registerAdminPage(page: AdminPage): void {
      adminPages.push(page);
      console.debug(`${prefix} Registered admin page: ${page.path}`);
    },

    registerWidget(widget: Widget): void {
      widgets.push(widget);
      console.debug(`${prefix} Registered widget: ${widget.id}`);
    },

    registerContentHook(hook: ContentHook): void {
      contentHooks.push(hook);
      console.debug(`${prefix} Registered content hook: ${hook.model}:${hook.event}`);
    },

    // -----------------------------------------------------------------------
    // Getters
    // -----------------------------------------------------------------------

    getRoutes: () => [...routes],
    getMenuItems: () => [...menuItems],
    getAdminPages: () => [...adminPages],
    getWidgets: () => [...widgets],
    getContentHooks: () => [...contentHooks],
  };
}

// ---------------------------------------------------------------------------
// Config store management
// ---------------------------------------------------------------------------

/**
 * Clear all config data for a given extension.
 * Called during uninstall to clean up persisted settings.
 */
export function clearExtensionConfig(extensionId: string): void {
  configStores.delete(extensionId);
}

/**
 * Export all config for backup/migration purposes.
 */
export function exportAllConfigs(): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};
  for (const [extId, store] of configStores.entries()) {
    result[extId] = Object.fromEntries(store.entries());
  }
  return result;
}

/**
 * Clear the global event bus (useful in tests).
 */
export function clearEventBus(): void {
  globalEventBus.clear();
}
