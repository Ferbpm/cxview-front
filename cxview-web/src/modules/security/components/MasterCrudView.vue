<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { useToast } from 'primevue/usetoast'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, ModuleRegistry, themeQuartz, type CellClickedEvent, type ColDef } from 'ag-grid-community'
import { authService, type MasterRecord, type MasterResource } from '@/modules/security/services/auth.service'
import { workspaceViewOptions } from '@/modules/security/config/workspace-views'
import { createStandardGridOptions, formatGridDate } from '@/utils/ag-grid'
import { useObjectPermissions } from '@/composables/use-object-permissions'

ModuleRegistry.registerModules([AllCommunityModule])
const props = defineProps<{ title: string; resource: MasterResource; parentLabel: string; parentResource?: MasterResource }>()
const { can } = useObjectPermissions(props.resource)
const toast = useToast()
const canCreate = can('create'), canUpdate = can('update'), canDelete = can('delete'), canFilter = can('filter')
type ParentOption = { label: string; value: string; moduleId?: string }
type Row = MasterRecord & { statusLabel: string; createdAtValue: string | null; parentNameLabel: string; moduleNameLabel: string }
const rows = ref<Row[]>([]); const loading = ref(false); const saving = ref(false); const error = ref(''); const filtersVisible = ref(false); const dialogVisible = ref(false); const deleteVisible = ref(false); const selected = ref<Row | null>(null)
const filterName = ref(''); const filterStatus = ref<string | null>(null); const filterParentId = ref<string | null>(null); const filterModuleId = ref<string | null>(null); const parents = ref<ParentOption[]>([]); const moduleNames = ref<Record<string, string>>({}); const moduleOptions = ref<ParentOption[]>([]); const formModuleId = ref<string | null>(null); const form = ref({ id: '', parentId: '', name: '', description: '', viewKey: '', status: 'A' })
const statuses = [{ label: 'Todos', value: null }, { label: 'Activo', value: 'A' }, { label: 'Inactivo', value: 'I' }]
const gridTheme = themeQuartz.withParams({ accentColor: '#16457f', borderColor: '#d7e4f0', headerBackgroundColor: '#f4f8fc', headerTextColor: '#38536f', fontFamily: 'Manrope, sans-serif', wrapperBorderRadius: 0 })
const columns = computed<ColDef<Row>[]>(() => [
  ...(props.resource === 'submenus' ? [{ field: 'moduleNameLabel', headerName: 'Módulo', minWidth: 200, flex: .9, filter: 'agTextColumnFilter' } as ColDef<Row>] : []),
  ...(props.parentResource ? [{ field: 'parentNameLabel', headerName: props.parentLabel, minWidth: 220, flex: 1, filter: 'agTextColumnFilter' } as ColDef<Row>] : []),
  { field: 'name', headerName: 'Nombre', minWidth: 220, flex: 1.1, filter: 'agTextColumnFilter' },
  { field: 'description', headerName: 'Descripción', minWidth: 240, flex: 1.3, filter: 'agTextColumnFilter' },
  ...(props.resource === 'submenus' ? [{ field: 'viewKey', headerName: 'Vista dinámica', minWidth: 230, flex: .9, filter: 'agTextColumnFilter' } as ColDef<Row>] : []),
  { field: 'statusLabel', headerName: 'Estado', minWidth: 115, flex: .5, filter: 'agTextColumnFilter', cellRenderer: ({ data }: { data: Row }) => `<span class="company-status company-status--${data.statusLabel.toLowerCase()}">${data.statusLabel}</span>` },
  { field: 'createdAtValue', headerName: 'Fecha de creación', minWidth: 150, flex: .65, cellDataType: 'dateString', filter: 'agDateColumnFilter', valueFormatter: ({ value }) => formatGridDate(value) },
  { headerName: 'Acciones', sortable: false, filter: false, width: 110, cellRenderer: () => `<div class="company-actions">${canUpdate.value ? '<button data-action="edit"><i class="pi pi-pencil"></i></button>' : ''}${canDelete.value ? '<button data-action="delete"><i class="pi pi-trash"></i></button>' : ''}</div>` },
])
const availableParentOptions = computed(() => props.resource === 'submenus' ? parents.value.filter(menu => menu.moduleId === formModuleId.value) : parents.value)
const filterParentOptions = computed(() => {
  const options = props.resource === 'submenus' && filterModuleId.value ? parents.value.filter(menu => menu.moduleId === filterModuleId.value) : parents.value
  return props.resource === 'submenus' && !filterModuleId.value
    ? options.map(menu => ({ ...menu, label: `${menu.moduleId ? moduleNames.value[menu.moduleId] ?? 'Módulo no disponible' : 'Módulo no disponible'} · ${menu.label}` }))
    : options
})
function asRow(item: MasterRecord): Row {
  const parent = parents.value.find(candidate => candidate.value === item.parentId)
  return { ...item, parentNameLabel: item.applicationName?.trim() || item.parentName?.trim() || parent?.label || `${props.parentLabel} no disponible`, moduleNameLabel: props.resource === 'submenus' && parent?.moduleId ? moduleNames.value[parent.moduleId] ?? 'Módulo no disponible' : '', statusLabel: item.status === 'A' ? 'Activo' : 'Inactivo', createdAtValue: item.createdAt?.slice(0, 10) ?? null }
}
async function load() { loading.value = true; error.value = ''; try { const result = await authService.listMaster(props.resource, { parentId: filterParentId.value || undefined, name: filterName.value || undefined, status: filterStatus.value || undefined }); rows.value = result.filter(item => !filterModuleId.value || props.resource !== 'submenus' || parents.value.find(menu => menu.value === item.parentId)?.moduleId === filterModuleId.value).map(asRow) } catch (e) { error.value = e instanceof Error ? e.message : 'No fue posible cargar los datos.' } finally { loading.value = false } }
async function loadParents() {
  if (!props.parentResource) parents.value = (await authService.listCompanies()).map(x => ({ label: x.name, value: x.id }))
  else if (props.resource === 'submenus') {
    const [menuRecords, moduleRecords] = await Promise.all([authService.listMaster('menus'), authService.listMaster('modules')])
    moduleNames.value = Object.fromEntries(moduleRecords.map(module => [module.id, module.name]))
    moduleOptions.value = moduleRecords.map(module => ({ label: module.name, value: module.id }))
    parents.value = menuRecords.map(menu => ({ label: menu.name, value: menu.id, moduleId: menu.parentId }))
  } else parents.value = (await authService.listMaster(props.parentResource)).map(x => ({ label: x.name, value: x.id }))
  rows.value = rows.value.map(asRow)
}
function openCreate() { if (!canCreate.value) return; formModuleId.value = null; form.value = { id: '', parentId: props.resource === 'submenus' ? '' : parents.value.length === 1 ? parents.value[0].value : '', name: '', description: '', viewKey: '', status: 'A' }; dialogVisible.value = true }
function openEdit(row: Row) { if (!canUpdate.value) return; formModuleId.value = props.resource === 'submenus' ? parents.value.find(menu => menu.value === row.parentId)?.moduleId ?? null : null; form.value = { id: row.id, parentId: row.parentId, name: row.name, description: row.description ?? '', viewKey: row.viewKey ?? '', status: row.status }; dialogVisible.value = true }
function changeFormModule() { form.value.parentId = '' }
function changeFilterModule() { filterParentId.value = null }
function clickCell(event: CellClickedEvent<Row>) { const action = (event.event?.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]')?.dataset.action; if (action === 'edit' && event.data && canUpdate.value) openEdit(event.data); if (action === 'delete' && event.data && canDelete.value) { selected.value = event.data; deleteVisible.value = true } }
async function save() { if (!form.value.parentId || !form.value.name.trim()) { toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: `Completa ${props.parentLabel.toLowerCase()} y nombre.`, life: 4000 }); return }; saving.value = true; try { const payload = { parentId: form.value.parentId, name: form.value.name.trim(), description: form.value.description.trim(), ...(props.resource === 'submenus' ? { viewKey: form.value.viewKey || null } : {}), status: form.value.status }; if (form.value.id) await authService.updateMaster(props.resource, form.value.id, payload); else await authService.createMaster(props.resource, payload); dialogVisible.value = false; await load(); toast.add({ severity: 'success', summary: 'Cambios guardados', detail: 'El registro se guardó correctamente.', life: 3500 }) } catch (e) { toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: e instanceof Error ? e.message : 'No fue posible guardar.', life: 5000 }) } finally { saving.value = false } }
async function remove() { if (!selected.value || !canDelete.value) return; saving.value = true; try { await authService.deleteMaster(props.resource, selected.value.id); deleteVisible.value = false; await load(); toast.add({ severity: 'success', summary: 'Registro dado de baja', detail: 'La operación se realizó correctamente.', life: 3500 }) } catch (e) { toast.add({ severity: 'error', summary: 'No se pudo dar de baja', detail: e instanceof Error ? e.message : 'No fue posible eliminar.', life: 5000 }) } finally { saving.value = false } }
onMounted(async () => { await loadParents(); await load() })
</script>
<template>
  <section class="companies-view">
    <header class="companies-view__header">
      <div><h1>{{ title }}</h1><p>Administración de {{ title.toLowerCase() }}.</p></div>
      <div class="companies-view__actions">
        <Button v-if="canCreate" label="Nuevo" icon="pi pi-plus" class="company-primary-button" @click="openCreate" />
        <Button v-if="canFilter" label="Filtros" icon="pi pi-filter" class="company-secondary-button" outlined @click="filtersVisible = true" />
      </div>
    </header>
    <Message v-if="error" severity="error" closable @close="error = ''">{{ error }}</Message>
    <section class="companies-table-card">
      <div class="companies-table-card__toolbar"><span class="companies-table-card__title">Listado</span></div>
      <AgGridVue v-bind="createStandardGridOptions<Row>()" class="companies-grid" :theme="gridTheme" :row-data="rows" :column-defs="columns" :loading="loading" :default-col-def="{ sortable: true, resizable: true, filter: true }" :dom-layout="'autoHeight'" @cell-clicked="clickCell" />
    </section>
    <Drawer v-model:visible="filtersVisible" position="right" class="companies-filter-drawer">
      <template #header><strong>Filtros de consulta</strong></template>
      <div class="companies-filter-form">
        <template v-if="resource === 'submenus'"><label>Módulo</label><Select v-model="filterModuleId" :options="moduleOptions" option-label="label" option-value="value" placeholder="Todos los módulos" show-clear filter fluid @update:model-value="changeFilterModule" /></template>
        <template v-if="parentResource"><label>{{ parentLabel }}</label><Select v-model="filterParentId" :options="filterParentOptions" option-label="label" option-value="value" :placeholder="resource === 'submenus' && filterModuleId ? 'Todos los menús del módulo' : `Todos los ${parentLabel.toLowerCase()}s`" show-clear filter fluid /></template>
        <label>Nombre</label><InputText v-model="filterName" fluid />
        <label>Estado</label><Select v-model="filterStatus" :options="statuses" option-label="label" option-value="value" fluid />
      </div>
      <template #footer><div class="companies-filter-actions"><Button label="Limpiar" class="company-secondary-button" text @click="filterName = ''; filterStatus = null; filterParentId = null; filterModuleId = null" /><Button label="Aplicar filtros" class="company-primary-button" @click="filtersVisible = false; load()" /></div></template>
    </Drawer>
    <Dialog v-model:visible="dialogVisible" modal :header="form.id ? 'Editar' : 'Nuevo'" class="company-dialog">
      <div class="company-form"><template v-if="resource === 'submenus'"><label>Módulo</label><Select v-model="formModuleId" :options="moduleOptions" option-label="label" option-value="value" placeholder="Selecciona un módulo" filter fluid @update:model-value="changeFormModule" /></template><label>{{ parentLabel }}</label><Select v-model="form.parentId" :options="availableParentOptions" option-label="label" option-value="value" :placeholder="resource === 'submenus' && !formModuleId ? 'Selecciona primero un módulo' : `Selecciona un ${parentLabel.toLowerCase()}`" :disabled="resource === 'submenus' && !formModuleId" filter fluid /><label>Nombre</label><InputText v-model="form.name" maxlength="50" fluid /><label>Descripción</label><InputText v-model="form.description" :maxlength="resource === 'submenus' ? 100 : 50" fluid /><template v-if="resource === 'submenus'"><label>Vista dinámica</label><Select v-model="form.viewKey" :options="workspaceViewOptions" option-label="label" option-value="value" placeholder="Sin vista dinámica" show-clear filter fluid /><small>La clave define el componente que se abrirá; el nombre solo se muestra al usuario.</small></template><template v-if="form.id"><label>Estado</label><Select v-model="form.status" :options="statuses.slice(1)" option-label="label" option-value="value" fluid /></template></div>
      <template #footer><Button label="Cancelar" class="company-secondary-button" text @click="dialogVisible = false" /><Button label="Guardar" class="company-primary-button" :loading="saving" @click="save" /></template>
    </Dialog>
    <Dialog v-model:visible="deleteVisible" modal header="Confirmar baja" class="company-dialog"><p>¿Dar de baja a <strong>{{ selected?.name }}</strong>?</p><template #footer><Button label="Cancelar" text @click="deleteVisible = false" /><Button label="Dar de baja" severity="danger" :loading="saving" @click="remove" /></template></Dialog>
  </section>
</template>
