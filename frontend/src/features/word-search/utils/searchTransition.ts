const SEARCH_TRANSITION_CLASS = "search-route-leaving";
const SEARCH_NAVIGATION_DELAY_MS = 70;
const SEARCH_TRANSITION_FALLBACK_MS = 3000;

interface SearchTransitionRouter {
  push: (href: string) => void;
}

function shouldReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function navigateWithSearchTransition(
  router: SearchTransitionRouter,
  href: string,
) {
  if (typeof window === "undefined" || shouldReduceMotion()) {
    router.push(href);
    return;
  }

  document.documentElement.classList.add(SEARCH_TRANSITION_CLASS);

  window.setTimeout(() => {
    router.push(href);
  }, SEARCH_NAVIGATION_DELAY_MS);

  window.setTimeout(() => {
    document.documentElement.classList.remove(SEARCH_TRANSITION_CLASS);
  }, SEARCH_TRANSITION_FALLBACK_MS);
}

export function finishSearchTransition() {
  if (typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      document.documentElement.classList.remove(SEARCH_TRANSITION_CLASS);
    });
  });
}
