"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiHome, FiArrowLeft } from "react-icons/fi";

export default function NotFoundClient() {
  const router = useRouter();

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="relative max-w-md w-full collage-card p-8 sm:p-10 text-center shadow-lg border border-[var(--border-color)] overflow-visible">
        {/* Subtle decorative washi tape accent */}
        <div className="washi-tape washi-tape-center washi-tape-coral !w-[100px] !h-[20px]" />

        {/* 404 Minimal Typography */}
        <div className="select-none mt-2">
          <div className="text-7xl sm:text-8xl font-black font-serif tracking-tight text-[var(--text-color)]">
            404
          </div>
          <span className="collage-handwritten text-xl sm:text-2xl text-[var(--link-color)] block mt-1 font-bold">
            Page Not Found
          </span>
        </div>

        {/* Short, minimal description */}
        <p className="text-sm text-[var(--secondary-text-color)] mt-3 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Minimal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-7">
          <Link
            href="/"
            className="tactile-btn tactile-btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold shadow-sm hover:scale-[1.02] transition-transform"
          >
            <FiHome className="text-base" />
            <span>Back to Home</span>
          </Link>

          <button
            type="button"
            onClick={handleGoBack}
            className="tactile-btn w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold hover:bg-[var(--card-kraft-color)] transition-colors"
          >
            <FiArrowLeft className="text-base" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Minimal error code indicator */}
        <div className="mt-8 pt-5 border-t border-dashed border-[var(--border-subtle)] text-[11px] collage-mono text-[var(--secondary-text-color)]">
          HTTP 404 • Resource Not Located
        </div>
      </div>
    </div>
  );
}
