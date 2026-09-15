# HIREOS - COMPLETE FRONTEND & FIGMA DESIGN SPECIFICATION

Source audit date: 2026-09-03  
Repository: `C:\Users\PREDATOR\Downloads\HireOS Interview Platform Design`  
Primary frontend: React 19, Vite 8, Tailwind CSS v4

## 0. Figma Access Check

**CONFIRMED FROM TOOL DISCOVERY:** This session does not expose a callable Figma MCP, Figma plugin, browser-based Figma inspector, or Figma file-editing connector.

The only design connector discovered by tool search is Canva. Canva can read/create/edit Canva designs, but it is not Figma access and cannot inspect or create Figma frames/components.

If you provide a Figma URL in this environment, I cannot directly open it, inspect frames/components, create frames/components, edit an existing Figma design, or create a new Figma design through Figma. I can still produce a Figma-ready specification from the repository, which is this document.

## 1. Repository Understanding

**CONFIRMED FROM CODE:** The application is a single-page demo prototype. It does not use React Router or URL paths. `src/App.tsx` stores a local `page` state and swaps one of seven page components into the DOM. The bottom floating navigator is a demo-only page switcher.

Core files:

| Area | File | Role |
|---|---|---|
| Entry | `src/main.tsx` | Mounts React app into `#root`. |
| App shell | `src/App.tsx` | Provides `LanguageProvider`, `AppStateProvider`, page switcher, floating demo nav. |
| Global styles | `src/index.css` | Tailwind import, fonts, theme tokens, animations, scrollbar hiding. |
| Shared app state | `src/state/AppStateContext.tsx` | Candidate name, company id, CV filename, interview session. |
| Localization | `src/i18n/LanguageContext.tsx`, `src/i18n/translations.ts` | EN/HI toggle and translation dictionary. |
| Data | `src/data/companies.ts`, `src/data/questions.ts`, `src/data/placementPrepDemo.ts` | Static companies, question bank, placement demo data. |
| Pages | `src/pages/*.tsx` | Landing, setup, interview, results, dashboard, admin, placement flow. |
| Components | `src/components/*.tsx` | Owl avatar, language toggle, code editor, progress timeline, placement sections. |
| Imports/assets | `src/imports/*` | Prior design prompt/reference docs and two PNG screenshots. |

Build verification:

**CONFIRMED FROM BUILD:** `pnpm build` completed successfully. Vite produced `dist/index.html`, CSS, and JS assets.

Rendered screenshot verification:

**PARTIALLY CONFIRMED:** A local Vite server was started manually at `http://localhost:5173/` because the expected Figma Make server on `8443` was not reachable. Playwright CLI exists, but the project does not have the Playwright Node module installed, so automated multi-screen screenshot capture was not completed without changing dependencies. This spec is therefore based on source implementation and build verification, not captured screenshots.

## 2. Application Map

**CONFIRMED FROM CODE:** Logical route names are `Page` union values, not browser URLs. In Figma, treat each as a separate screen. Browser URL remains `/`.

```
HireOS
|-- Demo Shell
|   |-- Floating Demo Navigator (bottom-center pill)
|-- Marketing
|   |-- Landing
|-- Candidate Interview Setup
|   |-- Setup
|-- Interview Experience
|   |-- Interview - Video Question
|   |-- Interview - Text Question
|   |-- Interview - Code Question
|   |-- Interview - Auto-fill Confirmation Modal
|   |-- Interview - Auto-fill Demo State
|-- Candidate Results
|   |-- Results
|   |-- Results - Expanded Question Row
|-- Candidate Journey
|   |-- Student Dashboard
|-- Recruiter/Admin
|   |-- Admin Dashboard
|   |-- Admin Dashboard - Empty Search State
|   |-- Admin Dashboard - Bulk Selection State
|-- Placement Readiness
|   |-- Placement Flow
|       |-- Interview Summary
|       |-- Analysis Loading
|       |-- Analysis Results
|       |-- Learning Material
|       |-- Placement Readiness Report
```

| Page | Logical route | Browser route | Parent layout | Source file | Access/role | Reachability | Completeness |
|---|---|---|---|---|---|---|---|
| Landing | `landing` | `/` | App shell only | `src/pages/LandingPage.tsx` | Public/demo | Initial state, bottom nav, return home buttons | Complete marketing/demo landing. |
| Setup | `setup` | `/` | App shell only | `src/pages/SetupPage.tsx` | Candidate/demo | Landing CTAs, bottom nav, admin new interview, results start another | Complete demo form. |
| Interview | `interview` | `/` | App shell only | `src/pages/InterviewPage.tsx` | Candidate/demo | Setup continue, bottom nav, placement back/report retry | Complete simulated interview UI. |
| Results | `results` | `/` | App shell only | `src/pages/ResultsPage.tsx` | Candidate/demo | Landing demo CTA, interview end/completion, admin view row, dashboard history row, bottom nav | Complete static results screen. |
| Student Dashboard | `dashboard` | `/` | App shell only | `src/pages/StudentDashboardPage.tsx` | Candidate/demo | Results CTA, bottom nav | Complete static journey dashboard. |
| Admin Dashboard | `admin` | `/` | App shell only | `src/pages/AdminPage.tsx` | Recruiter/admin demo | Landing admin CTA, bottom nav | Complete static admin table/dashboard. |
| Placement Flow | `placement-flow` | `/` | App shell only | `src/pages/PlacementFlowPage.tsx`, `src/components/PlacementPrepFlow.tsx` | Candidate learning/demo | Interview header button, auto-fill completion, bottom nav | Complete long-form static placement-readiness flow. |

No authentication screens, forgot password screens, settings screens, candidate profile detail routes, job CRUD routes, interview calendar route, or true analytics route exist in the current codebase.

## 3. Global Application Shell

**CONFIRMED FROM CODE:** `App` wraps all screens in language and app-state providers, then renders exactly one page at a time. There is no persistent sidebar/header shared across all pages. Each page owns its own header.

### Floating Demo Navigator

Source: `src/App.tsx`

Placement:

| Property | Value |
|---|---|
| Position | Fixed, bottom center |
| Offset | `bottom-6`, `left-1/2`, `-translate-x-1/2` |
| Z-index | `z-50` |
| Layout | Horizontal flex, gap 4px, horizontal scroll if needed |
| Padding | `px-2 py-1.5` |
| Radius | `rounded-full` |
| Shadow | `shadow-2xl` |
| Border | `border-white/30` |
| Width | `max-w-[95vw]` |
| Background | Inline `rgba(17,24,39,0.92)` with `backdropFilter: blur(16px)` |

Items in exact order:

| Label | Page id | Visual marker | Active state | Inactive state |
|---|---|---|---|---|
| Landing | `landing` | emoji/text marker | `bg-[#1DB584] text-white shadow-lg shadow-[#1DB584]/30` | `text-gray-400 hover:text-white hover:bg-white/10` |
| Setup | `setup` | emoji/text marker | Same active | Same inactive |
| Interview | `interview` | emoji/text marker | Same active | Same inactive |
| Results | `results` | emoji/text marker | Same active | Same inactive |
| Placement | `placement-flow` | emoji/text marker | Same active | Same inactive |
| Journey | `dashboard` | emoji/text marker | Same active | Same inactive |
| Admin | `admin` | emoji/text marker | Same active | Same inactive |

Responsive behavior:

**CONFIRMED FROM CODE:** Button labels are hidden below Tailwind `sm` (`hidden sm:inline`), leaving only the visual marker. The nav can horizontally scroll within 95vw.

Figma component: `Navigation/DemoPageSwitcher`

## 4. User Flows

### Candidate Main Flow

**CONFIRMED FROM CODE:**

Landing -> `Start Interview Now` or `Get Started` -> Setup -> choose company -> upload CV -> optional edit full name -> `Continue to Interview` -> Interview -> answer/skip/repeat questions -> Results -> Dashboard or start another interview.

Notes:

| Step | Interaction | Result |
|---|---|---|
| Landing primary CTA | Click `Start Interview Now` | Sets page to `setup`. |
| Setup company cards | Click card | Updates `companyId`, selected card variant appears. |
| Setup CV upload | Browse or drop file | Stores only `file.name`; no upload API. |
| Setup continue | Disabled until `companyId` and `cvFileName` exist | Navigates to `interview`. |
| Interview start | Click `Start Speaking`, `Start Typing`, or `Start Coding` | `isRecording=true`, owl enters listening, timer starts for non-auto-fill mode. |
| Interview submit | Click `Submit & Next` | Marks current question answered, owl thinking, after 1.2s advances or goes to `results`. |
| Results dashboard CTA | Click `Dashboard` | Navigates to `dashboard`. |

### Demo Auto-fill Flow

**CONFIRMED FROM CODE:**

