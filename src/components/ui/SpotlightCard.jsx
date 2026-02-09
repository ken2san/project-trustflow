import React, { useRef, useState, useCallback } from "react";

const SpotlightCard = React.memo(({ children, className = "", onClick }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = useCallback((e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => { setOpacity(0); if (divRef.current) divRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`; }}
      onClick={onClick}
      className={`relative overflow-hidden border border-white/5 bg-[#0f172a] backdrop-blur-xl transition-all duration-300 ease-out ${className}`}
    >
      <div className="pointer-events-none absolute -inset-px transition duration-300 z-0" style={{ opacity, background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.1), transparent 40%)` }} />
      <div className="pointer-events-none absolute -inset-px transition duration-300 z-0" style={{ opacity, background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.4), transparent 40%)`, maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)', maskComposite: 'exclude', WebkitMaskComposite: 'xor', padding: '1px' }} />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
});

export default SpotlightCard;
