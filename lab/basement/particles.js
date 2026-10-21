import * as THREE from 'three';

export function createParticles(host, reduced) {
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.1,50);camera.position.set(0,1,8);camera.lookAt(0,0,0);
  const count=20000,positions=new Float32Array(count*3),seeds=new Float32Array(count);
  let seed=71;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
  for(let i=0;i<count;i++){
    const angle=random()*Math.PI*2,layer=Math.floor(random()*4),onCap=random()<.32;
    const radius=onCap?Math.sqrt(random())*1.35:1.35;
    positions[i*3]=Math.cos(angle)*radius;
    positions[i*3+1]=layer*.57-1.05+(onCap?.42:random()*.42);
    positions[i*3+2]=Math.sin(angle)*radius;
    seeds[i]=random();
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('seed',new THREE.BufferAttribute(seeds,1));
  const uniforms={time:{value:0},mouse:{value:new THREE.Vector2()},strength:{value:0},ratio:{value:renderer.getPixelRatio()}};
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms,
    vertexShader:`attribute float seed;uniform float time;uniform vec2 mouse;uniform float strength;uniform float ratio;varying float alpha;
    void main(){vec3 p=position;float a=.35+sin(time*.12)*.12;mat2 turn=mat2(cos(a),-sin(a),sin(a),cos(a));p.xz=turn*p.xz;float flow=pow(seed,2.)*strength;vec2 direction=normalize(mouse+vec2(.001));p.xy+=direction*flow*(2.+seed*3.);p.z+=sin(seed*30.+time*2.)*flow*.45;p.y+=sin(seed*40.+time)*flow*.2;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.2+seed)*ratio*5./-mv.z,1.,3.5);alpha=.3+seed*.65;}`,
    fragmentShader:'varying float alpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(.86,.9,1.),alpha*smoothstep(.5,.1,d));}'});
  const cloud=new THREE.Points(geometry,material);cloud.rotation.z=-.17;scene.add(cloud);
  let active=true,visible=false,frame=0,target=0;const mouse=new THREE.Vector2();
  function render(now){frame=0;if(!active||!visible||document.hidden)return;uniforms.time.value=reduced?0:now*.001;uniforms.mouse.value.lerp(mouse,.045);uniforms.strength.value+=(target-uniforms.strength.value)*.035;renderer.render(scene,camera);if(!reduced)frame=requestAnimationFrame(render);}
  function wake(){if(!frame&&active&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
  host.addEventListener('pointermove',e=>{if(reduced)return;const r=host.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);target=Math.min(mouse.length()*.85,.9);});
  host.addEventListener('pointerleave',()=>{target=0;});
  new ResizeObserver(()=>{if(!host.clientWidth)return;renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();wake();}).observe(host);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(frame);frame=0;}},{threshold:.01}).observe(host);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();});
  return{setActive(value){active=value;if(value)wake();else{cancelAnimationFrame(frame);frame=0;}}};
}
