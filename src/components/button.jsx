"use client";
import React from "react";

const Button = ({ text, link, className, style }) => {
  const handleClick = () => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <button onClick={handleClick} className={className} style={style}>
      {text}
    </button>
  );
};

export default Button;
