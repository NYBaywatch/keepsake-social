// Scrapes the user's own LinkedIn "My items" saved-posts page.
// Strategy: identify cards by their permalink URLs rather than LinkedIn's
// obfuscated CSS classes, so redesigns are less likely to break extraction.

const POST_LINK = /\/(feed\/update|posts|pulse)\//;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findCards() {
  // A "card" is the smallest <li> (or fallback: any element) containing a post permalink.
  const anchors = [...document.querySelectorAll('main a[href]')].filter((a) =>
    POST_LINK.test(a.href)
  );
  const cards = new Set();
  for (const a of anchors) {
    const li = a.closest('li') || a.closest('div[data-urn], article');
    if (li) cards.add(li);
  }
  return [...cards];
}

function clickShowMore() {
  const btn = [...document.querySelectorAll('main button')].find((b) =>
    /show more/i.test(b.textContent)
  );
  if (btn) btn.click();
  return !!btn;
}

async function scrollUntilDone(onProgress) {
  let stable = 0;
  let lastCount = 0;
  for (let i = 0; i < 200 && stable < 3; i++) {
    window.scrollTo(0, document.body.scrollHeight);
    clickShowMore();
    await sleep(1500);
    const count = findCards().length;
    onProgress(count);
    stable = count === lastCount ? stable + 1 : 0;
    lastCount = count;
  }
  return lastCount;
}

function extractCard(card) {
  const link = [...card.querySelectorAll('a[href]')].find((a) => POST_LINK.test(a.href));
  const profile = [...card.querySelectorAll('a[href]')].find((a) =>
    /\/(in|company|school)\//.test(a.href)
  );
  // Card text: collapse whitespace, drop pure-UI lines.
  const lines = (card.innerText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^(Save|Saved|Unsave|…|\.\.\.)$/i.test(l));
  // The profile anchor is often the avatar image (no text); the author name
  // is reliably the card's first text line.
  let author = profile ? profile.innerText.trim().split('\n')[0] : '';
  if (!author) author = (lines[0] || '').replace(/'s profile.*$/i, '');
  return {
    url: link ? link.href.split('?')[0] : '',
    author,
    authorUrl: profile ? profile.href.split('?')[0] : '',
    text: lines.join('\n'),
  };
}

function collect() {
  const seen = new Set();
  const items = [];
  for (const card of findCards()) {
    const item = extractCard(card);
    const key = item.url || item.text.slice(0, 120);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }
  return items;
}

// ---- serializers ----

function toCsv(items) {
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = [['url', 'author', 'authorUrl', 'text'].join(',')];
  for (const it of items) rows.push([it.url, it.author, it.authorUrl, it.text].map(esc).join(','));
  return rows.join('\r\n');
}

function toMarkdown(items) {
  const parts = [`# LinkedIn Saved Posts (${items.length})`, ''];
  items.forEach((it, i) => {
    parts.push(`## ${i + 1}. ${it.author || 'Unknown author'}`);
    if (it.url) parts.push(`[Post](${it.url})` + (it.authorUrl ? ` · [Profile](${it.authorUrl})` : ''));
    parts.push('', it.text, '', '---', '');
  });
  return parts.join('\n');
}

function download(content, filename, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- message handling from popup ----

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action !== 'export') return;
  (async () => {
    await scrollUntilDone((n) =>
      chrome.runtime.sendMessage({ action: 'progress', count: n }).catch(() => {})
    );
    const items = collect();
    const stamp = new Date().toISOString().slice(0, 10);
    if (msg.format === 'json') {
      download(JSON.stringify(items, null, 2), `linkedin-saves-${stamp}.json`, 'application/json');
    } else if (msg.format === 'csv') {
      download(toCsv(items), `linkedin-saves-${stamp}.csv`, 'text/csv');
    } else {
      download(toMarkdown(items), `linkedin-saves-${stamp}.md`, 'text/markdown');
    }
    sendResponse({ ok: true, count: items.length });
  })();
  return true; // keep the message channel open for the async response
});
