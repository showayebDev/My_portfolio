'use client'

import React from 'react'
import { NavGroup } from '@payloadcms/ui'

export const ApiDocsNavLink = () => {
  const isDev =
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_ENABLE_SWAGGER === 'true'

  if (!isDev) return null

  return (
    <NavGroup label="Developer" isOpen={true}>
      <a
        className="nav__link"
        href="/api/docs"
        target="_blank"
        rel="noopener noreferrer"
        id="nav-api-docs"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span className="nav__link-label">API Docs (Swagger)</span>
        <span style={{ fontSize: '10px', opacity: 0.7, paddingLeft: '4px' }}>↗</span>
      </a>
    </NavGroup>
  )
}