Interview -> `Auto-fill for Demo` -> confirmation modal -> `Start Demo` -> scripted four-question auto-fill -> Placement Flow.

Timing:

| Timing constant | Value | Purpose |
|---|---:|---|
| `QUESTION_READ_MS` | 1200ms | Question visible before prompt appears. |
| `POPUP_WAIT_MS` | 2000ms | Prompt shown before answer reveal starts. |
| `WORD_INTERVAL_MS` | 70ms | Text/video answer reveal word cadence. |
| `LINE_INTERVAL_MS` | 150ms | Code answer reveal line cadence. |
| `VIEW_MS` | 2000ms | Pause after reveal. |
| `CELEBRATE_MS` | 700ms | Owl celebration beat before next question. |

### Recruiter/Admin Flow

**CONFIRMED FROM CODE:**

Landing -> `View Admin Dashboard` -> Admin Dashboard -> search/filter/sort/select candidates -> `View` result or `New Interview` setup.

Non-functional buttons: `Export CSV`, table `Schedule`, table `Reject`, bulk `Schedule`, bulk `Reject`, pagination buttons. They have styles but no handlers.

### Placement Learning Flow

**CONFIRMED FROM CODE:**

Interview header `Placement Prep` or auto-fill completion -> Placement Flow -> scroll through sections -> `Learn This Topic` scrolls to learning -> `Continue Learning` scrolls to learning -> `Try Interview Again` returns to interview.

## 5. Foundations

### Colors

**CONFIRMED FROM CODE:** Custom theme tokens are in `src/index.css`.

| Token | HEX | RGB | CSS/Tailwind usage | Source |
|---|---:|---:|---|---|
| Brand | `#1DB584` | 29,181,132 | `bg-brand`, `text-brand`, `border-brand` | `src/index.css` |
| Brand Dark | `#0F9269` | 15,146,105 | `bg-brand-dark`, hover primary buttons | `src/index.css` |
| Brand Light | `#CCFBEC` | 204,251,236 | `text-brand-light`, light accents | `src/index.css` |
| Brand Muted | `#E6F9F3` | 230,249,243 | `bg-brand-muted` | `src/index.css` |
| Amethyst | `#A855F7` | 168,85,247 | `bg-amethyst`, `text-amethyst` | `src/index.css` |
| Amethyst Light | `#E9D5FF` | 233,213,255 | `bg-amethyst-light` | `src/index.css` |
| Ember | `#FB923C` | 251,146,60 | `bg-ember`, `text-ember` | `src/index.css` |
| Ember Light | `#FED7AA` | 254,215,170 | `bg-ember-light` | `src/index.css` |
| Navy | `#1F2937` | 31,41,55 | `bg-navy`, `text-navy` | `src/index.css` |
| Body | `#6B7280` | 107,114,128 | `text-body` available, gray text mostly uses Tailwind gray | `src/index.css` |
| Surface | `#F3F4F6` | 243,244,246 | `bg-surface` | `src/index.css` |
| White | `#FFFFFF` | 255,255,255 | Cards, headers, light page surface | Tailwind default |
| Gray 50 | `#F9FAFB` | 249,250,251 | table hover, disabled/soft backgrounds | Tailwind default |
| Gray 100 | `#F3F4F6` | 243,244,246 | borders/backgrounds | Tailwind default |
| Gray 200 | `#E5E7EB` | 229,231,235 | borders, ring bases | Tailwind default |
| Gray 300 | `#D1D5DB` | 209,213,219 | icons/text | Tailwind default |
| Gray 400 | `#9CA3AF` | 156,163,175 | muted labels | Tailwind default |
| Gray 500 | `#6B7280` | 107,114,128 | body/muted text | Tailwind default |
| Gray 600 | `#4B5563` | 75,85,99 | secondary text | Tailwind default |
| Gray 700 | `#374151` | 55,65,81 | dark UI details | Tailwind default |
| Gray 800 | `#1F2937` | 31,41,55 | results header gradient | Tailwind default |
| Gray 900 | `#111827` | 17,24,39 | dark cards | Tailwind default |
| Gray 950 | `#030712` | 3,7,18 | interview/placement page background | Tailwind default |
| Blue 500 | `#3B82F6` | 59,130,246 | results overall metric, company avatar | Tailwind default |
| Pink 500 | `#EC4899` | 236,72,153 | company/admin avatar | Tailwind default |
| Cyan 500 | `#06B6D4` | 6,182,212 | admin avatar | Tailwind default |
| Orange 500 | `#F97316` | 249,115,22 | avatar/owl details | Tailwind default |
| Indigo 500 | `#6366F1` | 99,102,241 | company/admin avatar | Tailwind default |
| Green 400/500 | `#4ADE80` / `#22C55E` | varies | placement strong states | Tailwind default |
| Amber 400/500/600 | `#FBBF24` / `#F59E0B` / `#D97706` | varies | warnings/review/timer | Tailwind default |
| Red 400/500 | `#F87171` / `#EF4444` | varies | failed/error/end interview | Tailwind default |
| Code Surface | `#0D1117` | 13,17,23 | code editor body | `CodeEditor.tsx` |
| Code Header | `#161B22` | 22,27,34 | code editor title/run bars | `CodeEditor.tsx` |
| Code Gutter | `#0A0E14` | 10,14,20 | line-number gutter | `CodeEditor.tsx` |

### Typography

**CONFIRMED FROM CODE:** Fonts are imported in `src/index.css` from Google Fonts.

| Token | Font | Size | Weight | Line height | Usage |
|---|---|---:|---:|---|---|
| Hero H1 | Outfit | 48/60/72px | 900 | tight | Landing hero. |
| Page H1 | Outfit | 30/36px or 24px | 900 | default | Setup title, dashboard title. |
| Dark Section H2 | Outfit | 30px | 700 | default | Placement section headings. |
| Marketing H2 | Outfit | 36px | 900 | default | Landing sections and CTA banner. |
| Card H3 | Outfit | 18/20px | 700 | default | Feature cards, next steps. |
| Body Large | Outfit | 18/20px | 400 | relaxed | Landing subhead/section copy. |
| Body | Outfit | 14/16px | 400/500 | relaxed where specified | Cards, descriptions, row metadata. |
| Label | Outfit | 12/14px | 700 | normal | Uppercase labels, table headers. |
| Caption | Outfit | 10/11/12px | 500/700 | tight/default | badges, microcopy. |
| Button | Outfit | 12/14/16px | 600/700 | default | CTAs and controls. |
| Metrics | JetBrains Mono | 18/24/30/48/60px | 700/900 | default | Scores, timers, counts. |
| Code | JetBrains Mono | 12/14px | 400/500 | 1.6 | Code editor, code blocks. |

Figma font styles:

| Figma style | CSS equivalent |
|---|---|
| Display/Hero | Outfit 72, Black, line-height ~1.1 |
| Display/Hero Mobile | Outfit 48, Black |
| Heading/Page | Outfit 36, Black |
| Heading/Card | Outfit 18-20, Bold |
| Body/Default | Outfit 14-16, Regular/Medium |
| Label/Uppercase | Outfit 12, Bold, uppercase, wide tracking |
| Caption | Outfit 11-12, Medium |
| Mono/Metric Large | JetBrains Mono 30-60, Black |
| Mono/Code | JetBrains Mono 14, Regular, 1.6 |

### Spacing

**CONFIRMED FROM CODE:** Tailwind spacing scale is used directly.

| Value | Tailwind | Common usage |
|---:|---|---|
| 2px | `0.5` | Language toggle shell padding, timeline connector height. |
| 4px | `1` | Small gaps, badge padding, progress bar labels. |
| 6px | `1.5` | Pills, icon button padding, small gaps. |
| 8px | `2` | Inline gaps, button vertical padding, rounded control gap. |
| 10px | `2.5` | Button/input vertical padding, badge x/y. |
| 12px | `3` | Standard row gap, button/input padding. |
| 14px | `3.5` | Floating nav item horizontal padding. |
| 16px | `4` | Card/control gaps, table padding, mobile menu gap. |
| 20px | `5` | Standard card padding for compact cards. |
| 24px | `6` | Page horizontal padding, large card padding, grid gaps. |
| 32px | `8` | Hero CTA gap top, feature card padding, result card padding. |
| 40px | `10` | Setup top content, upload zone padding. |
| 48px | `12` | CTA banner padding, analysis loading panel. |
| 56px | `14` | Landing stats/features section vertical spacing. |
| 64px | `16` | Placement section gaps, bottom nav page padding. |
| 80px | `20` | Landing feature/how/CTA section vertical spacing. |
| 112px | `28` | Landing hero top padding below fixed nav. |

### Radius

