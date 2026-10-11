<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import Button from 'primevue/button'
import { authService, SessionExpiredError, type AuthorizedMenu, type AuthorizedSubmenu } from '@/modules/security/services/auth.service'

export interface WorkspaceSelection { menuId: string; menuName: string; submenuId?: string; submenuName?: string; viewKey?: string }

const props = defineProps<{ menus: AuthorizedMenu[]; userName: string; expiresAt?: string | null }>()
const emit = defineEmits<{ home: []; select: [selection: WorkspaceSelection]; sessionExpired: [] }>()

const remainingSeconds = ref(0)
const activeMenu = ref<AuthorizedMenu | null>(null)
const submenus = ref<AuthorizedSubmenu[]>([])
const submenusLoading = ref(false)
const submenusError = ref('')
const menuIcon = (name: string) => {
  const normalizedName = name.toLowerCase()
  if (normalizedName.includes('document')) return 'pi pi-file'
  if (normalizedName.includes('reporte') || normalizedName.includes('indicador')) return 'pi pi-chart-bar'
  if (normalizedName.includes('seguridad')) return 'pi pi-shield'
  if (normalizedName.includes('maestro')) return 'pi pi-database'
  return 'pi pi-briefcase'
}
function refreshRemainingTime() {
  const expiration = props.expiresAt ? Date.parse(props.expiresAt) : NaN
  remainingSeconds.value = Number.isNaN(expiration) ? 0 : Math.max(0, Math.ceil((expiration - Date.now()) / 1000))
}
refreshRemainingTime()
const timeLeft = computed(() => `${String(Math.floor(remainingSeconds.value / 60)).padStart(2, '0')}:${String(remainingSeconds.value % 60).padStart(2, '0')}`)
const timer = window.setInterval(refreshRemainingTime, 1000)
onUnmounted(() => window.clearInterval(timer))

async function selectMenu(item: AuthorizedMenu) {
  if (activeMenu.value?.menuId === item.menuId) { activeMenu.value = null; submenus.value = []; return }
  activeMenu.value = item
  submenus.value = []
  submenusError.value = ''
  submenusLoading.value = true
  try {
    const response = await authService.listSubmenus(props.userName, item.menuId)
    if (!response.length) { activeMenu.value = null; emit('select', { menuId: item.menuId, menuName: item.name }); return }
    submenus.value = response
  } catch (error) {
    if (error instanceof SessionExpiredError) { emit('sessionExpired'); return }
    submenusError.value = error instanceof Error ? error.message : 'No fue posible cargar los submenús autorizados.'
  } finally { submenusLoading.value = false }
}

function selectSubmenu(item: AuthorizedSubmenu) {
  if (!activeMenu.value) return
  emit('select', { menuId: activeMenu.value.menuId, menuName: activeMenu.value.name, submenuId: item.submenuId, submenuName: item.name, viewKey: item.viewKey ?? undefined })
  activeMenu.value = null
  submenus.value = []
}
function goHome() { activeMenu.value = null; submenus.value = []; submenusError.value = ''; emit('home') }

function selectionHref(selection: WorkspaceSelection) {
  const query = new URLSearchParams({ menuId: selection.menuId, menuName: selection.menuName })
  if (selection.submenuId) query.set('submenuId', selection.submenuId)
  if (selection.submenuName) query.set('submenuName', selection.submenuName)
  if (selection.viewKey) query.set('viewKey', selection.viewKey)
  return `/principal?${query.toString()}`
}

function openMenu(event: MouseEvent, item: AuthorizedMenu) {
  // Conserva el comportamiento del menú lateral con clic normal, pero deja que
  // el navegador abra el enlace de forma nativa con Ctrl/clic central/nueva pestaña.
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  void selectMenu(item)
}
</script>

<template>
  <aside class="app-sidebar" aria-label="Menú principal">
    <Button v-tooltip.right="'Inicio'" icon="pi pi-home" rounded text aria-label="Inicio" :class="{ 'sidebar-button--active': true }" class="sidebar-button" @click="goHome" />
    <span class="sidebar-rule" />
    <div class="sidebar-menu-list"><a v-for="item in props.menus" :key="item.menuId" v-tooltip.right="item.description || item.name" :href="selectionHref({ menuId: item.menuId, menuName: item.name })" class="sidebar-button" :aria-label="item.name" @click="openMenu($event, item)"><i :class="menuIcon(item.name)" aria-hidden="true" /></a></div>
    <Button v-tooltip.right="`Sesión: ${timeLeft}`" rounded text class="sidebar-button sidebar-session" :aria-label="`Tiempo de sesión restante ${timeLeft}`"><i class="pi pi-clock" aria-hidden="true" /><span>{{ timeLeft }}</span></Button>
    <div v-if="activeMenu" class="sidebar-flyout"><div class="sidebar-submenu"><span class="panel-kicker">{{ activeMenu.name }}</span><strong>Opciones disponibles</strong><span v-if="submenusLoading" class="sidebar-submenu__status"><i class="pi pi-spin pi-spinner" /> Cargando…</span><span v-else-if="submenusError" class="sidebar-submenu__status sidebar-submenu__status--error">{{ submenusError }}</span><a v-else v-for="item in submenus" :key="item.submenuId" :href="selectionHref({ menuId: activeMenu.menuId, menuName: activeMenu.name, submenuId: item.submenuId, submenuName: item.name, viewKey: item.viewKey ?? undefined })" @click="selectSubmenu(item)"><i class="pi pi-angle-right" />{{ item.name }}</a></div></div>
  </aside>
</template>
