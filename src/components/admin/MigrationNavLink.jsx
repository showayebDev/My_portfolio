'use client'

import React from 'react'
import { Link, NavGroup } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'

export const MigrationNavLink = () => {
  const pathname = usePathname()
  const isActive = pathname === '/admin/migration' || pathname?.startsWith('/admin/migration')

  return (
    <NavGroup label="Management" isOpen={true}>
      <Link
        className={`nav__link ${isActive ? 'active' : ''}`}
        href="/admin/migration"
        id="nav-migration"
      >
        {isActive && <div className="nav__link-indicator" />}
        <span className="nav__link-label">Migration & Backup</span>
      </Link>
    </NavGroup>
  )
}
