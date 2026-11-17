// MTUT offline cache: always try the network first, fall back to the last copy when offline
const CACHE = "mtut-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url), same = u.origin === location.origin;
  const cdn = /(^|\.)fonts\.(googleapis|gstatic)\.com$|(^|\.)cdnjs\.cloudflare\.com$/.test(u.hostname);
  if (!same && !cdn) return;                                   // AI calls and everything else go straight out
  e.respondWith(
    fetch(r).then(res => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
            .catch(() => caches.match(r, { ignoreSearch: same }).then(m => m || Response.error()))
  );
});
