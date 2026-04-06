const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealTargets = document.querySelectorAll("[data-reveal]");
const parallaxTargets = document.querySelectorAll("[data-depth]");
const topbar = document.querySelector(".topbar");
const pointerGlow = document.querySelector(".pointer-glow");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  }
);

revealTargets.forEach((element) => {
  if (prefersReducedMotion.matches) {
    element.classList.add("is-visible");
    return;
  }
  revealObserver.observe(element);
});

let pointerX = window.innerWidth * 0.5;
let pointerY = window.innerHeight * 0.2;
let rafId = null;

const updatePointerGlow = () => {
  document.documentElement.style.setProperty("--pointer-x", `${pointerX}px`);
  document.documentElement.style.setProperty("--pointer-y", `${pointerY}px`);
  rafId = null;
};

window.addEventListener("pointermove", (event) => {
  pointerX = event.clientX;
  pointerY = event.clientY;

  if (!pointerGlow || prefersReducedMotion.matches) {
    return;
  }

  if (rafId === null) {
    rafId = window.requestAnimationFrame(updatePointerGlow);
  }
});

const applyParallax = () => {
  if (prefersReducedMotion.matches) {
    parallaxTargets.forEach((element) => {
      element.style.transform = "";
    });
    return;
  }

  const viewportHeight = window.innerHeight;

  parallaxTargets.forEach((element) => {
    const rect = element.getBoundingClientRect();
    const depth = Number(element.dataset.depth || "0");
    const centerOffset = rect.top + rect.height / 2 - viewportHeight / 2;
    const translateY = centerOffset * depth * -0.18;
    const translateX = (pointerX - window.innerWidth / 2) * depth * 0.02;
    element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
  });
};

const onScroll = () => {
  if (topbar) {
    topbar.classList.toggle("is-condensed", window.scrollY > 24);
  }
  applyParallax();
};

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", applyParallax);
window.addEventListener("load", applyParallax);

onScroll();
