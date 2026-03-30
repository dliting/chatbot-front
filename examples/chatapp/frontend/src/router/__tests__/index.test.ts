import { describe, it, expect } from 'vitest'
import router from '../index'

describe('Router Configuration', () => {
  it('should have all required routes', () => {
    const routes = router.getRoutes()
    const routePaths = routes.map(r => r.path)
    expect(routePaths).toContain('/')
    expect(routePaths).toContain('/extended')
    expect(routePaths).toContain('/sidebar')
    expect(routePaths).toContain('/floating')
    expect(routePaths).toContain('/settings')
  })

  it('should have correct route names', () => {
    const routes = router.getRoutes()
    const routeNames = routes.map(r => r.name)
    expect(routeNames).toContain('landing')
    expect(routeNames).toContain('extended')
    expect(routeNames).toContain('sidebar')
    expect(routeNames).toContain('floating')
    expect(routeNames).toContain('settings')
  })

  it('should lazy load view components', () => {
    const routes = router.getRoutes()
    routes.forEach(route => {
      expect(route.components).toBeDefined()
    })
  })
})
