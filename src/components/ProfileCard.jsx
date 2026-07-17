"use client";
import { MdEmail } from "react-icons/md";

import React, { useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import ContactForm from "./ContactForm";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";
import { ThemeContext } from "@/context/ThemeContext";
import { FaSun, FaMoon, FaLink } from "react-icons/fa";
import { CgLaptop } from "react-icons/cg";
import { BsGithub, BsFacebook, BsWhatsapp, BsDiscord, BsLinkedin, BsTwitter, BsYoutube, BsTelegram } from "react-icons/bs";
import { AiOutlineInstagram } from "react-icons/ai";


const calculateExperience = (startYear) => {
  const currentYear = new Date().getFullYear();
  return currentYear - startYear;
};
const iconClass =
  "text-[1.5rem] cursor-pointer transition-transform duration-300 ease-in-out hover:scale-125";

const ProfileCard = ({ socialData, profileStatus }) => {
  const { theme, toggleTheme, showToggle } = useContext(ThemeContext);
  const experience = calculateExperience(2021) - 1; // Since 2021

  const storageApi = process.env.NEXT_PUBLIC_STORAGE_API;

  const showEmail = socialData ? socialData.contact?.hasEmail : false;
  const email = socialData?.contact?.email || null;

  const socials = socialData ? socialData.socials : [];

  const currentStatus = profileStatus ? profileStatus.trim() : "";

  return (
    <aside className="w-full lg:w-1/3 xl:w-1/4 space-y-8" id="profile">
      <AnimatedContent
        distance={150}
        direction="vertical"
        reverse={false}
        duration={1.2}
        ease="power3.out"
        initialOpacity={0.2}
        animateOpacity
        scale={0.9}
        threshold={0.1}
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
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            ></svg>
          </div>

          {/* Profile Avatar & Status Section */}
          <div className="relative mb-6 group flex flex-col items-center">
            {/* GitHub Style Status Badge */}
            <div
              className={` ${currentStatus ? 'block' : 'hidden'} mb-3 px-3 py-1 text-xs font-medium text-[var(--text-color)] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-full shadow-sm max-w-[200px] truncate animate-pulse`}
            >
              {currentStatus}
            </div>

            {/* Profile Image */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--border-color)] shadow-md transition-transform duration-500 group-hover:scale-105">
              <Image
                alt="Showayeb Ahamed"
                className="w-full h-full object-cover"
                src="/profile-pic.png"
                width={128}
                height={128}
                quality={100}
                priority
              />
            </div>
          </div>

          {/* Bio text */}
          <p className="text-base text-[var(--secondary-text-color)] leading-relaxed">
            I am{" "}
            <span className="text-[var(--text-color)] font-semibold">
              Showayeb Ahamed
            </span>
            .
          </p>
          <p className="text-xs text-[var(--secondary-text-color)] mt-4 leading-relaxed max-w-[240px]">
            I am a CSE student with {experience}+ years of coding experience. I
            love learning new tech stacks.
          </p>

          <div className="w-full border-t border-[var(--border-color)] my-8"></div>

          {/* Quick Info */}
          <div className="w-full space-y-4 text-sm text-[var(--secondary-text-color)]">
            <div className="flex justify-between items-center">
              <span>Job</span>
              <span className="text-[var(--text-color)] font-medium">
                Student
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Location</span>
              <span className="text-[var(--text-color)] font-medium">
                Dhaka, Bangladesh
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Experience</span>
              <span className="text-[var(--text-color)] font-medium">
                {experience}+ Years
              </span>
            </div>
          </div>

          {/* Reach Me Section */}
          <div className="relative w-full flex items-center justify-center my-8">
            <span className="bg-[var(--card-bg-color)] px-4 text-xs font-semibold uppercase tracking-wider text-[var(--secondary-text-color)] z-10">
              Reach me
            </span>
            <div className="absolute w-full border-t border-[var(--border-color)]"></div>
          </div>

          {/* Social Links */}
          <div className="w-full space-y-4 text-xs">
            {socials.map((social) => {
              let IconComponent;
              let hoverColor = "hover:text-[var(--text-color)]";
              const platformLower = social.platform.toLowerCase();

              if (platformLower === "github") {
                IconComponent = BsGithub;
                hoverColor = "hover:text-[#333]";
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

              // Extract handle/username from URL or use the name
              let username = social.name;
              try {
                const cleanUrl = social.url.replace(/\/$/, "");
                const parts = cleanUrl.split("/");
                const lastPart = parts[parts.length - 1] || social.name;

                if (platformLower === "github" || platformLower === "facebook" || platformLower === "linkedin") {
                  username = lastPart;
                } else if (platformLower === "instagram" || platformLower === "twitter" || platformLower === "telegram") {
                  username = lastPart.startsWith("@") ? lastPart : "@" + lastPart;
                } else if (platformLower === "whatsapp") {
                  username = lastPart;
                } else if (platformLower === "youtube") {
                  username = lastPart;
                }
              } catch (e) {
                console.error("Error parsing social username:", e);
              }

              return (
                <Link
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between items-center group cursor-pointer text-[var(--secondary-text-color)] hover:text-[var(--text-color)] transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <IconComponent
                      className={`${iconClass} ${hoverColor} icon`}
                      aria-label={social.name}
                    />
                    <span className="font-medium">{social.name}</span>
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

          {/* Contact Popup Modal Button */}
          <div
            className="w-full mt-8 pt-6 border-t border-[var(--border-color)] flex justify-center z-20"
            id="contact"
          >
            <ContactForm />
          </div>
        </section>
      </AnimatedContent>
    </aside>
  );
};

export default ProfileCard;
