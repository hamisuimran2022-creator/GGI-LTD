(()=>{
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const header=$('.site-header'), menu=$('.menu-btn'), mobile=$('.mobile-nav');
if(header){const sync=()=>header.classList.toggle('scrolled',scrollY>35);addEventListener('scroll',sync,{passive:true});sync()}
if(menu&&mobile){menu.addEventListener('click',()=>{const open=mobile.classList.toggle('open');menu.setAttribute('aria-expanded',open?'true':'false');document.body.style.overflow=open?'hidden':''});$$('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>{mobile.classList.remove('open');menu.setAttribute('aria-expanded','false');document.body.style.overflow=''}))}
$$('.reveal').forEach(el=>{if(reduce){el.style.opacity=1;el.style.transform='none';return}const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.style.transition='opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1)';e.target.style.opacity=1;e.target.style.transform='translateY(0)';io.unobserve(e.target)}}),{threshold:.1});io.observe(el)});
if(!reduce){$$('.tilt').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=e.clientX/r.width-r.left/r.width-.5,y=e.clientY/r.height-r.top/r.height-.5;card.style.transform=`perspective(1000px) rotateX(${-y*3}deg) rotateY(${x*4}deg) translateY(-4px)`});card.addEventListener('pointerleave',()=>card.style.transform='')})}
const glow=document.createElement('div');glow.className='cursor-glow';document.body.appendChild(glow);if(!reduce&&matchMedia('(pointer:fine)').matches){let tx=-200,ty=-200,cx=tx,cy=ty;addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY});const tick=()=>{cx+=(tx-cx)*.09;cy+=(ty-cy)*.09;glow.style.transform=`translate(${cx}px,${cy}px) translate(-50%,-50%)`;requestAnimationFrame(tick)};tick()}
const form=$('#contactForm');if(form){form.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(form);const body=`Name: ${d.get('name')||''}\nPhone: ${d.get('phone')||''}\n\n${d.get('message')||''}`;location.href=`mailto:mohammadhamisugimi@gmail.com?subject=${encodeURIComponent(d.get('subject')||'GGI Enquiry')}&body=${encodeURIComponent(body)}`})}
const year=$('#year');if(year)year.textContent=new Date().getFullYear();
})();
