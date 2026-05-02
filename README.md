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
│   ├── popup.html      # Optional: quick access to knowledge base
│   └── icons/
├── knowledge-base/
│   └── alerts.json     # The hand-maintained list of known alerts + fixes
└── README.md
```

### Knowledge base format (`alerts.json`)

```json
[
  {
    "id": "unique-alert-id",
    "match": "substring or pattern found in the alert description",
    "title": "Human-readable name for this alert type",
    "hint": "Short description of what this is and what to check first",
    "wiki": "https://internal-wiki/link-to-full-guide",
    "sql": "SELECT * FROM errors WHERE ... -- optional, ready to copy"
  }
]
```

Matching is done by checking whether the alert description **contains** the `match` string (case-insensitive). If multiple entries match, all are shown. Unknown alerts are visually flagged for escalation.

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

- [ ] Document the `alerts.json` format clearly with examples
- [ ] Add validation script to catch malformed entries before deploying
- [ ] Establish a lightweight process for adding new entries (PR or direct edit)
- [ ] Seed the knowledge base with the ~25 known alert types

**Definition of done:** A non-developer team member can add a new alert entry by editing one JSON file.

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

## Getting Started (development)

1. Clone the repo
2. Open `chrome://extensions` in Chrome or Brave
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `extension/` folder
5. Navigate to the alerts page — BatchMan is active

To update after editing files, click the refresh icon on the extension card in `chrome://extensions`.
