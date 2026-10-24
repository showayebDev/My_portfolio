'use client'

import React from 'react'
import { useRowLabel } from '@payloadcms/ui'
import {
  FaGithub,
  FaFacebook,
  FaLinkedin,
  FaInstagram,
  FaXTwitter,
  FaWhatsapp,
  FaDiscord,
  FaYoutube,
  FaTelegram,
  FaReddit,
  FaTwitch,
  FaTiktok,
  FaThreads,
  FaMedium,
  FaDribbble,
  FaBehance,
  FaStackOverflow,
  FaGitlab,
  FaCodepen,
  FaSpotify,
  FaPatreon,
  FaSteam,
  FaPinterest,
  FaGlobe,
  FaLink,
} from 'react-icons/fa6'

const ICON_MAP = {
  github: FaGithub,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  instagram: FaInstagram,
  twitter: FaXTwitter,
  x: FaXTwitter,
  whatsapp: FaWhatsapp,
  discord: FaDiscord,
  youtube: FaYoutube,
  telegram: FaTelegram,
  reddit: FaReddit,
  twitch: FaTwitch,
  tiktok: FaTiktok,
  threads: FaThreads,
  medium: FaMedium,
  dribbble: FaDribbble,
  behance: FaBehance,
  'stack overflow': FaStackOverflow,
  stackoverflow: FaStackOverflow,
  gitlab: FaGitlab,
  codepen: FaCodepen,
  spotify: FaSpotify,
  patreon: FaPatreon,
  steam: FaSteam,
  pinterest: FaPinterest,
  website: FaGlobe,
  other: FaLink,
}

export const SocialRowLabel = () => {
  const rowLabel = useRowLabel()
  const data = rowLabel?.data || {}
  const rowNumber = rowLabel?.rowNumber
  const platform = data?.platform || ''
  const name = data?.name || ''
  const platformKey = platform.toLowerCase().trim()
  const IconComponent = ICON_MAP[platformKey] || FaLink

  const label = platform || `Social ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
      <IconComponent style={{ fontSize: '15px', flexShrink: 0 }} />
      <span>{label}</span>
      {name ? (
        <span style={{ opacity: 0.65, fontWeight: 400, marginLeft: '4px' }}>
          ({name})
        </span>
      ) : null}
    </span>
  )
}
