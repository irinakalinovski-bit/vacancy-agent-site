# Design Exploration — Tailored Job Opportunities

## Three directions considered

### 1. Field Notes Atlas

**Very Brief Intro:** An editorial research desk translated into an interactive job atlas. Warm paper, ink-blue navigation, and map-like metadata make the evidence feel deliberate and legible.

**Probability:** 0.037

### 2. Signal Console

**Very Brief Intro:** A quiet technical-monitoring interface where vacancies read as verified signals rather than generic cards. Fine grids, disciplined typography, and status codes emphasize relevance and recency.

**Probability:** 0.071

### 3. Indigo Hiring Journal

**Very Brief Intro:** A magazine-style dossier with strong type, deep indigo surfaces, and oversized narrative numbers. It makes career research feel personal and considered rather than transactional.

**Probability:** 0.052

---

## Chosen approach: Field Notes Atlas

### Design Movement

Contemporary **editorial cartography**: part European field guide, part specialist research dossier. The page behaves like a calibrated document that can be explored, filtered, and acted on.

### Core Principles

1. **Evidence before decoration:** visible verification, source paths, freshness, and caveats are first-class UI elements.
2. **Asymmetric orientation:** a stable vertical rail anchors the role geography and scoring logic while the findings take the wider reading field.
3. **Calm density:** small rules, subtle paper texture, and carefully weighted type accommodate many technical facts without turning into a spreadsheet.
4. **Actionable clarity:** every strong match ends with a direct source action and an honest note about the one thing to verify.

### Color Philosophy

The base is **warm field paper** rather than sterile white, to make research feel human and reviewed. **Graphite ink** carries long-form information. **Atlas navy** anchors navigation and credibility. A single **oxidized teal** signals positive technical fit, while **copper red** flags conditions that require confirmation. No gradients are used; contrast comes from material-like color blocks and density.

### Layout Paradigm

The desktop report uses a **fixed left field rail** with search, geographic filters, legend, and candidate-stack summary. The right canvas is an editorial reading sequence: annotated hero, an evidence strip, a horizontally scrollable fit topology, then filterable role dossiers. On mobile, the rail becomes an openable compass panel and the reading flow stays linear.

### Signature Elements

1. **Match telemetry bands:** narrow stacked bars that express the five real alignment dimensions per role.
2. **Coordinate labels:** compact `PL / REMOTE / 01` and `GLOBAL / 07` locators on cards and headings.
3. **Field stamps:** outlined labels such as `VERIFIED`, `FRESH`, `CONFIRM ELIGIBILITY`, and `B2B` that make uncertainty visible.

### Interaction Philosophy

Filtering is a research instrument, not a visual trick. A visitor can narrow by region, work model, direct technology cluster, and confidence state; the score display and role count respond immediately. Save/share behavior is supported by a copyable filtered view and browser-native printing.

### Animation

Animations are restrained and information-led. Filter changes use 180ms opacity/transform transitions with a snappy ease-out. Telemetry bands ease from a shortened width on first view only. Card hovers shift 2px and deepen the paper shadow, while buttons use a 0.97 active scale. Motion is disabled under `prefers-reduced-motion`.

### Typography System

**Fraunces** is used for research conclusions and high-impact numerical evidence; its editorial texture differentiates the report from a generic dashboard. **DM Sans** delivers readable interface text, and **IBM Plex Mono** handles codes, tech tags, timestamps, and ratios. Headlines have short, decisive phrasing; body copy uses a generous line-height and maximum measure.

### Brand Essence

**A calibrated opportunity atlas for experienced cloud-native builders who want to spend their application effort where the stack genuinely fits.**

Personality: **exact, composed, candid**.

### Brand Voice

Headlines read like research findings; CTAs are direct and specific. Microcopy names uncertainty instead of smoothing it away. Avoid generic recruitment language.

Example lines: “Nine roles cleared the stack screen.”

Example lines: “Open the source before you spend the application effort.”

### Wordmark & Logo

The mark is an **offset coordinate frame**: three nested, open-corner rectangles crossed by a decisive north-east trajectory. It suggests finding the correct opportunity intersection without using literal job-search imagery. The wordmark pairs the atlas mark with a compact mono locator style.

### Signature Brand Color

**Atlas Teal — #167B79.** A blue-green that feels technical, geographically referential, and reserved enough for evidence marking.

## Style Decisions

- Use no gradients, glassmorphism, or default “dashboard cards.”
- Use sharply squared or lightly rounded 6px corners only; rules and labels do most of the grouping work.
- Never show a “match score” without its individual evidence dimensions and a caveat.
- Treat user-excluded companies and Java/Angular/Python-led role exclusions as explicit audit findings, not silently omitted results.