| Token | Tailwind | Pixel | Usage |
|---|---|---:|---|
| Small | `rounded-md` | 6px | Chart bars, code pre blocks. |
| Medium | `rounded-lg` | 8px | icon buttons, dark placement cards, pagination. |
| Large | `rounded-xl` | 12px | inputs, buttons, upload file row icons, code editor. |
| XL | `rounded-2xl` | 16px | most cards, primary CTAs, question cards. |
| 3XL | `rounded-3xl` | 24px | hero/profile/result showcase/CTA banner. |
| Full | `rounded-full` | 9999px | pills, avatars, progress dots, rings. |

### Shadows

| Shadow | Tailwind/source | Usage |
|---|---|---|
| `shadow-sm` | Tailwind | most white cards. |
| `shadow-md` | Tailwind hover | expanded results rows hover. |
| `shadow-lg shadow-brand/10` | Tailwind | selected company card. |
| `shadow-lg shadow-brand/30` | Tailwind | hovered/active primary CTAs and floating nav active. |
| `shadow-xl` | Tailwind | landing floating glass cards, modal prompts. |
| `shadow-2xl` | Tailwind | floating nav and results score showcase. |
| SVG drop shadow | `feDropShadow dx=0 dy=14 stdDeviation=18 floodOpacity=0.18` | owl head. |
| `drop-shadow-xl/2xl` | Tailwind | owl visual emphasis. |

### Animation

**CONFIRMED FROM CODE:** Custom animation classes live in `src/index.css`.

| Animation | Duration/easing | Usage |
|---|---|---|
| `owl-breathe` | 3.2s ease-in-out infinite | Owl idle. |
| `owl-celebrate` | 1s cubic-bezier infinite | Owl celebrating. |
| `owl-bob` | 0.75s ease-in-out infinite | Owl listening. |
| `owl-tilt` | 2.2s ease-in-out infinite | Owl thinking. |
| `blink` | 4.5s ease-in-out infinite | Owl eyes. |
| `ear-wob` | 2.8s ease-in-out infinite/reverse | Owl ear tufts. |
| `fade-up` | 0.55s ease-out both | Landing/results/analysis entrance. |
| `slide-in-right` | 0.45s ease-out both | Available helper, not central. |
| `float-card` | 3.6s/4.8s infinite | Landing floating cards. |
| `record-pulse` | 1.4s infinite | Recording dot. |
| `bar-grow` | 1.1s cubic-bezier both | Progress bars. |
| `ring-fill` | 1.4s cubic-bezier both | Results rings. |
| `confetti-fall` | dynamic per element | Results header confetti dots. |
| `score-bounce` | 0.7s cubic-bezier both | Results score. |

## 6. Page-by-Page Figma Specification

### Landing

Classification: **CONFIRMED FROM CODE** unless marked otherwise.  
Logical route: `landing`; browser route: `/`.  
Source: `src/pages/LandingPage.tsx`, `src/components/OwlAvatar.tsx`, `src/components/LanguageToggle.tsx`.

Purpose: public marketing/demo entry screen for AI-powered interviews. It introduces HireOS, shows mascot-led visual proof, and routes users to setup, results demo, or admin dashboard.

Frame recommendation:

| Viewport | Frame |
|---|---|
| Desktop | 1440 x full-page scroll, min 1024 visible |
| Laptop | 1280 x full-page scroll |
| Tablet | 768 x full-page scroll |
| Mobile | 390 x full-page scroll |

Layout:

1. Fixed top nav: 64px height, white/90 blur, bottom border.
2. Centered hero: max width 1280, top padding 112px, bottom 48px, horizontal 24px.
3. Owl visual area: min height 380 mobile-ish, 460 at `sm`, centered owl with two desktop-only glass floating cards.
4. Stats band: surface background, four stats in 2 columns mobile/tablet and 4 columns at `lg`.
5. Features: max width 1152, 3 feature cards at `md`, one column below.
6. How it works: navy band, 3 process steps at `md`, connector line visible on desktop.
7. CTA banner: centered 896 max width gradient card.
8. Footer: simple flex row at `md`, stacked below.

Visible elements:

| Element | Size/placement | Purpose |
|---|---|---|
| Logo lockup | 32px brand square with 28px owl, `HireOS` 20px bold | Brand identity. |
| Desktop nav links | hidden below `md`, gap 32px | Anchor placeholders: Features, How It Works, Pricing, Contact. |
| Language toggle | desktop auth area and mobile menu | EN/HI switching. |
| Sign In | text button, no handler | Placeholder auth action. |
| Get Started | brand pill, 20px x 10px padding | Navigates to setup. |
| Mobile menu button | `md:hidden`, 24px icon | Toggles mobile menu. |
| Mobile menu | white panel, border-top, stacked links | Responsive nav. |
| Hero H1 | 48/60/72px black, max width 896 | Main marketing message. |
| Hero subhead | 18/20px gray, max width 672 | Value proposition. |
| Primary CTA | brand 16px button, 32px x 16px, 16px radius | Setup flow. |
| Secondary CTA | gray outline 2px, 32px x 16px | Results demo. |
| Left signal card | 208px wide, glass, desktop only | Communication, Technical Depth, Role Fit bars. |
| Right score card | 192px wide, glass, desktop only | Overall match 82/100. |
| Owl avatar | 340px | Mascot centerpiece. |
| Stats | 4 values: 10k+, 95%, 200+, 2.4x | Social proof. |
| Feature cards | white cards, 24px radius, 32px padding | Adaptive Questions, Instant Analysis, Fair & Unbiased. |
| Process steps | 64px numbered blocks | Post a Job, Candidates Interview, Review Results. |
| CTA banner | brand gradient, 24px radius, 48px padding | Two closing CTAs. |
| Footer | brand, rights, links | Footer/legal placeholders. |

Component hierarchy:

```
LandingPage
|-- nav
|   |-- Logo + OwlAvatar
|   |-- DesktopLinks
|   |-- LanguageToggle
|   |-- AuthButtons
|   |-- MobileMenuToggle
|   |-- MobileMenu
|-- Hero
|   |-- Headline
|   |-- CTAButtons
|   |-- SignalCard
|   |-- MatchCard
|   |-- OwlAvatar
|-- StatsBand
|-- FeaturesGrid
|-- ProcessBand
|-- CTABanner
|-- Footer
```

Interactions/states:

| Interaction | Behavior | State variants |
|---|---|---|
| Mobile menu | Toggles `menuOpen`; icon changes hamburger/close. | closed/open. |
| Get Started / primary CTA / CTA banner free | `onNavigate("setup")`. | default/hover. |
| View Demo | `onNavigate("results")`. | default/hover. |
| View Admin Dashboard | `onNavigate("admin")`. | default/hover. |
| Language toggle | Sets `lang` to `en` or `hi`. | active/inactive light. |
| Desktop nav links | `href="#"`; no route. | hover only. |
| Sign In | no handler. | hover only. |

Responsive:

| Breakpoint | Behavior |
|---|---|
| Mobile < 640 | Hero H1 48px, CTAs full width stacked, desktop links hidden, floating glass cards hidden, stats 2 columns, features/process single column. |
| `sm` >= 640 | H1 60px, CTAs inline, hero visual min-height 460, CTA rows can become horizontal. |
| `md` >= 768 | desktop links/auth visible, mobile hamburger hidden, features/process 3 columns, footer row. |
| `lg` >= 1024 | H1 72px, stats 4 columns, floating signal/match cards visible. |

### Setup

Logical route: `setup`; browser route: `/`.  
Source: `src/pages/SetupPage.tsx`, `src/data/companies.ts`, `src/components/OwlAvatar.tsx`, `LanguageToggle`.

Purpose: candidate chooses a company, uploads a CV, confirms/edits full name, then starts the interview.

Frame: desktop 1440 x 1024, content max width 896 (`max-w-4xl`), horizontal padding 24, background surface.

Layout:

1. White top bar with back button left, language toggle right.
2. Centered intro with 110px owl, eyebrow, H1, subtitle.
3. Step 1 company picker: six cards in 1/2/3 columns depending viewport.
4. Step 2 CV upload: dashed drop zone or uploaded file row.
5. Name input section.
6. Continue CTA and helper text when disabled.

Visible elements:

| Element | Size/placement | Purpose |
|---|---|---|
| Header | white, `px-6 py-4`, max 896 | Back and language. |
| Back button | icon 20px, label hidden below `sm` | Returns to landing. |
| Owl | 110px | Friendly setup guide. |
| Company cards | white, 16px radius, 20px padding, 2px border | Select from six static companies. |
| Company logo tile | 44px square, 12px radius | Initials and brand color. |
| Selected badge | brand-muted pill with check icon | Only on selected card. |
| CV drop zone | white, 16px radius, dashed 2px border, 40px padding | Drag/drop or browse CV. |
| Browse button | brand, 20px x 10px, 12px radius | Opens hidden file input. |
| Uploaded file row | white, 16px radius, 20px padding, icon + file name + remove | Replaces drop zone after file chosen. |
| Name input | max 448px, 16px x 12px, 12px radius | Candidate name persisted to context. |
| Continue | 32px x 16px, 16px radius | Disabled until company and CV file name exist. |

