"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GlobalError({ error, reset }) {
  const email = process.env.NEXT_PUBLIC_EMAIL || "";

  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  // Create dynamic mailto link including error details
  const mailtoLink = useMemo(() => {
    const subject = encodeURIComponent("Website Error Report");
    const body = encodeURIComponent(
      `I found an error on showayeb.dev.\n\nHere are the details:\n\n` +
        `Error Message: ${error?.message || "N/A"}\n` +
        `Error Stack:\n${error?.stack || "No stack trace available."}\n\n` +
        `Browser Info: ${navigator.userAgent}`
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }, [error, email]);

  return (
    <div
      className="flex flex-col items-center justify-center my-[50px] text-center px-6"
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
      }}
    >
      {/* Animated warning icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="text-8xl md:text-9xl font-extrabold mb-4"
        style={{
          color: "var(--btn-1-bg)",
        }}
      >
        ⚠️
      </motion.div>

      {/* Title */}
      <h1
        className="text-3xl md:text-4xl font-bold mb-3"
        style={{ color: "var(--text-color)" }}
      >
        Something went wrong!
      </h1>

      {/* Subtitle */}
      <p
        className="max-w-md mb-6"
        style={{ color: "var(--secondary-text-color)" }}
      >
        An unexpected error occurred. You can try again, go back to the home
        page, or report this issue.
      </p>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        {/* Try Again */}
        <button
          onClick={() => reset()}
          className="px-6 py-3 transition duration-300 shadow-md"
          style={{
            backgroundColor: "var(--btn-1-bg)",
            color: "var(--btn-1-text)",
            borderRadius: "var(--radius)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--btn-1-bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--btn-1-bg)")
          }
        >
          🔁 Try Again
        </button>

        {/* Home Button */}
        <Link
          href="/"
          className="px-6 py-3 transition duration-300 shadow-md"
          style={{
            backgroundColor: "var(--btn-2-bg)",
            color: "var(--btn-2-text)",
            borderRadius: "var(--radius)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--btn-2-bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--btn-2-bg)")
          }
        >
          🏠 Back to Home
        </Link>

        {/* Report Error */}
        {email && (
          <a
            href={mailtoLink}
            className="px-6 py-3 transition duration-300 shadow-md"
            style={{
              backgroundColor: "var(--card-bg-color)",
              color: "var(--text-color)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--btn-2-bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--card-bg-color)")
            }
          >
            📧 Report This Error
          </a>
        )}
      </div>

      {/* Footer note */}
      {email && (
        <p
          className="text-sm mt-8"
          style={{ color: "var(--secondary-text-color)" }}
        >
          Need help?{" "}
          <Link
            href={`mailto:${email}`}
            className="underline hover:opacity-80"
            style={{ color: "var(--text-color)" }}
          >
            Contact support
          </Link>
        </p>
      )}
    </div>
  );
}
