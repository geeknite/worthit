# Is It Worth Finishing?

A rational decision tool for gamers with large backlogs and limited time.

🌐 **Live Site:** [worthit.geeknite.com](https://worthit.geeknite.com)

---

## Overview

**Is It Worth Finishing?** helps gamers make rational decisions about whether to finish, pause, or abandon a game they're currently playing. It's a simple, frontend-only utility with no accounts, no databases, and no tracking.

---

## Features

- ✅ **Instant calculation** - No page reloads
- 📱 **Mobile-friendly** - Responsive design
- 🎯 **Deterministic logic** - Same inputs = same output
- 📊 **Score breakdown** - See exactly how the decision was made
- 🔒 **Privacy-first** - The tool stores nothing: no accounts, no database, no analytics. The ads are Google's and set their own cookies, which is what `privacy.html` is for
- 💰 **Ad-ready** - Space for one unobtrusive ad placement, and no unit in it yet (see Advertisements)

---

## Decision Algorithm

### Input Variables

| Variable           | Type     | Range  | Description                |
| ------------------ | -------- | ------ | -------------------------- |
| Hours Played       | Number   | 0+     | Time already invested      |
| Hours Remaining    | Number   | 0+     | Estimated time to complete |
| Enjoyment          | Slider   | 1-10   | Current enjoyment level    |
| Backlog Pressure   | Slider   | 1-10   | Size of waiting games list |
| Completionist Mode | Checkbox | On/Off | Tendency to finish games   |

### Algorithm Breakdown

```
FINAL SCORE = Base Score + Modifiers (clamped 0-100)

1. BASE SCORE
   = Enjoyment × 10
   Range: 10-100 points

2. TIME INVESTMENT MODIFIER
   = (Investment Ratio - 0.5) × 20
   Where: Investment Ratio = Hours Played / Total Hours
   Range: -10 to +10 points
   Effect: Bonus if past halfway, penalty if early

3. REMAINING TIME PENALTY (conditional)
   Applies when: Hours Remaining > 20 AND Enjoyment < 6
   = -(Hours Factor × Enjoyment Factor × 15)
   Range: 0 to -15 points
   Effect: Penalizes long games with low enjoyment

4. BACKLOG PRESSURE PENALTY
   = -((Backlog - 1) / 9) × 25
   Range: 0 to -25 points
   Effect: Higher backlog = more pressure to abandon

5. COMPLETIONIST BONUS (conditional)
   Applies when: Completionist Mode = ON
   = +15 points
   Effect: Increases tendency to finish
```

### Decision Thresholds

| Score Range | Recommendation | Meaning                     |
| ----------- | -------------- | --------------------------- |
| **65-100**  | ✅ FINISH      | Worth completing            |
| **35-64**   | ⏸️ PAUSE       | Take a break, revisit later |
| **0-34**    | 🚪 ABANDON     | Move on without guilt       |

### Example Calculations

**Example 1: Highly Enjoyable, Almost Done**

- Hours Played: 30, Remaining: 5, Enjoyment: 9, Backlog: 4, Completionist: Off
- Base: 90, Time: +7, Backlog: -8
- **Final: 89 → FINISH**

**Example 2: Low Enjoyment, Long Way To Go**

- Hours Played: 3, Remaining: 40, Enjoyment: 3, Backlog: 8, Completionist: Off
- Base: 30, Time: -9, Remaining: -11, Backlog: -19
- **Final: 0 → ABANDON**

**Example 3: Medium Everything**

- Hours Played: 15, Remaining: 15, Enjoyment: 5, Backlog: 5, Completionist: Off
- Base: 50, Time: 0, Backlog: -11
- **Final: 39 → PAUSE**

---

## Project Structure

```
is-it-worth-finishing/
├── index.html      # Main HTML with SEO meta tags
├── styles.css      # Responsive CSS with dark theme
├── app.js          # Decision logic and interactivity
└── README.md       # This file
```

---

## Deployment

### Option 1: GitHub Pages (Free)

1. Push to GitHub repository
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose `main` branch, `/ (root)` folder
5. Set custom domain to `worthit.geeknite.com`

### Option 2: Netlify (Free)

1. Connect GitHub repository to Netlify
2. Build command: (leave empty)
3. Publish directory: `/`
4. Add custom domain in Site Settings

### Option 3: Cloudflare Pages (Free)

1. Connect GitHub repository
2. Framework preset: None
3. Build command: (leave empty)
4. Build output directory: `/`
5. Add custom domain via Cloudflare DNS

### Option 4: Vercel (Free)

1. Import GitHub repository
2. Framework: Other
3. Build & Output Settings: Default
4. Add custom domain in Project Settings

### DNS Configuration

Add these records for `worthit.geeknite.com`:

```
Type: CNAME
Name: worthit
Value: [hosting-provider-url]
TTL: Auto
```

---

## SEO Information

### Recommended Title

```
Is It Worth Finishing? | Game Backlog Decision Tool
```

### Meta Description

```
Should you finish that game or move on? A rational decision tool for gamers with limited time and growing backlogs. No opinions, just logic.
```

### Keywords

```
game backlog, finish game, abandon game, gaming decision, backlog management, gaming time, should I finish, game completion
```

---

## Advertisements

AdSense is already loaded, and **not the way this section used to describe**. It
told you to paste a raw `<ins>` with your own `data-ad-client` into
`.ad-placeholder`; doing that today would hardcode a second publisher id next to
the one the shared loader already sets, and the `ca-pub-XXXXXXXXXX` placeholder
made it look like this site had no publisher at all.

What actually happens is one line in `index.html`:

```html
<link rel="preconnect" href="https://blog.geeknite.com" />
<script async src="https://blog.geeknite.com/assets/js/gn-ads.js?v=1"></script>
```

`gn-ads.js` is shared by nine GeekNite sites. It reads the `gn_member` cookie
that `blog.geeknite.com` sets after a Patreon login, scoped to `.geeknite.com`;
an active patron gets no AdSense script at all (hiding units that have already
loaded is against AdSense policy), and everyone else gets the loader with the
publisher id baked in. So there is nothing per-site to configure, and nothing
here to paste a client id into.

**What is missing is the unit.** Measured 2026-09-18: `.ad-placeholder` contains
a label and an HTML comment, and there is not one `<ins class="adsbygoogle">` in
this repo — nor in `subs`, `heat-solo` or `Peloton-Tactics`. Loading
`adsbygoogle.js` without a unit renders nothing unless Auto ads are switched on
for the site in the AdSense console, which is an account-level setting and not
visible from here. The placeholder is therefore a hole, and it is left looking
like one on purpose rather than filled with a fake slot id.

To close it, create a display unit for `worthit.geeknite.com` in the AdSense
console and put its **numeric** slot id in:

```html
<!-- inside .ad-placeholder -->
<ins
  class="adsbygoogle"
  style="display:block"
  data-ad-client="ca-pub-2992269112655291"
  data-ad-slot="0000000000"
  data-ad-format="auto"
  data-full-width-responsive="true"
></ins>
<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

`data-ad-slot` has to be the id the console gives you. `"auto"` is a *format*,
not a slot: a unit with `data-ad-slot="auto"` can never be paid, which is
exactly the state three of the Astro sites in this ecosystem were in.

---

## Analytics

**There is none, and adding some is not a one-line change.** This section used
to say "the code includes a placeholder for Google Analytics" and then gave a
`gtag` snippet to paste. There is no such placeholder: `index.html` loads no
`googletagmanager.com` script and defines no `dataLayer`.

That absence is a statement the site makes elsewhere. `privacy.html` lists the
third-party cookies this site sets and the only ones on it are Google's
advertising cookies; the tool's own answers never leave the browser. Adding
Analytics means adding a cookie the privacy page says is not there, so it is an
edit to two files and a claim to a visitor, not a snippet.

---

## Anti-Copy Protection

The app includes several protection measures:

- Right-click context menu disabled
- Common keyboard shortcuts blocked (Ctrl+U, Ctrl+S, F12)
- Text selection disabled on body
- Drag and drop prevention
- Console warning message
- Integrity check for domain verification

**Note:** These are deterrents, not foolproof protection. Determined users can still access the source code.

---

## Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## License

[![CC BY-NC 4.0](https://licensebuttons.net/l/by-nc/4.0/88x31.png)](https://creativecommons.org/licenses/by-nc/4.0/)

This work is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).

© 2026 worthit.geeknite.com

**You are free to:**

- Share — copy and redistribute the material
- Adapt — remix, transform, and build upon the material

**Under the following terms:**

- **Attribution** — You must give appropriate credit
- **NonCommercial** — You may not use the material for commercial purposes

---

## Changelog

### v1.0.0 (2026-01-17)

- Initial release
- Core decision algorithm
- Responsive design
- SEO optimization
- Ad placement ready
- Anti-copy protection
