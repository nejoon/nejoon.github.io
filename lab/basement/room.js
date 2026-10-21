import * as THREE from 'three';
import { createPortfolio } from './portfolio.js';
import { createEncounters } from './encounters.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Procedural room furnishings with local pixel-art character textures.
export function createRoom(host, reduced) {
  const mobile = matchMedia('(max-width: 767px)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#10100e');
  // A closed, illuminated shell keeps even ultra-wide corners inside the room.
  const camera = new THREE.PerspectiveCamera(60, 1, .05, 100);
  const base = new THREE.Vector3(.7, 1.6, 9.5);
  const look = new THREE.Vector3(-.2, 2.8, -5);
  camera.position.copy(base);
  const materials = {};
  const mat = (name, color, roughness = .8, metalness = 0) => materials[name] = new THREE.MeshStandardMaterial({color, roughness, metalness});
  const concrete = mat('concrete', '#48443d');
  const dark = mat('dark', '#161817', .7, .35);
  const metal = mat('metal', '#444740', .45, .8);
  const wood = mat('wood', '#654125', .8);
  const black = mat('black', '#0c0d0c');
  const ivory = mat('ivory', '#716e58');
  const orange = mat('orange', '#c83d0b', .5);
  const led = new THREE.MeshStandardMaterial({color:'#ffcd81',emissive:'#ff9d38',emissiveIntensity:4});
  const whiteLED = new THREE.MeshStandardMaterial({color:'#ffffdf',emissive:'#ffe2b0',emissiveIntensity:5});
  // Seeded noise creates concrete pores and mottling without image files.
  let seed = 107;
  function random(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  const surface = document.createElement('canvas'); surface.width = surface.height = 256;
  const ctx = surface.getContext('2d'); const pixels = ctx.createImageData(256,256);
  for(let i=0;i<pixels.data.length;i+=4){const n=90+random()*60; pixels.data[i]=n;pixels.data[i+1]=n;pixels.data[i+2]=n;pixels.data[i+3]=255;}
  ctx.putImageData(pixels,0,0);
  const texture = new THREE.CanvasTexture(surface); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;texture.repeat.set(7,7);texture.colorSpace = THREE.SRGBColorSpace;
  concrete.map = texture; concrete.bumpMap = texture; concrete.bumpScale = .065;
  function box(w,h,d,x,y,z,material=dark,parent=scene){ const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=!mobile;mesh.receiveShadow=true;parent.add(mesh);return mesh; }
  function rod(a,b,r=.025,material=metal,parent=scene){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,start.distanceTo(end),8),material);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());mesh.castShadow=!mobile;parent.add(mesh);return mesh;}
  function point(color,intensity,x,y,z,distance=12){const light=new THREE.PointLight(color,intensity,distance,2);light.position.set(x,y,z);scene.add(light);return light;}
  let shadowLights=0;
  function spot(color,intensity,position,target,angle=.65){const light=new THREE.SpotLight(color,intensity,35,angle,.65,1.5);light.position.set(...position);light.target.position.set(...target);light.castShadow=!mobile && shadowLights++<3;light.shadow.mapSize.set(1024,1024);light.shadow.bias=-.001;light.shadow.normalBias=.035;scene.add(light,light.target);return light;}
  function canvasLabel(text,w=1024,h=256,color='#ffd6ac',font='800 175px Geist, Arial'){const c=document.createElement('canvas');c.width=w;c.height=h;const cctx=c.getContext('2d');cctx.fillStyle=color;cctx.font=font;cctx.textAlign='center';cctx.textBaseline='middle';cctx.fillText(text,w/2,h/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
  box(25,.25,23,0,-.15,0,concrete);
  box(24,9,.3,0,4.5,-8,concrete);
  box(.3,9,20,-12,4.5,1,concrete);
  box(.3,9,20,12,4.5,1,concrete);
  box(24.6,.3,20,0,8.35,1,concrete);
  box(24.6,9,.3,0,4.5,11,concrete);
  // Furnishings adapt horizontally on narrow screens; the shell stays full size.
  const shell = new Set(scene.children);
  // Floor expansion joints and original court markings anchor the scale.
  for(let x=-12;x<=12;x+=3)box(.018,.004,21,x,.001,1,black);
  for(let z=-8;z<=11;z+=3)box(24,.004,.018,0,.002,z,black);
  const court = new THREE.MeshBasicMaterial({color:'#777365',transparent:true,opacity:.32});
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.38,2.41,80),court);ring.rotation.x=-Math.PI/2;ring.position.set(2,.012,-3.4);scene.add(ring);
  box(.035,.005,4.6,4.4,.015,-5.65,court);box(.035,.005,4.6,-.4,.015,-5.65,court);box(4.8,.005,.035,2,.015,-3.35,court);
  // Portfolio shelving is built with the interactive artwork below.
  point('#ffb15d',55,-8,3.7,-5.6,9);point('#ffaf65',35,-10,5.1,-6.2,8);
  // Stair flight travels from the foreground left up toward the mezzanine.
  const stairX=-5.6, stairZ=-2;
  for(let i=0;i<13;i++){
    const x=stairX+i*.43,y=.18+i*.255;
    box(.46,.09,1.5,x,y,stairZ,metal);
    for(let s=-1;s<=1;s+=2){rod([x,y,stairZ+s*.75],[x,y+1.05,stairZ+s*.75],.025);}
  }
  for(let s=-1;s<=1;s+=2){rod([-5.8,.08,stairZ+s*.7],[-.1,3.5,stairZ+s*.7],.08);rod([-5.65,1.25,stairZ+s*.75],[-.38,4.35,stairZ+s*.75],.035);}
  box(5.3,.18,3.5,2.35,3.55,-3,metal);
  for(let x=0;x<=4.8;x+=.6){rod([x,3.65,-1.25],[x,4.7,-1.25]);rod([x,3.65,-4.75],[x,4.7,-4.75]);}
  rod([-.2,4.7,-1.25],[5,4.7,-1.25],.04);rod([-.2,4.7,-4.75],[5,4.7,-4.75],.04);
  for(const x of [0,4.8]){box(.15,3.5,.15,x,1.75,-1.4,metal);box(.15,3.5,.15,x,1.75,-4.5,metal);}
  for(let x=-.2;x<5;x+=.18)box(.028,.035,3.5,x,3.66,-3,black);
  // Back doorway with inset amber light and industrial grille.
  box(2.4,3.4,.2,1,1.7,-7.65,black);
  box(1.7,2.9,.1,1,1.45,-7.48,new THREE.MeshStandardMaterial({color:'#291f13',emissive:'#e37526',emissiveIntensity:.9}));
  for(let x=.2;x<1.9;x+=.18)box(.035,2.9,.05,x,1.45,-7.36,metal);
  box(2.15,.07,.13,1,3.12,-7.3,led);point('#ff8c32',24,1,2,-6.7,7);
  // Structural ceiling beams, exposed pipework, and pendant lights.
  for(let x=-10;x<12;x+=4){box(.16,.3,18,x,8,0,metal);}
  for(let z=-6;z<9;z+=5)box(24,.24,.18,0,8,z,dark);
  rod([-11,6.8,-7],[11,6.8,-7],.07);rod([10.7,0,-7],[10.7,6.8,-7],.07);
  for(const [x,z] of [[-8,-3],[0,1],[7,-2]]){rod([x,8,z],[x,6.3,z],.015);const shade=new THREE.Mesh(new THREE.ConeGeometry(.38,.3,24,1,true),dark);shade.position.set(x,6.3,z);scene.add(shade);box(.35,.025,.35,x,6.16,z,whiteLED);spot('#ffd4a0',110,[x,6.1,z],[x,0,z],.7);}
  // Interactive groups are raycast recursively; labels are inherited from parents.
  const targets=[];
  function interactive(name){const group=new THREE.Group();group.userData.label=name;scene.add(group);targets.push(group);return group;}
  const arcade=interactive('ARCADE / INSERT CURIOSITY');arcade.position.set(-7.2,0,-3.7);arcade.rotation.y=.23;
  box(1.25,1.1,.9,0,.55,0,orange,arcade);box(1.25,1.6,.8,0,1.65,-.17,dark,arcade);box(1.33,.35,1,0,2.58,-.04,orange,arcade);box(1.36,.14,.8,0,1.25,.3,dark,arcade);
  for(const x of [-.64,.64])box(.08,2.6,.95,x,1.3,-.03,black,arcade);
  const arcadeCanvas=document.createElement('canvas');arcadeCanvas.width=256;arcadeCanvas.height=256;const ac=arcadeCanvas.getContext('2d');const arcadeTexture=new THREE.CanvasTexture(arcadeCanvas);arcadeTexture.magFilter=THREE.NearestFilter;arcadeTexture.colorSpace=THREE.SRGBColorSpace;
  const arcadeScreen=new THREE.Mesh(new THREE.PlaneGeometry(.94,.84),new THREE.MeshStandardMaterial({map:arcadeTexture,emissiveMap:arcadeTexture,emissive:'#ffffff',emissiveIntensity:2}));arcadeScreen.position.set(0,1.93,.253);arcadeScreen.rotation.x=-.13;arcade.add(arcadeScreen);
  const marquee=canvasLabel('DATA RUN',512,100,'#ffbc6b','700 64px monospace');const marqueeMesh=new THREE.Mesh(new THREE.PlaneGeometry(1.08,.22),new THREE.MeshBasicMaterial({map:marquee,transparent:true}));marqueeMesh.position.set(0,2.6,.47);arcade.add(marqueeMesh);
  rod([-.27,1.32,.45],[-.27,1.52,.45],.025,metal,arcade);const ball=new THREE.Mesh(new THREE.SphereGeometry(.075,12,8),orange);ball.position.set(-.27,1.54,.45);arcade.add(ball);
  for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.035,12),led);b.position.set(.1+i*.14,1.34,.5);arcade.add(b);}point('#ff4d16',13,-7.1,1.9,-2.8,4);
  // CRT scanlines, drifting noise, and live plots. Curvature is in the geometry.
  const screenUniforms=[];
  const screenVertex='varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const screenFragment=`varying vec2 vUv;uniform float time;uniform float seed;uniform vec3 tint;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  void main(){vec2 uv=vUv;float n=hash(floor(uv*vec2(160.,110.))+floor(time*12.)+seed);float scan=.78+.22*sin(uv.y*420.);float trace=exp(-abs(uv.y-(.47+.14*sin(uv.x*22.+time+seed)+.06*sin(uv.x*63.-time)))*100.);float grid=step(.97,fract(uv.x*12.))*.14+step(.97,fract(uv.y*9.))*.14;float bars=step(uv.y,.15+hash(vec2(floor(uv.x*14.),seed))*.22)*.18;float edge=pow(max(0.,16.*uv.x*uv.y*(1.-uv.x)*(1.-uv.y)),.3);gl_FragColor=vec4(tint*(.07+n*.15+trace*1.8+grid+bars)*scan*edge,1.);}`;
  const monitors=interactive('MONITORS / LIVE SIGNAL');monitors.position.set(6.7,0,-5.6);monitors.rotation.y=-.18;
  for(let i=0;i<8;i++){
    const col=i%3,row=Math.floor(i/3),x=(col-1)*1.43+(row===2?.3:0),y=.73+row*1.25;
    box(1.35,1.12,1.05,x,y,-row*.05, i%3===0?ivory:dark,monitors);box(1.13,.87,.04,x-.04,y+.03,.55,black,monitors);
    const geometry=new THREE.PlaneGeometry(1.03,.76,16,12);const positions=geometry.attributes.position;
    for(let v=0;v<positions.count;v++){const px=positions.getX(v),py=positions.getY(v);positions.setZ(v,.075*(1-Math.pow(px/.56,2))*(1-Math.pow(py/.43,2)));}geometry.computeVertexNormals();
    const uniforms={time:{value:0},seed:{value:i*7.3},tint:{value:new THREE.Color(i%3===0?'#ffa373':i%3===1?'#cad8c5':'#9bc3ce')}};screenUniforms.push(uniforms);
    const screen=new THREE.Mesh(geometry,new THREE.ShaderMaterial({uniforms,vertexShader:screenVertex,fragmentShader:screenFragment}));screen.position.set(x-.04,y+.03,.58);monitors.add(screen);
    box(.025,.025,.02,x+.59,y-.35,.565,led,monitors);
    for(let j=0;j<3;j++)box(.12,.015,.02,x+.49,y-.12-j*.07,.565,black,monitors);
  }
  point('#b6d4d3',22,6.7,2,-3.6,7);
  // Neon lettering comes from Google-font text on a transparent canvas.
  const neon=interactive('NEJOON / ALL ROADS LEAD TO DATA');
  const neonTexture=canvasLabel('nejoon.',1536,384,'#ffc493','800 280px Geist, Arial');
  const neonMaterial=new THREE.MeshStandardMaterial({map:neonTexture,emissiveMap:neonTexture,emissive:'#ff9050',emissiveIntensity:4,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(6.5,1.625),neonMaterial);sign.position.set(7.1,5.45,-7.73);neon.add(sign);
  point('#ff893c',65,7,5.4,-6.7,10);
  // Hoop and hanging net, independently modeled with tubes.
  const hoop=interactive('HOOP / TAKE A BREAK');
  box(2.05,1.35,.09,2.1,6.15,-7.57,ivory,hoop);box(1.9,1.2,.025,2.1,6.15,-7.51,dark,hoop);
  for(const x of [1.72,2.48])box(.035,.55,.02,x,5.98,-7.48,ivory,hoop);
  for(const y of [5.71,6.26])box(.8,.035,.02,2.1,y,-7.48,ivory,hoop);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.43,.036,10,40),orange);rim.rotation.x=Math.PI/2;rim.position.set(2.1,5.65,-6.93);hoop.add(rim);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,b=a+.2;rod([2.1+Math.cos(a)*.43,5.65,-6.93+Math.sin(a)*.43],[2.1+Math.cos(b)*.25,5.08,-6.93+Math.sin(b)*.25],.009,ivory,hoop);}
  for(let j=0;j<3;j++){const net=new THREE.Mesh(new THREE.TorusGeometry(.28+j*.055,.008,4,24),ivory);net.rotation.x=Math.PI/2;net.position.set(2.1,5.15+j*.16,-6.93);hoop.add(net);}
  // Bench, server racks, loose cabling and a ball make this a lived-in room.
  box(2.6,.13,.7,-3,.62,1,wood);for(const x of [-4,-2])box(.09,.6,.5,x,.3,1,metal);
  for(let i=0;i<2;i++){box(.85,1.8,.85,10+i*.9,.9,-6,dark);for(let j=0;j<8;j++){box(.7,.12,.03,10+i*.9,.2+j*.19,-5.56,black);box(.025,.025,.035,9.76+i*.9,.2+j*.19,-5.53,led);}}
  const basketball=new THREE.Mesh(new THREE.SphereGeometry(.28,24,16),orange);basketball.position.set(2.8,.28,-.2);scene.add(basketball);
  for(let j=0;j<3;j++){const seam=new THREE.Mesh(new THREE.TorusGeometry(.282,.007,4,40),black);seam.position.copy(basketball.position);seam.rotation.set(j*Math.PI/2,j===2?Math.PI/2:0,0);scene.add(seam);}
  const cableCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(7,.03,-4),new THREE.Vector3(6,.03,-2),new THREE.Vector3(8,.03,-.5),new THREE.Vector3(9,.03,-3)]);scene.add(new THREE.Mesh(new THREE.TubeGeometry(cableCurve,40,.018,5,false),black));
  // Broad diagonal shafts: additive, edge-faded planes plus actual shadow-casting light.
  const beamMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{color:{value:new THREE.Color('#d7bc89')}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv; uniform vec3 color;void main(){float edge=pow(sin(vUv.x*3.14159),2.);float fade=sin(vUv.y*3.14159);gl_FragColor=vec4(color,edge*fade*.045);}'});
  for(let i=0;i<3;i++){
    const x=-4+i*3.5;
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([x,7.8,-5.5,x+.6,7.8,-5.5,x+6,0,3,x+3.2,0,3],3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,1,1,0,0,0],2));geometry.setIndex([0,1,2,0,2,3]);scene.add(new THREE.Mesh(geometry,beamMaterial));
    spot('#ffe3ab',180,[x,7.7,-5.4],[x+4.2,0,3],.19);
    const patch=new THREE.Mesh(new THREE.PlaneGeometry(1.3,4.6),new THREE.MeshBasicMaterial({color:'#dec99f',transparent:true,opacity:.13,blending:THREE.AdditiveBlending,depthWrite:false}));patch.rotation.set(-Math.PI/2,0,-.55);patch.position.set(x+4.1,.018,2.1);scene.add(patch);
  }
  scene.add(new THREE.HemisphereLight('#b6c2ca','#66503b',1.15));
  scene.add(new THREE.AmbientLight('#c4b8a4',.35));
  spot('#b3c6d3',90,[3,7,10],[0,2,-4],.9);
  const portfolio=createPortfolio({scene,targets,box,wood,black,led,renderer,wake,host,reduced});
  const encounters=createEncounters({scene,camera,host,targets,box,rod,reduced,base,look,wake,portfolio});
  const interior = new THREE.Group();
  for (const child of [...scene.children]) if (!shell.has(child)) interior.add(child);
  scene.add(interior);
  // Return shelving along the left wall, continuing past the camera's field of view.
  for (let z=-5;z<10;z+=2) {
    for (let y=.6;y<5;y+=1.4) {
      box(.8,.09,1.9,-11.5,y,z,wood);
      box(.04,.025,1.7,-11.08,y+1.1,z,led);
    }
  }
  let composer;
  if(!mobile){composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),.36,.65,1.15));composer.addPass(new OutputPass());}
  const finish=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform sampler2D tDiffuse;uniform float time;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float grain=fract(sin(dot(vUv+time*.001,vec2(12.9898,78.233)))*43758.5453)-.5;gl_FragColor=vec4(c+grain*.012,1.);}'});
  if(composer)composer.addPass(finish);
  const mouse=new THREE.Vector2(),smooth=new THREE.Vector2(),raycaster=new THREE.Raycaster();
  const tag=document.querySelector('#hover-tag');let hovered=false,active=true,visible=true,frame=0,lastScreen=-1;
  function drawArcade(time){ac.fillStyle='#160705';ac.fillRect(0,0,256,256);ac.fillStyle='#ff631e';ac.font='bold 17px monospace';ac.textAlign='center';ac.fillText('DATA RUN',128,30);ac.fillStyle='#ffad66';for(let y=0;y<8;y++)for(let x=0;x<9;x++){if((x+y)%3!==0)ac.fillRect(25+x*24,55+y*14,14,6);}const px=reduced?128:128+Math.sin(time*.8)*70;ac.fillStyle='#ffe4bc';ac.fillRect(px-19,214,38,6);ac.fillRect(128+Math.sin(time)*60,130+Math.cos(time*.7)*60,7,7);ac.fillStyle='#a93110';ac.font='12px monospace';ac.fillText('ALL ROADS LEAD TO DATA',128,246);arcadeTexture.needsUpdate=true;}
  function render(time=0){frame=0;if(!active||!visible||document.hidden)return;const t=time*.001;
    smooth.lerp(mouse,.035);
    if(!encounters.cameraOwned){camera.position.copy(base);camera.position.x+=reduced?0:smooth.x*.08+Math.sin(t*.12)*.015;camera.position.y+=reduced?0:smooth.y*.04+Math.cos(t*.15)*.01;
    camera.lookAt(look.x+(reduced?0:smooth.x*.06),look.y+(reduced?0:smooth.y*.03),look.z);}
    encounters.update(time);
    for(const u of screenUniforms)u.time.value=reduced?0:t;
    if(Math.floor(t*12)!==lastScreen){drawArcade(reduced?0:t);lastScreen=Math.floor(t*12);}
    neonMaterial.emissiveIntensity=reduced?4:3.8+Math.sin(t*7)*.15+(Math.sin(t*1.7)> .997?-.65:0);
    finish.uniforms.time.value=t;
    if(hovered&&!encounters.busy) updateHover();
    else {tag.hidden=true;encounters.highlight(null);host.parentElement.style.cursor='';}
    if(composer)composer.render();else renderer.render(scene,camera);
    frame=requestAnimationFrame(render);
  }
  function wake(){if(!frame&&active&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h);composer?.setSize(w,h);
    const aspect=w/h;
    const portrait=THREE.MathUtils.clamp((1.2-aspect)/.6,0,1);
    camera.aspect=aspect;
    camera.fov=60+18*portrait;
    // Keep a human eye height and a fixed interior distance, never retreat outside.
    base.set(.7*(1-portrait),1.6,9.5);
    look.set(-.2*(1-portrait),2.8,-5);
    const halfWidth=17*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*aspect;
    interior.scale.x=Math.min(1,halfWidth/12);
    camera.updateProjectionMatrix();encounters.resize();wake();
  }
  function pick(){
    scene.updateMatrixWorld(true);camera.updateMatrixWorld();raycaster.setFromCamera(mouse,camera);
    const hits=raycaster.intersectObjects(targets,true);let item=hits[0]?.object;
    while(item&&!item.userData.label)item=item.parent;return item;
  }
  function setPointer(e){const rect=host.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);}
  function updateHover(){const item=pick();tag.hidden=!item;if(item)tag.textContent=item.userData.project?item.userData.label:`[${item.userData.label}]`;encounters.highlight(item);host.parentElement.style.cursor=item?.userData.encounter?'pointer':'';}
  host.parentElement.addEventListener('pointermove',e=>{setPointer(e);hovered=!e.target.closest('a,button');tag.style.left=`${Math.max(12,Math.min(e.clientX+22,innerWidth-310))}px`;tag.style.top=`${Math.min(e.clientY+22,innerHeight-45)}px`;});
  host.parentElement.addEventListener('pointerleave',()=>{hovered=false;mouse.set(0,0);tag.hidden=true;encounters.highlight(null);host.parentElement.style.cursor='';});
  let pointerDown=null;
  host.parentElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};});
  host.parentElement.addEventListener('click',e=>{
    if(e.target.closest('a,button')||encounters.busy||!pointerDown||Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>8)return;
    setPointer(e);const item=pick();if(item?.userData.encounter){tag.hidden=true;encounters.focus(item);}
  });
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;tag.hidden=true;}},{threshold:0});observer.observe(host);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
  new ResizeObserver(resize).observe(host);resize();
  return {setActive(value){active=value;encounters.setActive(value);tag.hidden=true;host.parentElement.style.cursor="";if(value){resize();wake();}else{cancelAnimationFrame(frame);frame=0;}}};
}
