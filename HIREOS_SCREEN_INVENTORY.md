# HIREOS SCREEN INVENTORY

Source audit date: 2026-09-03

Important implementation note: HireOS currently has no browser routes. All screens are logical `Page` state values in `src/App.tsx`, and the browser path remains `/`.

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
| 10 | Interview | Code question | `interview` | Yes | Yes | Yes | `src/pages/InterviewPage.tsx`, `src/components/CodeEditor.tsx` |
| 11 | Interview | Auto-fill confirmation modal | `interview` | Yes | Optional | Yes | `src/pages/InterviewPage.tsx` |
| 12 | Interview | Auto-fill active state | `interview` | Yes | Optional | Yes | `src/pages/InterviewPage.tsx` |
| 13 | Results | Results default | `results` | Yes | Yes | Yes | `src/pages/ResultsPage.tsx` |
| 14 | Results | Accordion collapsed/alternate expanded row | `results` | Yes | Optional | Yes | `src/pages/ResultsPage.tsx` |
| 15 | Student Dashboard | Journey dashboard | `dashboard` | Yes | Yes | Yes | `src/pages/StudentDashboardPage.tsx` |
| 16 | Admin | Dashboard default | `admin` | Yes | Yes | Yes | `src/pages/AdminPage.tsx` |
| 17 | Admin | Empty filtered state | `admin` | Yes | Yes | Yes | `src/pages/AdminPage.tsx` |
| 18 | Admin | Bulk selected state | `admin` | Yes | Yes | Yes | `src/pages/AdminPage.tsx` |
| 19 | Placement | Sticky header | `placement-flow` | Yes | Yes | Yes | `src/pages/PlacementFlowPage.tsx` |
| 20 | Placement | Interview summary | `placement-flow` | Yes | Yes | Yes | `src/components/PlacementInterviewSummary.tsx` |
| 21 | Placement | Analysis loading | `placement-flow` | Yes | Yes | Yes | `src/components/PlacementAnalysisSection.tsx` |
| 22 | Placement | Analysis results | `placement-flow` | Yes | Yes | Yes | `src/components/PlacementAnalysisSection.tsx` |
| 23 | Placement | Learning material | `placement-flow` | Yes | Yes | Yes | `src/components/PlacementLearningSection.tsx` |
| 24 | Placement | Readiness report | `placement-flow` | Yes | Yes | Yes | `src/components/PlacementReportSection.tsx` |

Screens not present in the repository:

| Requested product area | Status |
|---|---|
| Login / forgot password / auth | Not implemented. |
| Candidate profile detail | Not implemented. |
| Job list/detail/create/edit | Not implemented. |
| Interview calendar/scheduling flow | Only placeholder buttons exist. |
| Settings/profile/team/integrations | Not implemented. |
| Persistent sidebar | Not implemented. |

