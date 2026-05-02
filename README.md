# BatchMan

> Like Batman, but for batch errors. Watches the alerts so you don't have to remember everything.

A browser extension that overlays fix hints directly onto your internal alert monitoring page. When a developer opens the alerts page, BatchMan automatically matches each alert description against a knowledge base of known issues and surfaces the relevant wiki link, debugging hint, and/or a ready-to-copy SQL snippet — without changing the existing workflow.

## Goals

- Save time for developers who monitor alerts daily
- Reduce human error from mis-remembering cleanup steps
- Keep maintenance burden lower than the time it saves

## Architecture

```
BatchMan/
├── extension/          # Browser extension (Chrome/Brave, MV3)
│   ├── manifest.json
│   ├── content.js      # Reads the DOM, injects hint overlays
│   ├── options.html/js # Settings UI (URL pattern + CSS selectors)
│   ├── popup.html/js   # Toolbar popup
│   ├── style.css
│   └── icons/
├── knowledge-base/
│   └── alerts.json     # Source of truth — edit this, then run npm run build
├── scripts/
│   ├── validate.js     # Validates alerts.json (run standalone or via build)
│   └── build.js        # Validates + copies alerts.json into extension/
└── package.json
```

`extension/alerts.json` is a **build artifact** — never edit it directly. Edit `knowledge-base/alerts.json` and run `npm run build`.

### Knowledge base format (`knowledge-base/alerts.json`)

```json
[
  {
    "id": "unique-alert-id",
    "match": "substring found in the alert description (case-insensitive)",
    "title": "Human-readable name for this alert type",
    "hint": "Short description of what this is and what to check first",
    "wiki": "https://internal-wiki/link-to-full-guide",
    "sql": "SELECT * FROM errors WHERE ... -- optional, ready to copy"
  }
]
```

| Field   | Required | Type            | Notes |
|---------|----------|-----------------|-------|
| `id`    | Yes      | string          | Unique identifier, no spaces |
| `match` | Yes      | string          | Substring to look for in the alert description |
| `title` | Yes      | string          | Shown in the hint panel header |
| `hint`  | Yes      | string          | One or two sentences — what it is and what to do first |
| `wiki`  | No       | string or null  | Link to the full wiki guide |
| `sql`   | No       | string or null  | Ready-to-copy SQL for the common cleanup |

Matching is case-insensitive substring search. If multiple entries match a single alert, all are shown. Unknown alerts are flagged visually for escalation.

---

## Phases

### Phase 1 — Chrome/Brave Extension (MVP)

**Goal:** A working extension that overlays hints on the alerts page.

- [ ] Set up Chrome Manifest V3 extension scaffold
- [ ] Write `content.js` to read alert descriptions from the DOM
- [ ] Implement match logic against `alerts.json`
- [ ] Inject a simple, unobtrusive hint panel next to each matched alert
- [ ] Visually flag unmatched alerts as "unknown — escalate"
- [ ] Load `alerts.json` as a bundled extension asset
- [ ] Manual install instructions for Chrome/Brave (load unpacked)

**Definition of done:** A developer loads the alerts page and sees hints inline, with zero new tabs or tools needed.

---

### Phase 2 — Knowledge Base Tooling

**Goal:** Make it easy for the team to add/edit/remove alert entries without touching extension code.

- [x] Separate knowledge base from extension code (`knowledge-base/alerts.json`)
- [x] Validate script — catches missing fields, duplicate IDs, duplicate match strings
- [x] Build script — validates then copies into extension, prints reload reminder
- [x] `.gitignore` — `extension/alerts.json` is a build artifact, not committed
- [ ] Seed the knowledge base with the ~25 known alert types

**Definition of done:** A developer edits one JSON file, runs one command, and reloads the extension.

---

### Phase 3 — Quality of Life Improvements

**Goal:** Reduce friction further based on real usage feedback.

- [ ] Copy-to-clipboard button for SQL snippets
- [ ] Collapsible hint panels (to avoid visual clutter on busy days)
- [ ] Keyboard shortcut to toggle all hints on/off
- [ ] Extension popup showing a summary of today's alerts and match rate
- [ ] "Suggest a fix" button for unknown alerts (pre-fills an email/form to the team)

---

### Phase 4 — Firefox Support

**Goal:** Support Firefox (used by part of the team).

- [ ] Audit Manifest V3 differences between Chrome and Firefox
- [ ] Adapt `manifest.json` and any Chrome-specific APIs
- [ ] Test and package for Firefox (`.xpi`)
- [ ] Unified build script that produces both Chrome and Firefox packages

---

## Browser Compatibility

| Browser | Status         | Notes                                      |
|---------|----------------|--------------------------------------------|
| Chrome  | Phase 1        | Primary target                             |
| Brave   | Phase 1        | Chromium-based — Chrome extension works as-is |
| Firefox | Phase 4        | Requires minor MV3 adaptation              |

---

## Getting Started

### First-time setup
```bash
git clone <repo-url>
cd BatchMan
npm run build          # validates + copies knowledge base into extension/
```

Then in Chrome or Brave:
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `extension/` folder
4. Click the BatchMan icon in the toolbar → **Settings**
5. Enter your alerts page URL pattern and the CSS selectors for alert rows

### After a knowledge base update (`git pull`)
```bash
npm run build
# Then click ↺ on the BatchMan card in chrome://extensions
```

### Adding or editing an alert entry
1. Edit `knowledge-base/alerts.json`
2. Run `npm run validate` to check for errors
3. Run `npm run build` to apply it to the extension
4. Commit and push so the team can pull the update

### Useful commands
| Command              | What it does |
|----------------------|--------------|
| `npm run validate`   | Check `knowledge-base/alerts.json` for errors and warnings |
| `npm run build`      | Validate + copy into `extension/alerts.json` |
