import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const useIdleLogout = (timeout, redirectTo) => {
  const navigate = useNavigate();
  const timerRef = useRef();

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Perform logout logic here
      localStorage.removeItem("token");
      navigate(redirectTo, { replace: true });
    }, timeout);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer(); // start timer initially

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeout, navigate, redirectTo]);
};

export default useIdleLogout;
