<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, ModuleRegistry, themeQuartz, type CellClickedEvent, type ColDef } from 'ag-grid-community'
import { authService, type ActiveSite, type FixedCost } from '@/modules/security/services/auth.service'
import { createStandardGridOptions, formatGridDate } from '@/utils/ag-grid'
import { useObjectPermissions } from '@/composables/use-object-permissions'

ModuleRegistry.registerModules([AllCommunityModule])
type Row = FixedCost & { statusLabel: string }
const rows = ref<Row[]>([]), sites = ref<ActiveSite[]>([]), loading = ref(false), saving = ref(false), error = ref('')
const filtersVisible = ref(false), filterDescription = ref(''), filterSiteId = ref<string | null>(null), filterStatus = ref<string | null>(null)
const dialogVisible = ref(false), deleteVisible = ref(false), selected = ref<Row | null>(null)
const form = ref({ id: '', siteId: '', description: '', amount: null as number | null, status: 'A' })
const statuses = [{ label: 'Todos', value: null }, { label: 'Activo', value: 'A' }, { label: 'Inactivo', value: 'I' }]
const { can } = useObjectPermissions('fixed-costs')
const canCreate = can('create'), canUpdate = can('update'), canDelete = can('delete'), canFilter = can('filter')
const theme = themeQuartz.withParams({ accentColor: '#16457f', borderColor: '#d7e4f0', headerBackgroundColor: '#f4f8fc', headerTextColor: '#38536f', fontFamily: 'Manrope, sans-serif', wrapperBorderRadius: 0 })
const money = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const columns = computed<ColDef<Row>[]>(() => [
  { field: 'siteName', headerName: 'Sede', minWidth: 220, flex: 1.1 },
  { field: 'description', headerName: 'Descripción', minWidth: 260, flex: 1.3, cellRenderer: ({ value }: { value: string }) => `<strong class="company-name--single">${value}</strong>` },
  { field: 'amount', headerName: 'Importe', minWidth: 140, flex: .55, valueFormatter: ({ value }) => money.format(Number(value ?? 0)) },
  { field: 'statusLabel', headerName: 'Estado', minWidth: 120, flex: .5, cellRenderer: ({ data }: { data: Row }) => `<span class="company-status company-status--${data.statusLabel.toLowerCase()}">${data.statusLabel}</span>` },
  { field: 'createdAt', headerName: 'Fecha de creación', minWidth: 155, flex: .65, valueFormatter: ({ value }) => formatGridDate(value) },
  { headerName: 'Acciones', sortable: false, filter: false, minWidth: 110, maxWidth: 125, cellRenderer: () => `<div class="company-actions">${canUpdate.value ? '<button data-action="edit" aria-label="Editar costo fijo"><i class="pi pi-pencil"></i></button>' : ''}${canDelete.value ? '<button data-action="delete" aria-label="Dar de baja costo fijo"><i class="pi pi-trash"></i></button>' : ''}</div>` },
])
const hasFilters = computed(() => Boolean(filterDescription.value || filterSiteId.value || filterStatus.value))
const toRow = (value: FixedCost): Row => ({ ...value, statusLabel: value.status === 'A' ? 'Activo' : 'Inactivo' })
async function loadCatalogs() { try { sites.value = await authService.listActiveFixedCostSites() } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible cargar las sedes.' } }
async function load() { loading.value = true; error.value = ''; try { rows.value = (await authService.listFixedCosts({ siteId: filterSiteId.value || undefined, description: filterDescription.value || undefined, status: filterStatus.value || undefined })).map(toRow) } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible cargar los costos fijos.' } finally { loading.value = false } }
function openCreate() { form.value = { id: '', siteId: '', description: '', amount: null, status: 'A' }; dialogVisible.value = true }
function openEdit(value: Row) { selected.value = value; form.value = { id: value.id, siteId: value.siteId, description: value.description, amount: value.amount, status: value.status }; dialogVisible.value = true }
function cellClick(event: CellClickedEvent<Row>) { const action = (event.event?.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]')?.dataset.action; if (action === 'edit' && event.data) openEdit(event.data); if (action === 'delete' && event.data) { selected.value = event.data; deleteVisible.value = true } }
async function save() { if (!form.value.siteId || !form.value.description.trim() || form.value.amount === null || form.value.amount < 0) { error.value = 'Selecciona la sede, registra una descripción y un importe válido.'; return }; saving.value = true; try { const payload = { siteId: form.value.siteId, description: form.value.description.trim(), amount: form.value.amount, ...(form.value.id ? { status: form.value.status } : {}) }; if (form.value.id) await authService.updateFixedCost(form.value.id, payload); else await authService.createFixedCost(payload); dialogVisible.value = false; await load() } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible guardar el costo fijo.' } finally { saving.value = false } }
async function remove() { if (!selected.value) return; saving.value = true; try { await authService.deleteFixedCost(selected.value.id); deleteVisible.value = false; await load() } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible dar de baja el costo fijo.' } finally { saving.value = false } }
onMounted(async () => { await loadCatalogs(); await load() })
</script>
<template>
  <section class="companies-view" aria-label="Costos fijos">
    <header class="companies-view__header"><div><h1>Costos fijos</h1><p>Administración de costos fijos por sede.</p></div><div class="companies-view__actions"><Button v-if="canCreate" label="Nuevo costo fijo" icon="pi pi-plus" class="company-primary-button" @click="openCreate"/><Button v-if="canFilter" label="Filtros" icon="pi pi-filter" class="company-secondary-button" outlined @click="filtersVisible=true"/></div></header>
    <Message v-if="error" severity="error" closable @close="error=''">{{ error }}</Message>
    <section class="companies-table-card"><div class="companies-table-card__toolbar"><span class="companies-table-card__title">Listado de costos fijos</span><span v-if="hasFilters" class="companies-table-card__total">Filtros aplicados</span></div><AgGridVue v-bind="createStandardGridOptions<Row>()" class="companies-grid" :theme="theme" :row-data="rows" :column-defs="columns" :loading="loading" :default-col-def="{sortable:true,resizable:true,filter:true}" :dom-layout="'autoHeight'" @cell-clicked="cellClick"/></section>
    <Drawer v-model:visible="filtersVisible" position="right" class="companies-filter-drawer"><template #header><strong>Filtros de costos fijos</strong></template><div class="companies-filter-form"><label>Sede</label><Select v-model="filterSiteId" :options="sites" option-label="name" option-value="id" show-clear fluid/><label>Descripción</label><InputText v-model="filterDescription" fluid/><label>Estado</label><Select v-model="filterStatus" :options="statuses" option-label="label" option-value="value" fluid/></div><template #footer><div class="companies-filter-actions"><Button label="Limpiar" text @click="filterDescription='';filterSiteId=null;filterStatus=null"/><Button label="Aplicar filtros" class="company-primary-button" @click="filtersVisible=false;load()"/></div></template></Drawer>
    <Dialog v-model:visible="dialogVisible" modal :header="form.id ? 'Editar costo fijo' : 'Nuevo costo fijo'" class="company-dialog"><div class="company-form"><label>Sede</label><Select v-model="form.siteId" :options="sites" option-label="name" option-value="id" filter fluid/><label>Descripción</label><InputText v-model="form.description" maxlength="50" fluid/><label>Importe</label><InputNumber v-model="form.amount" :min="0" :max="99999999.99" :min-fraction-digits="2" :max-fraction-digits="2" fluid/><template v-if="form.id"><label>Estado</label><Select v-model="form.status" :options="statuses.slice(1)" option-label="label" option-value="value" fluid/></template></div><template #footer><Button label="Cancelar" text @click="dialogVisible=false"/><Button :label="form.id ? 'Guardar cambios' : 'Crear costo fijo'" class="company-primary-button" :loading="saving" @click="save"/></template></Dialog>
    <Dialog v-model:visible="deleteVisible" modal header="Dar de baja costo fijo" class="company-dialog company-dialog--confirm"><p>¿Deseas dar de baja a <strong>{{ selected?.description }}</strong>?</p><template #footer><Button label="Cancelar" text @click="deleteVisible=false"/><Button label="Dar de baja" severity="danger" :loading="saving" @click="remove"/></template></Dialog>
  </section>
</template>
