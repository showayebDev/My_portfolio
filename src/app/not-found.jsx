"use client";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center w-full text-center px-4"
      style={{
        backgroundColor: "var(--bg-color)",
        color: "var(--text-color)",
        padding: "6px 4px",
      }}
    >
      <h1
        className="font-bold"
        style={{
          fontSize: "6rem",
          color: "var(--btn-color-2-bg)",
        }}
      >
        404
      </h1>

      <p style={{ fontSize: "1.25rem", color: "var(--text-color)" }}>
        Oops! Page not found.
      </p>

      <p
        className="mt-2 mb-6"
        style={{
          color: "var(--secondary-text-color)",
          maxWidth: "400px",
        }}
      >
        The page you’re looking for doesn’t exist or may have been moved.
      </p>

      <Link
        href="/"
        className="rounded-lg font-medium transition-colors duration-300 shadow"
        style={{
          backgroundColor: "var(--btn-color-2-bg)",
          color: "var(--btn-color-2-text)",
          padding: "6px 4px",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor =
            "var(--btn-color-2-bg-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--btn-color-2-bg)")
        }
      >
        Go Home
      </Link>
    </div>
  );
}
