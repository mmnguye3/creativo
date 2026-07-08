import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
