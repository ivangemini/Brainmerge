const COPY_BY_LOCALE={en:'./locales/campaign-en.json',ru:'./locales/campaign-ru.json'};
const IDS=['w1-sneaker-garden','w1-toilet-pond','w1-watermelon-grill','w1-hose-tunnels','w1-gnome-yard','w1-mushroom-field','w1-backyard-core'];
let snapshot=null,copy=null,locale=null,queued=false;
const world=()=>snapshot?.worlds?.find(x=>x.id===1)??null;
const progress=id=>world()?.locations?.find(x=>x.id===id)??null;
function unlocked(id){const i=IDS.indexOf(id);if(i<0)return false;if(i===0)return true;return(progress(IDS[i-1])?.phases?.restore??0)>=1}
async function loadCopy(){const next=document.documentElement.lang?.toLowerCase().startsWith('ru')?'ru':'en';if(copy&&locale===next)return;const r=await fetch(COPY_BY_LOCALE[next]);if(!r.ok)return;copy=await r.json();locale=next}
function apply(){document.querySelectorAll('.campaign-node--location').forEach(node=>{if(!(node instanceof HTMLButtonElement))return;const id=node.dataset.locationId;if(!IDS.includes(id))return;const open=unlocked(id);node.classList.toggle('is-locked',!open);node.dataset.routeUnlocked=open?'true':'false';node.setAttribute('aria-disabled',open?'false':'true');const img=node.querySelector('img');if(img instanceof HTMLImageElement){if(!open){if(!img.dataset.unlockedSrc)img.dataset.unlockedSrc=img.src;img.src='./public/assets/ui/stage-locked.webp'}else if(img.dataset.unlockedSrc){img.src=img.dataset.unlockedSrc;delete img.dataset.unlockedSrc}}})}
function refresh(){void loadCopy().then(apply)}
function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}
window.addEventListener('brainmerge:campaign-state',e=>{if(e instanceof CustomEvent&&e.detail&&typeof e.detail==='object'){snapshot=e.detail;queue()}});
document.addEventListener('click',e=>{const node=e.target instanceof Element?e.target.closest('.campaign-node--location'):null;if(!(node instanceof HTMLElement))return;const id=node.dataset.locationId;if(!IDS.includes(id)||unlocked(id))return;queueMicrotask(()=>{const note=document.querySelector('.campaign-detail.is-open .campaign-detail__note');if(note&&copy)note.textContent=copy.locationRouteLocked})},true);
new MutationObserver(queue).observe(document.body,{subtree:true,childList:true});
new MutationObserver(queue).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
refresh();window.dispatchEvent(new Event('brainmerge:campaign-state-request'));