Form fields:

| Order | Field | Type | Required | Placeholder/accepted values | Validation |
|---:|---|---|---|---|---|
| 1 | Company | card selection | Yes | six static companies | `companyId` truthy. Default is `techcorp`. |
| 2 | CV | hidden file input/drop | Yes | `.pdf,.doc,.docx` | UI text says up to 10MB, but no size validation exists. |
| 3 | Full name | text | No hard validation | `e.g. Alex Chen` | Updates `candidateName`; can be empty. |

Interactions/states:

| Item | Behavior | State |
|---|---|---|
| Company card | Click sets company id. | default/hover/selected. |
| Drop zone | Drag over sets `dragOver=true`; drop stores first filename. | default/drag-over/uploaded. |
| Browse | Clicks hidden file input. | hover. |
| Remove | Clears `cvFileName`. | hover red. |
| Name input | Edits shared candidate name. | default/focus/filled. |
| Continue | Navigates to interview only when enabled. | disabled/enabled/hover. |

Responsive:

| Breakpoint | Behavior |
|---|---|
| Mobile | Header label hidden; company grid one column; CTA centered; upload large single-column. |
| `sm` | Company grid 2 columns; intro H1 36px; uploaded row remains horizontal. |
| `lg` | Company grid 3 columns. |

### Interview

Logical route: `interview`; browser route: `/`.  
Source: `src/pages/InterviewPage.tsx`, `src/components/CodeEditor.tsx`, `src/components/OwlAvatar.tsx`, `src/data/questions.ts`, `src/data/placementPrepDemo.ts`.

Purpose: simulated AI interview for video, text, and code questions. Supports manual progression and a scripted auto-fill demo.

Frame: desktop 1440 x 1024 dark app screen; main content max width 896.

Layout:

1. Dark header: back/company info left, language/session/progress/demo/end controls right.
2. Main content: centered max 896 vertical column.
3. Media/answer area:
   - Video question: 16:9 camera preview, max height 480, owl overlay top right, status top left, timer bottom right when recording, progress line bottom.
   - Text/code question: dark panel with status left, timer + owl right, then text area or code editor.
4. Question card: category/step row, progress dots, question text, action buttons, helper hint.

Question types:

| Type | Source data | Input surface | Start button label | Duration |
|---|---|---|---|---:|
| Video | `type: "video"` | camera preview placeholder | Start Speaking | 150s |
| Text | `type: "text"` | textarea, 160px high | Start Typing | 200-240s |
| Code | `type: "code"` | CodeEditor, 220px editor body | Start Coding | 420s in manual bank, 240s in demo script |

Manual question bank:

| # | Type | Category | Duration | Notes |
|---:|---|---|---:|---|
| 1 | video | behavioral | 150 | Tell me about yourself. |
| 2 | video | behavioral | 150 | Challenging project. |
| 3 | text | technical | 240 | Sync vs async. |
| 4 | code | coding | 420 | Two-sum starter code. |
| 5 | video | situational | 150 | Disagreements. |
| 6 | text | situational | 240 | Prioritization. |
| 7 | code | coding | 420 | Palindrome starter code. |
| 8 | video | culture | 150 | Five-year path. |
| 9 | text | culture | 200 | Stay updated. |
| 10 | video | behavioral | 150 | Questions for company. |

Visible elements:

| Element | Details |
|---|---|
| Back icon | 20px, returns landing. |
| Company/role title | Uses selected company role/name or `HireOS`; subtitle `Initial AI Screening`. |
| Session timer | Hidden below `sm`; increments every second from mount. |
| Progress counter | Current question / active question length. |
| Auto-fill for Demo | Hidden below `sm`; opens confirmation modal. |
| Placement Prep | Hidden below `sm`; navigates to placement flow. |
| End Interview | Navigates to results. |
| Status pill | Ready or Recording with gray/red dot. |
| Owl avatar | 200px in video, 56px in text/code header; state changes idle/listening/thinking/celebrating. |
| Timer | Recording-only; brand/amber/red depending remaining time. |
| Text answer | Dark `#0d1117` textarea; word counter. |
| Code editor | custom editor with gutter, title bar, run bar, output panel. |
| Question meta | Question X of N, category badge, progress dots. |
| Primary action | Start or Submit & Next. |
| Secondary actions | Repeat, Skip except last question. |
| Hint card | Owl 36px and contextual help. |

Interactions/states:

| Item | Behavior | State variants |
|---|---|---|
| Start | `isRecording=true`, owl listening. | idle/recording. |
| Submit & Next | Marks answered, owl thinking; after 1.2s advance or results. | recording/submitting-like delay. |
| Skip | Advances without marking answered; hidden on last question. | available/hidden. |
| Repeat | Resets current question timer/input/owl. | reset. |
| End Interview | Navigates results. | default/hover. |
| Auto-fill for Demo | Opens modal. | default/modal-open. |
| Modal cancel | Closes modal. | default/hover. |
| Modal start | Switches to auto-fill mode, resets first demo question. | auto-fill active. |
| Stop auto-fill/cancel | Returns manual mode and first question. | auto-fill active/manual. |
| Code textarea Tab | Inserts two spaces instead of changing focus. | editing. |
| Code Run | Sets `hasRun=true`, output changes to simulated success. | not run/run. |

Timer color:

| Remaining threshold | Text color |
|---|---|
| > 40% | brand |
| > 15% and <= 40% | amber |
| <= 15% | red |

Auto-fill modal:

| Property | Value |
|---|---|
| Overlay | fixed inset, `bg-black/70`, backdrop blur, z 50 |
| Card | `max-w-sm`, full width, dark gray 900, border white/10, radius 16, padding 24 |
| Title | 18px white bold |
| Body | 14px gray 400 |
| Buttons | Cancel outlined, Start Demo brand |
| Outside click | no handler |
| Escape key | no handler |

Responsive:

| Breakpoint | Behavior |
|---|---|
| Mobile | Header controls wrap/compress; session timer, auto-fill, placement prep hidden; main remains single column; video 16:9; text/code panels full width. |
| `sm` | Session timer visible, additional header controls visible except responsive constraints. |
| Desktop | Centered max 896 column with dark background on both sides. |

### Results

Logical route: `results`; browser route: `/`.  
Source: `src/pages/ResultsPage.tsx`, `OwlAvatar`, `LanguageToggle`.

Purpose: candidate post-interview scoring and feedback summary.

Frame: 1440 x full scroll; content max width 1024 (`max-w-5xl`).

Layout:

1. Dark gradient hero header with confetti dots, language toggle top right.
2. Pass badge under congratulatory H1.
3. White score showcase card overlapping header by -80px.
4. Question-by-question accordion list.
5. Next steps card with three columns and three CTAs.

Visible elements:

| Element | Details |
|---|---|
| Header gradient | `from-navy via-gray-800 to-gray-900`, top padding 80, bottom 128. |
| Confetti dots | 14 absolute tiny dots with timed `confetti-fall`. |
| Title | `Congratulations, {first name}!`; candidate name from context. |
| Subtitle | selected company role/name and static `Aug 25, 2026`. |
| Pass badge | brand translucent pill with check icon. |
| Score showcase | white, radius 24, `shadow-2xl`, 32px padding, flex column to row at `lg`. |
| Owl | 180px celebrating. |
| Overall ring | SVG score ring 208px square for score 82/100. |
| Metric grid | 2 columns: Communication 85, Technical 78, Cultural Fit 88, Overall 82. |
| Accordion rows | five question rows; first expanded by default. |
| Next steps | three static steps and three action buttons. |

Accordion behavior:

| State | Behavior |
|---|---|
| Default | Row 0 expanded. |
| Click closed row | Sets `expanded` to that row index. |
| Click open row | Sets `expanded=null`; all rows can be closed. |
| Expanded content | Two cards: response summary and AI feedback. |

CTAs:

| Button | Behavior |
|---|---|
| Return Home | `onNavigate("landing")` |
| Dashboard | `onNavigate("dashboard")` |
| Start Another Interview | `onNavigate("setup")` |

Responsive:

| Breakpoint | Behavior |
|---|---|
| Mobile | Header text 36/40-ish via Tailwind, score showcase stacked, metric grid remains 2 columns, progress snippet in accordion hidden below `sm`, next steps single column. |
| `sm` | Header H1 48px, accordion details 2 columns, CTA buttons row. |
| `lg` | Score showcase lays out owl/ring/metrics horizontally. |

### Student Dashboard

Logical route: `dashboard`; browser route: `/`.  
Source: `src/pages/StudentDashboardPage.tsx`, `ProgressTimeline`, `OwlAvatar`.

