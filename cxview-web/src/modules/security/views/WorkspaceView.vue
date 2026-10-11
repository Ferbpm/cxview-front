<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AppHeader from '@/components/app/AppHeader.vue'
import AppSidebar, { type WorkspaceSelection } from '@/components/app/AppSidebar.vue'
import { authService, type AuthorizedMenu } from '@/modules/security/services/auth.service'
import CompaniesView from '@/modules/security/components/CompaniesView.vue'
import MasterCrudView from '@/modules/security/components/MasterCrudView.vue'
import UsersMasterView from '@/modules/security/components/UsersMasterView.vue'
import AccessAssignmentView from '@/modules/security/components/AccessAssignmentView.vue'
import FormOptionsMasterView from '@/modules/security/components/FormOptionsMasterView.vue'
import UserProfilesView from '@/modules/security/components/UserProfilesView.vue'
import { workspaceViewRegistry } from '@/modules/security/config/workspace-views'
import type { MasterResource } from '@/modules/security/services/auth.service'
import { clearObjectPermissionCodes, setObjectPermissionCodes } from '@/composables/use-object-permissions'

interface UserContext { operationType: string; businessUnit: string; location: string; module: string; moduleName: string; menus: AuthorizedMenu[] }
const COMPANY_SUBMENU_ID = '8b1c2c05-5b3d-48b2-9e12-6e2621dcce6b'
const USERS_SUBMENU_ID = 'e2a6ed92-5856-489e-b21d-fd3ceecb7fa9'
const FORM_OPTIONS_SUBMENU_ID = 'a7e4c9d2-6e11-4f4f-9a3b-2d8c5e71b604'
const USER_PROFILES_SUBMENU_ID = 'a9fd8380-1005-4b11-9422-523100ee0004'
const masterViews: Record<string, { title: string; resource: MasterResource; parentLabel: string; parentResource?: MasterResource }> = {
  '3dcbcc79-7efc-4969-a078-6827eb2886c6': { title: 'Aplicaciones empresariales', resource: 'applications', parentLabel: 'Empresa' },
  'c88ef4ad-caf3-4d42-91a4-3183d7cddabc': { title: 'Dominios de la empresa', resource: 'domains', parentLabel: 'Empresa' },
  'b0a64691-4a45-4b14-9708-1a32e4e37db6': { title: 'Áreas de la empresa', resource: 'areas', parentLabel: 'Empresa' },
  '8d954bea-c575-47e2-99b2-3c92bc840027': { title: 'Roles de las áreas', resource: 'roles', parentLabel: 'Área', parentResource: 'areas' },
  '386f85bf-e4a4-46cf-a4b2-c2af7528ea59': { title: 'Módulos por aplicaciones', resource: 'modules', parentLabel: 'Aplicación', parentResource: 'applications' },
  'a9fd8380-1005-4b11-9422-523100ee0001': { title: 'Menús', resource: 'menus', parentLabel: 'Módulo', parentResource: 'modules' },
  'a9fd8380-1005-4b11-9422-523100ee0002': { title: 'Submenús', resource: 'submenus', parentLabel: 'Menú', parentResource: 'menus' },
  'a9fd8380-1005-4b11-9422-523100ee0003': { title: 'Submenús de segundo nivel', resource: 'second-level-submenus', parentLabel: 'Submenú', parentResource: 'submenus' },
}
const router = useRouter()
const route = useRoute()
const toast = useToast()
const context = ref<UserContext | null>(null)
const activeSelection = ref<WorkspaceSelection | null>(null)
const accessAssignmentVisible = ref(false)
const WORKSPACE_CONTEXT_KEY = 'cxview.user.context'
let moduleChangeRequested = false
const closeAccessAssignment = () => { accessAssignmentVisible.value = false }
const userName = authService.getCurrentUser() ?? 'Usuario'
const permissionCode = (option: { code?: string; optionCode?: string; codeOption?: string; codigo?: string; CODOPC?: string }) => option.code ?? option.optionCode ?? option.codeOption ?? option.codigo ?? option.CODOPC
async function loadObjectPermissions() {
  try {
    const users = await authService.listSecurityUsers({ userName })
    const currentUser = users.find(user => user.login.toLowerCase() === userName.toLowerCase())
    if (!currentUser) { setObjectPermissionCodes([]); return }
    const access = await authService.getUserAccess(currentUser.id)
    setObjectPermissionCodes(access.formOptions.filter(option => option.assigned === true || Boolean(option.accessId)).map(permissionCode).filter((code): code is string => Boolean(code)))
  } catch { setObjectPermissionCodes([]) }
}
const sessionExpiresAt = ref(authService.getSessionExpiresAt())
let refreshingSession = false
async function renewSessionOnActivity() {
  const expiresAt = sessionExpiresAt.value ? Date.parse(sessionExpiresAt.value) : NaN
  if (refreshingSession || !Number.isFinite(expiresAt) || expiresAt - Date.now() > 5 * 60 * 1000) return
  refreshingSession = true
  try { const renewed = await authService.refreshSession(); sessionExpiresAt.value = renewed.expiresAt } catch { await logout() } finally { refreshingSession = false }
}
onMounted(() => { void loadObjectPermissions(); window.addEventListener('cxview-access-cancel', closeAccessAssignment); ['click', 'keydown', 'pointerdown', 'scroll'].forEach(event => window.addEventListener(event, renewSessionOnActivity, { passive: true })) })
onUnmounted(() => { window.removeEventListener('cxview-access-cancel', closeAccessAssignment); ['click', 'keydown', 'pointerdown', 'scroll'].forEach(event => window.removeEventListener(event, renewSessionOnActivity)) })
const notifications = [{ id: 1, title: 'Operación actualizada', message: 'La orden VLC-2048 cambió a carga confirmada.', time: 'Hace 8 min', unread: true }]
const moduleImages: Record<string, string> = { 'integrated-logistics': '/images/auth-logistics.png', security: '/images/module-security.png', 'temporary-depot': '/images/module-temporary-depot.png', support: '/images/auth-logistics.png', 'master-data': '/images/module-temporary-depot.png' }
try { context.value = JSON.parse(sessionStorage.getItem(WORKSPACE_CONTEXT_KEY) ?? localStorage.getItem(WORKSPACE_CONTEXT_KEY) ?? 'null') as UserContext | null } catch { sessionStorage.removeItem(WORKSPACE_CONTEXT_KEY); localStorage.removeItem(WORKSPACE_CONTEXT_KEY) }
if (!context.value?.module) void router.replace({ name: 'module-selection' })
const headerContext = computed(() => context.value ? [context.value.operationType, context.value.businessUnit, context.value.location].filter(Boolean) : [])
const backgroundImage = computed(() => context.value ? moduleImages[context.value.module] ?? moduleImages['integrated-logistics'] : '')
const activeOption = computed(() => activeSelection.value?.submenuName ?? activeSelection.value?.menuName ?? 'Inicio')
const breadcrumb = computed(() => activeSelection.value ? [context.value?.moduleName ?? 'Módulo', activeSelection.value.menuName, ...(activeSelection.value.submenuName ? [activeSelection.value.submenuName] : [])] : ['Inicio'])
const isCompaniesView = computed(() => activeSelection.value?.submenuId === COMPANY_SUBMENU_ID)
const isUsersView = computed(() => activeSelection.value?.submenuId === USERS_SUBMENU_ID)
const isFormOptionsView = computed(() => activeSelection.value?.submenuId === FORM_OPTIONS_SUBMENU_ID)
const isUserProfilesView = computed(() => activeSelection.value?.submenuId === USER_PROFILES_SUBMENU_ID)
const activeDynamicView = computed(() => {
  const key = activeSelection.value?.viewKey?.trim()
  return key ? workspaceViewRegistry[key] : undefined
})
const isAccessAssignmentView = computed(() => /asignaci[oó]n|permisos|accesos/.test((activeSelection.value?.submenuName ?? '').toLowerCase()))
const masterView = computed(() => activeSelection.value?.submenuId ? masterViews[activeSelection.value.submenuId] : undefined)
function selectionFromRoute(): WorkspaceSelection | null {
  const value = (name: string) => typeof route.query[name] === 'string' ? route.query[name] : ''
  const menuId = value('menuId')
  const menuName = value('menuName')
  if (!menuId || !menuName) return null
  return { menuId, menuName, submenuId: value('submenuId') || undefined, submenuName: value('submenuName') || undefined, viewKey: value('viewKey') || undefined }
}
function selectWorkspaceOption(selection: WorkspaceSelection) {
  activeSelection.value = selection
  accessAssignmentVisible.value = false
  void router.replace({ name: 'workspace', query: { menuId: selection.menuId, menuName: selection.menuName, ...(selection.submenuId ? { submenuId: selection.submenuId } : {}), ...(selection.submenuName ? { submenuName: selection.submenuName } : {}), ...(selection.viewKey ? { viewKey: selection.viewKey } : {}) } })
}
function goHome() { activeSelection.value = null; accessAssignmentVisible.value = false; void router.replace({ name: 'workspace' }) }
watch(() => route.query, () => {
  const selection = selectionFromRoute()
  if (selection) { activeSelection.value = selection; accessAssignmentVisible.value = false }
  else { activeSelection.value = null }
}, { immediate: true })
async function logout() { authService.clearAuthSession(); clearObjectPermissionCodes(); sessionStorage.removeItem(WORKSPACE_CONTEXT_KEY); localStorage.removeItem(WORKSPACE_CONTEXT_KEY); await router.replace({ name: 'login' }) }
async function changeModule() {
  moduleChangeRequested = true
  activeSelection.value = null
  accessAssignmentVisible.value = false
  sessionStorage.removeItem(WORKSPACE_CONTEXT_KEY)
  localStorage.removeItem(WORKSPACE_CONTEXT_KEY)
  await router.replace({ name: 'module-selection' })
}
onBeforeRouteLeave((to) => {
  if (to.name === 'module-selection' && !moduleChangeRequested) {
    toast.add({ severity: 'warn', summary: 'Navegación no disponible', detail: 'Para cambiar de módulo usa la opción “Cambiar módulo” en el menú de tu usuario.', life: 5000 })
    return false
  }
  return true
})
</script>

