# BatchMan

> Like Batman, but for batch errors. Watches the alerts so you don't have to remember everything.

BatchMan is a browser extension that overlays fix hints directly onto your internal alert monitoring page. When you open the alerts page, it automatically matches each alert description against a knowledge base of known issues and surfaces the relevant wiki link, debugging hint, and a ready-to-copy SQL snippet — without changing your existing workflow.

---

## Requirements

- Node.js 16 or later (for the build script)
- Chrome or Brave (Firefox: planned for Phase 4)
- Git (to share knowledge base updates with the team)

---

## Installation

### 1. Clone the repo and build

```bash
git clone <repo-url>
cd BatchMan
npm run build
```

This validates `knowledge-base/alerts.json` and copies it into the extension folder.

### 2. Load the extension in Chrome or Brave

1. Open `chrome://extensions` in your browser
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder inside this repo
5. The BatchMan icon appears in your toolbar

### 3. Configure the extension

BatchMan needs to know which page to scan and how alert rows are structured in the DOM. You only need to do this once.

1. Click the BatchMan icon in the toolbar
2. Click **Settings**
3. Fill in the three fields:

| Field | What to enter | Example |
|---|---|---|
| **Alerts page URL pattern** | The URL of your alerts page with `*` as wildcard | `*://intranet.company.com/alerts*` |
| **Alert row selector** | CSS selector for each alert row | `.alert-item` |
| **Description selector** | CSS selector for the description text *within* a row (optional — leave empty to use the full row text) | `.alert-description` |

4. Click **Save settings**
5. Open (or reload) the alerts page — BatchMan is now active

#### How to find your CSS selectors

If you are not sure what selectors to use:

1. Open the alerts page and press `F12` to open DevTools
2. Click the **element picker** icon (top-left of the DevTools panel)
3. Click on an alert row in the page
4. The matching element is highlighted in the DevTools HTML panel
5. Right-click it → **Copy → Copy selector**
6. Paste it into the BatchMan settings and simplify if needed
   (remove `:nth-child(...)` parts to make it match all rows, not just one)

---

## Day-to-day usage

BatchMan works silently in the background. Open your alerts page as normal — hint panels appear automatically below each alert row.

| What you see | What it means |
|---|---|
| Blue **✓ Known** badge | BatchMan found a match in the knowledge base |
| Orange **⚠ Unknown — escalate** badge | No match found — raise this internally |

For known alerts the panel shows:
- A short **hint** describing what the issue is and what to check first
- A **wiki link** to the full guide (if one exists)
- A **Copy SQL** button for common cleanup queries (if one exists)

---

## Managing the knowledge base

The knowledge base lives in `knowledge-base/alerts.json`. This is the only file you need to edit when adding or updating fixes.

### Adding or editing an entry

1. Open `knowledge-base/alerts.json`
2. Add or edit an entry following the format below
3. Run `npm run validate` to catch any mistakes
4. Run `npm run build` to apply the change to the extension
5. Reload the extension in `chrome://extensions` (click the ↺ icon on the BatchMan card)
6. Commit and push so the rest of the team can pull the update

### Entry format

```json
[
  {
    "id": "unique-alert-id",
    "match": "substring found in the alert description (case-insensitive)",
    "title": "Human-readable name for this alert type",
    "hint": "One or two sentences — what it is and what to do first.",
    "wiki": "https://internal-wiki/link-to-full-guide",
    "sql": "SELECT * FROM errors WHERE ... -- ready to copy and run"
  }
]
```

| Field | Required | Type | Notes |
|---|---|---|---|
| `id` | Yes | string | Unique identifier — no spaces, use hyphens |
| `match` | Yes | string | Substring to look for in the alert description |
| `title` | Yes | string | Shown in the hint panel header |
| `hint` | Yes | string | What to do first — keep it short |
| `wiki` | No | string or null | Full wiki guide URL |
| `sql` | No | string or null | Ready-to-copy SQL snippet |

Matching is **case-insensitive substring search**. If multiple entries match a single alert, all hints are shown stacked.

### Pulling a team update

When a colleague pushes a knowledge base change:

```bash
git pull
npm run build
# Click ↺ on BatchMan in chrome://extensions
```

### Useful commands

| Command | What it does |
|---|---|
| `npm run validate` | Checks `knowledge-base/alerts.json` for errors and warnings |
| `npm run build` | Validates, then copies into `extension/alerts.json` |

---

## Architecture

```
BatchMan/
├── extension/            # Browser extension (Chrome/Brave, Manifest V3)
│   ├── manifest.json
│   ├── content.js        # Reads DOM, matches alerts, injects hint panels
│   ├── options.html/js   # Settings UI (URL pattern + CSS selectors)
│   ├── popup.html/js     # Toolbar popup (entry count + settings link)
│   ├── style.css
│   └── icons/
├── knowledge-base/
│   └── alerts.json       # Source of truth — edit here, never in extension/
├── scripts/
│   ├── validate.js       # Validates alerts.json
│   └── build.js          # Validates + copies into extension/
└── package.json
```

`extension/alerts.json` is a build artifact and is not committed to git. Always edit `knowledge-base/alerts.json` and run `npm run build`.

---

## Roadmap

### Phase 1 — Chrome/Brave Extension (done)

- [x] Chrome Manifest V3 extension scaffold
- [x] DOM scraping with configurable CSS selectors
- [x] Case-insensitive substring matching against knowledge base
- [x] Hint panels injected inline per alert (wiki link, hint, copy-SQL button)
- [x] Unknown alerts flagged visually for escalation
- [x] URL pattern and selectors configurable via settings UI (no code changes needed)
- [x] MutationObserver for dynamically loaded alert rows

### Phase 2 — Knowledge Base Tooling (done)

- [x] Knowledge base separated from extension code
- [x] Validation script — catches missing fields, duplicate IDs, duplicate match strings
- [x] Build script — validates then copies into extension, prints reload reminder
- [x] Team update workflow documented
- [ ] Seed with the ~25 known alert types

### Phase 3 — Quality of Life Improvements

- [ ] Collapsible hint panels (reduce visual clutter on busy days)
- [ ] Keyboard shortcut to toggle all hints on/off
- [ ] Popup summary of matched vs unknown alerts on the current page
- [ ] "Suggest a fix" flow for unknown alerts

### Phase 4 — Firefox Support

- [ ] Audit Manifest V3 differences between Chrome and Firefox
- [ ] Adapt manifest and any Chrome-specific APIs
- [ ] Package for Firefox (`.xpi`)
- [ ] Unified build producing both Chrome and Firefox packages

---

## Browser compatibility

| Browser | Status | Notes |
|---|---|---|
| Chrome | Done | Primary target |
| Brave | Done | Chromium-based — Chrome extension works as-is |
| Firefox | Phase 4 | Requires minor MV3 adaptation |
