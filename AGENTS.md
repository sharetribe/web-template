# AGENTS.md - Codex Guide for Sharetribe Web Template

This is the root Codex instruction file for the Archivo Vintach Sharetribe Web Template repository.
Keep this file compact because Codex loads it automatically. Detailed subsystem notes live in
`.codex/reference/`.

## Project

Archivo Vintach is a customized marketplace built on the
[Sharetribe Web Template](https://github.com/sharetribe/web-template): React 18, Redux Toolkit,
Final Form, Express SSR, Sharetribe Marketplace API, and Stripe Connect.

- GitHub: `https://github.com/honekun/sharetribe-web-template`
- Upstream: `https://github.com/sharetribe/web-template`
- Staging: `https://archivo-vintach.onrender.com/`
- Docs: `https://www.sharetribe.com/docs/`
- Node: `>=18.20.1 <23.2.0`
- Package manager: Yarn

## Commands

```sh
yarn run dev              # Frontend :3000 + backend API :3500
yarn run dev-frontend     # Frontend only
yarn run dev-backend      # Backend API only
yarn run dev-server       # Production-like SSR with hot reload on :4000
yarn start                # Production server

yarn run build            # Build web bundle + server
yarn run format           # Prettier JS/CSS
yarn run format-ci        # Check JS/CSS formatting
yarn test -- --watchAll=false
yarn test-server
yarn test-ci

node .codex/scripts/codex-scaffold.js new-page MyPage --path /my-page
node .codex/scripts/codex-scaffold.js new-section SectionBanner --target cms
node .codex/scripts/branch-review.js
```

## Codex Setup

- `.codex/agents/` contains task-specific briefs for spawned agents.
- `.codex/commands/` contains repeatable prompt workflows.
- `.codex/checks/README.md` contains local guardrail checklists.
- `.codex/reference/` contains detailed subsystem guidance.
- `AGENTS.override.md` is gitignored and may be used for local, temporary instructions.

Read the relevant reference before touching a subsystem:

- `.codex/reference/architecture.md` - routing, Redux ducks, SSR, config, API boundaries.
- `.codex/reference/pagebuilder.md` - PageBuilder sections, display tokens, extension rules.
- `.codex/reference/listing-forms.md` - listing wizard customizations, image handling, pricing.
- `.codex/reference/transactions.md` - transaction processes, My Sales/Purchases/Balance.
- `.codex/reference/notifications.md` - server-only AV notification services.
- `.codex/reference/i18n.md` - translation files and key checks.
- `.codex/reference/upstream-sync.md` - upstream merge-risk watchlist.
- `.codex/reference/local-overrides.md` - local override workflow.

## Delegation

Use project-local briefs when delegation is useful:

- Explorer: `.codex/agents/sharetribe-web-template-explorer.md`
- Implementer: `.codex/agents/sharetribe-web-template-implementer.md`
- Auditor: `.codex/agents/sharetribe-web-template-auditor.md`
- Translation reviewer: `.codex/agents/translation-reviewer.md`

Rules:

- Prefer explorer agents for read-only discovery.
- Prefer worker agents for bounded implementation with disjoint file ownership.
- Use the auditor for reviews or risky changes.
- Use the translation reviewer for user-facing copy or translation-file changes.
- Do not delegate overlapping write scopes.
- Do not delegate transaction-process changes without explicit user approval.

## Architecture Rules

- Reusable UI belongs in `src/components/`.
- Page containers and SSR data loading belong in `src/containers/<PageName>/`.
- Page data should be loaded through `.duck.js` `loadData`, registered in
  `src/containers/pageDataLoadingAPI.js` and `src/routing/routeConfiguration.js`.
- Shared Redux state belongs in `src/ducks/`.
- Non-SDK API wrappers belong in `src/util/api.js`.
- Server-only integrations belong in `server/`.
- AV customization extension hooks belong in `src/extensions/`.
- Prefer hosted Sharetribe config/assets when Console supports the use case.
- Use `useConfiguration()` for config access.
- Use local utilities before adding dependencies; ask before adding a library.

## SSR Rules

- Guard browser APIs (`window`, `document`, `localStorage`, session storage) behind
  `typeof window !== 'undefined'`.
- Do not use `useEffect` for primary page data loading when SSR is expected.
- Avoid hydration mismatches by keeping server and client render paths consistent.
- Never import `server/services/*` from client-side code.

## Sharetribe Rules

- Use the Sharetribe SDK for Marketplace API calls.
- Marketplace API reference:
  `https://www.sharetribe.com/api-reference/marketplace.html#marketplace-api-reference`
- Always use Stripe Connect, never direct charges.
- Transaction-process, transition, payment, and payout changes require explicit user approval and
  usually require matching Sharetribe backend/process updates.
- Heroku has an ephemeral filesystem; do not write runtime files to disk.

## UI, Forms, and Styling

- Use functional React components and hooks.
- Use CSS Modules and class selectors; do not use component element selectors.
- Use React Final Form and shared `Field*` components for forms.
- New custom fields need labels and validation errors via `ValidationError`.
- Follow mobile-first breakpoints from `src/styles/customMediaQueries.css`: `--viewportMedium`
  starts at 768px, `--viewportLarge` starts at 1024px.
- Mobile spacing follows a 6px baseline; medium+ spacing follows an 8px baseline.
- Use semantic HTML and preserve accessibility.

## Import Order

Follow the local Sharetribe import order:

1. External libraries and third-party assets.
2. Configurations, contexts, and `util` modules.
3. Shared components from `../../components`.
4. Parent-directory modules.
5. Same-directory modules.

See `src/containers/CheckoutPage/CheckoutPage.js` for an example.

## Internationalization

- Use `FormattedMessage` or `intl.formatMessage()` for all user-facing copy.
- Translation files: `src/translations/en.json`, `src/translations/es.json`,
  `src/translations/en_av.json`, `src/translations/es_av.json`.
- Keep AV-specific keys symmetric between `en_av.json` and `es_av.json`.
- Use the translation-reviewer brief or `.codex/commands/i18n-check.md` for copy-heavy changes.

## Testing

- New `src/components/AV*/` components need colocated tests: render, key props, snapshot.
- New `src/containers/*Page/` pages need smoke test + snapshot.
- New `src/util/*.js` helpers need unit tests for every exported function.
- New extension logic should include registry/detection tests when practical.
- Use `renderWithProviders` from `src/util/testHelpers` for React tests.
- Run targeted tests or `yarn test -- --watchAll=false` when feasible. If not, say why.

## Formatting

Prettier conventions: single quotes, 2 spaces, trailing commas, max line 100. After JS/CSS edits,
run Prettier on touched files or `yarn run format`.

## Protected Files and Guardrails

- Do not edit secret env files: `.env`, `.env.development`, `.env.test`, `.env.production`.
- `.env-template` is allowed.
- Before editing upstream Sharetribe template files, first check whether the change can be done in a
  custom component, config file, extension hook, or CSS override.
- If a watchlist file from `.codex/reference/upstream-sync.md` changes, keep the diff minimal and
  call out upstream merge risk.
- Use `node .codex/scripts/branch-review.js` before larger final handoffs.

## Documentation

Read relevant docs before changing their subsystem:

- `docs/bulk-import.md`
- `docs/listing-custom-fields-setup.md`
- `docs/console-customization-guide.md`
- `docs/test-account-setup.md`
- `docs/bidding-research.md`
- `docs/ai_notes.md`

Implementation plans (not yet implemented):

- `docs/plan-bulk-import-all-users.md`
- `docs/plan-favorites-page.md`
- `docs/plan-shopping-bag.md`
