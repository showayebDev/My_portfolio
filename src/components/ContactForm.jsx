"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Turnstile from "react-turnstile";

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [theme, setTheme] = useState("auto");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") || "auto";
    setTheme(storedTheme);
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [turnstileToken, setTurnstileToken] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!turnstileToken) {
      setErrorMessage("Please verify you are human!");
      setShowError(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData, token: turnstileToken }),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Submission failed");

      setShowSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTurnstileToken("");
      setIsModalOpen(false); // Close modal on success
    } catch (err) {
      setErrorMessage(err.message);
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        className="w-full py-2.5 px-4 bg-[var(--text-color)] text-[var(--bg-color)] hover:opacity-90 rounded-xl font-semibold shadow-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 border border-[var(--border-color)] text-sm"
        onClick={() => setIsModalOpen(true)}
      >
        <span>📫</span>
        <span>Leave a Message</span>
      </button>

      {mounted &&
        isModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="bg-[var(--bg-color)] opacity-100 rounded-xl w-full max-w-md max-h-[90vh] shadow-2xl relative overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-0 relative">
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-color)] mb-2">
                    Contact Me
                  </h2>
                  <p className="text-sm text-[var(--secondary-text-color)]">
                    Send us a message and we&apos;ll get back to you ASAP.
                  </p>
                </div>
                <button
                  className="absolute top-4 right-4 bg-transparent border-none text-2xl cursor-pointer text-[var(--secondary-text-color)] w-8 h-8 flex items-center justify-center rounded transition-colors duration-200 hover:bg-[var(--bg-color)] hover:text-[var(--text-color)]"
                  onClick={() => setIsModalOpen(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {/* name + email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="mb-4 sm:mb-0">
                    <label
                      htmlFor="name"
                      className="block mb-1 font-medium text-[var(--text-color)] text-sm"
                    >
                      Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      required
                      disabled={isSubmitting}
                      className="w-full p-2 border-[2px] border-[var(--border-color)] rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-[var(--text-color)] focus:ring-1 focus:ring-[rgba(var(--text-color-rgb),0.2)] bg-[var(--card-bg-color)] text-[var(--text-color)] disabled:bg-[var(--card-bg-color)] disabled:text-[var(--secondary-text-color)] disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-1 font-medium text-[var(--text-color)] text-sm"
                    >
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                      disabled={isSubmitting}
                      className="w-full p-2 border-[2px] border-[var(--border-color)] rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-[var(--text-color)] focus:ring-1 focus:ring-[rgba(var(--text-color-rgb),0.2)] bg-[var(--card-bg-color)] text-[var(--text-color)] disabled:bg-[var(--card-bg-color)] disabled:text-[var(--secondary-text-color)] disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* subject */}
                <div className="mb-4">
                  <label
                    htmlFor="subject"
                    className="block mb-1 font-medium text-[var(--text-color)] text-sm"
                  >
                    Subject *
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      handleInputChange("subject", e.target.value)
                    }
                    required
                    disabled={isSubmitting}
                    className="w-full p-2 border-[2px] border-[var(--border-color)] rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-[var(--text-color)] focus:ring-1 focus:ring-[rgba(var(--text-color-rgb),0.2)] bg-[var(--card-bg-color)] text-[var(--text-color)] disabled:bg-[var(--card-bg-color)] disabled:text-[var(--secondary-text-color)] disabled:cursor-not-allowed"
                  />
                </div>

                {/* message */}
                <div className="mb-4">
                  <label
                    htmlFor="message"
                    className="block mb-1 font-medium text-[var(--text-color)] text-sm"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      handleInputChange("message", e.target.value)
                    }
                    required
                    disabled={isSubmitting}
                    rows="4"
                    className="w-full p-2 border-[2px] border-[var(--border-color)] rounded-md text-sm transition-all duration-200 focus:outline-none focus:border-[var(--text-color)] focus:ring-1 focus:ring-[rgba(var(--text-color-rgb),0.2)] bg-[var(--card-bg-color)] text-[var(--text-color)] disabled:bg-[var(--card-bg-color)] disabled:text-[var(--secondary-text-color)] disabled:cursor-not-allowed"
                  />
                </div>

                {/* Cloudflare Turnstile */}
                <div className="mb-4">
                  {" "}
                  {/* Added a margin-bottom for spacing */}
                  <Turnstile
                    sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                    onVerify={(token) => {
                      setTurnstileToken(token);
                    }}
                    onExpire={() => setTurnstileToken("")}
                    theme={theme} // Consider making this dynamic based on theme
                  />
                </div>

                <div className="flex gap-3 mt-5 pt-4 border-t border-[var(--border-color)]">
                  <button
                    type="button"
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 border border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] hover:bg-[var(--card-bg-color)] disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed bg-[var(--btn-2-bg)] text-[var(--btn-2-text)] hover:bg-[var(--btn-2-bg-hover)]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                        Sending...
                      </span>
                    ) : (
                      "Send Message"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Success Modal */}
      {mounted &&
        showSuccess &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowSuccess(false)}
          >
            <div
              className="bg-[var(--card-bg-color)] rounded-xl p-8 text-center max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                ✓
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-color)] mb-3">
                Message Sent Successfully!
              </h3>
              <p className="text-[var(--secondary-text-color)] leading-normal mb-6">
                Thank you! I’ll reply as soon as I can.
              </p>
              <button
                className="px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 bg-[var(--btn-2-bg)] text-[var(--btn-2-text)] hover:bg-[var(--btn-2-bg-hover)]"
                onClick={() => setShowSuccess(false)}
              >
                Close
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Error Modal */}
      {mounted &&
        showError &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowError(false)}
          >
            <div
              className="bg-[var(--card-bg-color)] rounded-xl p-8 text-center max-w-sm w-full shadow-2xl border border-red-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                !
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-color)] mb-3">
                Submission Failed
              </h3>
              <p className="text-[var(--secondary-text-color)] leading-normal mb-6">
                {errorMessage}
              </p>
              <button
                className="px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-200 bg-[var(--btn-2-bg)] text-[var(--btn-2-text)] hover:bg-[var(--btn-2-bg-hover)]"
                onClick={() => setShowError(false)}
              >
                Try Again
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
