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
import { authService, type ContainerDimension } from '@/modules/security/services/auth.service'
import { createStandardGridOptions, formatGridDate } from '@/utils/ag-grid'
import { useObjectPermissions } from '@/composables/use-object-permissions'
ModuleRegistry.registerModules([AllCommunityModule])
type Row = ContainerDimension & { statusLabel: string }
const rows = ref<Row[]>([]), loading = ref(false), saving = ref(false), error = ref('')
const filtersVisible = ref(false), filterDimension = ref(''), filterStatus = ref<string | null>(null), dialogVisible = ref(false), deleteVisible = ref(false), selected = ref<Row | null>(null)
const form = ref({ id: '', dimension: '', status: 'A' })
const statuses = [{ label: 'Todos', value: null }, { label: 'Activo', value: 'A' }, { label: 'Inactivo', value: 'I' }]
const { can } = useObjectPermissions('container-dim')
const canCreate = can('create'), canUpdate = can('update'), canDelete = can('delete'), canFilter = can('filter')
const theme = themeQuartz.withParams({ accentColor: '#16457f', borderColor: '#d7e4f0', headerBackgroundColor: '#f4f8fc', headerTextColor: '#38536f', fontFamily: 'Manrope, sans-serif', wrapperBorderRadius: 0 })
const columns = computed<ColDef<Row>[]>(() => [
  { field: 'dimension', headerName: 'Dimensión', minWidth: 250, flex: 1.2, cellRenderer: ({ value }: { value: string }) => `<strong class="company-name--single">${value}</strong>` },
  { field: 'statusLabel', headerName: 'Estado', minWidth: 120, flex: .5, cellRenderer: ({ data }: { data: Row }) => `<span class="company-status company-status--${data.statusLabel.toLowerCase()}">${data.statusLabel}</span>` },
  { field: 'createdAt', headerName: 'Fecha de creación', minWidth: 155, flex: .65, valueFormatter: ({ value }) => formatGridDate(value) },
  { headerName: 'Acciones', sortable: false, filter: false, minWidth: 110, maxWidth: 125, cellRenderer: () => `<div class="company-actions">${canUpdate.value ? '<button data-action="edit" aria-label="Editar dimensión"><i class="pi pi-pencil"></i></button>' : ''}${canDelete.value ? '<button data-action="delete" aria-label="Dar de baja dimensión"><i class="pi pi-trash"></i></button>' : ''}</div>` },
])
const hasFilters = computed(() => Boolean(filterDimension.value || filterStatus.value))
const toRow = (value: ContainerDimension): Row => ({ ...value, statusLabel: value.status === 'A' ? 'Activo' : 'Inactivo' })
async function load() { loading.value = true; error.value = ''; try { rows.value = (await authService.listContainerDimensions({ dimension: filterDimension.value || undefined, status: filterStatus.value || undefined })).map(toRow) } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible cargar las dimensiones.' } finally { loading.value = false } }
function openCreate() { form.value = { id: '', dimension: '', status: 'A' }; dialogVisible.value = true }
function openEdit(value: Row) { selected.value = value; form.value = { id: value.id, dimension: value.dimension, status: value.status }; dialogVisible.value = true }
function cellClick(event: CellClickedEvent<Row>) { const action = (event.event?.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]')?.dataset.action; if (action === 'edit' && event.data) openEdit(event.data); if (action === 'delete' && event.data) { selected.value = event.data; deleteVisible.value = true } }
async function save() { const dimension = form.value.dimension.trim(); if (!dimension || dimension.length > 2) { error.value = 'La dimensión es obligatoria y debe tener como máximo 2 caracteres.'; return }; saving.value = true; try { const payload = { dimension, ...(form.value.id ? { status: form.value.status } : {}) }; if (form.value.id) await authService.updateContainerDimension(form.value.id, payload); else await authService.createContainerDimension(payload); dialogVisible.value = false; await load() } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible guardar la dimensión.' } finally { saving.value = false } }
async function remove() { if (!selected.value) return; saving.value = true; try { await authService.deleteContainerDimension(selected.value.id); deleteVisible.value = false; await load() } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible dar de baja la dimensión.' } finally { saving.value = false } }
onMounted(load)
</script>
<template><section class="companies-view" aria-label="Dimensión contenedor"><header class="companies-view__header"><div><h1>Dimensión contenedor</h1><p>Administración de dimensiones maestras de contenedor.</p></div><div class="companies-view__actions"><Button v-if="canCreate" label="Nueva dimensión" icon="pi pi-plus" class="company-primary-button" @click="openCreate"/><Button v-if="canFilter" label="Filtros" icon="pi pi-filter" class="company-secondary-button" outlined @click="filtersVisible=true"/></div></header><Message v-if="error" severity="error" closable @close="error=''">{{ error }}</Message><section class="companies-table-card"><div class="companies-table-card__toolbar"><span class="companies-table-card__title">Listado de dimensiones</span><span v-if="hasFilters" class="companies-table-card__total">Filtros aplicados</span></div><AgGridVue v-bind="createStandardGridOptions<Row>()" class="companies-grid" :theme="theme" :row-data="rows" :column-defs="columns" :loading="loading" :default-col-def="{sortable:true,resizable:true,filter:true}" :dom-layout="'autoHeight'" @cell-clicked="cellClick"/></section><Drawer v-model:visible="filtersVisible" position="right" class="companies-filter-drawer"><template #header><strong>Filtros de dimensiones</strong></template><div class="companies-filter-form"><label>Dimensión</label><InputText v-model="filterDimension" maxlength="2" fluid/><label>Estado</label><Select v-model="filterStatus" :options="statuses" option-label="label" option-value="value" fluid/></div><template #footer><div class="companies-filter-actions"><Button label="Limpiar" text @click="filterDimension='';filterStatus=null"/><Button label="Aplicar filtros" class="company-primary-button" @click="filtersVisible=false;load()"/></div></template></Drawer><Dialog v-model:visible="dialogVisible" modal :header="form.id ? 'Editar dimensión' : 'Nueva dimensión'" class="company-dialog"><div class="company-form"><label>Dimensión</label><InputText v-model="form.dimension" maxlength="2" fluid/><template v-if="form.id"><label>Estado</label><Select v-model="form.status" :options="statuses.slice(1)" option-label="label" option-value="value" fluid/></template></div><template #footer><Button label="Cancelar" text @click="dialogVisible=false"/><Button :label="form.id ? 'Guardar cambios' : 'Crear dimensión'" class="company-primary-button" :loading="saving" @click="save"/></template></Dialog><Dialog v-model:visible="deleteVisible" modal header="Dar de baja dimensión" class="company-dialog company-dialog--confirm"><p>¿Deseas dar de baja a <strong>{{ selected?.dimension }}</strong>?</p><template #footer><Button label="Cancelar" text @click="deleteVisible=false"/><Button label="Dar de baja" severity="danger" :loading="saving" @click="remove"/></template></Dialog></section></template>
