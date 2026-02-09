import React, { useState, useEffect } from "react";
import useInterval from "../../hooks/useInterval";

const Typewriter = ({ text = "", delay = 30 }) => {
  const [currentText, setCurrentText] = useState('');
  const [index, setIndex] = useState(0);
  useEffect(() => { setCurrentText(''); setIndex(0); }, [text]);
  useInterval(() => { if (text && index < text.length) { setCurrentText((prev) => prev + text.charAt(index)); setIndex(prev => prev + 1); } }, (text && index < text.length) ? delay : null);
  return <span>{currentText}</span>;
};

export default Typewriter;
