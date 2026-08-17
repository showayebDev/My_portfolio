"use client";
import React from "react";
import {
  FiGithub,
  FiTag,
  FiDownload,
  FiArrowUpRight,
  FiBookOpen,
  FiPlayCircle,
  FiPackage,
  FiExternalLink,
} from "react-icons/fi";
import { TbBuildingStore } from "react-icons/tb";

const Button = ({ text, link, className, style, icon: CustomIcon, children }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  const getIcon = () => {
    if (CustomIcon) return <CustomIcon className="text-base shrink-0" />;
    const lower = (text || "").toLowerCase().trim();

    // GitHub / Source Code
    if (lower.includes("github") || lower.includes("repo") || lower.includes("source")) {
      return <FiGithub className="text-base shrink-0" />;
    }

    // Marketplace / Store / Extension / VS Code
    if (lower.includes("marketplace") || lower.includes("store") || lower.includes("extension") || lower.includes("vscode")) {
      return <TbBuildingStore className="text-base shrink-0" />;
    }

    // Release / Tag / Version
    if (lower.includes("release") || lower.includes("tag") || lower.includes("version")) {
      return <FiTag className="text-base shrink-0" />;
    }

    // Download / Install / Get
    if (lower.includes("download") || lower.includes("install") || lower.includes("get")) {
      return <FiDownload className="text-base shrink-0" />;
    }

    // Documentation / Guide / Docs / Manual
    if (lower.includes("doc") || lower.includes("guide") || lower.includes("wiki") || lower.includes("manual")) {
      return <FiBookOpen className="text-base shrink-0" />;
    }

    // Video / Tutorial / Watch / Demo Video
    if (lower.includes("video") || lower.includes("tutorial") || lower.includes("watch") || lower.includes("youtube")) {
      return <FiPlayCircle className="text-base shrink-0" />;
    }

    // Package / NPM / PyPI / Module
    if (lower.includes("package") || lower.includes("npm") || lower.includes("pypi") || lower.includes("crate")) {
      return <FiPackage className="text-base shrink-0" />;
    }

    // Live / Website / Demo / Site / Visit / App
    if (lower.includes("live") || lower.includes("demo") || lower.includes("website") || lower.includes("site") || lower.includes("visit") || lower.includes("app")) {
      return <FiExternalLink className="text-base shrink-0" />;
    }

    // Default Fallback Icon
    return <FiArrowUpRight className="text-base shrink-0 opacity-80" />;
  };

  const iconElement = getIcon();

  return (
    <button onClick={handleClick} className={className} style={style}>
      {iconElement}
      {children || <span>{text}</span>}
    </button>
  );
};

export default Button;
