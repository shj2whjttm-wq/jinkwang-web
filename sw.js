// 진광고 앱 서비스 워커
// 화면 파일(HTML/JS/CSS/아이콘)만 저장한다. 자료(Supabase)는 앱 안에서 따로 저장본을 관리한다.
const CACHE = 'jinkwang-shell-v2';
const BASE = '/jinkwang-web/';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([BASE, BASE + 'manifest.json'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // 화면 이동은 먼저 서버에 물어보고, 안 되면 저장된 껍데기를 준다.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then((r) => { caches.open(CACHE).then((c) => c.put(BASE, r.clone())); return r; })
      .catch(() => caches.match(BASE)));
    return;
  }
  // 빌드된 JS/CSS/아이콘은 한 번 받으면 그대로 쓴다 (파일 이름에 해시가 있어 안전하다).
  if (url.pathname.startsWith(BASE + '_expo/') || /.(png|ico|json|js|css)$/.test(url.pathname)) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone()));
      return r;
    })));
  }
});
