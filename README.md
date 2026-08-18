# Keepsake for LinkedIn

Export your own LinkedIn saved posts to JSON, CSV, or Markdown — entirely locally in your browser. No servers, no accounts, nothing leaves your machine.

LinkedIn's official data export gives you bare URLs with no post content, and those links rot as posts get deleted. Keepsake captures the actual content of everything you've saved, in one click.

## Install (load unpacked)

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.

## Use

1. Go to <https://www.linkedin.com/my-items/saved-posts/> while logged in.
2. Click the Keepsake icon in the toolbar.
3. Pick a format. The page auto-scrolls until the whole list has loaded (~1.5s per batch), then the file downloads.

Each saved post exports as:

| field | contents |
|---|---|
| `url` | post permalink |
| `author` / `authorUrl` | who posted it, with profile/company link |
| `text` | the card's full visible text |

## How it works

Three small files, no build step:

- `content.js` — injected only on `linkedin.com/my-items/*`; auto-scrolls, scrapes, serializes, downloads
- `popup.html` / `popup.js` — the toolbar UI; talks to the content script via Chrome message passing

Post cards are identified by their **permalink URLs** (`/feed/update/`, `/posts/`, `/pulse/`) rather than LinkedIn's obfuscated CSS class names, so redesigns are less likely to break extraction. If an export ever comes back empty, the heuristics to adjust are `findCards()` and `extractCard()` in `content.js`.

## Notes

- For personal use on your own account at human pace. LinkedIn's User Agreement frowns on automated collection generally — don't run this in a loop all day.
- Not affiliated with or endorsed by LinkedIn.

## License

MIT
