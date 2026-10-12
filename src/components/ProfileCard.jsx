"use client";
import React, { useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import { MdEmail } from "react-icons/md";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";
import { ThemeContext } from "@/context/ThemeContext";
import { FaSun, FaMoon, FaLink } from "react-icons/fa";
import { CgLaptop } from "react-icons/cg";
import {
  BsGithub,
  BsFacebook,
  BsWhatsapp,
  BsDiscord,
  BsLinkedin,
  BsTwitter,
  BsYoutube,
  BsTelegram,
} from "react-icons/bs";
import { AiOutlineInstagram } from "react-icons/ai";

const ProfileCard = ({ profile = {} }) => {
  const { theme, toggleTheme, showToggle } = useContext(ThemeContext);

  const name = profile.name || "";
  const greeting = profile.greeting || "";
  const bio = profile.bio || "";
  const status = profile.status ? profile.status.trim() : "";
  const job = profile.job || "";
  const location = profile.location || "";

  const showJob =
    profile.showJob !== false &&
    profile.showJob !== 0 &&
    profile.show_job !== 0;

  const showLocation =
    profile.showLocation !== false &&
    profile.showLocation !== 0 &&
    profile.show_location !== 0;

  const showExperience =
    profile.showExperience !== false &&
    profile.showExperience !== 0 &&
    profile.show_experience !== 0;

  const rawExperience = profile.experience;
  const currentYear = new Date().getFullYear();
  let experience = "";

  if (
    rawExperience !== undefined &&
    rawExperience !== null &&
    String(rawExperience).trim() !== ""
  ) {
    const parsedYear = parseInt(String(rawExperience).trim(), 10);
    if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear <= currentYear) {
      const diff = currentYear - parsedYear;
      experience = `${diff}+ Years`;
    } else {
      experience = String(rawExperience);
    }
  }

  const avatarSrc =
    (typeof profile.avatar === "object" && profile.avatar?.url)
      ? profile.avatar.url
      : profile.avatarUrl || null;

  const email = profile.email || "";
  const socials = Array.isArray(profile.socials) ? profile.socials : [];
  const hasQuickInfo = Boolean((showJob && job) || (showLocation && location) || (showExperience && experience));

  return (
    <aside className="w-full lg:w-1/3 xl:w-1/4 space-y-8" id="profile">
      <AnimatedContent
        distance={20}
        direction="vertical"
        reverse={false}
        duration={0.3}
        ease="power2.out"
        initialOpacity={0.7}
        animateOpacity
        scale={0.99}
        threshold={0.05}
      >
        <section className="collage-card p-6 sm:p-7 md:p-8 lg:p-7 flex flex-col items-center text-center relative overflow-visible">
          {/* Top Washi Tape Strips (Physical Collage Anchors) */}
          <div className="washi-tape washi-tape-center washi-tape-amber" />
          <div className="washi-tape washi-tape-corner-right washi-tape-sage" />

          {/* Header Row: Theme Toggle + DYMO Tape Label + Archive No */}
          <div className="flex justify-between items-center w-full mb-6 pt-1 text-[var(--secondary-text-color)]">
            {showToggle ? (
              <button
                onClick={toggleTheme}
                className="die-cut-sticker p-2 hover:bg-[var(--card-kraft-color)] cursor-pointer"
                title="Toggle Moodboard Light / Dark"
              >
                {theme === "light" ? (
                  <FaMoon className="w-4 h-4 text-amber-900" />
                ) : theme === "dark" ? (
                  <CgLaptop className="w-4 h-4 text-amber-200" />
                ) : (
                  <FaSun className="w-4 h-4 text-amber-500" />
                )}
              </button>
            ) : (
              <div className="w-8 h-8" />
            )}

            <div className="dymo-label">
              <span>✦ PROFILE ✦</span>
            </div>

            <div className="w-8 h-8" />
          </div>

          {/* Profile Body: 2 columns side-by-side on md to lg, single column on mobile (<md) and desktop (lg+) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 md:gap-8 items-start">
            {/* Section 1: Visual Identity & Bio */}
            <div className="flex flex-col items-center text-center w-full">
              {/* Status Postage Stamp Badge */}
              {status && (
                <div className="mb-5 postage-stamp bg-[var(--card-kraft-color)] border-dashed border-[var(--border-color)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-color)]">
                    {status}
                  </span>
                </div>
              )}

              {/* Vintage Polaroid Avatar */}
              <div className="mb-6 relative group">
                {/* Tiny piece of tape on the polaroid top */}
                <div className="washi-tape washi-tape-center washi-tape-coral !w-[60px] !h-[16px] !top-[-8px]" />

                <div className="polaroid-frame">
                  <div className="w-32 h-32 overflow-hidden border border-[var(--border-color)] bg-[var(--card-kraft-color)] flex items-center justify-center">
                    {avatarSrc ? (
                      <Image
                        alt={name || "Profile"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={avatarSrc}
                        width={140}
                        height={140}
                        quality={90}
                        priority
                      />
                    ) : (
                      <span className="text-4xl text-[var(--secondary-text-color)] select-none">
                        {name ? name.charAt(0).toUpperCase() : "👤"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Name & Greeting Typography */}
              {(greeting || name) && (
                <div className="mb-2">
                  <p className="collage-handwritten text-xl text-[var(--link-color)] font-bold -rotate-1">
                    {greeting || "Hello there!"}
                  </p>
                  <h1 className="collage-serif text-2xl font-extrabold text-[var(--text-color)] mt-0.5">
                    {name}
                  </h1>
                </div>
              )}

              {/* Bio in Archival Index Paper Scrap */}
              {bio && (
                <div className="w-full mt-3 p-3.5 bg-[var(--card-kraft-color)] border border-[var(--border-color)] rounded-xl shadow-inner relative text-left">
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded text-[9px] collage-mono font-bold uppercase tracking-wider text-[var(--secondary-text-color)]">
                    NOTE
                  </div>
                  <p className="text-xs text-[var(--text-color)] leading-relaxed font-medium">
                    {bio}
                  </p>
                </div>
              )}
            </div>

            {/* Section 2: Quick Info & Postal Dispatch / Socials */}
            <div className="flex flex-col w-full md:border-l md:border-dashed md:border-[var(--border-subtle)] md:pl-8 lg:border-l-0 lg:pl-0 md:justify-center">
              {/* Quick Info Field Entries */}
              {hasQuickInfo && (
                <div className="w-full mt-6 md:mt-0 pt-5 md:pt-0 border-t-2 md:border-t-0 lg:border-t-2 lg:pt-5 lg:mt-6 border-dashed border-[var(--border-subtle)] space-y-2.5 text-xs">
                  {showJob && job && (
                    <div className="flex justify-between items-center bg-[var(--card-note-color)] px-3 py-2 rounded-lg border border-[var(--border-subtle)]">
                      <span className="collage-mono text-[10px] uppercase font-bold text-[var(--secondary-text-color)]">
                        [ROLE]
                      </span>
                      <span className="text-[var(--text-color)] font-bold">
                        {job}
                      </span>
                    </div>
                  )}
                  {showLocation && location && (
                    <div className="flex justify-between items-center bg-[var(--card-note-color)] px-3 py-2 rounded-lg border border-[var(--border-subtle)]">
                      <span className="collage-mono text-[10px] uppercase font-bold text-[var(--secondary-text-color)]">
                        [BASE]
                      </span>
                      <span className="text-[var(--text-color)] font-bold">
                        {location}
                      </span>
                    </div>
                  )}
                  {showExperience && experience && (
                    <div className="flex justify-between items-center bg-[var(--card-note-color)] px-3 py-2 rounded-lg border border-[var(--border-subtle)]">
                      <span className="collage-mono text-[10px] uppercase font-bold text-[var(--secondary-text-color)]">
                        [EXP]
                      </span>
                      <span className="text-[var(--text-color)] font-bold">
                        {experience}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Postal Dispatch & Social Stickers */}
              {(socials.length > 0 || email) && (
                <div className={`w-full ${hasQuickInfo ? "mt-7 md:mt-6 pt-4 border-t-2 border-dashed border-[var(--border-subtle)]" : "mt-6 md:mt-0 pt-4 md:pt-0 border-t-2 md:border-t-0 lg:border-t-2 lg:pt-4 lg:mt-6 border-dashed border-[var(--border-subtle)]"}`}>
                  <div className="flex items-center justify-center mb-4">
                    <span className="dymo-label bg-[var(--stamp-red)] text-white text-[10px]">
                      DISPATCH // REACH ME
                    </span>
                  </div>

                  <div className="w-full space-y-2 text-xs">
                    {socials.map((social, index) => {
                      let IconComponent;
                      const platformLower = (social.platform || "").toLowerCase();

                      if (platformLower === "github") {
                        IconComponent = BsGithub;
                      } else if (platformLower === "instagram") {
                        IconComponent = AiOutlineInstagram;
                      } else if (platformLower === "facebook") {
                        IconComponent = BsFacebook;
                      } else if (platformLower === "whatsapp") {
                        IconComponent = BsWhatsapp;
                      } else if (platformLower === "discord") {
                        IconComponent = BsDiscord;
                      } else if (platformLower === "linkedin") {
                        IconComponent = BsLinkedin;
                      } else if (platformLower === "twitter") {
                        IconComponent = BsTwitter;
                      } else if (platformLower === "youtube") {
                        IconComponent = BsYoutube;
                      } else if (platformLower === "telegram") {
                        IconComponent = BsTelegram;
                      } else {
                        IconComponent = FaLink;
                      }

                      let username = social.name;
                      try {
                        const cleanUrl = (social.url || "").replace(/\/$/, "");
                        const parts = cleanUrl.split("/");
                        const lastPart = parts[parts.length - 1] || social.name;

                        if (
                          platformLower === "github" ||
                          platformLower === "facebook" ||
                          platformLower === "linkedin"
                        ) {
                          username = lastPart;
                        } else if (
                          platformLower === "instagram" ||
                          platformLower === "twitter" ||
                          platformLower === "telegram"
                        ) {
                          username = lastPart.startsWith("@") ? lastPart : "@" + lastPart;
                        } else if (platformLower === "whatsapp") {
                          username = lastPart;
                        }
                      } catch (_e) {}

                      return (
                        <Link
                          key={social.id || `${social.platform}-${index}`}
                          href={social.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex justify-between items-center p-2.5 bg-[var(--card-note-color)] hover:bg-[var(--card-kraft-color)] border border-[var(--border-color)] rounded-xl transition-all duration-200 group hover:translate-x-1 shadow-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-[var(--card-bg-color)] border border-[var(--border-color)] flex items-center justify-center text-sm text-[var(--text-color)] group-hover:rotate-6 transition-transform">
                              <IconComponent />
                            </span>
                            <span className="font-bold text-[var(--text-color)]">
                              {social.platform}
                            </span>
                          </div>
                          <span className="collage-mono text-[11px] text-[var(--secondary-text-color)] group-hover:text-[var(--link-color)] transition-colors truncate max-w-[120px] md:max-w-[180px] lg:max-w-[120px]">
                            {username}
                          </span>
                        </Link>
                      );
                    })}

                    {email && (
                      <Link
                        href={`mailto:${email}`}
                        className="flex justify-between items-center p-2.5 bg-[var(--card-note-color)] hover:bg-[var(--card-kraft-color)] border border-[var(--border-color)] rounded-xl transition-all duration-200 group hover:translate-x-1 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[var(--card-bg-color)] border border-[var(--border-color)] flex items-center justify-center text-sm text-[var(--stamp-red)] group-hover:rotate-6 transition-transform">
                            <MdEmail />
                          </span>
                          <span className="font-bold text-[var(--text-color)]">
                            Email
                          </span>
                        </div>
                        <span className="collage-mono text-[11px] text-[var(--secondary-text-color)] group-hover:text-[var(--link-color)] transition-colors truncate max-w-[120px] md:max-w-[180px] lg:max-w-[120px]">
                          {email}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </AnimatedContent>
    </aside>
  );
};

export default ProfileCard;
