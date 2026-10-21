import { t, getLang, onLangChange, translateDOM, languageSwitch, projectText } from './i18n.js';
import * as THREE from 'three';

export function createPortfolio({scene,targets,box,wood,black,led,renderer,wake,host,reduced}) {
  const wall=new THREE.Group();scene.add(wall);
  const sections=[['branding',6],['uiux',9],['ppt',4],['marketing',8]];
  // Two wide bays, each with two sections and three illuminated display rows.
  box(8.3,6.5,.24,-7.55,3.55,-7.65,black,wall);
  for(let i=0;i<61;i++)box(.075,6.5,.12,-11.6+i*.135,3.55,-7.46,wood,wall);
  const bays=sections.map(([key,count],i)=>{
    const x=-9.65+(i%2)*4.15,top=i<2?6.7:3.45;
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=96;
    const ctx=canvas.getContext('2d');
    const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
    function redraw() {
      ctx.fillStyle='#171714';ctx.fillRect(0,0,1024,96);ctx.fillStyle='#ffc48a';
      ctx.font='500 46px "Geist Mono", "Apple SD Gothic Neo", "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif';
      ctx.textBaseline='middle';ctx.fillText(`${t(`shelf.${key}`)} / ${String(count).padStart(2,'0')}`,32,48,960);
      map.needsUpdate=true;
    }
    redraw();
    const plate=new THREE.Mesh(new THREE.PlaneGeometry(3.8,.36),new THREE.MeshStandardMaterial({map,emissiveMap:map,emissive:'#ffffff',emissiveIntensity:.7}));plate.position.set(x,top,-7.1);wall.add(plate);
    for(let row=0;row<3;row++){
      const y=top-.98-row*.95;
      box(4.02,.07,.78,x,y,-7.05,wood,wall);
      box(3.9,.025,.035,x,y+.79,-6.68,led,wall);
    }
    for(const side of [-1,1])box(.07,3.15,.72,x+side*2.04,top-1.38,-7.08,wood,wall);
    return {key,x,top,redraw};
  });
  const roots=[],frameGeo=new THREE.BoxGeometry(1,1,.055),imageGeo=new THREE.PlaneGeometry(1,.5625);
  const backing=new THREE.MeshStandardMaterial({color:'#17191a',roughness:.65});
  const loader=new THREE.TextureLoader();const anisotropy=renderer.capabilities.getMaxAnisotropy();
  let highlighted=null,actions,selected=null,imageIndex=0,overflow='',returnFocus;
  const chip=document.createElement('button');chip.type='button';chip.className='portfolio-chip';chip.dataset.i18n='portfolio.chip';chip.textContent=t('portfolio.chip');chip.dataset.i18nAriaLabel='portfolio.aria';chip.setAttribute('aria-label',t('portfolio.aria'));chip.disabled=true;host.parentElement.append(chip);
  chip.addEventListener('click',()=>actions?.overview());
  const dialog=document.createElement('dialog');dialog.className='project-modal';dialog.lang=getLang();dialog.setAttribute('aria-labelledby','project-title');
  dialog.innerHTML=`<div class="project-panel"><button class="project-close" data-i18n-aria-label="close" type="button">×</button><header><span class="mono project-category"></span><h2 id="project-title"></h2><p class="project-description"></p></header><section class="project-gallery" data-i18n-aria-label="project.images"><img class="project-main" loading="lazy" alt=""><div class="gallery-controls"><button type="button" data-image="-1" data-i18n-aria-label="image.prev">←</button><span class="mono gallery-count" aria-live="polite"></span><button type="button" data-image="1" data-i18n-aria-label="image.next">→</button></div><div class="project-thumbnails"></div></section><a class="project-link" target="_blank" rel="noopener" data-i18n="project.full"></a><footer><button type="button" data-project="-1" data-i18n="project.prev"></button><span class="mono project-count"></span><button type="button" data-project="1" data-i18n="project.next"></button></footer></div>`;
  dialog.querySelector('header').prepend(languageSwitch());
  document.body.append(dialog);translateDOM(dialog);const el=s=>dialog.querySelector(s);
  function showImage(index){
    const data=selected.userData.project;imageIndex=(index+data.images.length)%data.images.length;
    const main=el('.project-main');main.classList.remove('tall');main.onload=()=>main.classList.toggle('tall',main.naturalHeight/main.naturalWidth>1.6);main.src=data.images[imageIndex];el('.project-main').alt=`${projectText(data,'title')} — ${imageIndex+1}`;
    el('.gallery-count').textContent=`${imageIndex+1} / ${data.images.length}`;
    dialog.querySelectorAll('[data-image]').forEach(b=>b.disabled=data.images.length<2);
    [...el('.project-thumbnails').children].forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===imageIndex));if(i===imageIndex)b.scrollIntoView({block:'nearest',inline:'nearest'});});
  }
  function open(root){
    selected=root;const data=root.userData.project;
    el('.project-category').textContent=`${t('portfolio')} / ${projectText(data,'category')}`;el('h2').textContent=projectText(data,'title');el('.project-description').textContent=projectText(data,'desc');el('.project-link').href=data.url;
    el('.project-count').textContent=`${roots.indexOf(root)+1} / ${roots.length}`;
    el('.project-thumbnails').replaceChildren(...data.images.map((src,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',t('image.view',{number:i+1}));const img=document.createElement('img');img.src=src;img.loading='lazy';img.alt='';b.append(img);b.addEventListener('click',()=>showImage(i));return b;}));
    if(!dialog.open){returnFocus=document.activeElement;overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();el('.project-close').focus();}
    showImage(0);dialog.scrollTop=0;
  }
  function close(){if(dialog.open){dialog.close();document.body.style.overflow=overflow;returnFocus?.focus({preventScroll:true});}selected=null;}
  el('.project-close').addEventListener('click',()=>actions.close());
  dialog.addEventListener('cancel',e=>{e.preventDefault();actions.close();});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)actions.close();}});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();showImage(imageIndex+(e.key==='ArrowLeft'?-1:1));}});
  dialog.querySelectorAll('[data-image]').forEach(b=>b.addEventListener('click',()=>showImage(imageIndex+Number(b.dataset.image))));
  dialog.querySelectorAll('[data-project]').forEach(b=>b.addEventListener('click',()=>actions.navigate(roots[(roots.indexOf(selected)+Number(b.dataset.project)+roots.length)%roots.length])));
  function projectLabel(item) {
    const title=projectText(item,'title');
    return `[${t(`shelf.${item.shelf}`)}] ${title.length>25?title.slice(0,25)+'…':title}`;
  }
  onLangChange(() => {
    dialog.lang=getLang();
    bays.forEach(bay=>bay.redraw());
    roots.forEach(root=>root.userData.label=projectLabel(root.userData.project));
    if (dialog.open && selected) {
      const data=selected.userData.project;
      el('.project-category').textContent=`${t('portfolio')} / ${projectText(data,'category')}`;
      el('h2').textContent=projectText(data,'title');el('.project-description').textContent=projectText(data,'desc');
      el('.project-main').alt=`${projectText(data,'title')} — ${imageIndex+1}`;
      [...el('.project-thumbnails').children].forEach((button,i)=>button.setAttribute('aria-label',t('image.view',{number:i+1})));
    }
    wake();
  });
  async function load(){
    const response=await fetch('./portfolio.json');if(!response.ok)throw new Error(`Portfolio: ${response.status}`);const data=await response.json();
    for(const bay of bays){
      data.filter(item=>item.shelf===bay.key).forEach((item,i)=>{
        const root=new THREE.Group(),poster=i===0||i===4;
        const width=poster?.77:1.16,height=poster?.79:1.16*9/16+.055;
        root.position.set(bay.x+(i%3-1)*1.3,bay.top-.98-Math.floor(i/3)*.95+.035+height/2,-6.82);
        root.rotation.set(poster?0:-.08,0,Math.sin(item.id)*THREE.MathUtils.degToRad(2));
        root.userData={label:projectLabel(item),encounter:true,project:item,restZ:root.position.z};
        const edge=backing.clone();root.userData.edge=edge;const frame=new THREE.Mesh(frameGeo,edge);frame.scale.set(width+.045,height,1);root.add(frame);
        // Poster mounts retain a landscape 16:9 image, with generous matting above/below.
        const mat=new THREE.MeshBasicMaterial({color:'#272a2b'}),picture=new THREE.Mesh(imageGeo,mat);picture.scale.set(width-.025,width-.025,1);picture.position.z=.03;root.add(picture);
        wall.add(root);targets.push(root);roots.push(root);root.userData.picture=mat;
      });
    }
    chip.disabled=false;wake();
    // Limit decoding/uploads to two at a time; every frame starts as a dark placeholder.
    let next=0;
    async function worker(){while(next<roots.length){const root=roots[next++];try{const texture=await loader.loadAsync(`./${root.userData.project.tex}`);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=anisotropy;const mat=root.userData.picture;mat.map=texture;mat.color.set('#ffffff');mat.needsUpdate=true;wake();}catch(error){console.warn('Portfolio thumbnail unavailable:',root.userData.project.tex,error);}await new Promise(resolve=>setTimeout(resolve,40));}}
    await Promise.all([worker(),worker()]);
  }
  load().catch(error=>{console.error(error);chip.dataset.i18n='portfolio.unavailable';chip.textContent=t('portfolio.unavailable');});
  return {wall,open,close,connect(value){actions=value;},highlight(root){highlighted=root?.userData.project?root:null;},update(){for(const root of roots){const on=root===highlighted;root.position.z=THREE.MathUtils.lerp(root.position.z,root.userData.restZ+(on?.03:0),reduced?1:.15);root.userData.edge.emissive.set(on?'#ff641e':'#000000');root.userData.edge.emissiveIntensity=on?1.4:0;}}};
}
