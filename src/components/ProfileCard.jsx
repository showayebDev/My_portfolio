"use client";
import { MdEmail } from "react-icons/md";
import React, { useContext } from "react";
import Image from "next/image";
import Link from "next/link";
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

const iconClass =
  "text-[1.5rem] cursor-pointer transition-transform duration-300 ease-in-out hover:scale-125";

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
        <section className="bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-2xl p-8 flex flex-col items-center text-center shadow-lg">
          {/* Header Row */}
          <div className="flex justify-between items-center w-full mb-6 text-[var(--secondary-text-color)]">
            {showToggle ? (
              <button
                onClick={toggleTheme}
                className="cursor-pointer text-xl text-[var(--secondary-text-color)] hover:text-[var(--text-color)] transition-colors duration-200"
                title="Toggle Theme"
              >
                {theme === "light" ? (
                  <FaMoon className="w-5 h-5" />
                ) : theme === "dark" ? (
                  <CgLaptop className="w-5 h-5" />
                ) : (
                  <FaSun className="w-5 h-5" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6" />
            )}
            <span className="text-lg font-bold tracking-wide text-[var(--text-color)]">
              About me
            </span>
            <div className="w-6 h-6" />
          </div>

          {/* Profile Avatar & Status Section */}
          <div className="relative mb-6 group flex flex-col items-center">
            {/* Status Badge */}
            {status && (
              <div className="mb-3 px-3 py-1 text-xs font-medium text-[var(--text-color)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-full shadow-sm max-w-[200px] truncate animate-pulse">
                {status}
              </div>
            )}

            {/* Profile Image */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--border-color)] shadow-md transition-transform duration-500 group-hover:scale-105 relative bg-[var(--bg-color)] flex items-center justify-center">
              {avatarSrc ? (
                <Image
                  alt={name || "Profile"}
                  className="w-full h-full object-cover"
                  src={avatarSrc}
                  width={128}
                  height={128}
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

          {/* Bio text */}
          {(greeting || name) && (
            <p className="text-base text-[var(--secondary-text-color)] leading-relaxed">
              {greeting && `${greeting} `}
              {name && (
                <span className="text-[var(--text-color)] font-semibold">
                  {name}
                </span>
              )}
              {name && "."}
            </p>
          )}
          {bio && (
            <p className="text-xs text-[var(--secondary-text-color)] mt-4 leading-relaxed max-w-[240px]">
              {bio}
            </p>
          )}

          {((showJob && job) || (showLocation && location) || (showExperience && experience)) && (
            <>
              <div className="w-full border-t border-[var(--border-color)] my-8"></div>

              {/* Quick Info */}
              <div className="w-full space-y-4 text-sm text-[var(--secondary-text-color)]">
                {showJob && job && (
                  <div className="flex justify-between items-center">
                    <span>Job</span>
                    <span className="text-[var(--text-color)] font-medium">
                      {job}
                    </span>
                  </div>
                )}
                {showLocation && location && (
                  <div className="flex justify-between items-center">
                    <span>Location</span>
                    <span className="text-[var(--text-color)] font-medium">
                      {location}
                    </span>
                  </div>
                )}
                {showExperience && experience && (
                  <div className="flex justify-between items-center">
                    <span>Experience</span>
                    <span className="text-[var(--text-color)] font-medium">
                      {experience}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Reach Me Section */}
          {(socials.length > 0 || email) && (
            <div className="relative w-full flex items-center justify-center my-8">
              <span className="bg-[var(--card-bg-color)] px-4 text-xs font-semibold uppercase tracking-wider text-[var(--secondary-text-color)] z-10">
                Reach me
              </span>
              <div className="absolute w-full border-t border-[var(--border-color)]"></div>
            </div>
          )}

          {/* Social Links */}
          <div className="w-full space-y-4 text-xs">
            {socials.map((social, index) => {
              let IconComponent;
              let hoverColor = "hover:text-[var(--text-color)]";
              const platformLower = (social.platform || "").toLowerCase();

              if (platformLower === "github") {
                IconComponent = BsGithub;
                hoverColor = "hover:text-[#333] dark:hover:text-white";
              } else if (platformLower === "instagram") {
                IconComponent = AiOutlineInstagram;
                hoverColor = "hover:text-[#e1306c]";
              } else if (platformLower === "facebook") {
                IconComponent = BsFacebook;
                hoverColor = "hover:text-[#1877f2]";
              } else if (platformLower === "whatsapp") {
                IconComponent = BsWhatsapp;
                hoverColor = "hover:text-[#25d366]";
              } else if (platformLower === "discord") {
                IconComponent = BsDiscord;
                hoverColor = "hover:text-[#5865f2]";
              } else if (platformLower === "linkedin") {
                IconComponent = BsLinkedin;
                hoverColor = "hover:text-[#0a66c2]";
              } else if (platformLower === "twitter") {
                IconComponent = BsTwitter;
                hoverColor = "hover:text-[#1da1f2]";
              } else if (platformLower === "youtube") {
                IconComponent = BsYoutube;
                hoverColor = "hover:text-[#ff0000]";
              } else if (platformLower === "telegram") {
                IconComponent = BsTelegram;
                hoverColor = "hover:text-[#0088cc]";
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
              } catch (e) {}

              return (
                <Link
                  key={social.id || `${social.platform}-${index}`}
                  href={social.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between items-center group cursor-pointer text-[var(--secondary-text-color)] hover:text-[var(--text-color)] transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent
                      className={`${iconClass} ${hoverColor} icon`}
                      aria-label={social.name}
                    />
                    <span className="font-medium">{social.platform}</span>
                  </div>
                  <span className="text-[var(--text-color)] transition-colors group-hover:underline">
                    {username}
                  </span>
                </Link>
              );
            })}

            {email && (
              <Link
                href={`mailto:${email}`}
                className="flex justify-between items-center group cursor-pointer text-[var(--secondary-text-color)] hover:text-[var(--text-color)] transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <MdEmail
                    className={`${iconClass} hover:text-[#1877f2] icon`}
                    aria-label="Email"
                  />
                  <span className="font-medium">Email</span>
                </div>
                <span className="text-[var(--text-color)] transition-colors group-hover:underline break-all max-w-[150px] text-right">
                  {email}
                </span>
              </Link>
            )}
          </div>
        </section>
      </AnimatedContent>
    </aside>
  );
};

export default ProfileCard;
