(() => {
  'use strict';

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer:fine)').matches;

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Header / navigation
  const header = $('#mainNav') || $('#siteHeader');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuButton = $('#mobileMenuButton') || $('#menuButton');
  const mobileMenu = $('#mobileMenu');
  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      if ($('#mobileMenuButton')) mobileMenu.style.transform = open ? 'translateY(0)' : 'translateY(-100%)';
    });
    $$('.mobile-link, .mobile-nav-link', mobileMenu).forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        if ($('#mobileMenuButton')) mobileMenu.style.transform = 'translateY(-100%)';
      });
    });
  }

  // Cinematic cursor
  if (!reducedMotion && finePointer) {
    const dot = $('#cursor') || $('.cursor');
    const ring = $('#cursor-ring') || $('.cursor-follower');
    if (dot && ring) {
      let x = innerWidth / 2, y = innerHeight / 2;
      let rx = x, ry = y;
      window.addEventListener('pointermove', e => {
        x = e.clientX; y = e.clientY;
        dot.style.opacity = '1'; ring.style.opacity = '1';
      }, { passive: true });
      const cursorLoop = () => {
        rx += (x - rx) * 0.13;
        ry += (y - ry) * 0.13;
        dot.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
        ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
        requestAnimationFrame(cursorLoop);
      };
      cursorLoop();
      $$('a, button, .sector-row, .sector-card, .magnetic').forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
      });
    }
  }

  // GSAP page motion
  if (window.gsap) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    const loader = $('#loader');
    if (loader) {
      const line = $('.loader-line-inner', loader) || $('.loader-line span', loader);
      if (line) gsap.to(line, { width: '100%', duration: 0.9, ease: 'power2.inOut' });
      gsap.to(loader, { autoAlpha: 0, duration: 0.8, delay: 1.05, ease: 'power3.inOut' });
    }

    if (!reducedMotion) {
      const revealTargets = $$('.section-label, .manifesto-copy, .sector-card, .statement > div, .project-stage, .cta h2, .reveal, .reveal-left, .reveal-right');
      if (window.ScrollTrigger) {
        revealTargets.forEach(el => gsap.from(el, {
          y: 48,
          opacity: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        }));
        const hero = $('#hero');
        if (hero) {
          gsap.to('.hero-content', { y: -65, opacity: 0.22, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
          gsap.to('.hero-image', { scale: 1.14, yPercent: 5, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
          gsap.to('.hero-grid', { yPercent: 18, scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 } });
        }
      }

      $$('.hero-title .line-inner').forEach((el, i) => gsap.to(el, {
        y: '0%', duration: 1.05, delay: 0.25 + i * 0.09, ease: 'power4.out'
      }));
      $$('.hero-animate').forEach((el, i) => gsap.fromTo(el,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, delay: 0.65 + i * 0.08, ease: 'power3.out' }
      ));
    }
  }

  initThreeHero();

  function initThreeHero() {
    const canvas = $('#threeCanvas');
    if (!canvas || !window.THREE) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 100);
    camera.position.set(0.15, 0.05, 7.8);

    const root = new THREE.Group();
    root.position.set(1.55, 0.02, 0);
    scene.add(root);

    // Main dark metallic globe.
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(2.12, 72, 72),
      new THREE.MeshStandardMaterial({ color: 0x111619, metalness: 0.82, roughness: 0.28 })
    );
    root.add(globe);

    // Subtle atmospheric shell.
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0xf5b72d, transparent: true, opacity: 0.045, side: THREE.BackSide })
    );
    root.add(atmosphere);

    // Latitude / longitude wireframe.
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(2.145, 28, 18),
      new THREE.MeshBasicMaterial({ color: 0xf5b72d, wireframe: true, transparent: true, opacity: 0.11 })
    );
    root.add(wire);

    // Golden orbital system.
    const orbitGroup = new THREE.Group();
    root.add(orbitGroup);
    [2.42, 2.62, 2.86].forEach((radius, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, i === 1 ? 0.018 : 0.009, 10, 220),
        new THREE.MeshBasicMaterial({ color: 0xf5b72d, transparent: true, opacity: i === 1 ? 0.8 : 0.42 })
      );
      ring.rotation.x = Math.PI * (0.28 + i * 0.13);
      ring.rotation.y = 0.45 + i * 0.72;
      orbitGroup.add(ring);
    });

    // Glowing business nodes around the globe.
    const nodes = new THREE.Group();
    root.add(nodes);
    const nodePositions = [
      [1.32, 0.58, 1.54], [-1.25, 0.86, 1.28], [0.32, -1.62, 1.18],
      [1.68, -0.35, 0.74], [-0.58, 1.52, 1.08], [-1.68, -0.3, 0.92],
      [0.78, 1.35, -0.86], [-0.72, -1.35, -1.12]
    ];
    nodePositions.forEach((p, i) => {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(i % 2 ? 0.035 : 0.05, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffcf62 })
      );
      node.position.set(...p);
      nodes.add(node);
    });

    // Fine connecting lines create a global-network feel.
    const linePositions = [];
    for (let i = 0; i < nodePositions.length; i++) {
      const a = nodePositions[i];
      const b = nodePositions[(i + 2) % nodePositions.length];
      linePositions.push(...a, ...b);
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    root.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: 0xf5b72d, transparent: true, opacity: 0.16 })));

    // Star / dust field.
    const starCount = 520;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 5 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffd77c, size: 0.018, transparent: true, opacity: 0.48, sizeAttenuation: true }));
    scene.add(stars);

    // Lighting.
    scene.add(new THREE.AmbientLight(0xffffff, 0.42));
    const key = new THREE.PointLight(0xffc34d, 18, 18);
    key.position.set(3.5, 3.1, 5.5);
    scene.add(key);
    const rim = new THREE.PointLight(0x6d7f88, 8, 15);
    rim.position.set(-4, -1, -3);
    scene.add(rim);

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    if (finePointer && !reducedMotion) {
      window.addEventListener('pointermove', e => {
        targetX = (e.clientX / innerWidth - 0.5) * 0.75;
        targetY = (e.clientY / innerHeight - 0.5) * 0.38;
      }, { passive: true });
    }

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      currentX += (targetX - currentX) * 0.025;
      currentY += (targetY - currentY) * 0.025;

      root.rotation.y = t * 0.055 + currentX;
      root.rotation.x = currentY * 0.55;
      wire.rotation.y = -t * 0.018;
      orbitGroup.rotation.z = t * 0.045;
      nodes.scale.setScalar(1 + Math.sin(t * 1.8) * 0.012);
      stars.rotation.y = t * 0.004;

      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      root.position.x = innerWidth < 900 ? 1.0 : 1.55;
      root.scale.setScalar(innerWidth < 600 ? 0.78 : innerWidth < 900 ? 0.9 : 1);
    };
    window.addEventListener('resize', resize);
    resize();
  }
})();
