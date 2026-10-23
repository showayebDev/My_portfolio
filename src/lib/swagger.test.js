import { describe, it, expect } from 'vitest'
import { openapi, swaggerUI } from 'payload-oapi'
import configPromise from '../payload.config.js'

describe('Swagger UI and OpenAPI Documentation', () => {
  it('registers openapi and swagger endpoints when enabled', async () => {
    const config = await configPromise
    const openapiEndpoint = config.endpoints.find((e) => e.path === '/openapi.json')
    const docsEndpoint = config.endpoints.find((e) => e.path === '/docs')

    expect(openapiEndpoint).toBeDefined()
    expect(openapiEndpoint.method).toBe('get')

    expect(docsEndpoint).toBeDefined()
    expect(docsEndpoint.method).toBe('get')
  })

  it('serves Swagger UI HTML pointing to /api/openapi.json', async () => {
    const config = await configPromise
    const docsEndpoint = config.endpoints.find((e) => e.path === '/docs')

    const mockReq = {
      protocol: 'http:',
      headers: new Headers({ host: 'localhost:3000' }),
    }

    const response = await docsEndpoint.handler(mockReq)
    expect(response.status).toBe(200)

    const html = await response.text()
    expect(html).toContain('SwaggerUIBundle')
    expect(html).toContain('/api/openapi.json')
  })

  it('generates a valid OpenAPI spec with collections and globals', async () => {
    const config = await configPromise
    const openapiEndpoint = config.endpoints.find((e) => e.path === '/openapi.json')

    const mockPayload = {
      config,
      collections: Object.fromEntries(config.collections.map((c) => [c.slug, { config: c }])),
      globals: { config: config.globals },
      blocks: {},
    }

    const mockReq = {
      protocol: 'http:',
      headers: new Headers({ host: 'localhost:3000' }),
      payload: mockPayload,
    }

    const response = await openapiEndpoint.handler(mockReq)
    expect(response.status).toBe(200)

    const spec = await response.json()
    expect(spec.openapi).toMatch(/^3\./)
    expect(spec.info.title).toBe('Portfolio API')
    expect(spec.paths).toBeDefined()

    // Verify key portfolio collections and globals are present
    expect(spec.paths['/api/projects']).toBeDefined()
    expect(spec.paths['/api/skills']).toBeDefined()
    expect(spec.paths['/api/skill-categories']).toBeDefined()
    expect(spec.paths['/api/education']).toBeDefined()
    expect(spec.paths['/api/globals/profile']).toBeDefined()
  })

  it('respects the enabled=false flag when disabled', async () => {
    const baseConfig = { endpoints: [] }
    const disabledOpenApi = openapi({
      metadata: { title: 'Test', version: '1.0' },
      enabled: false,
    })
    const disabledSwagger = swaggerUI({
      docsUrl: '/docs',
      enabled: false,
    })

    let cfg = await disabledOpenApi(baseConfig)
    cfg = await disabledSwagger(cfg)

    expect(cfg.endpoints.find((e) => e.path === '/openapi.json')).toBeUndefined()
    expect(cfg.endpoints.find((e) => e.path === '/docs')).toBeUndefined()
  })
})
