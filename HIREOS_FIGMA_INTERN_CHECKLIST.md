# HIREOS FIGMA INTERN CHECKLIST

Use `HIREOS_COMPLETE_FIGMA_FRONTEND_SPEC.md` as the source of truth. Do not add HR platform screens that are not present in the current code unless they are clearly placed in a future/recommended section.

## Phase 1 - Foundations

- [ ] Create Figma file pages: Cover, Foundations, Mascot, Components, Landing, Setup, Interview, Results, Student Dashboard, Admin Dashboard, Placement Flow, Responsive, Prototype Flows, QA Checklist.
- [ ] Create color styles for brand, brand dark, brand light, brand muted, amethyst, amethyst light, ember, ember light, navy, body, surface, Tailwind grays, semantic status colors, and code editor surfaces.
- [ ] Create typography styles using Outfit for product UI and JetBrains Mono for metrics/code.
- [ ] Create spacing variables: 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- [ ] Create radius variables: 6, 8, 12, 16, 24, full.
- [ ] Create shadow styles approximating Tailwind `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`.
- [ ] Document animations: owl idle/listening/thinking/celebrating, fade-up, record pulse, bar grow, ring fill, score bounce, confetti fall.

## Phase 2 - Components

- [ ] Build `Mascot/OwlAvatar` with size variants 28, 36, 56, 90, 100, 110, 180, 200, 340.
- [ ] Build `Control/LanguageToggle` light/dark with EN and HI active states.
- [ ] Build `Navigation/DemoPageSwitcher` with all seven page items and mobile icon-only behavior.
- [ ] Build buttons: primary, secondary outline, ghost text, icon, danger outline, amethyst.
- [ ] Build inputs: text, search, textarea, code textarea, hidden file input representation.
- [ ] Build file dropzone states: default, drag-over, uploaded.
- [ ] Build badges: brand, amethyst, ember, passed, review, failed, strong, critical, high, medium, locked, neutral.
- [ ] Build light and dark cards: base, KPI, feature, profile, table shell, glass floating card, placement dark card.
- [ ] Build progress bars: 6px, 8px, 10px; brand, amethyst, ember, red, gradient.
- [ ] Build score rings: large and mini.
- [ ] Build admin histogram bars.
- [ ] Build timeline done/current/future states.
- [ ] Build results accordion row expanded/collapsed.
- [ ] Build dark confirmation modal.
- [ ] Build admin table header, row, selected row, empty state, footer pagination.
- [ ] Build code editor component with not-run/run output states.

## Phase 3 - Screens

- [ ] Landing desktop.
- [ ] Landing mobile.
- [ ] Landing mobile menu open.
- [ ] Setup default with selected company and no CV.
- [ ] Setup upload drag-over.
- [ ] Setup uploaded file and enabled continue.
- [ ] Interview video idle.
- [ ] Interview video recording.
- [ ] Interview text question.
- [ ] Interview code question.
- [ ] Interview auto-fill confirmation modal.
- [ ] Interview auto-fill active.
- [ ] Results default with first row expanded.
- [ ] Results alternate accordion state.
- [ ] Student dashboard.
- [ ] Admin dashboard default.
- [ ] Admin empty filtered state.
- [ ] Admin bulk selected state.
- [ ] Placement interview summary.
- [ ] Placement analysis loading.
- [ ] Placement analysis results.
- [ ] Placement learning material.
- [ ] Placement readiness report.

## Phase 4 - Responsive

- [ ] Build 390px mobile frames for all major pages.
- [ ] Build 768px tablet checks for Landing and Setup.
- [ ] Build 1280px laptop frames if needed for stakeholder review.
- [ ] Use 1440px as primary desktop frame.
- [ ] Confirm landing desktop links appear at `md` and mobile hamburger appears below `md`.
- [ ] Confirm setup company grid shifts from 1 to 2 to 3 columns.
- [ ] Confirm interview hides session time, auto-fill, and placement prep controls below `sm`.
- [ ] Confirm admin table uses horizontal scroll/min-width behavior on mobile.
- [ ] Confirm placement content stays single-column and wraps metadata/tags.

## Phase 5 - Prototype

- [ ] Landing primary CTA -> Setup.
- [ ] Landing secondary CTA -> Results.
- [ ] Landing admin CTA -> Admin Dashboard.
- [ ] Setup company selection -> selected-card variant.
- [ ] Setup upload -> uploaded state.
- [ ] Setup Continue -> Interview.
- [ ] Interview Start -> recording state.
- [ ] Interview Submit & Next -> next question variant.
- [ ] Interview Auto-fill -> modal.
- [ ] Auto-fill Start Demo -> auto-fill active -> Placement Flow.
- [ ] Interview End -> Results.
- [ ] Results accordion click -> expanded/collapsed variants.
- [ ] Results Dashboard -> Student Dashboard.
- [ ] Results Start Another -> Setup.
- [ ] Student Dashboard View Results -> Results.
- [ ] Admin New Interview -> Setup.
- [ ] Admin View -> Results.
- [ ] Admin search no-match -> empty state.
- [ ] Admin checkbox -> bulk selected state.
- [ ] Placement Learn This Topic -> Learning Material.
- [ ] Placement Try Interview Again -> Interview.

## Phase 6 - QA

- [ ] Verify all measurements against Tailwind-derived values in the main spec.
- [ ] Verify all current-vs-recommended annotations are preserved.
- [ ] Verify no nonexistent auth/settings/job/candidate-profile screens are mixed into current UI.
- [ ] Verify all non-functional placeholder controls are annotated.
- [ ] Verify dark and light component themes are separated.
- [ ] Verify mobile frames do not overlap text or controls.
- [ ] Verify table density and hidden columns match the implementation.
- [ ] Verify language toggle variants are present.
- [ ] Verify the owl mascot appears in all current usage sizes.

