<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/app/AppHeader.vue'
import AppSidebar from '@/components/app/AppSidebar.vue'
import { authService } from '@/modules/security/services/auth.service'

interface UserContext { operationType: string; businessUnit: string; location: string; module: string; moduleName: string }

const router = useRouter()
const context = ref<UserContext | null>(null)
const activePath = ref<string[]>([])
const userName = 'Fernando Peña'
const notifications = [{ id: 1, title: 'Operación actualizada', message: 'La orden VLC-2048 cambió a carga confirmada.', time: 'Hace 8 min', unread: true }]
const moduleImages: Record<string, string> = {
  'integrated-logistics': '/images/auth-logistics.png', security: '/images/module-security.png',
  'temporary-depot': '/images/module-temporary-depot.png', support: '/images/auth-logistics.png', 'master-data': '/images/module-temporary-depot.png',
}
try { context.value = JSON.parse(sessionStorage.getItem('cxview.user.context') ?? 'null') as UserContext | null } catch { sessionStorage.removeItem('cxview.user.context') }
if (!context.value?.module) void router.replace({ name: 'module-selection' })

const headerContext = computed(() => context.value ? [context.value.operationType, context.value.businessUnit, context.value.location] : [])
const backgroundImage = computed(() => context.value ? moduleImages[context.value.module] ?? moduleImages['integrated-logistics'] : '')
const activeOption = computed(() => activePath.value[activePath.value.length - 1] ?? 'Inicio')
const breadcrumb = computed(() => activePath.value.length ? ['Inicio', context.value?.moduleName ?? 'Módulo', ...activePath.value] : ['Inicio'])
async function logout() { authService.clearOtpChallenge(); sessionStorage.removeItem('cxview.user.context'); await router.replace({ name: 'login' }) }
</script>

<template>
  <div class="workspace-page">
    <AppHeader :user-name="userName" :notifications="notifications" :context="headerContext" @logout="logout" />
    <div class="workspace-layout">
      <AppSidebar @home="activePath = []" @select="activePath = $event" />
      <main class="workspace-main">
        <nav class="workspace-breadcrumb" aria-label="Ruta de navegación"><span v-for="(item, index) in breadcrumb" :key="item"><i v-if="index" class="pi pi-angle-right" />{{ item }}</span></nav>
        <section class="workspace-canvas" :style="{ backgroundImage: `url(${backgroundImage})` }">
          <div class="workspace-canvas__veil" />
          <div class="workspace-canvas__content"><span class="workspace-kicker">{{ context?.moduleName }}</span><h1>{{ activeOption }}</h1><p v-if="activeOption === 'Inicio'">Selecciona una opción del menú lateral para empezar a trabajar.</p><p v-else>Zona de trabajo preparada para <strong>{{ activeOption }}</strong>.</p></div>
        </section>
      </main>
    </div>
  </div>
</template>
