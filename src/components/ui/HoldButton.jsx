import React, { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import useInterval from "../../hooks/useInterval";


const HoldButton = ({ onClick, label, icon: Icon, className = "", color, disabled = false, holdKey }) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Reset isCompleted and progress when disabled changes or holdKey changes
  const prevDisabledRef = React.useRef(disabled);
  const prevHoldKeyRef = React.useRef(holdKey);
  useEffect(() => {
    if (disabled) {
      setIsHolding(false);
      setProgress(0);
      setIsCompleted(false);
    } else if (prevDisabledRef.current || prevHoldKeyRef.current !== holdKey) {
      setIsCompleted(false);
      setProgress(0);
    }
    prevDisabledRef.current = disabled;
    prevHoldKeyRef.current = holdKey;
  }, [disabled, holdKey]);

  useInterval(() => {
    if (isHolding && !isCompleted && !disabled && isReady) {
      setProgress((prev) => Math.min(prev + 5, 100));
    }
  }, isHolding ? 16 : null);

  useEffect(() => {
    if (progress >= 100 && !isCompleted) {
      setIsCompleted(true);
      setIsHolding(false);
      setTimeout(() => onClick(), 0);
    }
  }, [progress, isCompleted, onClick]);

  const startHold = () => { if (!isCompleted && !disabled && isReady) setIsHolding(true); };
  const endHold = () => { if (!isCompleted) { setIsHolding(false); setProgress(0); } };

  let bgClassFinal = "";
  let textClass = "";
  let fillClassFinal = "bg-indigo-400"; // default progress bar color
  let labelClass = "";
  if (color === "indigo") {
    bgClassFinal = "bg-indigo-600";
    textClass = "text-white";
    fillClassFinal = "bg-indigo-400";
  } else if (color === "red") {
    bgClassFinal = "bg-rose-950/30 border border-rose-500/30";
    fillClassFinal = "bg-rose-500";
    labelClass = "text-rose-500";
  }
  const isInteractive = !disabled && isReady;

  return (
    <button
      onMouseDown={startHold} onMouseUp={endHold} onMouseLeave={endHold} onTouchStart={startHold} onTouchEnd={endHold}
      disabled={!isInteractive}
      className={`relative overflow-hidden group select-none ${className} ${bgClassFinal} ${textClass} ${!isInteractive ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
      style={{ WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s', transform: isHolding ? 'scale(0.98)' : 'scale(1)' }}
    >
      <div className={`absolute inset-0 ${fillClassFinal} transition-all duration-75 ease-linear opacity-50`} style={{ width: `${progress}%` }} />
      <div className="relative z-10 flex items-center justify-center gap-3 w-full h-full">
        {isCompleted ? <CheckCircle2 className="w-6 h-6 animate-scale-up" /> : <><span className={`transition-transform ${labelClass}`}>{label}</span>{Icon && <Icon className={`w-5 h-5 transition-transform ${labelClass}`} />}</>}
      </div>
    </button>
  );
};

export default HoldButton;
