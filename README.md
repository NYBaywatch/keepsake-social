# Keepsake Social

Export your own saved posts from **LinkedIn** and **Instagram** to JSON, CSV, or Markdown — entirely locally in your browser. No servers, no accounts, nothing leaves your machine.

Platforms give you no good way out: LinkedIn's official data export is bare URLs with no post content, and Instagram's buries saves in a request-and-wait archive. Keepsake captures the actual content of everything you've saved, in one click.

## Install (load unpacked)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.

## Use

1. Open your saved items page while logged in:
   - LinkedIn: `linkedin.com/my-items/saved-posts/`
   - Instagram: `instagram.com/<your-username>/saved/all-posts/`
2. Click the Keepsake icon in the toolbar and pick a format.
3. The page auto-scrolls until the whole list has loaded, then the file downloads.

Exported fields:

| platform | fields |
|---|---|
| LinkedIn | `url`, `author`, `authorUrl`, `text` (full visible card text) |
| Instagram | `url`, `caption` (full caption from the grid), `image` (thumbnail URL) |

## How it works

No build step — a shared core plus one small collector per platform:

- `common.js` — scroll-and-accumulate loop, serializers, download, popup messaging
- `linkedin.js` / `instagram.js` — platform collectors
- `popup.html` / `popup.js` — the toolbar UI

Design notes that keep it robust:

- **Cards are identified by permalink URLs** (`/feed/update/`, `/p/`, `/reel/`, …), not the platforms' obfuscated CSS class names, so redesigns are less likely to break extraction.
- **Collection happens on every scroll pass**, not once at the end — Instagram virtualizes its grid and unmounts off-screen tiles, so late collection would silently drop items.
- Instagram's saved grid stores each post's full caption in the thumbnail `alt` text, so no per-post navigation is needed.

If an export ever comes back empty after a redesign, the collectors (`liCollectPass` / `igCollectPass`) are the place to adjust.

## Notes

- For personal use on your own account at human pace. Both platforms' terms frown on automated collection generally — don't run this in a loop all day.
- Not affiliated with or endorsed by LinkedIn or Instagram/Meta.

## License

MIT
