// LinkedIn saved-posts collector. Cards are identified by permalink URLs
// rather than LinkedIn's obfuscated CSS classes, so redesigns are less
// likely to break extraction.

const LI_POST_LINK = /\/(feed\/update|posts|pulse)\//;

function liCollectPass(seen) {
  // Saved lists sometimes paginate behind a "Show more" button.
  const more = [...document.querySelectorAll('main button')].find((b) =>
    /show more/i.test(b.textContent)
  );
  if (more) more.click();

  const anchors = [...document.querySelectorAll('main a[href]')].filter((a) =>
    LI_POST_LINK.test(a.href)
  );
  const cards = new Set();
  for (const a of anchors) {
    const li = a.closest('li') || a.closest('div[data-urn], article');
    if (li) cards.add(li);
  }
  for (const card of cards) {
    const link = [...card.querySelectorAll('a[href]')].find((a) => LI_POST_LINK.test(a.href));
    if (!link) continue;
    const url = link.href.split('?')[0];
    if (seen.has(url)) continue;
    const profile = [...card.querySelectorAll('a[href]')].find((a) =>
      /\/(in|company|school)\//.test(a.href)
    );
    const lines = (card.innerText || '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/^(Save|Saved|Unsave|…|\.\.\.)$/i.test(l));
    // The profile anchor is often the avatar image (no text); the author
    // name is reliably the card's first text line.
    let author = profile ? profile.innerText.trim().split('\n')[0] : '';
    if (!author) author = (lines[0] || '').replace(/'s profile.*$/i, '');
    seen.set(url, {
      url,
      author,
      authorUrl: profile ? profile.href.split('?')[0] : '',
      text: lines.join('\n'),
    });
  }
}

registerKeepsake('linkedin', () => /\/my-items\//.test(location.pathname), liCollectPass);
