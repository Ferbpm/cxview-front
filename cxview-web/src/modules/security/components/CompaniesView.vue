<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, ModuleRegistry, themeQuartz, type CellClickedEvent, type ColDef } from 'ag-grid-community'
import { authService, type Company, type CompanyFilters } from '@/modules/security/services/auth.service'
import { createStandardGridOptions, formatGridDate } from '@/utils/ag-grid'
import { useObjectPermissions } from '@/composables/use-object-permissions'

ModuleRegistry.registerModules([AllCommunityModule])

type CompanyRow = Company & { statusLabel: string; createdAtValue: string | null; type: string }
const companies = ref<CompanyRow[]>([])
const loading = ref(false)
const error = ref('')
const filtersVisible = ref(false)
const filterStatus = ref<string | null>(null)
const filterName = ref('')
const filterRuc = ref('')
const statusOptions = [{ label: 'Todos', value: null }, { label: 'Activo', value: 'A' }, { label: 'Inactivo', value: 'I' }]
const dialogVisible = ref(false)
const deleteVisible = ref(false)
const saving = ref(false)
const selectedCompany = ref<CompanyRow | null>(null)
const form = ref({ id: '', name: '', ruc: '', status: 'A' })
const standardGridOptions = createStandardGridOptions<CompanyRow>()
const { can } = useObjectPermissions('company')
const canCreate = can('create')
const canUpdate = can('update')
const canDelete = can('delete')
const canFilter = can('filter')
const gridTheme = themeQuartz.withParams({
  accentColor: '#16457f',
  borderColor: '#d7e4f0',
  columnBorder: { color: '#e6edf4' },
  headerBackgroundColor: '#f4f8fc',
  headerTextColor: '#38536f',
  headerFontSize: 12,
  headerFontWeight: 800,
  rowBorder: { color: '#e5edf4' },
  foregroundColor: '#40546a',
  fontFamily: 'Manrope, sans-serif',
  wrapperBorderRadius: 0,
})
const columnDefs = computed<ColDef<CompanyRow>[]>(() => [
  { field: 'ruc', headerName: 'RUC', minWidth: 145, flex: .75, filter: 'agTextColumnFilter' },
  { field: 'name', headerName: 'Empresa', minWidth: 300, flex: 1.8, filter: 'agTextColumnFilter', cellRenderer: ({ value }: { value: string }) => `<strong class="company-name--single">${value}</strong>` },
  { field: 'statusLabel', headerName: 'Estado', minWidth: 120, flex: .55, filter: 'agTextColumnFilter', cellRenderer: ({ data }: { data: CompanyRow }) => `<span class="company-status company-status--${data.statusLabel.toLowerCase()}">${data.statusLabel}</span>` },
  { field: 'createdAtValue', headerName: 'Fecha de creación', minWidth: 155, flex: .72, cellDataType: 'dateString', filter: 'agDateColumnFilter', valueFormatter: ({ value }) => formatGridDate(value) },
  { headerName: 'Acciones', sortable: false, filter: false, minWidth: 110, maxWidth: 125, cellRenderer: () => `<div class="company-actions">${canUpdate.value ? '<button type="button" data-action="edit" aria-label="Editar empresa"><i class="pi pi-pencil"></i></button>' : ''}${canDelete.value ? '<button type="button" data-action="delete" aria-label="Dar de baja empresa"><i class="pi pi-trash"></i></button>' : ''}</div>` },
])
const hasActiveFilters = computed(() => Boolean(filterName.value || filterRuc.value || filterStatus.value))
function toRow(company: Company): CompanyRow { return { ...company, type: 'Empresa propietaria', statusLabel: company.status === 'A' ? 'Activo' : 'Inactivo', createdAtValue: company.createdAt?.slice(0, 10) ?? null } }
async function loadCompanies() {
  loading.value = true; error.value = ''
  const filters: CompanyFilters = { empresa: filterName.value || undefined, ruc: filterRuc.value || undefined, estado: filterStatus.value || undefined }
  try { companies.value = (await authService.listCompanies(filters)).map(toRow) }
  catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible cargar la empresa.' }
  finally { loading.value = false }
}
function clearFilters() { filterName.value = ''; filterRuc.value = ''; filterStatus.value = null }
async function applyFilters() { filtersVisible.value = false; await loadCompanies() }
function openCreate() { form.value = { id: '', name: '', ruc: '', status: 'A' }; dialogVisible.value = true }
function openEdit(company: CompanyRow) { selectedCompany.value = company; form.value = { id: company.id, name: company.name, ruc: company.ruc, status: company.status }; dialogVisible.value = true }
function handleCellClick(event: CellClickedEvent<CompanyRow>) { const action = (event.event?.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]')?.dataset.action; if (action === 'edit' && event.data && canUpdate.value) openEdit(event.data); if (action === 'delete' && event.data && canDelete.value) { selectedCompany.value = event.data; deleteVisible.value = true } }
async function saveCompany() { if (!form.value.name.trim() || !form.value.ruc.trim()) { error.value = 'Completa la razón social y el RUC.'; return }; saving.value = true; error.value = ''; try { if (form.value.id) await authService.updateCompany(form.value.id, { name: form.value.name.trim(), ruc: form.value.ruc.trim(), status: form.value.status }); else await authService.createCompany({ name: form.value.name.trim(), ruc: form.value.ruc.trim() }); dialogVisible.value = false; await loadCompanies() } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible guardar la empresa.' } finally { saving.value = false } }
async function deleteCompany() { if (!selectedCompany.value) return; saving.value = true; error.value = ''; try { await authService.deleteCompany(selectedCompany.value.id); deleteVisible.value = false; await loadCompanies() } catch (reason) { error.value = reason instanceof Error ? reason.message : 'No fue posible dar de baja la empresa.' } finally { saving.value = false } }
onMounted(loadCompanies)
</script>

<template>
  <section class="companies-view" aria-label="Empresas">
    <header class="companies-view__header">
      <div><h1>Empresa</h1><p>Información de la empresa.</p></div>
      <div class="companies-view__actions"><Button v-if="canCreate" label="Nueva empresa" icon="pi pi-plus" class="company-primary-button" @click="openCreate" /><Button v-if="canFilter" label="Filtros" icon="pi pi-filter" class="company-secondary-button" outlined @click="filtersVisible = true" /></div>
    </header>
    <Message v-if="error" severity="error" closable @close="error = ''">{{ error }}</Message>
    <section class="companies-table-card">
      <div class="companies-table-card__toolbar"><span class="companies-table-card__title">Datos de la empresa</span><span v-if="hasActiveFilters" class="companies-table-card__total">Filtros aplicados</span></div>
      <AgGridVue v-bind="standardGridOptions" class="companies-grid" :theme="gridTheme" :row-data="companies" :column-defs="columnDefs" :default-col-def="{ sortable: true, resizable: true, filter: true }" :loading="loading" :dom-layout="'autoHeight'" :overlay-no-rows-template="'No hay información para mostrar.'" @cell-clicked="handleCellClick" />
    </section>
    <Drawer v-model:visible="filtersVisible" position="right" class="companies-filter-drawer" :modal="true">
      <template #header><div><span class="companies-filter-kicker">Empresa</span><strong>Filtros de consulta</strong></div></template>
      <div class="companies-filter-form"><label for="company-name">Empresa</label><InputText id="company-name" v-model="filterName" placeholder="Nombre de empresa" fluid /><label for="company-ruc">RUC</label><InputText id="company-ruc" v-model="filterRuc" maxlength="11" placeholder="RUC" fluid /><label for="company-status">Estado</label><Select id="company-status" v-model="filterStatus" :options="statusOptions" option-label="label" option-value="value" placeholder="Todos los estados" show-clear fluid /></div>
      <template #footer><div class="companies-filter-actions"><Button label="Limpiar" icon="pi pi-times" class="company-secondary-button" text @click="clearFilters" /><Button label="Aplicar filtros" icon="pi pi-check" class="company-primary-button" @click="applyFilters" /></div></template>
    </Drawer>
    <Dialog v-model:visible="dialogVisible" modal :header="form.id ? 'Editar empresa' : 'Nueva empresa'" class="company-dialog"><div class="company-form"><label for="form-company-name">Razón social</label><InputText id="form-company-name" v-model="form.name" maxlength="200" fluid /><label for="form-company-ruc">RUC</label><InputText id="form-company-ruc" v-model="form.ruc" maxlength="11" fluid /><template v-if="form.id"><label for="form-company-status">Estado</label><Select id="form-company-status" v-model="form.status" :options="statusOptions" option-label="label" option-value="value" fluid /></template></div><template #footer><Button label="Cancelar" class="company-secondary-button" text @click="dialogVisible = false" /><Button :label="form.id ? 'Guardar cambios' : 'Crear empresa'" icon="pi pi-check" class="company-primary-button" :loading="saving" @click="saveCompany" /></template></Dialog>
    <Dialog v-model:visible="deleteVisible" modal header="Dar de baja empresa" class="company-dialog company-dialog--confirm"><p>¿Deseas dar de baja a <strong>{{ selectedCompany?.name }}</strong>?</p><template #footer><Button label="Cancelar" severity="secondary" text @click="deleteVisible = false" /><Button label="Dar de baja" icon="pi pi-trash" severity="danger" :loading="saving" @click="deleteCompany" /></template></Dialog>
  </section>
</template>