Purpose: candidate journey summary across interviews, achievements, and current application progress.

Frame: 1440 x 1024; content max 1152 (`max-w-6xl`).

Layout:

1. White top bar with icon back and language toggle.
2. Profile header card.
3. Two KPI cards.
4. Current application journey card with horizontal timeline.
5. Two-column lower grid at `lg`: interview history (2/3 width) and achievements (1/3).

Visible elements:

| Element | Details |
|---|---|
| Profile card | white, radius 24, border, shadow-sm, padding 24/32, flex column to row at `sm`. |
| Owl | 90px idle. |
| Candidate name | from context, default Alex Chen. |
| Level badge | amethyst pill, level 3. |
| Streak badge | ember pill, 7-day streak. |
| XP progress | 640/1000, amethyst bar at 64%. |
| KPI cards | Interviews completed = 4, Average score = 79. |
| Journey | company initials 36px, title, subtitle, five-step timeline with active index 3. |
| History rows | 4 static rows with status and score, view results button. |
| Achievement badges | 6 badges; 4 earned, 2 locked. |

Timeline variants:

| Variant | Visual |
|---|---|
| Done | brand filled circle, white check, brand connector. |
| Current | brand-muted circle, brand border/text, pulse animation. |
| Future | white circle, gray border/text, gray connector. |

Interactions:

| Item | Behavior |
|---|---|
| Back | Landing. |
| View Results in history | Results page. |
| Language toggle | EN/HI. |

Responsive:

| Breakpoint | Behavior |
|---|---|
| Mobile | Profile stacks centered; lower grid single column; timeline horizontally scrollable. |
| `sm` | Profile row with right-aligned XP; header text left. |
| `lg` | Lower grid 3 columns with history span 2. |

### Admin Dashboard

Logical route: `admin`; browser route: `/`.  
Source: `src/pages/AdminPage.tsx`.

Purpose: recruiter/admin demo dashboard for screening results by role. Includes KPIs, charts, sortable/filterable table, empty state, bulk selection state.

Frame: 1440 x full scroll; content max 1280 (`max-w-7xl`).

Layout:

1. White header, responsive column/row.
2. Four KPI cards.
3. Analytics row: score distribution chart spans 2 columns at `lg`; metric averages card.
4. Candidate table card with search, status filters, conditional bulk actions, table, empty state, pagination.
5. Insights footer: four compact cards.

Candidate table columns in exact order:

| # | Column | Responsive | Sortable | Alignment |
|---:|---|---|---|---|
| 1 | Checkbox | always | no | center-ish, left padded |
| 2 | Candidate | always | yes, `name` | left |
| 3 | Score | always | yes, `score` | left |
| 4 | Comm. | hidden below `md` | yes, `communication` | left |
| 5 | Technical | hidden below `md` | yes, `technical` | left |
| 6 | Status | always | no | left |
| 7 | Date | always | no | left |
| 8 | Actions | always | no | right |

Static candidates:

| Name | Score | Communication | Technical | Fit | Status |
|---|---:|---:|---:|---:|---|
| Emma Rodriguez | 92 | 94 | 88 | 95 | Passed |
| Alex Chen | 82 | 85 | 78 | 88 | Passed |
| Sarah Kim | 78 | 80 | 72 | 82 | Review |
| James Okonkwo | 88 | 90 | 85 | 90 | Passed |
| Priya Sharma | 65 | 62 | 68 | 64 | Failed |
| Marcus Johnson | 71 | 74 | 66 | 72 | Failed |
| Yuki Tanaka | 85 | 88 | 80 | 87 | Passed |
| Lena Muller | 79 | 82 | 75 | 80 | Review |

Interactions/states:

| Item | Behavior | State variants |
|---|---|---|
| Back | Landing. | hover. |
| Export CSV | No handler. | default/hover. |
| New Interview | Setup. | default/hover. |
| Search | Filters by candidate name only. | empty/typed/no results. |
| Status filter | Sets `filterStatus` to All/Passed/Review/Failed. | active/inactive. |
| Header sort buttons | Toggle sort direction if same key, else set key desc. | inactive/active asc/active desc. |
| Select row checkbox | Adds/removes id from selected array. | unchecked/checked/selected row bg. |
| Select all | If all visible sorted rows selected, clears; else selects all visible sorted rows. | unchecked/checked. |
| Bulk actions | Appear only when selected count > 0. | hidden/visible. |
| View action | Results page. | hover underline. |
| Schedule row action | Visible for Passed only, no handler. | default/hover. |
| Reject row action | Visible for Failed only, no handler. | default/hover. |
| Clear filters | In empty state, resets status All and search empty. | visible only empty. |
| Pagination | Static buttons, no page state. | page 1 active, 2/3 inactive. |

Empty state:

| Trigger | Visual |
|---|---|
| `sorted.length === 0` | 64px vertical padding, 100px thinking owl, message, `Clear filters` text button. |

Responsive:

| Breakpoint | Behavior |
|---|---|
| Mobile | Header stacks, KPI grid 2 columns, analytics single column, controls stack, table horizontally scrolls with min width 700px. |
| `sm` | Header and table controls become rows when space allows; insights 2 columns. |
| `md` | Communication and Technical columns show. |
| `lg` | KPI 4 columns, analytics 3 columns, insights 4 columns. |

### Placement Flow

Logical route: `placement-flow`; browser route: `/`.  
Sources: `src/pages/PlacementFlowPage.tsx`, `PlacementPrepFlow.tsx`, `PlacementInterviewSummary.tsx`, `PlacementAnalysisSection.tsx`, `PlacementLearningSection.tsx`, `PlacementReportSection.tsx`, `src/data/placementPrepDemo.ts`.

Purpose: long-form interview-to-learning handoff. Shows captured interview answers, analysis, a learning module, and readiness report.

Frame: desktop 1440 x long scroll; content max 896; dark background.

Top header:

| Element | Details |
|---|---|
| Sticky shell | `top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-white/10` |
| Inner | max 896, px 24, py 16, flex between |
| Back | text gray to white, returns interview |
| Title | 14/16px black weight, white, centered/truncated |
| Language | dark variant |

Flow layout:

| Property | Value |
|---|---|
| Container | `max-w-4xl`, `mx-auto`, vertical flex |
| Padding | `py-12`, outer `px-6 pb-16` |
| Section gaps | `gap-16`, `sm:gap-20` |
| Reveal behavior | IntersectionObserver threshold 0.15; section fades/slides in and only renders children when visible. |

#### Placement Section 1 - Interview Summary

Visible elements:

| Element | Details |
|---|---|
| Number badge | 36px circle, brand/20 bg, brand text, number 1 |
| Heading | 30px bold white |
| Candidate metadata card | flex-wrap, 24px x 16px padding, dark translucent |
| Question cards | dark translucent, border white/10, radius 8, padding 24 |
| Tags | category amethyst pill; follow-up ember pill if `isFollowUp` true |
| Answer box | nested dark gray 900 panel with animated reveal text/code |
| Score/duration | gray text, score mono white |

State:

| State | Behavior |
|---|---|
| Answer reveal | Text splits by words at 70ms; code splits by lines at 150ms; each card starts `i * 500ms`. |

#### Placement Section 2 - Analysis Results

Initial state:

| State | Visual |
|---|---|
| Analyzing | 1000ms spinner card: 40px spinner with brand top border, message. |

Results state:

| Element | Details |
|---|---|
| Overall score card | 8.75/10, score animates over 1000ms after loading. |
| Status badge | 80px circle, border/color based on score ratio; here Excellent. |
| Category bars | Technical Knowledge 88, Communication 90, Problem Solving 90, System Design 70, Leadership 85, Collaboration 88. |
| Weak areas | System Design, score 7/10, severity Medium, description. |
| Learn This Topic | Amethyst button, scrolls to learning section. |
| Strong areas | Communication, Technical Knowledge, Problem Solving, Code Quality with Strong badges. |

#### Placement Section 3 - Learning Material

Visible elements:

| Element | Details |
|---|---|
| Main card | border white/10, bg white/5, padding 24/32, radius 8, vertical gap 32 |
| Topic header | System Design Fundamentals with icon marker, amethyst 20px bold |
| Reading time pill | gray translucent pill |
| Explanation | multiline text, gray 300 |
| Type cards | Horizontal Scaling, Vertical Scaling; gray 900 cards with code-style examples |
| Key points | six bullets with brand dot |
| Related topics | six translucent pills |
| Practice This Topic | Amethyst button, no handler |

#### Placement Section 4 - Readiness Report

Visible elements:

| Element | Details |
|---|---|
| Overall readiness | 88/100, progress bar 88%, status Excellent green, next-step copy. |
| By category | same six percentage bars as analysis. |
| Weak areas ranked | rank chip, System Design, severity, learning status Started, current/target/time. |
| Strong areas | Communication Skills, Technical Knowledge, Problem Solving with confidence. |
| Learning path | four steps with status pills. |
| Readiness projection | 95/100 and dynamic next review date. |
| CTAs | Try Interview Again, Continue Learning. |

Dynamic date:

**CONFIRMED FROM CODE:** `assessmentDate` and `nextReviewDate` are computed at runtime from the user's current date. On 2026-09-03, `nextReviewDate` would be 2026-09-06.

Interactions:

| Item | Behavior |
|---|---|
| Back | Interview page. |
| Learn This Topic | Smooth scroll to learning section. |
| Try Interview Again | Interview page. |
| Continue Learning | Smooth scroll to learning section. |
| Practice This Topic | No handler. |

Responsive:

| Breakpoint | Behavior |
|---|---|
| Mobile | One-column long scroll, wrapped metadata/tags, CTA stacks. |
| `sm` | Larger vertical gaps, learning card padding 32, report CTAs horizontal. |

## 7. Reusable Components for Figma

Create these components because they exist in the implementation.

| Component | Variants/properties | Source |
|---|---|---|
| `Mascot/OwlAvatar` | state: idle/listening/thinking/celebrating; size: 28, 36, 56, 90, 100, 110, 180, 200, 340 | `OwlAvatar.tsx` |
| `Control/LanguageToggle` | variant: light/dark; language: EN/HI | `LanguageToggle.tsx` |
| `Navigation/DemoPageSwitcher` | active page: 7 values; mobile labels hidden | `App.tsx` |
| `Button/Primary` | size sm/md/lg; state default/hover/disabled; optional icon | all pages |
| `Button/SecondaryOutline` | light/dark; hover border/text brand | all pages |
| `Button/GhostText` | light/dark; underline hover where used | admin/results/interview |
| `Button/Icon` | light/dark; back/menu | pages |
| `Input/Text` | default/focus/filled | setup/admin/interview |
| `Input/FileDropzone` | default/drag-over/uploaded | setup |
| `Card/Base` | light/dark/glass; radius 8/16/24; padding 16/20/24/32/48 | app-wide |
| `Badge/Status` | passed/review/failed/excellent/good/needs-work/critical/strong/locked | results/admin/placement |
| `Chart/ProgressBar` | color brand/amethyst/ember/red/gradient; size 6/8/10px high | app-wide |
| `Chart/ScoreRing` | large/mini; score/color | results |
| `Chart/BarDistribution` | six-bin candidate score histogram | admin |
| `Table/Candidate` | default/filter-empty/bulk-selected; responsive hidden cols | admin |
| `Accordion/QuestionReview` | expanded/collapsed; tag variants | results |
| `Modal/Confirmation` | auto-fill confirm | interview |
| `CodeEditor` | not-run/run, editable/read-only visual | code editor/interview/learning |
| `Timeline/ApplicationProgress` | done/current/future | dashboard |
| `Placement/RevealSection` | hidden/visible | placement |

### Variant Matrix

Button:

| Property | Values |
|---|---|
| Type | Primary, SecondaryOutline, GhostText, Icon, DangerOutline, Amethyst |
| Size | XS, S, M, L |
| State | Default, Hover, Pressed (recommended), Focus (recommended), Disabled, Loading (recommended) |
| Icon | None, Leading, Trailing, IconOnly |
| Theme | Light, Dark |

Input:

| Property | Values |
|---|---|
| Type | Text, Search, Textarea, CodeTextarea, FileHidden |
| State | Empty, Focus, Filled, Error (recommended only), Disabled, ReadOnly |
| Theme | Light, Dark |

Badge:

| Property | Values |
|---|---|
| Semantic | Brand, Amethyst, Ember, Passed, Review, Failed, Strong, Critical, High, Medium, Locked, Neutral |
| Size | XS, S, M |
| Shape | Pill, DotPill, Square-ish |

Navigation item:

| Property | Values |
|---|---|
| Page | Landing, Setup, Interview, Results, Placement, Journey, Admin |
| State | Active, Inactive, Hover |
| Viewport | DesktopLabel, MobileIconOnly |

Table:

| Property | Values |
|---|---|
| Row state | Default, Hover, Selected |
| Status | Passed, Review, Failed |
| Density | Current fixed density |
| Responsive | Desktop, MobileHorizontalScroll |

Modal:

| Property | Values |
|---|---|
| Type | Confirmation |
| Theme | Dark |
| State | Open, Closed |

## 8. Forms

| Form | Page | Fields/actions | Validation |
|---|---|---|---|
| Interview setup | Setup | Company cards, CV file, full name, Continue | Continue requires company and file name. No real file type/size or name validation beyond accept attribute. |
| Candidate answer - text | Interview | Textarea, word count, start/submit/repeat/skip | No required validation; submit can happen with empty answer. |
| Candidate answer - code | Interview | Code editor textarea, run button, output, submit/repeat/skip | No code validation; run output simulated. |
| Admin filters | Admin | Search input, status segmented filters | Search filters by name; no debounce. |
| Bulk actions | Admin | Checkboxes, select all, Schedule/Reject actions | No API submit handlers. |
| Language switcher | Shared | EN/HI buttons | Immediate local context update. |

## 9. Tables

Only one real table exists: Admin candidate table.

Design details:

| Property | Value |
|---|---|
| Table card | white, radius 16, border gray-100, shadow-sm, overflow hidden |
| Min width | 700px |
| Header row | `bg-surface`, border-b gray-100 |
| Header text | 12px, bold, uppercase, wide tracking, gray-400 |
| Body row | border-b gray-50, hover gray-50/50 |
| Selected row | brand-muted/30 |
| Cell padding | left/right 16px, vertical 16px; first cell left 24px |
| Pagination | static footer, page 1 active |

## 10. Overlays

| Overlay | Trigger | Source | Size | Close behavior | Notes |
|---|---|---|---|---|---|
| Landing mobile menu | hamburger button | `LandingPage.tsx` | full width under 64px nav | hamburger toggles | Not modal; pushes under fixed nav. |
| Auto-fill confirmation modal | Interview `Auto-fill for Demo` | `InterviewPage.tsx` | max 384px, dark card | Cancel button only | No outside click/Escape handler. |
| Auto-fill prompt bubble | Auto-fill mode | `InterviewPage.tsx` | content hug, dark pill | auto-hidden | Appears near owl. |

No drawers, popovers, tooltips, toast notifications, command palettes, or dropdown menus exist.

## 11. Search and Filtering

Admin dashboard:

| Control | Behavior |
|---|---|
| Search | Filters `c.name.toLowerCase().includes(searchQuery.toLowerCase())`. |
| Status | Filters exact status unless `All`. |
| Sort | Sorts filtered results by active key and direction. |
| Clear filters | Only shown in empty state, resets search to empty and status to All. |
| Pagination | Visual only; does not affect rows. |

No global search exists.

## 12. Dashboard and Analytics

### Student Dashboard Widgets

| Widget | Data | Visualization |
|---|---|---|
| Profile header | candidate name, level 3, 7-day streak | Owl, badges, XP progress bar. |
| Interviews completed | 4 | KPI card, mono 30px. |
| Average score | 79 | KPI card, brand mono 30px. |
| Current journey | selected company + 5 steps | horizontal timeline, active index 3. |
| Interview history | four static records | list rows with status badges and scores. |
| Achievements | six static badges | 2-column grid; locked cards opacity 60%. |

### Admin Analytics Widgets

| Widget | Data | Visualization |
|---|---|---|
| KPI cards | total 8, passed 4, review 2, avg 80 | four cards, icon markers. |
| Score distribution | static bins from 60-100 | simple vertical bars. |
| Metric averages | communication 82, technical 77, cultural fit 82 | three horizontal progress bars. |
| Insights footer | pass rate, avg, top metric, needs work | four compact cards with trend arrows. |

## 13. Candidate, Job, Interview, Analytics, Settings Scope

**CONFIRMED FROM CODE:** Current app coverage differs from a full HR platform.

| Product area | Exists? | Current implementation |
|---|---|---|
| Candidate list | Yes | Admin table only. |
| Candidate profile | No | No detail page. `View` navigates to generic results. |
| Candidate resume | Partial | Setup stores uploaded CV filename only. |
| Candidate notes/timeline | Partial | Results accordion and dashboard history, static. |
| Jobs list | No | Company/role cards in setup and admin role label only. |
| Create/edit job | No | Not implemented. |
| Applicants | Partial | Admin candidates are applicants for one role. |
| Interview scheduling | Placeholder | Schedule buttons exist with no handlers. |
| Interview list | Partial | Dashboard history and admin table. |
| Calendar | No | Not implemented. |
| Scorecards | Yes | Results and placement analysis/report. |
| Analytics | Yes, static | Admin charts and KPI widgets. |
| Settings/profile | No | Not implemented. |
| Authentication | No | Sign In button exists but no handler/page. |
| Onboarding | Partial | Setup flow. |
| Localization | Yes | English/Hindi toggle for most UI strings. |

