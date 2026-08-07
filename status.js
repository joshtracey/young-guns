/*
 * Live status banner.
 *
 * Reads status.txt and, if it says show: yes, drops a banner at the very
 * top of the page. Re-checks every 60s so anyone sitting on the page sees
 * an update without reloading. If status.txt is missing or unparseable,
 * nothing renders — the page is unaffected.
 */
(function () {
  var POLL_MS = 60000;

  var css = [
    '.status-banner {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  flex-wrap: wrap;',
    '  gap: 10px 16px;',
    '  padding: 14px 64px;',
    '  font-family: "Barlow Condensed", sans-serif;',
    '  font-weight: 700;',
    '  font-size: clamp(1.05rem, 2vw, 1.35rem);',
    '  letter-spacing: 0.06em;',
    '  text-transform: uppercase;',
    '  line-height: 1.3;',
    '  text-align: center;',
    '  color: #fff;',
    '  background: #1a3860;',
    '}',
    '.status-banner.level-live { background: #cc0000; }',
    '.status-banner.level-warn { background: #f5c842; color: #0b1f3a; }',
    '.status-banner.level-good { background: #17794a; }',
    '.status-banner.level-info { background: #1a3860; }',
    '.status-banner .status-dot {',
    '  width: 11px; height: 11px;',
    '  border-radius: 50%;',
    '  background: currentColor;',
    '  flex-shrink: 0;',
    '}',
    '.status-banner.level-live .status-dot { animation: status-pulse 1.5s infinite; }',
    '@keyframes status-pulse {',
    '  0%, 100% { opacity: 1; transform: scale(1); }',
    '  50% { opacity: 0.4; transform: scale(0.8); }',
    '}',
    '.status-banner .status-btn {',
    '  color: inherit;',
    '  text-decoration: none;',
    '  border: 2px solid currentColor;',
    '  border-radius: 7px;',
    '  padding: 6px 16px;',
    '  font-size: 0.85em;',
    '  letter-spacing: 0.08em;',
    '  white-space: nowrap;',
    '  transition: background 0.15s;',
    '}',
    '.status-banner .status-btn:hover, .status-banner .status-btn:focus {',
    '  background: rgba(255,255,255,0.18);',
    '  outline: 3px solid #fff;',
    '  outline-offset: 2px;',
    '}',
    '.status-banner.level-warn .status-btn:hover, .status-banner.level-warn .status-btn:focus {',
    '  background: rgba(11,31,58,0.12);',
    '  outline-color: #0b1f3a;',
    '}',
    '@media (max-width: 900px) { .status-banner { padding-left: 28px; padding-right: 28px; } }',
    '@media (max-width: 520px) { .status-banner { padding-left: 16px; padding-right: 16px; } }',
    '@media (min-width: 1600px) { .status-banner { padding-left: 96px; padding-right: 96px; } }'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // "key: value" lines, # comments, everything else ignored.
  function parse(raw) {
    var out = {};
    raw.split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line || line.charAt(0) === '#') return;
      var i = line.indexOf(':');
      if (i < 1) return;
      out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    });
    return out;
  }

  function isOn(v) {
    return ['yes', 'y', 'true', 'on', '1'].indexOf(String(v || '').toLowerCase()) !== -1;
  }

  function render(cfg) {
    var existing = document.getElementById('status-banner');
    if (existing) existing.remove();

    if (!isOn(cfg.show) || !cfg.text) return;

    var level = String(cfg.level || 'info').toLowerCase();
    if (['live', 'warn', 'good', 'info'].indexOf(level) === -1) level = 'info';

    var el = document.createElement('div');
    el.id = 'status-banner';
    el.className = 'status-banner level-' + level;
    el.setAttribute('role', 'status');

    var dot = document.createElement('span');
    dot.className = 'status-dot';
    el.appendChild(dot);

    var text = document.createElement('span');
    text.textContent = cfg.text;
    el.appendChild(text);

    // Only linkify real http(s) URLs.
    if (cfg.link && /^https?:\/\//i.test(cfg.link)) {
      var a = document.createElement('a');
      a.className = 'status-btn';
      a.href = cfg.link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = cfg.linktext || 'Open link';
      el.appendChild(a);
    }

    document.body.insertBefore(el, document.body.firstChild);
  }

  function check() {
    // Cache-bust: GitHub Pages caches static files for several minutes.
    fetch('status.txt?v=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); })
      .then(function (raw) { render(parse(raw)); })
      .catch(function () { /* no status file, no banner */ });
  }

  check();
  setInterval(check, POLL_MS);
})();
