---
name: saas-sidebar-redesign
description: Redesign the Vue 3 app shell from a top nav bar into a modern SaaS-style layout with a vertical left sidebar, consistent spacing scale, and a polished professional look. Use when asked to restyle the app shell, move navigation to a sidebar, or make the UI look more like a SaaS product. Applies to client/src/App.vue and shared styles; view internals are only touched for spacing consistency.
---

# SaaS Sidebar Redesign

Converts the Factory Inventory Management System shell from a horizontal top nav to a left sidebar layout, then normalizes spacing and surface styling so every page reads as one product.

This skill covers the **app shell and shared styles**. It does not rewrite view logic, change data flow, or alter API calls.

## When to use

- The user asks to move navigation to the left, add a sidebar, or make the UI look like a SaaS dashboard.
- The user asks for consistent spacing, a polished look, or a professional redesign of the shell.

Do not use it for a single-component restyle. Use the vue-expert agent for that.

## Hard rules (from CLAUDE.md)

1. **Every `.vue` file change is delegated to the `vue-expert` agent.** This skill produces the spec. Do not hand-edit `.vue` files in the main thread.
2. **No emojis in the UI.** Nav icons are inline SVG (stroke icons, 20px, `currentColor`).
3. **Use the slate palette** from CLAUDE.md: `#0f172a` (ink), `#64748b` (muted), `#e2e8f0` (border), `#f8fafc` (page bg). Status colors are green, blue, yellow, and red only.
4. **All user-visible strings go through `t()`.** Add any missing keys to both `client/src/locales/en.js` and `client/src/locales/ja.js`. The current "Reports" link is a hardcoded string. Fix it while you are in there.
5. **Keep the `<router-view />` contract.** Routes and `main.js` stay as they are.
6. **Keep the `FilterBar` behavior.** Its filters still drive every page through `useFilters`.
7. **Keep the modals and controls working.** `ProfileDetailsModal`, `TasksModal`, `LanguageSwitcher`, and `ProfileMenu` must still open and function.

## Target layout

```
+------------------+-----------------------------------------------+
| Sidebar (240px)  | Content header (page title, actions)          |
|                  |-----------------------------------------------|
| Logo / company   | FilterBar (sticky)                            |
|                  |-----------------------------------------------|
| Overview         |                                               |
| Inventory        |   <router-view />                             |
| Orders           |   max-width: none, padding: --space-6         |
| Finance          |                                               |
| Demand Forecast  |                                               |
| Reports          |                                               |
|                  |                                               |
| ---------------  |                                               |
| Profile / user   |                                               |
+------------------+-----------------------------------------------+
```

- **Sidebar:** `position: sticky; top: 0; height: 100vh`. Width `240px` expanded, `72px` collapsed (icon rail). Background `#ffffff`, right border `1px solid #e2e8f0`.
- **Sidebar header:** company name (`nav.companyName`) and subtitle (`nav.subtitle`). The subtitle hides when collapsed.
- **Nav items:** an icon, a label, and an active state. Use `router-link`, and set `aria-current="page"` on the active link.
- **Sidebar footer:** `ProfileMenu` and `LanguageSwitcher`. Move them out of the top bar.
- **Content area:** `flex: 1; min-width: 0`. Remove the `max-width: 1600px` cap on `.main-content` so wide tables and charts use the space.
- **Collapse toggle:** a button at the top of the sidebar with `aria-expanded` and `aria-controls`. Persist the state in `localStorage` under `sidebar-collapsed`.
- **Mobile (below `900px`):** the sidebar becomes an off-canvas drawer. A hamburger button in a slim top bar opens it. Use a backdrop click or Escape to close. Lock body scroll while it is open.

## Design tokens

Define these once in `App.vue` global styles on `:root`. Do not repeat raw values in views.

```css
:root {
  /* Spacing: 4px base scale */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */

  /* Surfaces */
  --color-page: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-ink: #0f172a;
  --color-muted: #64748b;
  --color-accent: #2563eb;
  --color-accent-soft: #eff6ff;

  /* Elevation and shape */
  --radius-md: 8px;
  --shadow-card: 0 1px 2px rgba(15, 23, 42, 0.04);

  /* Layout */
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 72px;
  --transition-base: 200ms ease;
}
```

