// Keepsake shared runtime — injected before each platform script.
// Platform scripts call registerKeepsake() with their own page check and
// collector; everything else (scroll loop, serializing, download, popup
// messaging) lives here.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function download(content, filename, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(items) {
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const cols = Object.keys(items[0] || { url: '' });
  const rows = [cols.join(',')];
  for (const it of items) rows.push(cols.map((c) => esc(it[c])).join(','));
  return rows.join('\r\n');
}

function toMarkdown(items, platform) {
  const parts = [`# Keepsake export — ${platform} (${items.length} items)`, ''];
  items.forEach((it, i) => {
    const title = it.author || (it.caption || it.text || '').split('\n')[0].slice(0, 60) || 'Item';
    parts.push(`## ${i + 1}. ${title}`);
    if (it.url) parts.push(`[Post](${it.url})` + (it.authorUrl ? ` · [Profile](${it.authorUrl})` : ''));
    parts.push('', it.text || it.caption || '', '', '---', '');
  });
  return parts.join('\n');
}

// Scroll-and-accumulate: collect on every pass so items virtualized out of
// the DOM (Instagram unmounts off-screen tiles) are not lost.
async function harvest(collectPass, onProgress) {
  const seen = new Map();
  let stable = 0;
  let last = 0;
  for (let i = 0; i < 200 && stable < 3; i++) {
    collectPass(seen);
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(1200);
    onProgress(seen.size);
    stable = seen.size === last ? stable + 1 : 0;
    last = seen.size;
  }
  collectPass(seen);
  return [...seen.values()];
}

function registerKeepsake(platform, isRightPage, collectPass) {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action !== 'export') return;
    if (!isRightPage()) {
      sendResponse({ ok: false, error: 'wrong-page' });
      return;
    }
    (async () => {
      const items = await harvest(collectPass, (n) =>
        chrome.runtime.sendMessage({ action: 'progress', count: n }).catch(() => {})
      );
      const stamp = new Date().toISOString().slice(0, 10);
      const base = `keepsake-${platform}-${stamp}`;
      if (msg.format === 'json') {
        download(JSON.stringify(items, null, 2), `${base}.json`, 'application/json');
      } else if (msg.format === 'csv') {
        download(toCsv(items), `${base}.csv`, 'text/csv');
      } else {
        download(toMarkdown(items, platform), `${base}.md`, 'text/markdown');
      }
      sendResponse({ ok: true, count: items.length });
    })();
    return true; // async response
  });
}
