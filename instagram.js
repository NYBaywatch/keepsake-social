// Instagram saved-posts collector. The saved grid stores each post's full
// caption in the thumbnail's alt text, so url + caption + image come
// straight from the grid — no per-post navigation needed.

function igCollectPass(seen) {
  for (const a of document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')) {
    const url = a.href.split('?')[0];
    if (seen.has(url)) continue;
    const img = a.querySelector('img');
    seen.set(url, {
      url,
      caption: img ? img.alt || '' : '',
      image: img ? img.src : '',
    });
  }
}

registerKeepsake('instagram', () => /\/saved\//.test(location.pathname), igCollectPass);