Rules for spacing:
- Use only the scale above for padding, margin, and gap.
- Page padding is `--space-6` on desktop and `--space-4` on mobile.
- Card padding is `--space-5`. Gaps between cards are `--space-4` or `--space-5`.
- Page title to content gap is `--space-6`.

## Nav item states

| State | Background | Text | Indicator |
|---|---|---|---|
| Default | transparent | `--color-muted` | none |
| Hover | `#f1f5f9` | `--color-ink` | none |
| Active | `--color-accent-soft` | `--color-accent` | 3px left bar, `--color-accent` |
| Focus-visible | transparent | inherited | `outline: 2px solid --color-accent; outline-offset: 2px` |

Every interactive element needs a visible focus style. Do not remove outlines without replacing them.

## Accessibility

- Wrap navigation in `<nav aria-label="Main">`.
- Collapsed rail: keep the label in `aria-label` or a visually hidden `<span>`, and show a native `title` tooltip.
- Drawer: `role="dialog"` with `aria-modal="true"` when open on mobile. Move focus to the first link on open and return focus to the toggle on close.
- Escape closes the drawer.
- Respect `prefers-reduced-motion`. Disable the sidebar width transition in that case.

## Process

1. **Audit.** Read `App.vue` (template, script, and global `<style>`). Find every top-nav selector: `.top-nav`, `.nav-container`, `.nav-tabs`, `.logo`, `.subtitle`, `.main-content`. Also check whether views depend on the top-nav height or on `.main-content` max-width. Grep `client/src/views` for `margin-top`, `height: calc`, and `max-width`.
2. **Tokens.** Add the `:root` token block to `App.vue` global styles.
3. **Shell.** Replace the top `<header>` with a sidebar. Keep the same `router-link` targets and the same `:class="{ active: ... }"` logic, now expressed as `aria-current`. Move `ProfileMenu` and `LanguageSwitcher` into the sidebar footer.
4. **Icons.** Add one inline SVG per route. Keep them in a small map in `App.vue` or a `components/NavIcon.vue` file. The `NavIcon` option is preferred if it is reused.
5. **Responsive.** Add the collapsed state and the mobile drawer, plus the hamburger in a slim mobile top bar.
6. **i18n.** Add any new keys to `en.js` and `ja.js`. Use `t('nav.reports')` for the Reports link.
7. **Views.** Only normalize spacing: swap raw padding and gap values for the tokens where a view clearly uses the old scale. Do not restructure view markup.
8. **Hand off to vue-expert.** Give it the target layout, the token block, the nav item states, the accessibility rules, and the file list. Ask it to report back which files it changed.
9. **Verify** (see below).

## Verification

Run the app, then check it in a browser. Do not claim the redesign works from a build alone.

1. Start both servers with `./scripts/start.sh`, or run `uv run python main.py` in `server/` and `npm run dev` in `client/`.
2. Build with `npm run build` in `client/`. It must succeed with no new warnings.
3. Use Playwright MCP tools against `http://localhost:3000`:
   - Navigate to `/`, `/inventory`, `/orders`, `/spending`, `/demand`, and `/reports`. Confirm the sidebar shows and the correct link is `aria-current="page"` on each.
   - Resize to 1440px wide and take a snapshot. Then resize to 390px wide and confirm the drawer opens and closes with the toggle and with Escape.
   - Toggle the collapsed rail and confirm `localStorage` is set.
   - Open `ProfileMenu`, `LanguageSwitcher` (check both `en` and `ja` labels), and `TasksModal`.
   - Check the console. The `/api/tasks` 404 is a known pre-existing issue (see `docs/architecture.html`). Ignore it, but report any other errors.
4. Report any failures with the actual output. Do not summarize them away.

## Known pre-existing issues to leave alone

- `/api/tasks` and `/api/purchase-orders` return 404. This is not part of the redesign.
- `Backlog.vue` has no route. Leave it unrouted.
- The `FilterBar` is not in scope beyond placement.
