<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import { AgGridVue } from 'ag-grid-vue3'
import { AllCommunityModule, ModuleRegistry, themeQuartz, type CellClickedEvent, type ColDef } from 'ag-grid-community'
import { authService, type SecurityUser, type SecurityUserPayload } from '@/modules/security/services/auth.service'
import { createStandardGridOptions, formatGridDate } from '@/utils/ag-grid'
ModuleRegistry.registerModules([AllCommunityModule])
const emit = defineEmits<{ assignAccess: [] }>()
type Row = SecurityUser & {
  statusLabel: string
  createdAtValue: string | null
  changePasswordLabel: string
  multipleSitesLabel: string
  defaultSiteLabel: string
}
type UserForm = SecurityUserPayload & { id: string }
const rows=ref<Row[]>([]), loading=ref(false), error=ref(''), dialog=ref(false), deleteVisible=ref(false), resetVisible=ref(false), saving=ref(false)
const selected=ref<Row | null>(null)
const statusOptions=[{label:'Activo',value:'A'},{label:'Inactivo',value:'I'}]
function emptyForm(): UserForm { return { id:'', login:'', password:'', firstNames:'', paternalLastName:'', maternalLastName:'', email:'', status:'A', domainId:null, roleId:null, changePassword:true, multipleSites:false, defaultSiteId:null } }
const form=ref<UserForm>(emptyForm())
const theme=themeQuartz.withParams({accentColor:'#16457f',borderColor:'#d7e4f0',headerBackgroundColor:'#f4f8fc',headerTextColor:'#38536f',fontFamily:'Manrope, sans-serif'})
const columns = computed<ColDef<Row>[]>(() => [
  { field: 'login', headerName: 'Usuario', filter: 'agTextColumnFilter', minWidth: 140 },
  { field: 'firstNames', headerName: 'Nombres', filter: 'agTextColumnFilter', minWidth: 170 },
  { field: 'paternalLastName', headerName: 'Apellido paterno', filter: 'agTextColumnFilter', minWidth: 170 },
  { field: 'maternalLastName', headerName: 'Apellido materno', filter: 'agTextColumnFilter', minWidth: 170 },
  { field: 'email', headerName: 'Correo', filter: 'agTextColumnFilter', minWidth: 220 },
  { field: 'statusLabel', headerName: 'Estado', filter: 'agSetColumnFilter', minWidth: 120 },
  { field: 'changePasswordLabel', headerName: 'Cambio de clave', filter: 'agSetColumnFilter', minWidth: 155 },
  { field: 'multipleSitesLabel', headerName: 'Múltiples sedes', filter: 'agSetColumnFilter', minWidth: 160 },
  { field: 'defaultSiteLabel', headerName: 'Sede predeterminada', filter: 'agTextColumnFilter', minWidth: 190 },
  {
    field: 'createdAtValue',
    headerName: 'Fecha de creación',
    cellDataType: 'dateString',
    filter: 'agDateColumnFilter',
    valueFormatter: ({ value }) => formatGridDate(value),
    minWidth: 155,
  },
  { headerName:'Acciones', colId:'actions', pinned:'right', lockPinned:true, sortable:false, filter:false, resizable:false, width:144, minWidth:144, maxWidth:144, cellRenderer:()=>'<div class="company-actions"><button type="button" data-action="edit" aria-label="Editar usuario"><i class="pi pi-pencil"></i></button><button type="button" data-action="reset-password" aria-label="Resetear clave"><i class="pi pi-key"></i></button><button type="button" data-action="delete" aria-label="Dar de baja usuario"><i class="pi pi-trash"></i></button></div>' },
])
function map(x: SecurityUser): Row {
  const response = x as SecurityUser & {
    defaultSiteName?: string | null
    nomSedeDefault?: string | null
    nombreSedeDefault?: string | null
    NOMSEDEDEFAULT?: string | null
  }
  const defaultSiteName = response.defaultSiteName ?? response.nomSedeDefault ?? response.nombreSedeDefault ?? response.NOMSEDEDEFAULT
  return {
    ...x,
    statusLabel: x.status === 'A' ? 'Activo' : 'Inactivo',
    changePasswordLabel: x.changePassword ? 'Sí' : 'No',
    multipleSitesLabel: x.multipleSites ? 'Sí' : 'No',
    defaultSiteLabel: defaultSiteName?.trim() || 'Sin sede predeterminada',
    createdAtValue: x.createdAt?.slice(0, 10) ?? null,
  }
}
async function load(){loading.value=true;try{rows.value=(await authService.listSecurityUsers()).map(map)}catch(e){error.value=e instanceof Error?e.message:'No fue posible cargar usuarios.'}finally{loading.value=false}}
function openCreate(){form.value=emptyForm();dialog.value=true}
function openEdit(user:Row){selected.value=user;form.value={id:user.id,login:user.login,password:'',firstNames:user.firstNames||'',paternalLastName:user.paternalLastName||'',maternalLastName:user.maternalLastName||'',email:user.email||'',status:user.status,domainId:user.domainId,roleId:user.roleId,changePassword:user.changePassword,multipleSites:user.multipleSites,defaultSiteId:user.defaultSiteId};dialog.value=true}
function handleCellClick(event:CellClickedEvent<Row>){const action=(event.event?.target as HTMLElement | null)?.closest<HTMLElement>('[data-action]')?.dataset.action;if(!action||!event.data)return;if(action==='edit')openEdit(event.data);if(action==='reset-password'){selected.value=event.data;resetVisible.value=true};if(action==='delete'){selected.value=event.data;deleteVisible.value=true}}
async function save(){if(!form.value.login?.trim()||!form.value.firstNames?.trim()||!form.value.email?.trim()||(!form.value.id&&!form.value.password)){error.value='Completa usuario, contraseña, nombres y correo.';return};saving.value=true;try{const payload={...form.value,login:form.value.login.trim(),firstNames:form.value.firstNames.trim(),paternalLastName:form.value.paternalLastName.trim(),maternalLastName:form.value.maternalLastName.trim(),email:form.value.email.trim()};delete (payload as Partial<UserForm>).id;if(!payload.password)delete (payload as Partial<SecurityUserPayload>).password;if(form.value.id)await authService.updateSecurityUser(form.value.id,payload);else await authService.createSecurityUser(payload);dialog.value=false;await load()}catch(e){error.value=e instanceof Error?e.message:'No fue posible guardar.'}finally{saving.value=false}}
async function remove(){if(!selected.value)return;saving.value=true;try{await authService.deleteSecurityUser(selected.value.id);deleteVisible.value=false;await load()}catch(e){error.value=e instanceof Error?e.message:'No fue posible dar de baja el usuario.'}finally{saving.value=false}}
async function resetPassword(){if(!selected.value)return;saving.value=true;try{await authService.changeSecurityUserPassword(selected.value.id,null);resetVisible.value=false;await load()}catch(e){error.value=e instanceof Error?e.message:'No fue posible resetear la clave.'}finally{saving.value=false}}
onMounted(load)
</script>

