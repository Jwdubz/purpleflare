(() => {
  const reduced = false; // motion mandatory per sotd-concept-caliber
  const loader = document.getElementById("loader");
  const bar = document.getElementById("loaderBar");
  const pct = document.getElementById("loaderPct");
  const enterBtn = document.getElementById("enterBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const films = () => [...document.querySelectorAll("video.film")];

  let paused = false;
  let lenis;

  function setFilmsPlaying(play) {
    films().forEach((v) => {
      v.muted = true;
      v.playsInline = true;
      if (play) {
        const p = v.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        v.pause();
      }
    });
  }

  function finishLoader() {
    loader.classList.add("is-done");
    loader.setAttribute("aria-hidden", "true");
    document.body.classList.add("is-ready");
    setFilmsPlaying(true);
    bootMotion();
  }

  // Loader percent (AVATR gate rule, our code)
  let n = 0;
  const tick = () => {
    n = Math.min(100, n + (n < 70 ? 2.4 : n < 92 ? 1.1 : 0.55));
    bar.style.width = n + "%";
    pct.textContent = Math.floor(n) + "%";
    if (n < 100) requestAnimationFrame(tick);
    else setTimeout(() => {
      // auto-enter after brief hold if user does not click
      if (!loader.classList.contains("is-done")) finishLoader();
    }, 1200);
  };
  requestAnimationFrame(tick);
  enterBtn.addEventListener("click", finishLoader);

  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.textContent = paused ? "Play" : "Pause";
    document.body.classList.toggle("is-paused", paused);
    setFilmsPlaying(!paused);
    if (lenis) {
      if (paused) lenis.stop();
      else lenis.start();
    }
    if (window.ScrollTrigger) {
      ScrollTrigger.getAll().forEach((st) => {
        if (paused) st.disable(false);
        else st.enable(false);
      });
    }
  });

  function bootMotion() {
    if (typeof Lenis === "undefined" || typeof gsap === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);
    lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      if (!paused) lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    gsap.utils.toArray(".display, .manifesto__line, .lede, .body, .chapter__copy, .review-grid blockquote, .proof-row li").forEach((el, i) => {
      gsap.from(el, {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        delay: 0.02 * (i % 5),
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    });

    gsap.utils.toArray(".film-frame").forEach((frame) => {
      gsap.from(frame, {
        clipPath: "inset(8% 8% 8% 8% round 12px)",
        duration: 1.15,
        ease: "expo.out",
        scrollTrigger: {
          trigger: frame,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    });

    // Hero film subtle scale on scroll
    const heroFilm = document.querySelector(".hero .film");
    if (heroFilm) {
      gsap.to(heroFilm, {
        scale: 1.08,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    }
  }

  // Keep films alive when tab returns
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !paused && loader.classList.contains("is-done")) {
      setFilmsPlaying(true);
    }
  });
})();
