// @ts-check
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'
import NextTopLoader from 'nextjs-toploader'

/**
 * @type {import('payload').ServerFunctionClient}
 */
const serverFunction = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

/**
 * @param {{ children: React.ReactNode }} props
 */
const Layout = ({ children }) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    <NextTopLoader
      color="#38bdf8"
      initialPosition={0.08}
      crawlSpeed={200}
      height={3}
      crawl={true}
      showSpinner={false}
      easing="ease"
      speed={200}
      shadow="0 0 10px #38bdf8,0 0 5px #38bdf8"
    />
    {children}
  </RootLayout>
)

export default Layout
