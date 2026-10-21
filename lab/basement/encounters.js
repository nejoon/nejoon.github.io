import { t, getLang, onLangChange, translateDOM, profileText } from './i18n.js';
import * as THREE from 'three';

// Shared camera transitions for character conversations and portfolio artwork.
export function createEncounters({scene, camera, host, targets, box, rod, reduced, base, look, wake, portfolio}) {
  const entries = [], characters = [];
  let profiles={};
  const profilesReady=fetch(new URL('./profiles.json',import.meta.url)).then(response=>{
    if(!response.ok)throw new Error(`Profiles: ${response.status}`);
    return response.json();
  }).then(data=>{profiles=data;}).catch(error=>console.error('Unable to load profiles:',error));
  const layer=document.createElement('div');layer.className='encounter-labels';host.parentElement.append(layer);
  const loader=new THREE.TextureLoader();
  const people=[
    {id:'sejun',x:-5.35,z:-.65,height:1.75},
    {id:'mingyeong',x:4.55,z:-3.25,height:1.75*.95}
  ];
  function localizePerson(data) { data.label=t(`${data.id}.name`); data.subtitle=t(`${data.id}.subtitle`); data.lines=t(`${data.id}.lines`); }
  people.forEach(localizePerson);
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const ctx=shadowCanvas.getContext('2d'), gradient=ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'#0009');gradient.addColorStop(1,'#0000');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const shadowMap=new THREE.CanvasTexture(shadowCanvas);
  for(const data of people) {
    const root=new THREE.Group();root.position.set(data.x,0,data.z);root.userData.label=data.label;root.userData.encounter=data;
    scene.add(root);targets.push(root);entries.push(root);
    const texture=loader.load(`./assets/characters/${data.id}.png`,()=>wake());
    texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;
    const sprite=new THREE.Mesh(new THREE.PlaneGeometry(data.height*51/91,data.height),new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.5,side:THREE.DoubleSide}));
    sprite.position.y=data.height/2+.025;root.add(sprite);
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.95,.65),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(data.x,.025,data.z);scene.add(shadow);
    const name=document.createElement('button');name.type='button';name.className='character-name';name.textContent=data.label;name.setAttribute('aria-label',t('talk', {name:data.label}));layer.append(name);
    const bubble=document.createElement('div');bubble.className='idle-speech';bubble.lang=getLang();bubble.hidden=true;layer.append(bubble);
    name.addEventListener('click',e=>{e.stopPropagation();focus(root);});
    characters.push({root,sprite,name,bubble,data});
  }
  // Clone shared materials before highlighting so only the selected object glows.
  for(const root of entries)root.traverse(mesh=>{if(mesh.isMesh&&mesh.material.emissive){mesh.material=mesh.material.clone();mesh.userData.baseEmissive=mesh.material.emissive.clone();mesh.userData.baseIntensity=mesh.material.emissiveIntensity;}});
  const dialog=document.createElement('dialog');dialog.className='encounter-modal';dialog.lang=getLang();dialog.setAttribute('aria-labelledby','encounter-title');
  dialog.innerHTML=`<div class="encounter-panel">
    <button class="encounter-close" type="button" data-i18n-aria-label="close">×</button>
    <div class="profile-identity"><img class="encounter-portrait" alt=""><span class="mono encounter-label" data-i18n="profile.title"></span><h2 id="encounter-title"></h2><p class="profile-alias mono"></p><p class="encounter-subtitle"></p></div>
    <div class="encounter-copy"><p class="encounter-description"></p><dl class="profile-stats"></dl>
      <section class="profile-approach"><h3 data-i18n="profile.approach"></h3><ol></ol></section>
      <section class="profile-services"><h3 data-i18n="profile.services"></h3><ul></ul></section>
      <section class="profile-tools"><h3 data-i18n="profile.tools"></h3><ul></ul></section>
      <section class="profile-links"><h3 data-i18n="profile.links"></h3><ul></ul></section>
      <button class="profile-portfolio" type="button" data-i18n="profile.portfolio"></button>
    </div>
    <footer class="profile-dialogue"><p class="encounter-speech" aria-live="polite"></p><button class="encounter-again" type="button" data-i18n="again"></button></footer>
  </div>`;
  document.body.append(dialog);translateDOM(dialog);
  const el=selector=>dialog.querySelector(selector);
  let focused=null,flight=null,highlighted=null,typeTimer,previousFocus,previousOverflow,active=true,lastLine=-1;
  let nextSpeech=performance.now()+8000+Math.random()*4000,speechUntil=0;
  const currentLook=look.clone(),world=new THREE.Vector3(),projected=new THREE.Vector3();
  function clearHighlight(){if(highlighted)highlighted.traverse(mesh=>{if(mesh.userData.baseEmissive){mesh.material.emissive.copy(mesh.userData.baseEmissive);mesh.material.emissiveIntensity=mesh.userData.baseIntensity;}});highlighted=null;}
  function highlight(root){portfolio.highlight(root);if(root===highlighted)return;clearHighlight();if(!root?.userData.encounter)return;highlighted=root;root.traverse(mesh=>{if(mesh.userData.baseEmissive){mesh.material.emissive.set('#ff641e');mesh.material.emissiveIntensity=.45;}});}
  function say(){
    clearInterval(typeTimer);const lines=focused.userData.encounter.lines;
    const choices=lines.map((_,i)=>i).filter(i=>i!==lastLine);lastLine=choices.length?choices[Math.floor(Math.random()*choices.length)]:0;
    const text=lines[lastLine],speech=el('.encounter-speech');speech.textContent='';
    if(reduced){speech.textContent=text;return;}
    // Announce the completed sentence once, rather than every typed syllable.
    speech.setAttribute('aria-live','off');let count=0;
    typeTimer=setInterval(()=>{speech.textContent=text.slice(0,++count);if(count>=text.length){clearInterval(typeTimer);speech.setAttribute('aria-live','polite');}},35);
  }
  function renderProfile(){
    const data=focused.userData.encounter;
    const profile=profiles[data.id]||{name:data.label,role:data.subtitle,summary:''};
    const value=field=>profileText(profile,field);
    el('h2').textContent=value('name');
    el('.profile-alias').textContent=value('alias')||'';el('.profile-alias').hidden=!value('alias');
    el('.encounter-subtitle').textContent=value('role');
    el('.encounter-description').textContent=value('summary');
    const portrait=el('img');portrait.src=`./assets/characters/${data.id}_portrait.webp`;portrait.alt=t('portrait',{name:value('name')});
    const stats=value('stats')||[];el('.profile-stats').hidden=!stats.length;
    el('.profile-stats').replaceChildren(...stats.map(([label,number])=>{
      const group=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
      dt.className='mono';dt.textContent=label;dd.textContent=number;group.append(dt,dd);return group;
    }));
    for(const field of ['approach','services','tools','links']){
      const items=value(field)||[],section=el(`.profile-${field}`);section.hidden=!items.length;
      section.querySelector('ol,ul').replaceChildren(...items.map(item=>{
        const li=document.createElement('li');
        if(field==='links'){
          const a=document.createElement('a');a.textContent=item[0]+' ↗';a.href=item[1];a.target='_blank';a.rel='noopener';li.append(a);
        }else li.textContent=item;
        return li;
      }));
    }
    el('.profile-portfolio').hidden=data.id!=='sejun';
    translateDOM(dialog);
  }
  async function open(){
    if(focused.userData.project){portfolio.open(focused);return;}
    if(focused===portfolio.wall)return;
    const root=focused;
    await profilesReady;
    // Loading may finish after the user leaves this scene or closes the encounter.
    if(!active||focused!==root||flight)return;
    renderProfile();previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    dialog.showModal();dialog.scrollTop=0;el('.encounter-close').focus();say();
  }
  function destination(root){
    scene.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(root),target=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
    const vertical=THREE.MathUtils.degToRad(camera.fov/2),horizontal=Math.atan(Math.tan(vertical)*camera.aspect);
    const distance=Math.max(size.y/(2*Math.tan(vertical)),size.x/(2*Math.tan(horizontal)))*1.6+size.z/2;
    return {target,position:target.clone().add(new THREE.Vector3(.12,.15,Math.max(1.3,distance)))};
  }
  function fly(position,target,done){
    flight={from:camera.position.clone(),fromLook:currentLook.clone(),position,target,start:performance.now(),done};
    if(reduced){camera.position.copy(position);currentLook.copy(target);camera.lookAt(currentLook);flight=null;done();}wake();
  }
  function focus(root){
    if(!active||flight||(focused&&focused!==portfolio.wall))return;previousFocus=document.activeElement;focused=root;lastLine=-1;highlight(null);
    characters.forEach(c=>c.bubble.hidden=true);host.parentElement.classList.add('encounter-focused');
    const dest=destination(root);fly(dest.position,dest.target,open);
  }
  function close(){
    if(!focused)return;clearInterval(typeTimer);
    if(dialog.open){dialog.close();document.body.style.overflow=previousOverflow||'';}
    portfolio.close();
    fly(base.clone(),look.clone(),()=>{focused=null;host.parentElement.classList.remove('encounter-focused');nextSpeech=performance.now()+8000+Math.random()*4000;previousFocus?.focus({preventScroll:true});});
  }
  function overview(){
    if(focused===portfolio.wall){close();return;}
    if(dialog.open){
      clearInterval(typeTimer);dialog.close();document.body.style.overflow=previousOverflow||'';
      focused=null;
      const returnFocus=previousFocus;
      focus(portfolio.wall);
      previousFocus=returnFocus;
    }else focus(portfolio.wall);
  }
  portfolio.connect({focus,close,navigate(root){
    focused=root;const dest=destination(root);fly(dest.position,dest.target,()=>{});portfolio.open(root);
  },overview});
  el('.profile-portfolio').addEventListener('click',overview);
  el('.encounter-close').addEventListener('click',close);el('.encounter-again').addEventListener('click',say);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&focused===portfolio.wall)close();});
  function project(node,position,offset=0){
    projected.copy(position);projected.y+=offset;projected.project(camera);
    node.hidden=!!focused||!active||projected.z<-1||projected.z>1||Math.abs(projected.x)>1||Math.abs(projected.y)>1;
    node.style.left=`${THREE.MathUtils.clamp((projected.x+1)*host.clientWidth/2,35,host.clientWidth-35)}px`;
    node.style.top=`${(1-projected.y)*host.clientHeight/2+host.offsetTop}px`;
  }
  onLangChange(() => {
    dialog.lang=getLang();
    for (const c of characters) {
      localizePerson(c.data); c.root.userData.label=c.data.label;
      c.name.textContent=c.data.label; c.name.setAttribute('aria-label',t('talk',{name:c.data.label}));
      c.bubble.lang=getLang();
      if (c.bubble.textContent && c.bubbleLine !== undefined) c.bubble.textContent=c.data.lines[c.bubbleLine];
    }
    if (dialog.open && focused?.userData.encounter?.lines) {
      const data=focused.userData.encounter;
      clearInterval(typeTimer);
      renderProfile();
      el('.encounter-speech').textContent=data.lines[Math.max(0,lastLine)];
      el('.encounter-speech').setAttribute('aria-live','polite');
    }
    wake();
  });
  return {
    get busy(){return (!!focused&&focused!==portfolio.wall)||!!flight;},get cameraOwned(){return !!focused||!!flight;},focus,highlight,
    update(time){
      portfolio.update();
      if(flight){const f=flight,p=Math.min(1,(time-f.start)/1200),ease=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;camera.position.lerpVectors(f.from,f.position,ease);currentLook.lerpVectors(f.fromLook,f.target,ease);camera.lookAt(currentLook);if(p===1){flight=null;f.done();}}
      else if(!focused)currentLook.copy(look);
      camera.updateMatrixWorld();scene.updateMatrixWorld(true);
      characters.forEach((c,i)=>{
        c.root.getWorldPosition(world);c.sprite.rotation.y=Math.atan2(camera.position.x-world.x,camera.position.z-world.z);
        c.sprite.position.y=c.data.height/2+.025+(reduced?0:Math.sin(time*.0018+i*2.4)*.015);
        project(c.name,world,c.data.height+.16);project(c.bubble,world,c.data.height+.5);
        c.bubble.hidden=c.bubble.hidden||time>speechUntil||!c.bubble.textContent;
      });

      if(!focused&&time>=nextSpeech){characters.forEach(c=>c.bubble.textContent='');const c=characters[Math.floor(Math.random()*characters.length)];c.bubbleLine=Math.floor(Math.random()*c.data.lines.length);c.bubble.textContent=c.data.lines[c.bubbleLine];speechUntil=time+4000;nextSpeech=time+8000+Math.random()*4000;}
    },
    resize(){if(focused&&!flight){const dest=destination(focused);camera.position.copy(dest.position);currentLook.copy(dest.target);camera.lookAt(currentLook);}},
    setActive(value){active=value;layer.hidden=!value;if(!value){portfolio.close();clearInterval(typeTimer);if(dialog.open){dialog.close();document.body.style.overflow=previousOverflow||'';}focused=null;flight=null;clearHighlight();host.parentElement.classList.remove('encounter-focused');camera.position.copy(base);currentLook.copy(look);}nextSpeech=performance.now()+8000+Math.random()*4000;}
  };
}
