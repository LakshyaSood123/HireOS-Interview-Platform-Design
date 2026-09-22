// URL routing: one path per page, on the History API. The app has a handful
// of flat routes and no route params, so this stays small rather than pulling
// in a router dependency. App.tsx decides which page a route renders and
// which routes need a signed-in learner.

import { useSyncExternalStore } from "react"

export const routes = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  trails: "/trails",
  setup: "/setup",
  interview: "/interview",
  results: "/results",
  "placement-flow": "/placement",
  dashboard: "/journey",
  admin: "/admin",
} as const

export type Route = keyof typeof routes

const NAVIGATE_EVENT = "reagvis:navigate"

export function isRoute(value: string): value is Route {
  return value in routes
}

/** The path the app is served under: "" in dev, a sub-path when vite.config.ts sets `base`. */
function basePath(): string {
  return new URL(import.meta.env.BASE_URL, window.location.href).pathname.replace(/\/+$/, "")
}

function currentPath(): string {
  const base = basePath()
  const { pathname } = window.location
  const path = pathname.startsWith(base) ? pathname.slice(base.length) : pathname
  return path.replace(/\/+$/, "") || "/"
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("popstate", onChange)
  window.addEventListener(NAVIGATE_EVENT, onChange)
  return () => {
    window.removeEventListener("popstate", onChange)
    window.removeEventListener(NAVIGATE_EVENT, onChange)
  }
}

export function hrefFor(route: Route): string {
  return `${basePath()}${routes[route]}`
}

/** The route in the address bar, or null for a path the app does not know. */
export function useRoute(): Route | null {
  const path = useSyncExternalStore(subscribe, currentPath)
  return (Object.keys(routes) as Route[]).find(route => routes[route] === path) ?? null
}

/** Moves to `route` without reloading. `replace` rewrites the current history
 * entry instead, so Back skips it — for redirects. */
export function navigate(route: Route, options: { replace?: boolean } = {}): void {
  if (currentPath() === routes[route] && !options.replace) return
  if (options.replace) window.history.replaceState(null, "", hrefFor(route))
  else window.history.pushState(null, "", hrefFor(route))
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
  window.scrollTo(0, 0)
}

/** A full page load of `route`. Used after signing in or out: the learner's
 * session is chosen once, before the first render (learnerSession.ts), so a
 * new session needs a fresh boot. */
export function reloadTo(route: Route): void {
  window.location.assign(hrefFor(route))
}
