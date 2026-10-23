// @ts-check
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

/**
 * @typedef {{
 *   params: Promise<{ segments: string[] }>,
 *   searchParams: Promise<{ [key: string]: string | string[] }>
 * }} Args
 */

/**
 * @param {Args} args
 * @returns {Promise<import('next').Metadata>}
 */
export const generateMetadata = ({ params, searchParams }) =>
  generatePageMetadata({ config, params, searchParams })

/**
 * @param {Args} args
 */
const NotFound = ({ params, searchParams }) =>
  NotFoundPage({ config, params, searchParams, importMap })

export default NotFound
