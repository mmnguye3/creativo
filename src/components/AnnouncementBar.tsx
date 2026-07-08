import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "cretivo_announcement_dismissed";

const AnnouncementBar = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="relative z-50 bg-orange-500 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <p className="text-white text-sm font-semibold text-center leading-snug">
          <span className="mr-1">✦</span>
          New: AI-powered design briefs — generate yours in the{" "}
          <Link
            to="/dashboard"
            className="underline underline-offset-2 hover:text-orange-100 transition-colors"
          >
            dashboard
          </Link>
          <span className="ml-1">✦</span>
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