## 14. Asset Inventory

| Asset | Type | Location | Used on | Notes |
|---|---|---|---|---|
| Owl avatar SVG | inline SVG component | `src/components/OwlAvatar.tsx` | Landing, setup, interview, results, dashboard, admin empty, placement indirectly no owl | Main mascot, animated by CSS classes. |
| Prior design screenshot 1 | PNG | `src/imports/Screenshot_2026-08-25_180706.png` | Not imported by app | Reference/import asset. |
| Prior design screenshot 2 | PNG | `src/imports/Screenshot_2026-08-25_180716.png` | Not imported by app | Reference/import asset. |
| HireOS design analysis | Markdown | `src/imports/HireOS_Design_Analysis.md` | Not imported by app | Design reference, not implementation. |
| Master development prompt | Markdown | `src/imports/HIREOS_MASTER_DEVELOPMENT_PROMPT.md` | Not imported by app | Reference prompt. |
| Owl technical spec | Markdown | `src/imports/OWL_AVATAR_TECHNICAL_SPEC.md` | Not imported by app | Reference for mascot. |
| Google Fonts | External CSS import | `src/index.css` | Entire app | Outfit, Inter, JetBrains Mono. |
| Inline icons | SVG/emoji/text markers | page/component files | App-wide | No icon package dependency. |

## 15. Iconography Inventory

**CONFIRMED FROM CODE:** No Lucide/Heroicons package is installed. Icons are inline SVG paths plus text/emoji markers.

| Icon | Approx size | Usage |
|---|---:|---|
| Owl mascot | variable | brand/guide/empty/success. |
| Clock | 28px | landing feature adaptive questions. |
| Pulse/analytics | 28px | landing feature instant analysis. |
| Shield | 28px | landing feature fair/unbiased. |
| Play triangle | 20px/14px | landing CTA, code run. |
| Video camera | 20px/40px | landing demo CTA, interview camera preview. |
| Checkmark | 12/16/20px | selected, pass badge, timeline done. |
| Hamburger/close | 24px | landing mobile nav. |
| Back arrow | 20px/16px | headers. |
| Upload | 40px | setup drop zone. |
| File document | 20px | uploaded CV row. |
| Microphone | 20px | interview start. |
| Chevron right/down | 16px | continue/submit and accordion. |
| Repeat arrows | 16px | interview repeat. |
| Search | 16px | admin search input. |
| Download | 16px | admin export button. |
| Plus | 16px | admin new interview. |
| Sort arrow | 14px | admin sortable table headers. |

Figma recommendation: recreate current inline icons as local vector components or swap to Lucide equivalents only if the design system chooses to standardize. Mark swaps as recommendations, not current UI.

## 16. Auto Layout Specifications

| Component | Direction | Gap | Padding | Width | Height |
|---|---|---:|---:|---|---|
| Landing nav inner | Horizontal | mixed 8/12/32 | x 24 | Fill/max 1280 | Fixed 64 |
| Primary CTA | Horizontal | 8 | x 32 y 16 | Hug/mobile Fill | Hug |
| Feature card | Vertical | 0 explicit, margins 20/8 | 32 | Fill | Hug |
| Company card | Vertical | margins internal | 20 | Fill | Hug |
| Uploaded CV row | Horizontal | 16 | 20 | Fill | Hug |
| Setup form sections | Vertical | 16-40 | none | Fill/max 896 | Hug |
| Interview header | Horizontal | 12/16/24 | x 24 y 16 | Fill | Hug |
| Question card | Vertical | 16/24 | 24 | Fill | Hug |
| Results score card | Column -> row at `lg` | 32 | 32 | Fill/max 1024 | Hug |
| Admin table controls | Column -> row at `sm` | 12 | x 24 y 16 | Fill | Hug |
| Admin row | Horizontal | 8/12 | cell-based | Fill/min 700 | Hug |
| Placement section | Vertical | 24 | none | Fill/max 896 | Hug |
| Placement dark card | Vertical | 16/24/32 | 24/32 | Fill | Hug |

## 17. Figma File Structure

Recommended Figma pages:

1. `00 - Cover`
2. `01 - Foundations`
3. `02 - Mascot`
4. `03 - Components`
5. `04 - Landing`
6. `05 - Setup`
7. `06 - Interview`
8. `07 - Results`
9. `08 - Student Dashboard`
10. `09 - Admin Dashboard`
11. `10 - Placement Flow`
12. `11 - Responsive`
13. `12 - Prototype Flows`
14. `13 - QA Checklist`

## 18. Naming Convention

Components:

| Pattern | Example |
|---|---|
| `Button/{Type}/{Size}/{State}` | `Button/Primary/Large/Hover` |
| `Input/{Type}/{Theme}/{State}` | `Input/Search/Light/Focus` |
| `Badge/{Semantic}/{Size}` | `Badge/Status/Passed/Small` |
| `Navigation/{Component}/{State}` | `Navigation/DemoPageSwitcher/Active` |
| `Card/{Theme}/{Radius}` | `Card/Light/R16` |
| `Table/{Part}/{State}` | `Table/CandidateRow/Selected` |
| `Mascot/Owl/{State}/{Size}` | `Mascot/Owl/Listening/200` |

Frames:

| Pattern | Example |
|---|---|
| `{Module}/{Screen}/{Viewport}` | `Interview/Video Question/Desktop` |
| `{Module}/{Screen}/{State}/{Viewport}` | `Admin/Candidate Table/Empty/Desktop` |
| `{Module}/{Flow Step}/{Viewport}` | `Placement/03 Learning Material/Desktop` |

## 19. Responsive Figma Frames

Minimum responsive frames:

| Viewport | Width | Use |
|---|---:|---|
| Mobile | 390 | Required for landing, setup, interview, admin table scroll behavior. |
| Tablet | 768 | Validate nav breakpoint, 2-column setup cards. |
| Laptop | 1280 | Typical desktop. |
| Desktop | 1440 | Primary desktop handoff. |

For every major page, build desktop and mobile. Tablet/laptop are most important for landing/setup/admin because breakpoint changes are visible there.

## 20. Prototype Connections

Connect these in Figma prototype mode:

1. Landing primary CTA -> Setup.
2. Landing secondary CTA -> Results.
3. Landing CTA banner admin -> Admin Dashboard.
4. Setup company card click -> same Setup frame with selected card variant.
5. Setup browse/upload -> Setup uploaded-file state.
6. Setup Continue -> Interview Video Question.
7. Interview Start -> Interview Recording state.
8. Interview Submit & Next -> Interview next question variant.
9. Interview Auto-fill -> Auto-fill Confirmation Modal.
10. Auto-fill Start Demo -> Interview Auto-fill active state -> Placement Flow.
11. Interview End -> Results.
12. Results row click -> Results expanded/collapsed row variant.
13. Results Dashboard -> Student Dashboard.
14. Results Start Another -> Setup.
15. Student Dashboard View Results -> Results.
16. Admin New Interview -> Setup.
17. Admin View -> Results.
18. Admin search no-match -> Admin Empty State.
19. Admin row checkbox -> Admin Bulk Selection State.
20. Placement Learn This Topic -> Placement Learning Material anchor/frame.
21. Placement Try Interview Again -> Interview.

## 21. Current UI Consistencies / Inconsistencies

Consistencies:

| Area | Observation |
|---|---|
| Brand palette | Teal/brand is consistently primary; amethyst and ember are secondary accents. |
| Typography | Outfit drives the product UI; JetBrains Mono consistently handles metrics/code. |
| Card language | White light cards on surface pages; translucent bordered dark cards on interview/placement. |
| Buttons | Primary actions generally use brand fill and darken to brand dark on hover. |
| Feedback | Badges use soft colored backgrounds with bold small type. |

Inconsistencies:

| Area | Issue |
|---|---|
| Routing terminology | App has no real URLs, but screens behave like routes through local state. Figma should label as logical routes. |
| Sidebar/header | No global sidebar exists, despite HR/dashboard expectations. Each page has its own header. |
| Radius scale | Marketing uses 24px cards while placement uses 8px dark cards; both are intentional-looking but not token-normalized. |
| Icon system | Inline SVGs and text/emoji markers are mixed; no single icon library. |
| Functional affordances | Several controls appear clickable but have no handler: Sign In, Export CSV, Schedule, Reject, Practice This Topic, pagination. |
| Validation | Setup mentions file limits but does not enforce size; candidate name can be blank. |
| Focus states | Inputs have focus rings; most buttons rely on hover and browser defaults only. |
| Localization | Most UI is translated, but several labels are hardcoded English: Role, Live Transcript, Candidate table headers, next-step card content. |
| Data realism | Admin, results, dashboard, placement report are static/demo; no loading/error API states except placement analysis spinner. |
| Scrollbars | Global CSS hides all scrollbars, which can harm discoverability for long pages and horizontal tables. |

