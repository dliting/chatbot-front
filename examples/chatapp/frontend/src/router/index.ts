import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingPage.vue')
  },
  {
    path: '/extended',
    name: 'extended',
    component: () => import('../views/ExtendedDemo.vue')
  },
  {
    path: '/sidebar',
    name: 'sidebar',
    component: () => import('../views/SidebarDemo.vue')
  },
  {
    path: '/floating',
    name: 'floating',
    component: () => import('../views/FloatingDemo.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
