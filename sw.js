// MTUT offline cache: always ask the network for the newest copy first, fall back to the last copy when offline
const CACHE = "mtut-v25";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k.startsWith("mtut-") && k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url), same = u.origin === location.origin;
  const cdn = /(^|\.)fonts\.(googleapis|gstatic)\.com$|(^|\.)cdnjs\.cloudflare\.com$/.test(u.hostname);
  if (!same && !cdn) return;                                   // AI calls and everything else go straight out
  const req = same ? fetch(r.url, { cache: "no-cache", credentials: "same-origin" }) : fetch(r);   // game files: skip the browser's 10-minute cache so updates show up at once
  e.respondWith(
    req.then(res => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
       .catch(() => caches.match(r, { ignoreSearch: same }).then(m => m || Response.error()))
  );
});
