<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { authService, type AccessCatalogItem, type SecurityUser, type UserProfile } from '@/modules/security/services/auth.service'
import { setObjectPermissionCodes } from '@/composables/use-object-permissions'
const emit = defineEmits<{ cancel: [] }>()
const toast = useToast()
const users = ref<SecurityUser[]>([]), profiles = ref<UserProfile[]>([]), modules = ref<AccessCatalogItem[]>([]), menus = ref<AccessCatalogItem[]>([]), submenus = ref<AccessCatalogItem[]>([]), secondLevelSubmenus = ref<AccessCatalogItem[]>([]), formOptions = ref<AccessCatalogItem[]>([]), actionOptions = ref<AccessCatalogItem[]>([])
const selectedUser = ref<string | null>(null), selectedProfile = ref<string | null>(null), selectedModule = ref<string | null>(null), selectedMenu = ref<string | null>(null), selectedSubmenu = ref<string | null>(null), selectedSecondLevelSubmenu = ref<string | null>(null), error = ref(''), profileAccessError = ref(''), loading = ref(false)
const uniqueItems = (items: AccessCatalogItem[]) => Array.from(new Map(items.map(item => [item.id || item.resourceId || item.name, item])).values())
const optionCode = (item: AccessCatalogItem) => item.code ?? (item as AccessCatalogItem & { optionCode?: string; codeOption?: string; codigo?: string; CODOPC?: string }).optionCode ?? (item as AccessCatalogItem & { codeOption?: string }).codeOption ?? (item as AccessCatalogItem & { codigo?: string }).codigo ?? (item as AccessCatalogItem & { CODOPC?: string }).CODOPC
const userOptions = computed(() => users.value.map(user => ({ label: `${user.login} · ${[user.firstNames, user.paternalLastName].filter(Boolean).join(' ')}`, value: user.id })))
const profileOptions = computed(() => profiles.value.filter(profile => profile.status === 'A' && profile.isRecordActive !== false).map(profile => ({ label: profile.description ? `${profile.name} · ${profile.description}` : profile.name, value: profile.id })))
const moduleOptions = computed(() => modules.value.map(item => ({ label: item.name ?? 'Módulo', value: item.id }))), menuOptions = computed(() => menus.value.map(item => ({ label: item.name ?? 'Menú', value: item.id }))), submenuOptions = computed(() => submenus.value.map(item => ({ label: item.name ?? 'Submenú', value: item.id }))), secondLevelOptions = computed(() => secondLevelSubmenus.value.map(item => ({ label: item.name ?? 'Segundo nivel', value: item.id })))
async function load() {
  loading.value = true
  try {
    // Los perfiles son opcionales en esta vista. Su autorización no puede
    // impedir que un usuario autorizado a administrar accesos vea a los usuarios.
    const [loadedUsers, loadedModules] = await Promise.all([authService.listSecurityUsers(), authService.listAccessModules()])
    users.value = loadedUsers
    selectedUser.value = users.value[0]?.id ?? null
    modules.value = uniqueItems(loadedModules)
    selectedModule.value = modules.value[0]?.id ?? null

    try {
      profiles.value = await authService.listUserProfiles()
      profileAccessError.value = ''
    } catch (reason) {
      profiles.value = []
      profileAccessError.value = reason instanceof Error ? reason.message : 'No tienes permiso para consultar perfiles.'
    }

    await changeModule()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'No fue posible cargar los datos.'
  } finally { loading.value = false }
}
async function changeUser() { selectedProfile.value = null; if (selectedUser.value) await loadAccess() }
async function changeModule() { if (!selectedModule.value) return; menus.value = await authService.listAccessMenus(selectedModule.value); selectedMenu.value = menus.value[0]?.id ?? null; await changeMenu() }
async function changeMenu() { if (!selectedMenu.value) return; submenus.value = await authService.listAccessSubmenus(selectedMenu.value); selectedSubmenu.value = submenus.value[0]?.id ?? null; await changeSubmenu() }
async function changeSubmenu() {
  if (!selectedSubmenu.value) { actionOptions.value = []; return }

  // El segundo nivel es opcional. Una ausencia o error de su catálogo no debe
  // impedir administrar las opciones que cuelgan directamente del submenú.
  try { secondLevelSubmenus.value = uniqueItems(await authService.listSecondLevelSubmenus(selectedSubmenu.value)) }
  catch { secondLevelSubmenus.value = [] }

  selectedSecondLevelSubmenu.value = secondLevelSubmenus.value[0]?.id ?? null
  if (selectedSecondLevelSubmenu.value) { await changeSecondLevelSubmenu(); return }

  let catalogOptions: AccessCatalogItem[] = []
  let catalogError = ''
  try { catalogOptions = await authService.listFormOptions(selectedSubmenu.value) }
  catch (reason) { catalogError = reason instanceof Error ? reason.message : 'No fue posible cargar las acciones de la vista.' }

  const access = selectedUser.value ? await authService.getUserAccess(selectedUser.value) : null
  const snapshotOptions = (access?.formOptions ?? []).filter(item => item.parentId === selectedSubmenu.value)
  formOptions.value = uniqueItems([...catalogOptions, ...snapshotOptions])
  actionOptions.value = formOptions.value
  // No ocultar errores de autorización o catálogo: antes la grilla vacía daba
  // la impresión de que el submenú no podía asignarse.
  error.value = !actionOptions.value.length && catalogError ? catalogError : ''
  await loadAccess()
}
async function changeSecondLevelSubmenu() { if (!selectedSecondLevelSubmenu.value || !selectedUser.value) return; const access = await authService.getUserAccess(selectedUser.value); formOptions.value = uniqueItems((access.formOptions ?? []).filter(item => item.parentId === selectedSecondLevelSubmenu.value)); actionOptions.value = formOptions.value; await loadAccess() }
async function loadAccess() { if (!selectedUser.value) return; const access = await authService.getUserAccess(selectedUser.value); const allAssigned = [...(access.formOptions ?? []), ...(access.secondLevelSubmenus ?? []), ...(access.submenus ?? []), ...(access.menus ?? []), ...(access.modules ?? [])]; const assigned = new Set(allAssigned.filter(item => item.assigned === true || Boolean(item.accessId)).map(item => item.resourceId ?? item.id)); actionOptions.value = formOptions.value.map(item => ({ ...item, assigned: assigned.has(item.id) || assigned.has(item.resourceId ?? '') })) }
function selectAllActions() { actionOptions.value.forEach(action => { action.assigned = true }) }
function clearAllActions() { actionOptions.value.forEach(action => { action.assigned = false }) }
async function applySelectedProfile() {
  if (!selectedUser.value || !selectedProfile.value) return
  const profile = profiles.value.find(item => item.id === selectedProfile.value)
  if (!profile) return

  loading.value = true
  try {
    const result = await authService.applyUserProfile(profile.id, selectedUser.value)
    const persistedAccess = await authService.getUserAccess(selectedUser.value)
    const currentUser = authService.getCurrentUser()?.toLowerCase()
    const selectedLogin = users.value.find(user => user.id === selectedUser.value)?.login.toLowerCase()
    if (currentUser && selectedLogin === currentUser) {
      setObjectPermissionCodes(
        (persistedAccess.formOptions ?? [])
          .filter(item => item.assigned === true || Boolean(item.accessId))
          .map(optionCode)
          .filter((code): code is string => Boolean(code))
      )
    }
    await loadAccess()
    selectedProfile.value = null
    toast.add({ severity: 'success', summary: 'Perfil aplicado', detail: `Se reemplazaron los permisos previos por ${result.modules} módulos, ${result.menus} menús, ${result.submenus} submenús, ${result.secondLevels} segundos niveles y ${result.options} opciones del perfil ${profile.name}.`, life: 6000 })
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : 'No fue posible aplicar el perfil.'
    toast.add({ severity: 'error', summary: 'No se pudo aplicar el perfil', detail, life: 5000 })
  } finally { loading.value = false }
}
async function save() {
  if (!selectedUser.value) return

  try {
    // Elegir un perfil solo prepara el cambio. La persistencia se realiza aquí,
    // exclusivamente al confirmar "Guardar asignación".
    if (selectedProfile.value) {
      await applySelectedProfile()
      return
    }

    if (!selectedModule.value || !selectedMenu.value || !selectedSubmenu.value) return

    // Las opciones que ya no están marcadas deben retirarse de TAS016. Antes
    // solo se enviaban altas, por lo que una recarga recuperaba los permisos antiguos.
    const currentAccess = await authService.getUserAccess(selectedUser.value)
    const directAssignments = new Map(
      (currentAccess.formOptions ?? [])
        .filter(item => (item.assigned === true || Boolean(item.accessId)) && Boolean(item.accessId))
        .map(item => [item.resourceId ?? item.id, item.accessId as string])
    )

    const removals = actionOptions.value
      .filter(item => !item.assigned)
      .map(item => directAssignments.get(item.resourceId ?? item.id))
      .filter((accessId): accessId is string => Boolean(accessId))

    await Promise.all(removals.map(accessId => authService.removeUserAccess(selectedUser.value!, accessId)))
    await authService.assignUserModule(selectedUser.value, selectedModule.value)
    await authService.assignUserMenu(selectedUser.value, selectedMenu.value)
    await authService.assignUserSubmenu(selectedUser.value, selectedSubmenu.value)
    if (selectedSecondLevelSubmenu.value) await authService.assignUserSecondLevelSubmenu(selectedUser.value, selectedSecondLevelSubmenu.value)
    await Promise.all(actionOptions.value.filter(item => item.assigned).map(item => authService.assignUserFormOption(selectedUser.value!, item.id)))

    // El estado de la sesión se actualiza desde el origen persistido, no desde
    // los checks locales de este submenú.
    const persistedAccess = await authService.getUserAccess(selectedUser.value)
    const currentUser = authService.getCurrentUser()?.toLowerCase()
    const selectedLogin = users.value.find(user => user.id === selectedUser.value)?.login.toLowerCase()
    if (currentUser && selectedLogin === currentUser) {
      setObjectPermissionCodes(
        (persistedAccess.formOptions ?? [])
          .filter(item => item.assigned === true || Boolean(item.accessId))
          .map(optionCode)
          .filter((code): code is string => Boolean(code))
      )
    }

    await loadAccess()
    toast.add({ severity: 'success', summary: 'Accesos actualizados', detail: 'La asignación se guardó correctamente.', life: 3500 })
  } catch (reason) {
    const detail = reason instanceof Error ? reason.message : 'No fue posible guardar la asignación.'
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail, life: 5000 })
  }
}
onMounted(() => { void load(); document.querySelector<HTMLButtonElement>('.access-assignment-view .company-secondary-button')?.addEventListener('click', () => window.dispatchEvent(new Event('cxview-access-cancel'))) })
</script>
<template>
  <section class="companies-view access-assignment-view">
    <header class="companies-view__header">
      <div><h1>Asignación de accesos</h1><p>Administra módulos, menús, submenús y acciones por usuario.</p></div>
      <div class="companies-view__actions"><Button label="Cancelar" icon="pi pi-arrow-left" class="company-secondary-button" outlined @click="emit('cancel')" /><Button label="Guardar asignación" icon="pi pi-check" class="company-primary-button" :loading="loading" @click="save" /></div>
    </header>
    <Message v-if="error" severity="info" closable @close="error = ''">{{ error }}</Message>
    <div class="access-assignment-layout">
      <section class="companies-table-card access-assignment-card"><div class="companies-table-card__toolbar"><span class="companies-table-card__title">1. Usuario y aplicación</span></div><div class="access-assignment-card__body"><label>Usuario</label><Select v-model="selectedUser" :options="userOptions" option-label="label" option-value="value" filter fluid @change="changeUser" /><label>Perfil de accesos</label><Select v-model="selectedProfile" :options="profileOptions" option-label="label" option-value="value" :disabled="!selectedUser || loading || Boolean(profileAccessError)" placeholder="Selecciona un perfil para aplicar" filter show-clear fluid /><small v-if="profileAccessError" class="access-assignment-empty">No tienes permiso para consultar o aplicar perfiles.</small><small v-else class="access-assignment-empty">El perfil se aplicará recién al pulsar «Guardar asignación»; hasta entonces no se modifica ningún permiso.</small><label>Aplicación / módulo</label><Select v-model="selectedModule" :options="moduleOptions" option-label="label" option-value="value" filter fluid @change="changeModule" /></div></section>
      <section class="companies-table-card access-assignment-card"><div class="companies-table-card__toolbar"><span class="companies-table-card__title">2. Menú y submenú</span></div><div class="access-assignment-card__body"><label>Menú</label><Select v-model="selectedMenu" :options="menuOptions" option-label="label" option-value="value" fluid @change="changeMenu" /><label>Submenú</label><Select v-model="selectedSubmenu" :options="submenuOptions" option-label="label" option-value="value" fluid @change="changeSubmenu" /><label>Submenú de segundo nivel</label><Select v-model="selectedSecondLevelSubmenu" :options="secondLevelOptions" option-label="label" option-value="value" :disabled="!selectedSubmenu || !secondLevelSubmenus.length" :placeholder="!selectedSubmenu ? 'Selecciona un submenú' : secondLevelSubmenus.length ? 'Selecciona un segundo nivel' : 'No hay segundos niveles registrados'" fluid @change="changeSecondLevelSubmenu" /><small v-if="selectedSubmenu && !secondLevelSubmenus.length" class="access-assignment-empty">Este submenú aún no tiene niveles hijos registrados.</small></div></section>
      <section class="companies-table-card access-assignment-card access-assignment-card--actions"><div class="companies-table-card__toolbar"><div class="access-assignment-actions-header"><span class="companies-table-card__title">3. Acciones de la vista</span><span class="companies-table-card__total">{{ actionOptions.filter(action => action.assigned).length }} seleccionadas</span><Button label="Seleccionar todas" icon="pi pi-check-square" size="small" class="company-secondary-button" outlined :disabled="!actionOptions.length" @click="selectAllActions" /><Button label="Deseleccionar" icon="pi pi-times" size="small" class="company-secondary-button" outlined :disabled="!actionOptions.length" @click="clearAllActions" /></div></div><div class="access-assignment-actions"><label v-for="action in actionOptions" :key="action.id" class="access-assignment-action"><input v-model="action.assigned" type="checkbox" /> <span>{{ action.description || action.code }}</span></label></div></section>
    </div>
  </section>
</template>
