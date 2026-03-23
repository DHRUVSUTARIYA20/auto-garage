import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const isTypingElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || target.isContentEditable) return true;
  return false;
};

export const GlobalShortcuts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const lastKeyRef = useRef<string | null>(null);
  const lastTimeRef = useRef<number>(0);

  const getDashboardUrl = (role: string) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "manager") return "/garage/dashboard";
    if (role === "staff" || role === "mechanic") return "/mechanic/dashboard";
    return "/customer/dashboard";
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingElement(event.target)) return;

      const now = Date.now();
      const key = event.key.toLowerCase();

      // "/" → go to garages + focus search
      if (key === "/") {
        event.preventDefault();
        if (location.pathname !== "/garages") {
          navigate("/garages");
          // give router a moment to render page before focusing
          window.setTimeout(() => {
            const input = document.getElementById("global-garage-search") as HTMLInputElement | null;
            input?.focus();
            input?.select();
          }, 250);
        } else {
          const input = document.getElementById("global-garage-search") as HTMLInputElement | null;
          input?.focus();
          input?.select();
        }
        return;
      }

      // key combos: "g" + "d" => dashboard
      const lastKey = lastKeyRef.current;
      const lastTime = lastTimeRef.current;
      const withinComboWindow = now - lastTime < 1200;

      if (key === "g") {
        lastKeyRef.current = "g";
        lastTimeRef.current = now;
        return;
      }

      if (key === "d" && lastKey === "g" && withinComboWindow) {
        event.preventDefault();
        navigate(getDashboardUrl(user?.role || "customer"));
        lastKeyRef.current = null;
        lastTimeRef.current = 0;
        return;
      }

      // reset combo if other keys pressed
      lastKeyRef.current = null;
      lastTimeRef.current = 0;
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [location.pathname, navigate]);

  return null;
};

