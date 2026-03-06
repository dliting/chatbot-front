import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/views/LandingPage.vue')
  },
  {
    path: '/compact',
    name: 'compact',
    component: () => import('@/views/CompactDemo.vue')
  },
  {
    path: '/extended',
    name: 'extended',
    component: () => import('@/views/ExtendedDemo.vue')
  },
  {
    path: '/floating',
    name: 'floating',
    component: () => import('@/views/FloatingDemo.vue')
  },
  {
    path: '/iframe',
    name: 'iframe',
    component: () => import('@/views/IframeDemo.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
