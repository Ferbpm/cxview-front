<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { authService, type AccessCatalogItem, type SecurityUser, type UserProfile } from '@/modules/security/services/auth.service'
import { useObjectPermissions } from '@/composables/use-object-permissions'

type Resource = 'modules' | 'menus' | 'submenus' | 'second-level-submenus' | 'form-options'
const toast = useToast()
const { can } = useObjectPermissions('profiles')
const canCreate = can('create'), canUpdate = can('update'), canDelete = can('delete'), canAssign = can('assign')
const profiles = ref<UserProfile[]>([]), users = ref<SecurityUser[]>([]), loading = ref(false), saving = ref(false)
const profileDialog = ref(false), permissionsDialog = ref(false), applyDialog = ref(false)
const selected = ref<UserProfile | null>(null), selectedUserId = ref<string | null>(null)
const form = ref({ id: '', name: '', description: '', status: 'A' })
const resource = ref<Resource>('modules'), accessRows = ref<AccessCatalogItem[]>([])
const modules = ref<AccessCatalogItem[]>([]), menus = ref<AccessCatalogItem[]>([]), submenus = ref<AccessCatalogItem[]>([]), secondLevels = ref<AccessCatalogItem[]>([])
const selectedModule = ref<string | null>(null), selectedMenu = ref<string | null>(null), selectedSubmenu = ref<string | null>(null), selectedSecondLevel = ref<string | null>(null)
const resourceLabels: Record<Resource, string> = { modules: 'Módulos', menus: 'Menús', submenus: 'Submenús', 'second-level-submenus': 'Segundo nivel', 'form-options': 'Opciones' }
const userOptions = computed(() => users.value.map(user => ({ label: `${user.login} · ${user.firstNames} ${user.paternalLastName}`.trim(), value: user.id })))
const contextParent = computed(() => ({ modules: undefined, menus: selectedModule.value ?? undefined, submenus: selectedMenu.value ?? undefined, 'second-level-submenus': selectedSubmenu.value ?? undefined, 'form-options': selectedSecondLevel.value ?? selectedSubmenu.value ?? undefined })[resource.value])
const canShowResource = computed(() => resource.value === 'modules' || (resource.value === 'menus' && selectedModule.value) || (resource.value === 'submenus' && selectedMenu.value) || (resource.value === 'second-level-submenus' && selectedSubmenu.value) || (resource.value === 'form-options' && (selectedSecondLevel.value || selectedSubmenu.value)))
function optionItems(items: AccessCatalogItem[], fallback: string) { return items.map(item => ({ label: item.name ?? fallback, value: item.id ?? item.resourceId })) }
async function loadProfiles() { loading.value = true; try { profiles.value = await authService.listUserProfiles() } catch (e) { toast.add({ severity: 'error', summary: 'No se pudieron cargar los perfiles', detail: e instanceof Error ? e.message : 'Inténtalo nuevamente.', life: 5000 }) } finally { loading.value = false } }
function openCreate() { form.value = { id: '', name: '', description: '', status: 'A' }; profileDialog.value = true }
function openEdit(profile: UserProfile) { form.value = { id: profile.id, name: profile.name, description: profile.description ?? '', status: profile.status }; profileDialog.value = true }
async function saveProfile() { if (!form.value.name.trim()) { toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Ingresa el nombre del perfil.', life: 3500 }); return }; saving.value = true; try { const payload = { name: form.value.name.trim(), description: form.value.description.trim() || null, status: form.value.status }; if (form.value.id) await authService.updateUserProfile(form.value.id, payload); else await authService.createUserProfile(payload); profileDialog.value = false; await loadProfiles(); toast.add({ severity: 'success', summary: 'Perfil guardado', detail: 'El perfil se actualizó correctamente.', life: 3500 }) } catch (e) { toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: e instanceof Error ? e.message : 'Inténtalo nuevamente.', life: 5000 }) } finally { saving.value = false } }
async function deactivate(profile: UserProfile) { if (!confirm(`¿Dar de baja el perfil ${profile.name}?`)) return; saving.value = true; try { await authService.deleteUserProfile(profile.id); await loadProfiles(); toast.add({ severity: 'success', summary: 'Perfil dado de baja', detail: 'La operación se realizó correctamente.', life: 3500 }) } catch (e) { toast.add({ severity: 'error', summary: 'No se pudo dar de baja', detail: e instanceof Error ? e.message : 'Inténtalo nuevamente.', life: 5000 }) } finally { saving.value = false } }
async function loadResource(): Promise<boolean> {
  if (!selected.value || !canShowResource.value) { accessRows.value = []; return true }

  if (resource.value === 'form-options' && selectedSubmenu.value) {
    try {
      const [catalog, assignments] = await Promise.all([
        authService.listFormOptions(selectedSubmenu.value).catch(() => authService.listFormOptionsMaintenance({ submenuId: selectedSubmenu.value ?? undefined })),
        // No ocultar un error de persistencia como si no hubiese permisos.
        // De esa forma la vista no muestra todos los checks desmarcados cuando
        // el procedimiento de consulta falla.
        authService.listProfileAccess(selected.value.id, resource.value, contextParent.value)
      ])
      const assignedByOption = new Map(assignments.map(item => [item.resourceId ?? item.id, item]))
      accessRows.value = catalog.map(option => {
        const assigned = assignedByOption.get(option.resourceId ?? option.id)
        return assigned ? { ...option, assigned: assigned.assigned, accessId: assigned.accessId } : { ...option, assigned: false, accessId: undefined }
      })
      return true
    } catch (e) {
      accessRows.value = []
      toast.add({ severity: 'error', summary: 'No se pudieron cargar las opciones', detail: e instanceof Error ? e.message : 'Inténtalo nuevamente.', life: 5000 })
      return false
    }
  }

  try {
    accessRows.value = await authService.listProfileAccess(selected.value.id, resource.value, contextParent.value)
    return true
  } catch (e) {
    accessRows.value = []
    toast.add({ severity: 'error', summary: 'No se pudieron cargar los permisos', detail: e instanceof Error ? e.message : 'Inténtalo nuevamente.', life: 5000 })
    return false
  }
}
async function changeModule() { menus.value = selectedModule.value ? await authService.listAccessMenus(selectedModule.value) : []; selectedMenu.value = null; submenus.value = []; secondLevels.value = []; selectedSubmenu.value = null; selectedSecondLevel.value = null; await loadResource() }
async function changeMenu() { submenus.value = selectedMenu.value ? await authService.listAccessSubmenus(selectedMenu.value) : []; selectedSubmenu.value = null; secondLevels.value = []; selectedSecondLevel.value = null; await loadResource() }
async function changeSubmenu() {
  // Un segundo nivel es opcional. Si el backend aún no expone ese catálogo o
  // el submenú no tiene hijos, las opciones directas deben seguir cargando.
  try { secondLevels.value = selectedSubmenu.value ? await authService.listSecondLevelSubmenus(selectedSubmenu.value) : [] }
  catch { secondLevels.value = [] }
  selectedSecondLevel.value = null
  await loadResource()
}
async function openPermissions(profile: UserProfile) { selected.value = profile; resource.value = 'modules'; modules.value = await authService.listAccessModules(); selectedModule.value = null; selectedMenu.value = null; selectedSubmenu.value = null; selectedSecondLevel.value = null; permissionsDialog.value = true; await loadResource() }
async function selectResource(value: Resource) { resource.value = value; await loadResource() }
async function toggleAccess(item: AccessCatalogItem) {
  if (!selected.value) return
  saving.value = true
  try {
    if (item.assigned || item.accessId) {
      await authService.removeProfileAccess(item.accessId!)
      item.assigned = false
      item.accessId = undefined
    } else {
      const assigned = await authService.assignProfileAccess(selected.value.id, resource.value, item.resourceId ?? item.id)
      item.assigned = true
      item.accessId = assigned.accessId
    }
    await loadResource()
  } catch (e) { toast.add({ severity: 'error', summary: 'No se pudo actualizar el permiso', detail: e instanceof Error ? e.message : 'Inténtalo nuevamente.', life: 5000 }) }
  finally { saving.value = false }
}
async function selectAllAccess() {
  if (!selected.value || !canShowResource.value || !accessRows.value.length) return
  const pending = accessRows.value.filter(item => !item.assigned && !item.accessId)
  if (!pending.length) return

  saving.value = true
  try {
    for (const item of pending) {
      const assigned = await authService.assignProfileAccess(selected.value.id, resource.value, item.resourceId ?? item.id)
      item.assigned = true
      item.accessId = assigned.accessId
    }
    const confirmed = await loadResource()
    const persisted = pending.every(item => accessRows.value.some(row => (row.resourceId ?? row.id) === (item.resourceId ?? item.id) && row.assigned && row.accessId))
    if (!confirmed || !persisted) {
      toast.add({ severity: 'error', summary: 'No se confirmó la grabación', detail: 'El servidor no devolvió todas las asignaciones. No cierres la ventana y revisa el mensaje de error.', life: 6000 })
      return
    }
    toast.add({ severity: 'success', summary: 'Permisos grabados', detail: `Se guardaron y verificaron ${pending.length} permisos del nivel actual.`, life: 3500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudieron seleccionar los permisos', detail: e instanceof Error ? e.message : 'Inténtalo nuevamente.', life: 5000 })
  } finally { saving.value = false }
}
async function clearAllAccess() {
  const assigned = accessRows.value.filter(item => item.assigned && item.accessId)
  if (!assigned.length) return

  saving.value = true
  toast.add({ severity: 'info', summary: 'Retirando permisos', detail: `Se retirarán ${assigned.length} asignaciones del nivel actual.`, life: 2500 })
  try {
    for (const item of assigned) {
      await authService.removeProfileAccess(item.accessId!)
      item.assigned = false
      item.accessId = undefined
    }
    const confirmed = await loadResource()
    const removed = assigned.every(item => accessRows.value.every(row => (row.resourceId ?? row.id) !== (item.resourceId ?? item.id) || !row.assigned))
    if (!confirmed || !removed) {
      toast.add({ severity: 'error', summary: 'No se confirmó el retiro', detail: 'El servidor no devolvió todas las bajas solicitadas.', life: 6000 })
      return
    }
    toast.add({ severity: 'success', summary: 'Permisos retirados', detail: `Se retiraron y verificaron ${assigned.length} permisos del nivel actual.`, life: 3500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'No se pudieron retirar los permisos', detail: e instanceof Error ? e.message : 'Inténtalo nuevamente.', life: 5000 })
  } finally { saving.value = false }
}
async function openApply(profile: UserProfile) { selected.value = profile; users.value = await authService.listSecurityUsers(); selectedUserId.value = null; applyDialog.value = true }
async function applyProfile() { if (!selected.value || !selectedUserId.value) return; saving.value = true; try { const result = await authService.applyUserProfile(selected.value.id, selectedUserId.value); applyDialog.value = false; toast.add({ severity: 'success', summary: 'Perfil aplicado', detail: `Se asignaron ${result.modules} módulos, ${result.menus} menús y ${result.options} opciones.`, life: 4500 }) } catch (e) { toast.add({ severity: 'error', summary: 'No se pudo aplicar el perfil', detail: e instanceof Error ? e.message : 'Inténtalo nuevamente.', life: 5000 }) } finally { saving.value = false } }
onMounted(() => { void loadProfiles() })
</script>

<template>
  <section class="companies-view">
    <header class="companies-view__header"><div><h1>Perfiles</h1><p>Plantillas de permisos reutilizables para usuarios.</p></div><div class="companies-view__actions"><Button v-if="canCreate" label="Nuevo perfil" icon="pi pi-plus" class="company-primary-button" @click="openCreate" /></div></header>
    <section class="companies-table-card"><div class="companies-table-card__toolbar"><span class="companies-table-card__title">Listado de perfiles</span></div><table class="profiles-table"><thead><tr><th>Perfil</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead><tbody><tr v-for="profile in profiles" :key="profile.id"><td>{{ profile.name }}</td><td>{{ profile.description || '—' }}</td><td><span :class="['company-status', `company-status--${profile.status === 'A' ? 'activo' : 'inactivo'}`]">{{ profile.status === 'A' ? 'Activo' : 'Inactivo' }}</span></td><td class="company-actions"><button v-if="canUpdate" title="Configurar permisos" @click="openPermissions(profile)"><i class="pi pi-key" /></button><button v-if="canAssign" title="Aplicar a usuario" @click="openApply(profile)"><i class="pi pi-users" /></button><button v-if="canUpdate" title="Editar" @click="openEdit(profile)"><i class="pi pi-pencil" /></button><button v-if="canDelete" title="Dar de baja" @click="deactivate(profile)"><i class="pi pi-trash" /></button></td></tr><tr v-if="!loading && !profiles.length"><td colspan="4">No hay perfiles registrados.</td></tr></tbody></table></section>
    <Dialog v-model:visible="profileDialog" modal :header="form.id ? 'Editar perfil' : 'Nuevo perfil'" class="company-dialog"><div class="company-form"><label>Nombre</label><InputText v-model="form.name" maxlength="50" fluid/><label>Descripción</label><InputText v-model="form.description" maxlength="100" fluid/><template v-if="form.id"><label>Estado</label><Select v-model="form.status" :options="[{label:'Activo',value:'A'},{label:'Inactivo',value:'I'}]" option-label="label" option-value="value" fluid/></template></div><template #footer><Button label="Cancelar" text @click="profileDialog=false"/><Button label="Guardar" class="company-primary-button" :loading="saving" @click="saveProfile"/></template></Dialog>
    <Dialog v-model:visible="permissionsDialog" modal header="Permisos del perfil" class="company-dialog profiles-permissions"><p class="profiles-permissions__name">{{ selected?.name }}</p><div class="profiles-resource-tabs"><Button v-for="(label, key) in resourceLabels" :key="key" :label="label" size="small" :outlined="resource !== key" :class="resource === key ? 'company-primary-button' : 'company-secondary-button'" @click="selectResource(key as Resource)"/></div><p class="profiles-permissions__help">Elige el nivel que deseas asignar. Los desplegables solo se muestran para ubicar su elemento padre.</p><div v-if="resource !== 'modules'" class="company-form"><label>Módulo</label><Select v-model="selectedModule" :options="optionItems(modules, 'Módulo')" option-label="label" option-value="value" placeholder="Selecciona un módulo" filter show-clear fluid @change="changeModule"/><template v-if="resource === 'submenus' || resource === 'second-level-submenus' || resource === 'form-options'"><label>Menú</label><Select v-model="selectedMenu" :options="optionItems(menus, 'Menú')" option-label="label" option-value="value" :disabled="!selectedModule" placeholder="Selecciona un menú" filter show-clear fluid @change="changeMenu"/></template><template v-if="resource === 'second-level-submenus' || resource === 'form-options'"><label>Submenú</label><Select v-model="selectedSubmenu" :options="optionItems(submenus, 'Submenú')" option-label="label" option-value="value" :disabled="!selectedMenu" placeholder="Selecciona un submenú" filter show-clear fluid @change="changeSubmenu"/></template><template v-if="resource === 'form-options' && secondLevels.length"><label>Segundo nivel</label><Select v-model="selectedSecondLevel" :options="optionItems(secondLevels, 'Segundo nivel')" option-label="label" option-value="value" :disabled="!selectedSubmenu" placeholder="Opcional" filter show-clear fluid @change="loadResource"/></template></div><p v-if="!canShowResource">Selecciona primero el elemento padre para administrar este nivel.</p><div v-else class="profiles-access-list"><div class="profiles-access-list__header"><span>{{ accessRows.length }} registros disponibles</span><div><Button label="Seleccionar todas" icon="pi pi-check-square" size="small" class="company-secondary-button" outlined :disabled="saving || !accessRows.length" @click="selectAllAccess"/><Button label="Quitar todas" icon="pi pi-times" size="small" class="company-secondary-button" outlined :disabled="saving || !accessRows.some(item => item.assigned && item.accessId)" @click="clearAllAccess"/></div></div><label v-for="item in accessRows" :key="item.resourceId ?? item.id"><input type="checkbox" :checked="item.assigned || Boolean(item.accessId)" :disabled="saving" @change="toggleAccess(item)"/> {{ item.name || item.code }}</label><p v-if="!accessRows.length">No hay registros disponibles en este nivel.</p></div><template #footer><Button label="Cerrar" class="company-primary-button" @click="permissionsDialog=false"/></template></Dialog>
    <Dialog v-model:visible="applyDialog" modal header="Aplicar perfil a usuario" class="company-dialog"><p>Al aplicar <strong>{{ selected?.name }}</strong> se reemplazarán los permisos directos actuales del usuario. Luego podrás agregar excepciones desde Asignación de accesos.</p><div class="company-form"><label>Usuario</label><Select v-model="selectedUserId" :options="userOptions" option-label="label" option-value="value" filter fluid/></div><template #footer><Button label="Cancelar" text @click="applyDialog=false"/><Button label="Aplicar perfil" class="company-primary-button" :loading="saving" :disabled="!selectedUserId" @click="applyProfile"/></template></Dialog>
  </section>
</template>