<template>
  <div class="workspace-page"><AppHeader :user-name="userName" :notifications="notifications" :context="headerContext" @logout="logout" @change-module="changeModule" /><div class="workspace-layout"><AppSidebar :menus="context?.menus ?? []" :user-name="userName" :expires-at="sessionExpiresAt" @home="goHome" @select="selectWorkspaceOption" @session-expired="logout" /><main class="workspace-main"><nav class="workspace-breadcrumb" aria-label="Ruta de navegación"><span v-for="(item, index) in breadcrumb" :key="item"><i v-if="index" class="pi pi-angle-right" />{{ item }}</span></nav><CompaniesView v-if="isCompaniesView" /><UsersMasterView v-else-if="isUsersView && !accessAssignmentVisible" @assign-access="accessAssignmentVisible = true" /><AccessAssignmentView v-else-if="accessAssignmentVisible || isAccessAssignmentView" /><FormOptionsMasterView v-else-if="isFormOptionsView" /><UserProfilesView v-else-if="isUserProfilesView" /><component v-else-if="activeDynamicView" :is="activeDynamicView" /><MasterCrudView v-else-if="masterView" :key="activeSelection?.submenuId" :title="masterView.title" :resource="masterView.resource" :parent-label="masterView.parentLabel" :parent-resource="masterView.parentResource" /><section v-else class="workspace-canvas" :style="{ backgroundImage: `url(${backgroundImage})` }"><div class="workspace-canvas__veil" /><div class="workspace-canvas__content"><span class="workspace-kicker">{{ context?.moduleName }}</span><h1>{{ activeOption }}</h1><p v-if="activeOption === 'Inicio'">Selecciona una opción del menú lateral para empezar a trabajar.</p><p v-else>Zona de trabajo preparada para <strong>{{ activeOption }}</strong>.</p></div></section></main></div></div>
</template>
