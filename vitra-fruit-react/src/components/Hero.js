import { useEffect, useRef, useState } from 'react';

const heroTitle = 'All natural dehydrated fruits';
const heroSubtitle = 'Crafted for cocktails, baking, snacking & indulging';
const heroTitleWords = ['All', 'natural', 'dehydrated', 'fruits'];

const TOTAL_FRAMES = 192;
const FRAME_PATH = (i) =>
  `/images/hero-frames/frame_${String(i).padStart(3, '0')}.webp`;

function Hero() {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const lastDrawnFrameRef = useRef(-1);
  const rafRef = useRef(0);
  const contentOpacityRef = useRef(1);
  const [contentOpacity, setContentOpacity] = useState(1);

  const handleShopClick = (event) => {
    event.preventDefault();
    const shopSection = document.querySelector('#shop');
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.location.hash = '#shop';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const sticky = stickyRef.current;
      const w = sticky ? sticky.clientWidth : window.innerWidth;
      const h = sticky ? sticky.clientHeight : window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      lastDrawnFrameRef.current = -1;
    };

    const drawFrame = (index) => {
      const frame = framesRef.current[index];
      if (!frame || !frame.complete || !frame.naturalWidth) return;
      if (lastDrawnFrameRef.current === index) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = frame.naturalWidth;
      const ih = frame.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(frame, dx, dy, dw, dh);
      lastDrawnFrameRef.current = index;
    };

    const findNearestLoadedFrame = (target) => {
      const frames = framesRef.current;
      if (frames[target] && frames[target].complete && frames[target].naturalWidth) {
        return target;
      }
      for (let offset = 1; offset < frames.length; offset += 1) {
        const before = target - offset;
        if (before >= 0 && frames[before] && frames[before].complete && frames[before].naturalWidth) {
          return before;
        }
        const after = target + offset;
        if (after < frames.length && frames[after] && frames[after].complete && frames[after].naturalWidth) {
          return after;
        }
      }
      return -1;
    };

    const computeProgress = () => {
      const section = sectionRef.current;
      if (!section) return 0;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight;
      if (total <= 0) return 0;
      const scrolled = -rect.top;
      return Math.max(0, Math.min(1, scrolled / total));
    };

    const update = () => {
      rafRef.current = 0;
      const progress = computeProgress();
      const targetIndex = Math.round(progress * (TOTAL_FRAMES - 1));
      const drawIndex = findNearestLoadedFrame(targetIndex);
      if (drawIndex >= 0) drawFrame(drawIndex);

      const fadeStart = 0.78;
      const fadeEnd = 0.96;
      let nextOpacity = 1;
      if (progress > fadeStart) {
        const t = Math.min(1, (progress - fadeStart) / (fadeEnd - fadeStart));
        const eased = t * t * (3 - 2 * t);
        nextOpacity = 1 - eased;
      }
      if (Math.abs(nextOpacity - contentOpacityRef.current) > 0.01) {
        contentOpacityRef.current = nextOpacity;
        setContentOpacity(nextOpacity);
      }
    };

    const requestUpdate = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    const preloadFrames = () => {
      const frames = new Array(TOTAL_FRAMES);
      framesRef.current = frames;
      const queue = [];
      for (let i = 0; i < TOTAL_FRAMES; i += 1) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (i === 0) requestUpdate();
          if (Math.abs(i - lastDrawnFrameRef.current) <= 1) requestUpdate();
        };
        frames[i] = img;
        queue.push(img);
      }
      const priority = [0];
      for (let step = 8; step >= 1; step = Math.floor(step / 2)) {
        for (let i = step; i < TOTAL_FRAMES; i += step) {
          if (!priority.includes(i)) priority.push(i);
        }
        if (step === 1) break;
      }
      for (let i = 0; i < TOTAL_FRAMES; i += 1) {
        if (!priority.includes(i)) priority.push(i);
      }
      priority.forEach((i) => {
        queue[i].src = FRAME_PATH(i);
      });
    };

    sizeCanvas();
    preloadFrames();
    requestUpdate();

    const handleScroll = () => requestUpdate();
    const handleResize = () => {
      sizeCanvas();
      requestUpdate();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero" id="home">
      <div ref={stickyRef} className="hero-sticky">
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
        <div className="hero-content" style={{ opacity: contentOpacity }}>
          <p className="hero-kicker">VitraFruits Collection</p>
          <div className="hero-layout-side">
            <div className="hero-copy-left">
              <h1 className="hero-title" aria-label={heroTitle}>
                <span className="hero-line">
                  {heroTitleWords.map((word, wordIndex) => (
                    <span
                      key={`${word}-${wordIndex}`}
                      className="hero-word"
                      style={{ '--word-index': wordIndex }}
                    >
                      {word}
                    </span>
                  ))}
                </span>
              </h1>
            </div>
            <div className="hero-copy-right">
              <h2 className="hero-subtitle">{heroSubtitle}</h2>
              <div className="hero-actions">
                <a href="#shop" className="btn btn-hero" onClick={handleShopClick}>Shop Now</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
