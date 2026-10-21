const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduced) document.documentElement.classList.add('js-motion');
const human=document.querySelector('#human-view');
const machine=document.querySelector('#machine-view');
const modeButtons=[...document.querySelectorAll('[data-mode]')];
let room,particles,mode='human';
try { mode=localStorage.getItem('nejoon-basement-mode')==='machine'?'machine':'human'; } catch { /* Private browsing can disable storage. */ }
function setMode(value,save=true){
  mode=value;const terminal=value==='machine';
  human.hidden=terminal;machine.hidden=!terminal;document.body.classList.toggle('machine',terminal);
  for(const button of modeButtons)button.setAttribute('aria-pressed',String(button.dataset.mode===value));
  room?.setActive(!terminal);particles?.setActive(!terminal);
  if(save){try{localStorage.setItem('nejoon-basement-mode',value);}catch{/* Preference remains session-local. */}window.scrollTo({top:0,behavior:'instant'});}
}
modeButtons.forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
setMode(mode,false);
document.querySelector('.brand').addEventListener('click',event=>{if(mode==='machine'){event.preventDefault();window.scrollTo({top:0,behavior:reduced?'instant':'smooth'});}});
document.querySelectorAll('.year').forEach(node=>node.textContent=new Date().getFullYear());
const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target);}},{threshold:.2});
document.querySelectorAll('.reveal').forEach(element=>revealObserver.observe(element));
const names=['Ruby on Rails','PostgreSQL','AWS','Docker','Kafka','Python','BigQuery','Redis','Terraform','GitHub Actions','Jekyll','Kubernetes','dbt','Airflow','Snowflake','Spark'];
const alphabet='░▒▓▚▞01<>/';
for(const name of names){
  const cell=document.createElement('div');cell.className='stack-cell';cell.tabIndex=0;cell.setAttribute('aria-label',name);
  const text=document.createElement('span');text.textContent=name;text.setAttribute('aria-hidden','true');cell.appendChild(text);
  let timer;
  function scramble(){if(reduced)return;clearInterval(timer);let step=0;timer=setInterval(()=>{step++;text.textContent=[...name].map((char,i)=>char===' '?char:i<step/2?char:alphabet[Math.floor(Math.random()*alphabet.length)]).join('');if(step>=name.length*2){clearInterval(timer);text.textContent=name;}},25);}
  cell.addEventListener('pointerenter',scramble);cell.addEventListener('focus',scramble);document.querySelector('.stack-grid').appendChild(cell);
}
let scrollTick=false;
window.addEventListener('scroll',()=>{if(reduced||scrollTick)return;scrollTick=true;requestAnimationFrame(()=>{const progress=Math.min(scrollY/innerHeight,1);document.querySelector('#room').style.opacity=String(1-progress*.8);scrollTick=false;});},{passive:true});
// Keep navigation and terminal mode working even if WebGL or the CDN is unavailable.
async function initialize(){
  try{
    await document.fonts.ready;
    const {createRoom}=await import('./room.js');
    room=createRoom(document.querySelector('#room'),reduced);room.setActive(mode==='human');
    document.querySelector('.room-status').textContent='DATA ROOM / LIVE RENDER';
  }catch(error){console.error('Data room initialization:',error);document.querySelector('.room-fallback').hidden=false;document.querySelector('.room-status').textContent='DATA ROOM / OFFLINE';}
  try{
    const {createParticles}=await import('./particles.js');particles=createParticles(document.querySelector('#particles'),reduced);particles.setActive(mode==='human');
  }catch(error){console.error('Particle initialization:',error);document.querySelector('#particles .media-bottom').textContent='DATA IN MOTION / WEBGL UNAVAILABLE';}
}
initialize();