## 22. Optional Figma / UI Improvements

These are **RECOMMENDED**, not current UI.

| Recommendation | Reason |
|---|---|
| Create a real route/frame taxonomy separate from demo nav | Prevent intern confusion from the current state-driven prototype. |
| Standardize radius tokens | Use R8 for compact dark cards, R12 controls, R16 app cards, R24 hero/showcase only. |
| Replace inline icons with a named icon set | Improves Figma component reuse and frontend consistency. Lucide would match the outline style. |
| Add explicit focus variants for all interactive controls | Current UI is hover-heavy. |
| Add disabled/loading/error variants to forms | Setup and interview need production-ready states if implemented beyond demo. |
| Mark non-functional controls visually or prototype them | Schedule/export/pagination look live but do nothing. |
| Review global hidden scrollbar rule | It can make admin table and placement long scroll harder to discover. |
| Normalize hardcoded English strings through i18n | Current language toggle does not fully localize all screens. |
| Build candidate profile/job management only as future scope | They do not exist in the current frontend; adding them to Figma should be clearly future-product work. |

## 23. Screen Inventory

| # | Module | Screen | Logical route | Desktop | Mobile | Figma required | Source file |
|---:|---|---|---|---|---|---|---|
| 1 | Shell | Floating demo navigator | all | Yes | Yes | Yes | `src/App.tsx` |
| 2 | Landing | Landing default | `landing` | Yes | Yes | Yes | `src/pages/LandingPage.tsx` |
| 3 | Landing | Mobile menu open | `landing` | No | Yes | Yes | `src/pages/LandingPage.tsx` |
| 4 | Setup | Default, no file | `setup` | Yes | Yes | Yes | `src/pages/SetupPage.tsx` |
| 5 | Setup | Drag-over upload | `setup` | Yes | Optional | Yes | `src/pages/SetupPage.tsx` |
| 6 | Setup | Uploaded file, continue enabled | `setup` | Yes | Yes | Yes | `src/pages/SetupPage.tsx` |
| 7 | Interview | Video question idle | `interview` | Yes | Yes | Yes | `src/pages/InterviewPage.tsx` |
| 8 | Interview | Video recording | `interview` | Yes | Yes | Yes | `src/pages/InterviewPage.tsx` |
| 9 | Interview | Text question | `interview` | Yes | Yes | Yes | `src/pages/InterviewPage.tsx` |
| 10 | Interview | Code question | `interview` | Yes | Yes | Yes | `src/pages/InterviewPage.tsx`, `CodeEditor.tsx` |
| 11 | Interview | Auto-fill modal | `interview` | Yes | Optional because trigger hidden on mobile | Yes | `src/pages/InterviewPage.tsx` |
| 12 | Interview | Auto-fill active | `interview` | Yes | Optional | Yes | `src/pages/InterviewPage.tsx` |
| 13 | Results | Results default | `results` | Yes | Yes | Yes | `src/pages/ResultsPage.tsx` |
| 14 | Results | Accordion all collapsed | `results` | Yes | Optional | Yes | `src/pages/ResultsPage.tsx` |
| 15 | Dashboard | Student journey | `dashboard` | Yes | Yes | Yes | `src/pages/StudentDashboardPage.tsx` |
| 16 | Admin | Dashboard default | `admin` | Yes | Yes | Yes | `src/pages/AdminPage.tsx` |
| 17 | Admin | Empty filtered state | `admin` | Yes | Yes | Yes | `src/pages/AdminPage.tsx` |
| 18 | Admin | Bulk selected state | `admin` | Yes | Yes | Yes | `src/pages/AdminPage.tsx` |
| 19 | Placement | Flow summary section | `placement-flow` | Yes | Yes | Yes | `PlacementInterviewSummary.tsx` |
| 20 | Placement | Analysis loading | `placement-flow` | Yes | Yes | Yes | `PlacementAnalysisSection.tsx` |
| 21 | Placement | Analysis results | `placement-flow` | Yes | Yes | Yes | `PlacementAnalysisSection.tsx` |
| 22 | Placement | Learning material | `placement-flow` | Yes | Yes | Yes | `PlacementLearningSection.tsx` |
| 23 | Placement | Readiness report | `placement-flow` | Yes | Yes | Yes | `PlacementReportSection.tsx` |

## 24. Figma Intern Execution Checklist

Phase 1 - Foundations:

- [ ] Create color styles from confirmed tokens.
- [ ] Create semantic color aliases for passed/review/failed, critical/high/medium, strong, dark surfaces.
- [ ] Create typography styles using Outfit and JetBrains Mono.
- [ ] Create spacing variables for 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 80.
- [ ] Create radius variables R6, R8, R12, R16, R24, Full.
- [ ] Create shadow styles matching Tailwind approximations.
- [ ] Create animation notes page for owl, fade-up, bar/ring, record pulse.

Phase 2 - Components:

- [ ] Build OwlAvatar as vector or high-fidelity traced component with four state notes.
- [ ] Build LanguageToggle light/dark with EN/HI active states.
- [ ] Build demo page switcher.
- [ ] Build button variants and sizes.
- [ ] Build input/search/textarea/code editor components.
- [ ] Build file dropzone default/drag/uploaded states.
- [ ] Build badges and status pills.
- [ ] Build cards for light, dark, glass, KPI, feature, profile, table shell.
- [ ] Build progress bars, score rings, histogram bars.
- [ ] Build timeline component.
- [ ] Build accordion row.
- [ ] Build modal component.
- [ ] Build table header, row, footer, empty state.

Phase 3 - Screens:

- [ ] Recreate Landing desktop.
- [ ] Recreate Landing mobile and mobile menu.
- [ ] Recreate Setup default, selected, uploaded, disabled/enabled continue.
- [ ] Recreate Interview video idle and recording.
- [ ] Recreate Interview text and code variants.
- [ ] Recreate Interview auto-fill modal and active state.
- [ ] Recreate Results default and accordion variants.
- [ ] Recreate Student Dashboard.
- [ ] Recreate Admin default, empty, and bulk-selected states.
- [ ] Recreate Placement flow sections and loading/results variants.

Phase 4 - Responsive:

- [ ] Build 390 mobile versions for Landing, Setup, Interview, Results, Dashboard, Admin, Placement.
- [ ] Validate 768 tablet behavior for setup cards and landing nav.
- [ ] Validate 1280 laptop and 1440 desktop.
- [ ] Show admin table horizontal scroll/min-width behavior in mobile annotation.

Phase 5 - Prototype:

- [ ] Connect main candidate flow.
- [ ] Connect admin flow.
- [ ] Connect auto-fill demo flow.
- [ ] Connect placement learn-topic scroll/anchor as frame transitions.
- [ ] Connect accordion and filter state examples.

Phase 6 - Visual QA:

- [ ] Compare all spacing against Tailwind values in this spec.
- [ ] Compare all major colors and dark surfaces.
- [ ] Check typography sizes and weights.
- [ ] Check button hover/disabled states.
- [ ] Check table density and hidden columns.
- [ ] Check mobile menu and hidden desktop controls.
- [ ] Mark future recommendations separately from confirmed UI.

## 25. Visual QA Checklist

- [ ] Landing nav height is 64px and fixed.
- [ ] Landing desktop nav links hide below `md`.
- [ ] Landing H1 uses 48/60/72px responsive sizing.
- [ ] Landing glass signal cards are hidden below `lg`.
- [ ] Setup content max width is 896px.
- [ ] Setup company grid is 1/2/3 columns by mobile/`sm`/`lg`.
- [ ] Setup continue is disabled until CV is uploaded.
- [ ] Interview dark background uses gray-950.
- [ ] Interview content max width is 896px.
- [ ] Interview video area is 16:9 and max 480px high.
- [ ] Interview session timer/auto-fill/placement buttons hide below `sm`.
- [ ] Code editor body is 220px high with gutter.
- [ ] Results score card overlaps header by 80px.
- [ ] Results accordion first row is expanded by default.
- [ ] Dashboard timeline scrolls horizontally if cramped.
- [ ] Admin table min width is 700px with horizontal overflow.
- [ ] Admin communication/technical columns hide below `md`.
- [ ] Admin empty state uses thinking owl and clear filters action.
- [ ] Placement header is sticky.
- [ ] Placement sections use max 896px and 64/80px gaps.
- [ ] Placement analysis loading spinner exists for first 1000ms.
- [ ] All non-functional controls are annotated as placeholders.

