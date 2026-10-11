<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, ModuleRegistry, themeQuartz, type CellClickedEvent, type ColDef } from 'ag-grid-community'
import { authService, type IntegratedLogisticsCampaign, type IntegratedLogisticsProduct, type Ubigeo } from '@/modules/security/services/auth.service'
import { createStandardGridOptions, formatGridDate } from '@/utils/ag-grid'
import { useObjectPermissions } from '@/composables/use-object-permissions'

ModuleRegistry.registerModules([AllCommunityModule])
type Row = IntegratedLogisticsCampaign & { statusLabel: string; ubigeoLabel: string }
const rows = ref<Row[]>([]), products = ref<IntegratedLogisticsProduct[]>([]), ubigeos = ref<Ubigeo[]>([]), loading = ref(false), saving = ref(false), error = ref('')
const filtersVisible = ref(false), filterProcess = ref(''), filterStatus = ref<string | null>(null), filterProduct = ref<string | null>(null), filterUbigeo = ref<string | null>(null)
const dialogVisible = ref(false), deleteVisible = ref(false), selected = ref<Row | null>(null)
const form = ref({ id: '', ubigeoId: '', productId: '', startDate: '', endDate: '', process: '', description: '', status: 'A' })
const statuses = [{ label: 'Todos', value: null }, { label: 'Activo', value: 'A' }, { label: 'Inactivo', value: 'I' }]
const { can } = useObjectPermissions('campaigns')
const canCreate = can('create'), canUpdate = can('update'), canDelete = can('delete'), canFilter = can('filter')
const productOptions = computed(() => products.value.map(item => ({ label: item.description ? `${item.name} · ${item.description}` : item.name, value: item.id })))
const ubigeoOptions = computed(() => ubigeos.value.map(item => ({ label: item.description || [item.district, item.province, item.department].filter(Boolean).join(' - '), value: item.id })))
const theme = themeQuartz.withParams({ accentColor: '#16457f', borderColor: '#d7e4f0', headerBackgroundColor: '#f4f8fc', headerTextColor: '#38536f', fontFamily: 'Manrope, sans-serif', wrapperBorderRadius: 0 })
const columns = computed<ColDef<Row>[]>(() => [
  { field: 'process', headerName: 'Proceso', minWidth: 180, flex: .9, cellRenderer: ({ value }: { value: string }) => `<strong class="company-name--single">${value}</strong>` },
  { field: 'productName', headerName: 'Producto', minWidth: 180, flex: .8 }, { field: 'ubigeoLabel', headerName: 'Ubigeo', minWidth: 230, flex: 1 },
  { field: 'startDate', headerName: 'Inicio', minWidth: 120, flex: .55, valueFormatter: ({ value }) => formatGridDate(value) }, { field: 'endDate', headerName: 'Fin', minWidth: 120, flex: .55, valueFormatter: ({ value }) => formatGridDate(value) },
  { field: 'description', headerName: 'Descripción', minWidth: 220, flex: 1 }, { field: 'statusLabel', headerName: 'Estado', minWidth: 110, flex: .45, cellRenderer: ({ data }: { data: Row }) => `<span class="company-status company-status--${data.statusLabel.toLowerCase()}">${data.statusLabel}</span>` },
  { headerName: 'Acciones', sortable: false, filter: false, minWidth: 110, maxWidth: 125, cellRenderer: () => `<div class="company-actions">${canUpdate.value ? '<button data-action="edit" aria-label="Editar campaña"><i class="pi pi-pencil"></i></button>' : ''}${canDelete.value ? '<button data-action="delete" aria-label="Dar de baja campaña"><i class="pi pi-trash"></i></button>' : ''}</div>` },
])
const hasFilters = computed(() => Boolean(filterProcess.value || filterStatus.value || filterProduct.value || filterUbigeo.value))
const toRow = (value: IntegratedLogisticsCampaign): Row => ({ ...value, statusLabel: value.status === 'A' ? 'Activo' : 'Inactivo', ubigeoLabel: [value.ubigeoCode, value.district, value.province, value.department].filter(Boolean).join(' - ') })
async function load() { loading.value = true; error.value = ''; try { rows.value = (await authService.listIntegratedLogisticsCampaigns({ process: filterProcess.value || undefined, status: filterStatus.value || undefined, productId: filterProduct.value || undefined, ubigeoId: filterUbigeo.value || undefined })).map(toRow) } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible cargar las campañas.' } finally { loading.value = false } }
async function loadCatalogs() { try { [products.value, ubigeos.value] = await Promise.all([authService.listActiveProducts(), authService.listActiveUbigeos()]) } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible cargar los catálogos.' } }
function openCreate() { form.value = { id: '', ubigeoId: '', productId: '', startDate: '', endDate: '', process: '', description: '', status: 'A' }; dialogVisible.value = true }
function openEdit(value: Row) { selected.value = value; form.value = { id: value.id, ubigeoId: value.ubigeoId, productId: value.productId, startDate: value.startDate, endDate: value.endDate, process: value.process, description: value.description ?? '', status: value.status }; dialogVisible.value = true }
function cellClick(event: CellClickedEvent<Row>) { const action = (event.event?.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]')?.dataset.action; if (action === 'edit' && event.data) openEdit(event.data); if (action === 'delete' && event.data) { selected.value = event.data; deleteVisible.value = true } }
async function save() { if (!form.value.ubigeoId || !form.value.productId || !form.value.startDate || !form.value.endDate || !form.value.process.trim()) { error.value = 'Completa ubigeo, producto, fechas y proceso.'; return }; if (form.value.endDate < form.value.startDate) { error.value = 'La fecha de fin no puede ser menor que la fecha de inicio.'; return }; saving.value = true; try { const payload = { ubigeoId: form.value.ubigeoId, productId: form.value.productId, startDate: form.value.startDate, endDate: form.value.endDate, process: form.value.process.trim(), description: form.value.description.trim() || null, ...(form.value.id ? { status: form.value.status } : {}) }; if (form.value.id) await authService.updateIntegratedLogisticsCampaign(form.value.id, payload); else await authService.createIntegratedLogisticsCampaign(payload); dialogVisible.value = false; await load() } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible guardar la campaña.' } finally { saving.value = false } }
async function remove() { if (!selected.value) return; saving.value = true; try { await authService.deleteIntegratedLogisticsCampaign(selected.value.id); deleteVisible.value = false; await load() } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible dar de baja la campaña.' } finally { saving.value = false } }
onMounted(async () => { await loadCatalogs(); await load() })
</script>
<template>
  <section class="companies-view" aria-label="Campañas">
    <header class="companies-view__header"><div><h1>Campañas</h1><p>Administración de campañas de logística integrada.</p></div><div class="companies-view__actions"><Button v-if="canCreate" label="Nueva campaña" icon="pi pi-plus" class="company-primary-button" @click="openCreate"/><Button v-if="canFilter" label="Filtros" icon="pi pi-filter" class="company-secondary-button" outlined @click="filtersVisible=true"/></div></header>
    <Message v-if="error" severity="error" closable @close="error=''">{{ error }}</Message>
    <section class="companies-table-card"><div class="companies-table-card__toolbar"><span class="companies-table-card__title">Listado de campañas</span><span v-if="hasFilters" class="companies-table-card__total">Filtros aplicados</span></div><AgGridVue v-bind="createStandardGridOptions<Row>()" class="companies-grid" :theme="theme" :row-data="rows" :column-defs="columns" :loading="loading" :default-col-def="{sortable:true,resizable:true,filter:true}" :dom-layout="'autoHeight'" @cell-clicked="cellClick"/></section>
    <Drawer v-model:visible="filtersVisible" position="right" class="companies-filter-drawer"><template #header><strong>Filtros de campañas</strong></template><div class="companies-filter-form"><label>Proceso</label><InputText v-model="filterProcess" fluid/><label>Producto</label><Select v-model="filterProduct" :options="productOptions" option-label="label" option-value="value" show-clear filter fluid/><label>Ubigeo</label><Select v-model="filterUbigeo" :options="ubigeoOptions" option-label="label" option-value="value" show-clear filter fluid/><label>Estado</label><Select v-model="filterStatus" :options="statuses" option-label="label" option-value="value" fluid/></div><template #footer><div class="companies-filter-actions"><Button label="Limpiar" text @click="filterProcess='';filterStatus=null;filterProduct=null;filterUbigeo=null"/><Button label="Aplicar filtros" class="company-primary-button" @click="filtersVisible=false;load()"/></div></template></Drawer>
    <Dialog v-model:visible="dialogVisible" modal :header="form.id ? 'Editar campaña' : 'Nueva campaña'" class="company-dialog"><div class="company-form"><label>Ubigeo</label><Select v-model="form.ubigeoId" :options="ubigeoOptions" option-label="label" option-value="value" filter fluid/><label>Producto</label><Select v-model="form.productId" :options="productOptions" option-label="label" option-value="value" filter fluid/><label>Fecha de inicio</label><InputText v-model="form.startDate" type="date" fluid/><label>Fecha de fin</label><InputText v-model="form.endDate" type="date" fluid/><label>Proceso</label><InputText v-model="form.process" maxlength="50" fluid/><label>Descripción</label><InputText v-model="form.description" maxlength="100" fluid/><template v-if="form.id"><label>Estado</label><Select v-model="form.status" :options="statuses.slice(1)" option-label="label" option-value="value" fluid/></template></div><template #footer><Button label="Cancelar" text @click="dialogVisible=false"/><Button :label="form.id ? 'Guardar cambios' : 'Crear campaña'" class="company-primary-button" :loading="saving" @click="save"/></template></Dialog>
    <Dialog v-model:visible="deleteVisible" modal header="Dar de baja campaña" class="company-dialog company-dialog--confirm"><p>¿Deseas dar de baja a <strong>{{ selected?.process }}</strong>?</p><template #footer><Button label="Cancelar" text @click="deleteVisible=false"/><Button label="Dar de baja" severity="danger" :loading="saving" @click="remove"/></template></Dialog>
  </section>
</template>
