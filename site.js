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
    if (window.ScrollTrigger) {
      ScrollTrigger.getAll().forEach((st) => {
        if (paused) st.disable(false);
        else st.enable(false);
      });
    }
    /* Pause freezes all motion: GSAP + smooth scroll */ if(window.gsap){gsap.globalTimeline[paused?'pause':'resume']();}if(typeof lenis!=='undefined'&&lenis){lenis.options.smoothWheel=!paused;}
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
      lenis.raf(time * 1000);
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

/* iOS Safari safety net: one-shot scroll reveals always end visible.
   Covers (1) Pause freezing GSAP mid-page, (2) stale trigger positions after fonts/films change layout,
   (3) momentum scroll landing at the very bottom without a trigger firing. */
(function(){
  var g=window.gsap,ST=window.ScrollTrigger;if(!g||!ST)return;
  function shots(){return ST.getAll().filter(function(s){return s.animation&&!s.vars.scrub;});}
  function sweep(){
    var vh=window.innerHeight,de=document.documentElement;
    var y=window.scrollY||de.scrollTop||0;var atEnd=y>0&&de.scrollHeight>vh*1.5&&y+vh>=de.scrollHeight-8;
    var frozen=g.globalTimeline.paused();var all=shots();if(!all.length)return;
    all.forEach(function(s){
      var a=s.animation,t=s.trigger;if(!a||a.progress()>=1)return;
      if(frozen||atEnd){a.progress(1);return;}
      if(a.isActive())return;if(y>=s.start+2||(t&&t.getBoundingClientRect().top<vh*0.5))a.play();
    });
  }
  var q=null;function later(){clearTimeout(q);q=setTimeout(sweep,180);}
  window.addEventListener('scroll',later,{passive:true});
  window.addEventListener('touchend',later,{passive:true});
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('.motion,.motion-toggle,#pauseBtn,.pause'))setTimeout(sweep,0);},true);
  setInterval(sweep,1200);
  function refresh(){if(ST.getAll().length){try{ST.refresh();}catch(e){}}later();}
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(refresh);
  window.addEventListener('load',function(){setTimeout(refresh,1500);});
})();
