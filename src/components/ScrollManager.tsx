import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Keeps the viewport in step with client-side navigation: a link that carries a
 * section (#pricing) lands on that section, a link to a plain route lands at the
 * top of the page. Back/forward keeps the browser's own scroll position.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation();
  const backForward = useRef(false);

  useEffect(() => {
    const onPopState = () => {
      backForward.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (backForward.current) {
      backForward.current = false;
      return;
    }

    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    let attempts = 0;
    let timer = 0;

    // The section can render a frame or two after the route changes, so keep
    // looking for it briefly instead of landing at the top of the page.
    const scrollToSection = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: "start" });
        return;
      }
      if (attempts++ < 25) timer = window.setTimeout(scrollToSection, 80);
    };

    scrollToSection();
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}
