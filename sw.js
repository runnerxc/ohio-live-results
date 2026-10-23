/* Running Result Live service worker. Scope = the folder this file is served from (never the live site's path).
   Shell (fonts, logo, icons) cache-first; the hub page and ALL data (meets.json, days/*.json, athletes*, tags, postseason,
   Results Hub pages + data.json) network-first, cache only as an offline fallback. Old caches of this scope are deleted on activate. */
const V='1-c1a2f2fd',P='rr-'+self.registration.scope+'|',SHELL=P+'shell-'+V,DATA=P+'data-'+V,MAXDATA=40;
const PRE=['./','assets/fonts/Inter.ttf','assets/fonts/JetBrainsMono.ttf','assets/fonts/InstrumentSerif-Regular.ttf','assets/fonts/InstrumentSerif-Italic.ttf','assets/ohrh-logo.png','assets/favicon.svg','pwa/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(PRE)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(P)&&k!==SHELL&&k!==DATA).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const key=u=>{const x=new URL(u);x.search='';return x.href};
async function trim(c){const ks=await c.keys();for(let i=0;i<ks.length-MAXDATA;i++)await c.delete(ks[i])}
async function netFirst(req,isNav){const c=await caches.open(isNav&&new URL(req.url).pathname.endsWith('/')&&key(req.url)===key(self.registration.scope)?SHELL:DATA);
try{const r=await fetch(req);if(r&&r.ok&&r.type==='basic'){c.put(key(req.url),r.clone()).then(()=>trim(c)).catch(()=>{})}return r}
catch(err){const hit=await caches.match(key(req.url),{ignoreSearch:true});if(hit)return hit;
if(isNav){const shell=await caches.match(key(self.registration.scope));if(shell)return shell}
return new Response(isNav?'<!doctype html><meta name=viewport content="width=device-width"><body style="background:#0a0a0a;color:#f5f5f5;font:16px system-ui;padding:24px">You are offline. Reconnect to see live results.</body>':'{"offline":true}',{status:503,headers:{'Content-Type':isNav?'text/html':'application/json'}})}}
async function cacheFirst(req){const hit=await caches.match(req,{ignoreSearch:true});if(hit)return hit;const r=await fetch(req);if(r&&r.ok){const c=await caches.open(SHELL);c.put(req,r.clone())}return r}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
if(u.origin!==location.origin||!req.url.startsWith(self.registration.scope))return;   // outside our folder: browser default
const p=u.pathname;
if(req.mode==='navigate'||/\.json$/.test(p)||p.endsWith('/')||p.endsWith('.html'))return e.respondWith(netFirst(req,req.mode==='navigate'));
if(/\/(assets|pwa)\//.test(p))return e.respondWith(cacheFirst(req));
});
