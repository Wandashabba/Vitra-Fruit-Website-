import { useEffect, useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from 'framer-motion';

/* ── Config ── */
const heroTitle = 'All natural dehydrated fruits';
const heroSubtitle = 'Crafted for cocktails, baking, snacking & indulging';
const heroTitleWords = heroTitle.split(' ');

const TOTAL_FRAMES = 192;
const FRAME_PATH = (i) =>
  `/images/hero-frames/frame_${String(i).padStart(3, '0')}.webp`;

/* Spring config for that heavy, premium feel */
const SPRING = { stiffness: 100, damping: 30, restDelta: 0.001 };

/* ── Word-reveal variant (split-text rise) ── */
const wordVariants = {
  hidden: { y: '110%', opacity: 0, filter: 'blur(6px)' },
  visible: (i) => ({
    y: '0%',
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      delay: i * 0.12 + 0.2,
      duration: 0.85,
      ease: [0.19, 1, 0.22, 1],
    },
  }),
};

const fadeUpVariants = {
  hidden: { y: 28, opacity: 0 },
  visible: (delay = 0) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay,
      duration: 0.78,
      ease: [0.2, 0.8, 0.25, 1],
    },
  }),
};

function Hero() {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const lastDrawnFrameRef = useRef(-1);
  const rafRef = useRef(0);
  const isMobileRef = useRef(false);

  /* Framer Motion scroll tracking */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  /* ── Parallax transforms ── */
  const headingYRaw = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const headingY = useSpring(headingYRaw, SPRING);

  /* Secondary text stays relatively static */
  const subtitleYRaw = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const subtitleY = useSpring(subtitleYRaw, SPRING);

  const kickerYRaw = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const kickerY = useSpring(kickerYRaw, SPRING);

  /* Canvas image: scale slightly (1.0 to 1.05) and rise faster on Y-axis */
  const canvasScaleRaw = useTransform(scrollYProgress, [0, 0.6], [1.0, 1.05]);
  const canvasScale = useSpring(canvasScaleRaw, SPRING);
  
  const canvasYRaw = useTransform(scrollYProgress, [0, 1], [0, -250]);
  const canvasY = useSpring(canvasYRaw, SPRING);

  const contentOpacityRaw = useTransform(scrollYProgress, [0.65, 0.85], [1, 0]);
  const contentOpacity = useSpring(contentOpacityRaw, SPRING);

  const contentRef = useRef(null);
  const isInView = useInView(contentRef, { once: true, amount: 0.3 });

  const handleShopClick = (event) => {
    event.preventDefault();
    const shopSection = document.querySelector('#shop');
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.location.hash = '#shop';
  };

  /* ── Canvas frame-sequence logic ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const checkMobile = () => {
      isMobileRef.current = window.innerWidth <= 1099;
    };

    const sizeCanvas = () => {
      checkMobile();
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
      /* Cover the full canvas */
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (cw - dw) / 2;
      /* On mobile: center the image vertically. On desktop: offset down */
      const dyOffset = isMobileRef.current ? 0 : 120;
      const dy = (ch - dh) / 2 + dyOffset;
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
      lastDrawnFrameRef.current = -1;
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
        {/* Canvas with scroll-driven scale and Y translation */}
        <motion.canvas
          ref={canvasRef}
          className="hero-canvas"
          aria-hidden="true"
          style={{ scale: canvasScale, y: canvasY }}
        />

        {/* Content overlay */}
        <motion.div
          className="hero-content"
          style={{ opacity: contentOpacity }}
        >
          {/* Kicker */}
          <motion.p
            className="hero-kicker"
            style={{ y: kickerY }}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            VitraFruits Collection
          </motion.p>

          <div className="hero-layout-side">
            {/* Left: Main heading with staggered word reveal */}
            <motion.div className="hero-copy-left" style={{ y: headingY }}>
              <h1 className="hero-title" aria-label={heroTitle}>
                <span className="hero-line">
                  {heroTitleWords.map((word, i) => (
                    <span key={`${word}-${i}`} className="hero-word-clip">
                      <motion.span
                        className="hero-word"
                        variants={wordVariants}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                      >
                        {word}
                      </motion.span>
                    </span>
                  ))}
                </span>
              </h1>
            </motion.div>

            {/* Right: Subtitle + CTA */}
            <motion.div className="hero-copy-right" style={{ y: subtitleY }}>
              <motion.h2
                className="hero-subtitle"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={0.56}
              >
                {heroSubtitle}
              </motion.h2>
              <motion.div
                className="hero-actions"
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                custom={0.95}
              >
                <motion.a 
                  href="#shop" 
                  className="btn btn-hero" 
                  onClick={handleShopClick}
                  whileTap={{ scale: 0.95 }}
                >
                  Shop Now
                </motion.a>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
