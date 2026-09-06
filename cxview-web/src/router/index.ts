import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/modules/security/views/LoginView.vue'),
      meta: { title: 'Iniciar sesión' },
    },
    {
      path: '/otp',
      name: 'otp',
      component: () => import('@/modules/security/views/OtpView.vue'),
      meta: { title: 'Verificar identidad' },
    },
    {
      path: '/seleccionar-modulo',
      name: 'module-selection',
      component: () => import('@/modules/security/views/ModuleSelectionView.vue'),
      meta: { title: 'Seleccionar módulo' },
    },
    {
      path: '/principal',
      name: 'workspace',
      component: () => import('@/modules/security/views/WorkspaceView.vue'),
      meta: { title: 'Espacio de trabajo' },
    },
  ],
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? 'Acceso')} | CXView`
})

export default router