<template>
  <section class="companies-view">
    <header class="companies-view__header"><div><h1>Usuarios</h1><p>Administración de usuarios de seguridad.</p></div><div class="companies-view__actions"><Button label="Asignar accesos" icon="pi pi-shield" class="company-secondary-button" outlined @click="emit('assignAccess')" /><Button label="Nuevo usuario" icon="pi pi-plus" class="company-primary-button" @click="openCreate" /></div></header>
    <Message v-if="error" severity="error" closable @close="error=''">{{ error }}</Message>
    <section class="companies-table-card"><div class="companies-table-card__toolbar"><span class="companies-table-card__title">Listado de usuarios</span></div><AgGridVue v-bind="createStandardGridOptions<Row>()" class="companies-grid" :theme="theme" :row-data="rows" :column-defs="columns" :loading="loading" :default-col-def="{sortable:true,resizable:true,filter:true}" :dom-layout="'autoHeight'" @cell-clicked="handleCellClick" /></section>
    <Dialog v-model:visible="dialog" modal :header="form.id ? 'Editar usuario' : 'Nuevo usuario'" class="company-dialog"><div class="company-form"><label>Usuario</label><InputText v-model="form.login" maxlength="20" fluid /><template v-if="!form.id"><label>Contraseña</label><InputText v-model="form.password" type="password" fluid /></template><label>Nombres</label><InputText v-model="form.firstNames" fluid /><label>Apellido paterno</label><InputText v-model="form.paternalLastName" fluid /><label>Apellido materno</label><InputText v-model="form.maternalLastName" fluid /><label>Correo</label><InputText v-model="form.email" type="email" fluid /><label v-if="form.id">Estado</label><Select v-if="form.id" v-model="form.status" :options="statusOptions" option-label="label" option-value="value" fluid /></div><template #footer><Button label="Cancelar" class="company-secondary-button" text @click="dialog=false" /><Button :label="form.id ? 'Guardar cambios' : 'Crear usuario'" icon="pi pi-check" class="company-primary-button" :loading="saving" @click="save" /></template></Dialog>
    <Dialog v-model:visible="resetVisible" modal header="Resetear clave" class="company-dialog company-dialog--confirm"><p>¿Deseas resetear la clave de <strong>{{ selected?.login }}</strong>?</p><p class="company-dialog__hint">El usuario deberá cambiar su contraseña al volver a iniciar sesión.</p><template #footer><Button label="Cancelar" severity="secondary" text @click="resetVisible=false" /><Button label="Resetear clave" icon="pi pi-key" class="company-primary-button" :loading="saving" @click="resetPassword" /></template></Dialog>
    <Dialog v-model:visible="deleteVisible" modal header="Dar de baja usuario" class="company-dialog company-dialog--confirm"><p>¿Deseas dar de baja a <strong>{{ selected?.login }}</strong>?</p><template #footer><Button label="Cancelar" severity="secondary" text @click="deleteVisible=false" /><Button label="Dar de baja" icon="pi pi-trash" severity="danger" :loading="saving" @click="remove" /></template></Dialog>
  </section>
</template>
