const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL?.replace(/\/$/, '') ?? ''
const AUTH_MOCK_ENABLED = import.meta.env.VITE_AUTH_MOCK_ENABLED === 'true'
const OTP_CHALLENGE_KEY = 'cxview.otp.challenge'
const AUTH_USER_KEY = 'cxview.auth.user'
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'cxview.auth.expires-at'

export class SessionExpiredError extends Error {
  constructor() { super('Tu sesión expiró. Inicia sesión nuevamente.') }
}

function getSharedSessionValue(key: string) {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key)
}

function setSharedSessionValue(key: string, value: string) {
  // No se guarda ningún token en storage. La cookie HttpOnly es la única
  // credencial y el usuario/vencimiento se comparten para nuevas pestañas.
  sessionStorage.setItem(key, value)
  localStorage.setItem(key, value)
}

function clearSessionStorage() {
  sessionStorage.removeItem(OTP_CHALLENGE_KEY)
  sessionStorage.removeItem(AUTH_USER_KEY)
  sessionStorage.removeItem('cxview.auth.token') // elimina un token legado si existe
  sessionStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY)
  localStorage.removeItem('cxview.auth.token')
}

export interface OtpChallenge {
  challengeId: string
  maskedDestination: string
}

interface LoginPayload {
  username: string
  password: string
  remember: boolean
}

interface LoginResponse {
  success: boolean
  message: string
  challengeId?: string | null
  maskedDestination?: string | null
}

interface TokenResponse { expiresAt: string }

export interface AssignedSite {
  siteId: string
  name: string
  abbreviation: string
  address: string | null
  phone: string | null
  isDefault: boolean
}

export interface AssignedOperationType {
  operationTypeId: string
  name: string
}

export interface AssignedBusinessUnit {
  businessUnitId: string
  name: string
  description: string
  salesRegionId: string
}

export interface AssignedModule {
  moduleId: string
  applicationId: string
  applicationName: string
  name: string
  description: string
}

export interface AuthorizedMenu {
  menuId: string
  name: string
  description: string
}

export interface AuthorizedSubmenu {
  submenuId: string
  name: string
  description: string | null
  viewKey?: string | null
}

export interface Company {
  id: string
  name: string
  ruc: string
  status: string
  isRecordActive: boolean
  createdBy: string | null
  createdAt: string | null
  updatedBy: string | null
  updatedAt: string | null
}

export interface CompanyFilters { idEmpresa?: string; empresa?: string; ruc?: string; estado?: string }
export interface CompanyPayload { name: string; ruc: string; status?: string }
export interface IntegratedLogisticsProduct { id: string; name: string; description: string | null; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface ProductFilters { id?: string; name?: string; status?: string }
export interface ProductPayload { name: string; description?: string | null; status?: string }
export interface Ubigeo { id: string; code: string | null; district: string | null; province: string | null; department: string | null; description: string | null }
export interface IntegratedLogisticsCampaign { id: string; ubigeoId: string; ubigeoCode: string | null; district: string | null; province: string | null; department: string | null; productId: string; productName: string | null; productDescription: string | null; startDate: string; endDate: string; process: string; description: string | null; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface CampaignFilters { id?: string; ubigeoId?: string; productId?: string; process?: string; status?: string }
export interface CampaignPayload { ubigeoId: string; productId: string; startDate: string; endDate: string; process: string; description?: string | null; status?: string }
export interface FixedCost { id: string; siteId: string; siteName: string | null; description: string; amount: number; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface FixedCostFilters { id?: string; siteId?: string; description?: string; status?: string }
export interface FixedCostPayload { siteId: string; description: string; amount: number; status?: string }
export interface ActiveSite { id: string; name: string; abbreviation: string | null }
export interface Deposit { id: string; depositTypeId: string; depositTypeDescription: string | null; name: string; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface DepositFilters { id?: string; depositTypeId?: string; name?: string; status?: string }
export interface DepositPayload { depositTypeId: string; name: string; status?: string }
export interface ActiveDepositType { id: string; description: string }
export interface ContainerDimension { id: string; dimension: string; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface ContainerDimensionFilters { id?: string; dimension?: string; status?: string }
export interface ContainerDimensionPayload { dimension: string; status?: string }
export interface EntityAddressType { id: string; description: string; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface EntityAddressTypeFilters { id?: string; description?: string; status?: string }
export interface EntityAddressTypePayload { description: string; status?: string }
export interface PaymentType { id: string; description: string; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface PaymentTypeFilters { id?: string; name?: string; status?: string }
export interface PaymentTypePayload { description: string; status?: string }
export interface ShippingLine { id: string; description: string; sunatCode: string | null; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface ShippingLineFilters { id?: string; description?: string; sunatCode?: string; status?: string }
export interface ShippingLinePayload { description: string; sunatCode?: string | null; status?: string }
export interface PickupPlace { id: string; description: string; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface PickupPlaceFilters { id?: string; name?: string; status?: string }
export interface PickupPlacePayload { description: string; status?: string }
export interface Currency { id: string; description: string; symbol: string; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface CurrencyFilters { id?: string; description?: string; symbol?: string; status?: string }
export interface CurrencyPayload { description: string; symbol: string; status?: string }
export interface CurrentAccountDocumentType { id: string; code: string; description: string; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface CurrentAccountDocumentTypeFilters { id?: string; code?: string; description?: string; status?: string }
export interface CurrentAccountDocumentTypePayload { code: string; description: string; status?: string }
export interface PackagingType { id: string; description: string; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface PackagingTypeFilters { id?: string; name?: string; status?: string }
export interface PackagingTypePayload { description: string; status?: string }
export type MasterResource = 'applications' | 'domains' | 'areas' | 'roles' | 'modules' | 'menus' | 'submenus' | 'second-level-submenus'
export interface MasterRecord { id: string; parentId: string; parentName?: string | null; applicationName?: string | null; name: string; description: string | null; viewKey?: string | null; status: string; isRecordActive: boolean; createdBy: string | null; createdAt: string | null; updatedBy: string | null; updatedAt: string | null }
export interface MasterPayload { parentId: string; name: string; description: string; viewKey?: string | null; status?: string }
export interface MasterFilters { id?: string; parentId?: string; name?: string; status?: string }
export interface SecurityUser { id: string; domainId: string | null; roleId: string | null; login: string; firstNames: string; paternalLastName: string; maternalLastName: string; email: string; status: string; changePassword: boolean; multipleSites: boolean; defaultSiteId: string | null; defaultSiteName?: string | null; isRecordActive: boolean; createdAt: string | null }
export interface SecurityUserPayload { domainId: string | null; roleId: string | null; login: string; password?: string; firstNames: string; paternalLastName: string; maternalLastName: string; email: string; changePassword: boolean; multipleSites: boolean; defaultSiteId: string | null; status?: string }
export interface PasswordChangeResult { id: string; login: string; status: string; changePassword: boolean; updatedBy: string | null; updatedAt: string | null; rowsAffected: number }
export interface AccessCatalogItem { id: string; resourceId?: string; moduleId?: string; menuId?: string; submenuId?: string; secondLevelSubmenuId?: string | null; parentId?: string; name?: string; description?: string | null; code?: string; status: string; isRecordActive: boolean; assigned?: boolean; isActive?: boolean; accessId?: string }
export interface FormOption extends AccessCatalogItem { color?: string | null; icon?: string | null; submenuName?: string | null; menuName?: string | null; moduleName?: string | null; applicationName?: string | null }
export interface FormOptionPayload { submenuId?: string | null; secondLevelId?: string | null; code: string; name: string; description?: string | null; color?: string | null; icon?: string | null; status?: string }
export interface UserAccess { modules: AccessCatalogItem[]; menus: AccessCatalogItem[]; submenus: AccessCatalogItem[]; secondLevelSubmenus: AccessCatalogItem[]; formOptions: AccessCatalogItem[] }
export interface UserProfile { id: string; applicationId: string | null; name: string; description: string | null; status: string; isRecordActive: boolean }
export interface UserProfilePayload { applicationId?: string | null; name: string; description?: string | null; status?: string }
export interface ProfileApplicationResult { profileId: string; userId: string; modules: number; menus: number; submenus: number; secondLevels: number; options: number }
const masterQueryKeys: Record<MasterResource, { id: string; parent: string; name: string }> = { applications: { id: 'idApp', parent: 'idEmpresa', name: 'aplicacion' }, domains: { id: 'idDominio', parent: 'idEmpresa', name: 'dominio' }, areas: { id: 'idArea', parent: 'idEmpresa', name: 'area' }, roles: { id: 'idRol', parent: 'idArea', name: 'rol' }, modules: { id: 'idModulo', parent: 'idApp', name: 'modulo' }, menus: { id: 'idMenu', parent: 'idModulo', name: 'menu' }, submenus: { id: 'idSubmenu', parent: 'idMenu', name: 'submenu' }, 'second-level-submenus': { id: 'idSecondLevelSubmenu', parent: 'idSubmenu', name: 'name' } }

function maskDestination(username: string) {
  if (!username.includes('@')) return `${username.slice(0, 2)}${'•'.repeat(Math.max(3, username.length - 2))}`
  const [name, domain] = username.split('@')
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(3, name.length - 2))}@${domain}`
}

async function mockPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
  await new Promise((resolve) => window.setTimeout(resolve, 450))

  if (path === '/api/v1/auth/login') {
    const { username } = body as LoginPayload
    return {
      success: true,
      message: 'Se envió un código de verificación.',
      challengeId: crypto.randomUUID(),
      maskedDestination: maskDestination(username),
    } as TResponse
  }

  if (path === '/api/v1/auth/verify-otp') {
    return { expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } as TResponse
  }

  if (path === '/api/v1/auth/refresh') {
    return { expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() } as TResponse
  }

  return undefined as TResponse
}

async function post<TResponse>(path: string, body: unknown): Promise<TResponse> {
  if (AUTH_MOCK_ENABLED) return mockPost<TResponse>(path, body)

  let response: Response
  try {
    response = await fetch(`${API_GATEWAY_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('No fue posible conectarse con el servicio de autenticación.')
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error('El usuario o la contraseña no son correctos.')
    if (response.status === 429) throw new Error('Has superado el límite de intentos. Espera un minuto antes de volver a intentarlo.')
    throw new Error('No pudimos completar la solicitud. Inténtalo nuevamente.')
  }

  if (response.status === 204) return undefined as TResponse
  return response.json() as Promise<TResponse>
}

async function authorizedRequest<TResponse>(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', resourceName: string, body?: unknown): Promise<TResponse> {
  const expiresAt = getSharedSessionValue(ACCESS_TOKEN_EXPIRES_AT_KEY)
  if (expiresAt && Date.parse(expiresAt) <= Date.now()) {
    clearSessionStorage()
    throw new SessionExpiredError()
  }

  let response: Response
  try {
    response = await fetch(`${API_GATEWAY_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
  } catch {
    throw new Error('No fue posible conectarse con el servicio de seguridad.')
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearSessionStorage()
      throw new SessionExpiredError()
    }
    if (response.status === 400) {
      const payload = await response.json().catch(() => null) as { message?: unknown; Message?: unknown } | null
      const message = payload?.message ?? payload?.Message
      throw new Error(typeof message === 'string' ? message : `La solicitud para ${resourceName} no es válida.`)
    }
    if (response.status === 403) throw new Error(`No tienes permisos para realizar esta operación en ${resourceName}.`)
    if (response.status === 404) throw new Error(`No se encontró ${resourceName}.`)
    throw new Error(`No fue posible obtener ${resourceName}.`)
  }

  if (response.status === 204) return undefined as TResponse
  return response.json() as Promise<TResponse>
}

function get<TResponse>(path: string, resourceName: string): Promise<TResponse> {
  return authorizedRequest<TResponse>(path, 'GET', resourceName)
}

function unwrapList<T>(value: T[] | { data?: T[]; items?: T[]; results?: T[]; value?: T[] }): T[] {
  if (Array.isArray(value)) return value
  return value?.data ?? value?.items ?? value?.results ?? value?.value ?? []
}

function unwrapUserAccess(value: UserAccess | { data?: UserAccess; result?: UserAccess; value?: UserAccess }): UserAccess {
  const access = ('data' in value ? value.data : 'result' in value ? value.result : 'value' in value ? value.value : value) ?? {}
  const source = access as Partial<UserAccess> & { Modules?: AccessCatalogItem[]; Menus?: AccessCatalogItem[]; Submenus?: AccessCatalogItem[]; SecondLevelSubmenus?: AccessCatalogItem[]; FormOptions?: AccessCatalogItem[] }
  return { modules: source.modules ?? source.Modules ?? [], menus: source.menus ?? source.Menus ?? [], submenus: source.submenus ?? source.Submenus ?? [], secondLevelSubmenus: source.secondLevelSubmenus ?? source.SecondLevelSubmenus ?? [], formOptions: source.formOptions ?? source.FormOptions ?? [] }
}

export const authService = {
  async login(payload: LoginPayload) {
    const response = await post<LoginResponse>('/api/v1/auth/login', {
      userName: payload.username,
      password: payload.password,
    })

    if (!response.success || !response.challengeId) {
      throw new Error('El usuario o la contraseña no son correctos.')
    }

    const challenge: OtpChallenge = {
      challengeId: response.challengeId,
      maskedDestination: response.maskedDestination || 'tu correo registrado',
    }
    sessionStorage.setItem(OTP_CHALLENGE_KEY, JSON.stringify(challenge))
    sessionStorage.setItem(AUTH_USER_KEY, payload.username)
    return challenge
  },

  getOtpChallenge(): OtpChallenge | null {
    const value = sessionStorage.getItem(OTP_CHALLENGE_KEY)
    if (!value) return null

    try {
      const challenge = JSON.parse(value) as OtpChallenge
      return challenge.challengeId && challenge.maskedDestination ? challenge : null
    } catch {
      sessionStorage.removeItem(OTP_CHALLENGE_KEY)
      return null
    }
  },

  async verifyOtp(challengeId: string, code: string) {
    const result = await post<TokenResponse>('/api/v1/auth/verify-otp', { challengeId, code })
    if (!result.expiresAt) throw new Error('No fue posible completar la verificación.')
    const userName = sessionStorage.getItem(AUTH_USER_KEY)
    if (userName) setSharedSessionValue(AUTH_USER_KEY, userName)
    setSharedSessionValue(ACCESS_TOKEN_EXPIRES_AT_KEY, result.expiresAt)
    return result
  },

  async refreshSession() {
    if (AUTH_MOCK_ENABLED) {
      const result = await mockPost<TokenResponse>('/api/v1/auth/refresh', {})
      setSharedSessionValue(ACCESS_TOKEN_EXPIRES_AT_KEY, result.expiresAt)
      return result
    }
    const response = await fetch(`${API_GATEWAY_URL}/api/v1/auth/refresh`, { method: 'POST', credentials: 'include', headers: { Accept: 'application/json' } })
    if (!response.ok) throw new SessionExpiredError()
    const result = await response.json() as TokenResponse
    if (!result.expiresAt) throw new SessionExpiredError()
    setSharedSessionValue(ACCESS_TOKEN_EXPIRES_AT_KEY, result.expiresAt)
    return result
  },

  listAssignedSites(userName: string) {
    if (AUTH_MOCK_ENABLED) {
      return Promise.resolve<AssignedSite[]>([
        { siteId: 'callao', name: 'CALLAO', abbreviation: 'CLL', address: 'Av. Ejemplo 123', phone: '012345678', isDefault: true },
        { siteId: 'chancay', name: 'CHANCAY', abbreviation: 'CHY', address: null, phone: null, isDefault: false },
      ])
    }
    return get<AssignedSite[]>(`/api/v1/security/users/${encodeURIComponent(userName)}/sites`, 'las sedes asignadas')
  },

  listOperationTypes(userName: string) {
    if (AUTH_MOCK_ENABLED) {
      return Promise.resolve<AssignedOperationType[]>([
        { operationTypeId: 'import', name: 'Importación' },
        { operationTypeId: 'export', name: 'Exportación' },
        { operationTypeId: 'national', name: 'Operación nacional' },
      ])
    }
    const query = new URLSearchParams({ userName })
    return get<AssignedOperationType[]>(`/api/v1/security/operation-types?${query.toString()}`, 'los tipos de operación asignados')
  },

  listBusinessUnits(userName: string) {
    if (AUTH_MOCK_ENABLED) {
      return Promise.resolve<AssignedBusinessUnit[]>([
        { businessUnitId: 'agency', name: 'Agenciamiento', description: '', salesRegionId: 'region-1' },
        { businessUnitId: 'international-cargo', name: 'Carga internacional', description: '', salesRegionId: 'region-1' },
        { businessUnitId: 'logistics-services', name: 'Servicios logísticos', description: '', salesRegionId: 'region-1' },
      ])
    }
    const query = new URLSearchParams({ userName })
    return get<AssignedBusinessUnit[]>(`/api/v1/security/business-units?${query.toString()}`, 'las unidades de negocio asignadas')
  },

  listModules(userName: string) {
    if (AUTH_MOCK_ENABLED) {
      return Promise.resolve<AssignedModule[]>([
        { moduleId: 'integrated-logistics', applicationId: 'vlc', applicationName: 'Web View Logistics', name: 'LOGÍSTICA INTEGRADA', description: 'Módulo servicio integrado de logística' },
        { moduleId: 'security', applicationId: 'vlc', applicationName: 'Web View Logistics', name: 'SEGURIDAD', description: 'Administración de usuarios y accesos' },
        { moduleId: 'temporary-depot', applicationId: 'vlc', applicationName: 'Web View Logistics', name: 'DEPÓSITO TEMPORAL', description: 'Gestión integral del depósito temporal' },
      ])
    }
    const query = new URLSearchParams({ userName })
    return get<AssignedModule[]>(`/api/v1/security/modules?${query.toString()}`, 'los módulos asignados')
  },

  listMenus(userName: string, moduleId: string) {
    if (AUTH_MOCK_ENABLED) {
      return Promise.resolve<AuthorizedMenu[]>([
        { menuId: 'operations', name: 'Operaciones', description: 'Gestión de operaciones asignadas' },
        { menuId: 'documents', name: 'Documentos', description: 'Consulta de documentos operativos' },
        { menuId: 'reports', name: 'Reportes', description: 'Indicadores y reportes disponibles' },
      ])
    }
    const query = new URLSearchParams({ userName, idMod: moduleId })
    return get<AuthorizedMenu[]>(`/api/v1/security/menus?${query.toString()}`, 'los menús autorizados')
  },

  listSubmenus(userName: string, menuId: string) {
    if (AUTH_MOCK_ENABLED) {
      return Promise.resolve<AuthorizedSubmenu[]>([
        { submenuId: 'assigned-items', name: 'Opciones asignadas', description: 'Opciones disponibles para este menú' },
      ])
    }
    const query = new URLSearchParams({ userName, idMenu: menuId })
    return get<AuthorizedSubmenu[]>(`/api/v1/security/submenus?${query.toString()}`, 'los submenús autorizados')
  },

  listCompanies(filters: CompanyFilters = {}) {
    if (AUTH_MOCK_ENABLED) return Promise.resolve<Company[]>([{ id: 'company-1', name: 'View Logistics Cargo S.A.C.', ruc: '20100055591', status: 'A', isRecordActive: true, createdBy: 'admin', createdAt: '2026-09-14T00:00:00', updatedBy: 'admin', updatedAt: '2026-09-14T00:00:00' }])
    const query = new URLSearchParams()
    if (filters.idEmpresa) query.set('idEmpresa', filters.idEmpresa)
    if (filters.empresa) query.set('empresa', filters.empresa)
    if (filters.ruc) query.set('ruc', filters.ruc)
    if (filters.estado) query.set('estado', filters.estado)
    return get<Company[]>(`/api/v1/security/companies${query.size ? `?${query.toString()}` : ''}`, 'la empresa')
  },

  createCompany(payload: CompanyPayload) {
    if (AUTH_MOCK_ENABLED) return Promise.resolve<Company>({ id: crypto.randomUUID(), name: payload.name, ruc: payload.ruc, status: 'A', isRecordActive: true, createdBy: 'mock', createdAt: new Date().toISOString(), updatedBy: null, updatedAt: null })
    return authorizedRequest<Company>('/api/v1/security/companies', 'POST', 'la empresa', payload)
  },

  updateCompany(id: string, payload: CompanyPayload) {
    if (AUTH_MOCK_ENABLED) return Promise.resolve<Company>({ id, name: payload.name, ruc: payload.ruc, status: payload.status ?? 'A', isRecordActive: true, createdBy: 'mock', createdAt: new Date().toISOString(), updatedBy: 'mock', updatedAt: new Date().toISOString() })
    return authorizedRequest<Company>(`/api/v1/security/companies/${encodeURIComponent(id)}`, 'PUT', 'la empresa', payload)
  },

  deleteCompany(id: string) {
    if (AUTH_MOCK_ENABLED) return Promise.resolve<void>(undefined)
    return authorizedRequest<void>(`/api/v1/security/companies/${encodeURIComponent(id)}`, 'DELETE', 'la empresa')
  },

  listIntegratedLogisticsProducts(filters: ProductFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.name) query.set('name', filters.name)
    if (filters.status) query.set('status', filters.status)
    return get<IntegratedLogisticsProduct[]>(`/api/v1/integrated-logistics/products${query.size ? `?${query.toString()}` : ''}`, 'los productos')
  },

  createIntegratedLogisticsProduct(payload: ProductPayload) {
    return authorizedRequest<IntegratedLogisticsProduct>('/api/v1/integrated-logistics/products', 'POST', 'el producto', payload)
  },

  updateIntegratedLogisticsProduct(id: string, payload: ProductPayload) {
    return authorizedRequest<IntegratedLogisticsProduct>(`/api/v1/integrated-logistics/products/${encodeURIComponent(id)}`, 'PUT', 'el producto', payload)
  },

  deleteIntegratedLogisticsProduct(id: string) {
    return authorizedRequest<void>(`/api/v1/integrated-logistics/products/${encodeURIComponent(id)}`, 'DELETE', 'el producto')
  },

  listActiveProducts() {
    return get<IntegratedLogisticsProduct[]>('/api/v1/integrated-logistics/products/active', 'los productos activos')
  },

  listIntegratedLogisticsCampaigns(filters: CampaignFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.ubigeoId) query.set('ubigeoId', filters.ubigeoId)
    if (filters.productId) query.set('productId', filters.productId)
    if (filters.process) query.set('process', filters.process)
    if (filters.status) query.set('status', filters.status)
    return get<IntegratedLogisticsCampaign[]>(`/api/v1/integrated-logistics/campaigns${query.size ? `?${query.toString()}` : ''}`, 'las campañas')
  },

  listActiveUbigeos() {
    return get<Ubigeo[]>('/api/v1/integrated-logistics/campaigns/ubigeos/active', 'los ubigeos activos')
  },

  createIntegratedLogisticsCampaign(payload: CampaignPayload) {
    return authorizedRequest<IntegratedLogisticsCampaign>('/api/v1/integrated-logistics/campaigns', 'POST', 'la campaña', payload)
  },

  updateIntegratedLogisticsCampaign(id: string, payload: CampaignPayload) {
    return authorizedRequest<IntegratedLogisticsCampaign>(`/api/v1/integrated-logistics/campaigns/${encodeURIComponent(id)}`, 'PUT', 'la campaña', payload)
  },

  deleteIntegratedLogisticsCampaign(id: string) {
    return authorizedRequest<void>(`/api/v1/integrated-logistics/campaigns/${encodeURIComponent(id)}`, 'DELETE', 'la campaña')
  },

  listFixedCosts(filters: FixedCostFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.siteId) query.set('siteId', filters.siteId)
    if (filters.description) query.set('description', filters.description)
    if (filters.status) query.set('status', filters.status)
    return get<FixedCost[]>(`/api/v1/integrated-logistics/fixed-costs${query.size ? `?${query.toString()}` : ''}`, 'los costos fijos')
  },
  listActiveFixedCostSites() { return get<ActiveSite[]>('/api/v1/integrated-logistics/fixed-costs/sites/active', 'las sedes activas') },
  createFixedCost(payload: FixedCostPayload) { return authorizedRequest<FixedCost>('/api/v1/integrated-logistics/fixed-costs', 'POST', 'el costo fijo', payload) },
  updateFixedCost(id: string, payload: FixedCostPayload) { return authorizedRequest<FixedCost>(`/api/v1/integrated-logistics/fixed-costs/${encodeURIComponent(id)}`, 'PUT', 'el costo fijo', payload) },
  deleteFixedCost(id: string) { return authorizedRequest<void>(`/api/v1/integrated-logistics/fixed-costs/${encodeURIComponent(id)}`, 'DELETE', 'el costo fijo') },

  listDeposits(filters: DepositFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.depositTypeId) query.set('depositTypeId', filters.depositTypeId)
    if (filters.name) query.set('name', filters.name)
    if (filters.status) query.set('status', filters.status)
    return get<Deposit[]>(`/api/v1/integrated-logistics/deposits${query.size ? `?${query.toString()}` : ''}`, 'los depósitos')
  },
  listActiveDepositTypes() { return get<ActiveDepositType[]>('/api/v1/integrated-logistics/deposits/types/active', 'los tipos de depósito activos') },
  createDeposit(payload: DepositPayload) { return authorizedRequest<Deposit>('/api/v1/integrated-logistics/deposits', 'POST', 'el depósito', payload) },
  updateDeposit(id: string, payload: DepositPayload) { return authorizedRequest<Deposit>(`/api/v1/integrated-logistics/deposits/${encodeURIComponent(id)}`, 'PUT', 'el depósito', payload) },
  deleteDeposit(id: string) { return authorizedRequest<void>(`/api/v1/integrated-logistics/deposits/${encodeURIComponent(id)}`, 'DELETE', 'el depósito') },

  listContainerDimensions(filters: ContainerDimensionFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.dimension) query.set('dimension', filters.dimension)
    if (filters.status) query.set('status', filters.status)
    return get<ContainerDimension[]>(`/api/v1/master-tables/container-dimensions${query.size ? `?${query.toString()}` : ''}`, 'las dimensiones de contenedor')
  },
  createContainerDimension(payload: ContainerDimensionPayload) { return authorizedRequest<ContainerDimension>('/api/v1/master-tables/container-dimensions', 'POST', 'la dimensión de contenedor', payload) },
  updateContainerDimension(id: string, payload: ContainerDimensionPayload) { return authorizedRequest<ContainerDimension>(`/api/v1/master-tables/container-dimensions/${encodeURIComponent(id)}`, 'PUT', 'la dimensión de contenedor', payload) },
  deleteContainerDimension(id: string) { return authorizedRequest<void>(`/api/v1/master-tables/container-dimensions/${encodeURIComponent(id)}`, 'DELETE', 'la dimensión de contenedor') },

  listEntityAddressTypes(filters: EntityAddressTypeFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.description) query.set('description', filters.description)
    if (filters.status) query.set('status', filters.status)
    return get<EntityAddressType[]>(`/api/v1/master-tables/entity-address-types${query.size ? `?${query.toString()}` : ''}`, 'los tipos de dirección')
  },
  createEntityAddressType(payload: EntityAddressTypePayload) { return authorizedRequest<EntityAddressType>('/api/v1/master-tables/entity-address-types', 'POST', 'el tipo de dirección', payload) },
  updateEntityAddressType(id: string, payload: EntityAddressTypePayload) { return authorizedRequest<EntityAddressType>(`/api/v1/master-tables/entity-address-types/${encodeURIComponent(id)}`, 'PUT', 'el tipo de dirección', payload) },
  deleteEntityAddressType(id: string) { return authorizedRequest<void>(`/api/v1/master-tables/entity-address-types/${encodeURIComponent(id)}`, 'DELETE', 'el tipo de dirección') },

  listPaymentTypes(filters: PaymentTypeFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.name) query.set('name', filters.name)
    if (filters.status) query.set('status', filters.status)
    return get<PaymentType[]>(`/api/v1/master-tables/payment-types${query.size ? `?${query.toString()}` : ''}`, 'los tipos de pago')
  },
  createPaymentType(payload: PaymentTypePayload) { return authorizedRequest<PaymentType>('/api/v1/master-tables/payment-types', 'POST', 'el tipo de pago', payload) },
  updatePaymentType(id: string, payload: PaymentTypePayload) { return authorizedRequest<PaymentType>(`/api/v1/master-tables/payment-types/${encodeURIComponent(id)}`, 'PUT', 'el tipo de pago', payload) },
  deletePaymentType(id: string) { return authorizedRequest<void>(`/api/v1/master-tables/payment-types/${encodeURIComponent(id)}`, 'DELETE', 'el tipo de pago') },

  listShippingLines(filters: ShippingLineFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.description) query.set('description', filters.description)
    if (filters.sunatCode) query.set('sunatCode', filters.sunatCode)
    if (filters.status) query.set('status', filters.status)
    return get<ShippingLine[]>(`/api/v1/master-tables/shipping-lines${query.size ? `?${query.toString()}` : ''}`, 'las líneas navieras')
  },
  createShippingLine(payload: ShippingLinePayload) { return authorizedRequest<ShippingLine>('/api/v1/master-tables/shipping-lines', 'POST', 'la línea naviera', payload) },
  updateShippingLine(id: string, payload: ShippingLinePayload) { return authorizedRequest<ShippingLine>(`/api/v1/master-tables/shipping-lines/${encodeURIComponent(id)}`, 'PUT', 'la línea naviera', payload) },
  deleteShippingLine(id: string) { return authorizedRequest<void>(`/api/v1/master-tables/shipping-lines/${encodeURIComponent(id)}`, 'DELETE', 'la línea naviera') },

  listPickupPlaces(filters: PickupPlaceFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.name) query.set('name', filters.name)
    if (filters.status) query.set('status', filters.status)
    return get<PickupPlace[]>(`/api/v1/master-tables/pickup-places${query.size ? `?${query.toString()}` : ''}`, 'los lugares de recojo')
  },
  createPickupPlace(payload: PickupPlacePayload) { return authorizedRequest<PickupPlace>('/api/v1/master-tables/pickup-places', 'POST', 'el lugar de recojo', payload) },
  updatePickupPlace(id: string, payload: PickupPlacePayload) { return authorizedRequest<PickupPlace>(`/api/v1/master-tables/pickup-places/${encodeURIComponent(id)}`, 'PUT', 'el lugar de recojo', payload) },
  deletePickupPlace(id: string) { return authorizedRequest<void>(`/api/v1/master-tables/pickup-places/${encodeURIComponent(id)}`, 'DELETE', 'el lugar de recojo') },

  listCurrencies(filters: CurrencyFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.description) query.set('description', filters.description)
    if (filters.symbol) query.set('symbol', filters.symbol)
    if (filters.status) query.set('status', filters.status)
    return get<Currency[]>(`/api/v1/master-tables/currencies${query.size ? `?${query.toString()}` : ''}`, 'las monedas')
  },
  createCurrency(payload: CurrencyPayload) { return authorizedRequest<Currency>('/api/v1/master-tables/currencies', 'POST', 'la moneda', payload) },
  updateCurrency(id: string, payload: CurrencyPayload) { return authorizedRequest<Currency>(`/api/v1/master-tables/currencies/${encodeURIComponent(id)}`, 'PUT', 'la moneda', payload) },
  deleteCurrency(id: string) { return authorizedRequest<void>(`/api/v1/master-tables/currencies/${encodeURIComponent(id)}`, 'DELETE', 'la moneda') },

  listCurrentAccountDocumentTypes(filters: CurrentAccountDocumentTypeFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.code) query.set('code', filters.code)
    if (filters.description) query.set('description', filters.description)
    if (filters.status) query.set('status', filters.status)
    return get<CurrentAccountDocumentType[]>(`/api/v1/master-tables/current-account-document-types${query.size ? `?${query.toString()}` : ''}`, 'los tipos de documento de cuenta corriente')
  },
  createCurrentAccountDocumentType(payload: CurrentAccountDocumentTypePayload) { return authorizedRequest<CurrentAccountDocumentType>('/api/v1/master-tables/current-account-document-types', 'POST', 'el tipo de documento de cuenta corriente', payload) },
  updateCurrentAccountDocumentType(id: string, payload: CurrentAccountDocumentTypePayload) { return authorizedRequest<CurrentAccountDocumentType>(`/api/v1/master-tables/current-account-document-types/${encodeURIComponent(id)}`, 'PUT', 'el tipo de documento de cuenta corriente', payload) },
  deleteCurrentAccountDocumentType(id: string) { return authorizedRequest<void>(`/api/v1/master-tables/current-account-document-types/${encodeURIComponent(id)}`, 'DELETE', 'el tipo de documento de cuenta corriente') },

  listPackagingTypes(filters: PackagingTypeFilters = {}) {
    const query = new URLSearchParams()
    if (filters.id) query.set('id', filters.id)
    if (filters.name) query.set('name', filters.name)
    if (filters.status) query.set('status', filters.status)
    return get<PackagingType[]>(`/api/v1/master-tables/packaging-types${query.size ? `?${query.toString()}` : ''}`, 'los tipos de embalaje')
  },
  createPackagingType(payload: PackagingTypePayload) { return authorizedRequest<PackagingType>('/api/v1/master-tables/packaging-types', 'POST', 'el tipo de embalaje', payload) },
  updatePackagingType(id: string, payload: PackagingTypePayload) { return authorizedRequest<PackagingType>(`/api/v1/master-tables/packaging-types/${encodeURIComponent(id)}`, 'PUT', 'el tipo de embalaje', payload) },
  deletePackagingType(id: string) { return authorizedRequest<void>(`/api/v1/master-tables/packaging-types/${encodeURIComponent(id)}`, 'DELETE', 'el tipo de embalaje') },

  listMaster(resource: MasterResource, filters: MasterFilters = {}) {
    if (AUTH_MOCK_ENABLED) return Promise.resolve<MasterRecord[]>([])
    const keys = masterQueryKeys[resource]; const query = new URLSearchParams()
    if (filters.id) query.set(keys.id, filters.id)
    if (filters.parentId) query.set(keys.parent, filters.parentId)
    if (filters.name) query.set(keys.name, filters.name)
    if (filters.status) query.set('estado', filters.status)
    return get<MasterRecord[]>(`/api/v1/security/master/${resource}${query.size ? `?${query.toString()}` : ''}`, 'el maestro solicitado')
  },
  createMaster(resource: MasterResource, payload: MasterPayload) {
    if (AUTH_MOCK_ENABLED) return Promise.resolve<MasterRecord>({ id: crypto.randomUUID(), parentId: payload.parentId, name: payload.name, description: payload.description, status: 'A', isRecordActive: true, createdBy: 'mock', createdAt: new Date().toISOString(), updatedBy: null, updatedAt: null })
    return authorizedRequest<MasterRecord>(`/api/v1/security/master/${resource}`, 'POST', 'el maestro solicitado', payload)
  },
  updateMaster(resource: MasterResource, id: string, payload: MasterPayload) {
    if (AUTH_MOCK_ENABLED) return Promise.resolve<MasterRecord>({ id, parentId: payload.parentId, name: payload.name, description: payload.description, status: payload.status ?? 'A', isRecordActive: true, createdBy: 'mock', createdAt: new Date().toISOString(), updatedBy: 'mock', updatedAt: new Date().toISOString() })
    return authorizedRequest<MasterRecord>(`/api/v1/security/master/${resource}/${encodeURIComponent(id)}`, 'PUT', 'el maestro solicitado', payload)
  },
  deleteMaster(resource: MasterResource, id: string) {
    if (AUTH_MOCK_ENABLED) return Promise.resolve<void>(undefined)
    return authorizedRequest<void>(`/api/v1/security/master/${resource}/${encodeURIComponent(id)}`, 'DELETE', 'el maestro solicitado')
  },
  listSecurityUsers(filters: Record<string, string | undefined> = {}) { const query = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value) }); return get<SecurityUser[]>(`/api/v1/security/master/users${query.size ? `?${query}` : ''}`, 'los usuarios') },
  createSecurityUser(payload: SecurityUserPayload) { return authorizedRequest<SecurityUser>('/api/v1/security/master/users', 'POST', 'los usuarios', payload) },
  updateSecurityUser(id: string, payload: SecurityUserPayload) { return authorizedRequest<SecurityUser>(`/api/v1/security/master/users/${encodeURIComponent(id)}`, 'PUT', 'los usuarios', payload) },
  deleteSecurityUser(id: string) { return authorizedRequest<void>(`/api/v1/security/master/users/${encodeURIComponent(id)}`, 'DELETE', 'los usuarios') },
  changeSecurityUserPassword(id: string, password: string | null) { return authorizedRequest<PasswordChangeResult>(`/api/v1/security/master/users/${encodeURIComponent(id)}/password`, 'PUT', 'la contraseña del usuario', { password }) },
  async listAccessModules(filters: Record<string, string | undefined> = {}) { const query = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value) }); return unwrapList(await get<AccessCatalogItem[] | { data?: AccessCatalogItem[]; items?: AccessCatalogItem[] }>(`/api/v1/security/master/modules${query.size ? `?${query}` : ''}`, 'los módulos')) },
  async listAccessMenus(moduleId: string) { return unwrapList(await get<AccessCatalogItem[] | { data?: AccessCatalogItem[]; items?: AccessCatalogItem[] }>(`/api/v1/security/master/menus?idModulo=${encodeURIComponent(moduleId)}`, 'los menús')) },
  async listAccessSubmenus(menuId: string) { return unwrapList(await get<AccessCatalogItem[] | { data?: AccessCatalogItem[]; items?: AccessCatalogItem[] }>(`/api/v1/security/master/submenus?idMenu=${encodeURIComponent(menuId)}`, 'los submenús')) },
  async listSecondLevelSubmenus(submenuId: string) { return unwrapList(await get<AccessCatalogItem[] | { data?: AccessCatalogItem[]; items?: AccessCatalogItem[] }>(`/api/v1/security/master/second-level-submenus/by-submenu/${encodeURIComponent(submenuId)}`, 'los submenús de segundo nivel')) },
  async listFormOptions(submenuId: string) { return unwrapList(await get<AccessCatalogItem[] | { data?: AccessCatalogItem[]; items?: AccessCatalogItem[] }>(`/api/v1/security/master/form-options/by-submenu/${encodeURIComponent(submenuId)}`, 'las acciones de la vista')) },
  async getUserAccess(userId: string) { return unwrapUserAccess(await get<UserAccess | { data?: UserAccess; result?: UserAccess; value?: UserAccess }>(`/api/v1/security/master/users/${encodeURIComponent(userId)}/access`, 'los accesos del usuario')) },
  assignUserModule(userId: string, moduleId: string) { return authorizedRequest<unknown>(`/api/v1/security/master/users/${encodeURIComponent(userId)}/modules/${encodeURIComponent(moduleId)}`, 'PUT', 'el módulo asignado') },
  assignUserMenu(userId: string, menuId: string) { return authorizedRequest<unknown>(`/api/v1/security/master/users/${encodeURIComponent(userId)}/menus/${encodeURIComponent(menuId)}`, 'PUT', 'el menú asignado') },
  assignUserSubmenu(userId: string, submenuId: string) { return authorizedRequest<unknown>(`/api/v1/security/master/users/${encodeURIComponent(userId)}/submenus/${encodeURIComponent(submenuId)}`, 'PUT', 'el submenú asignado') },
  assignUserSecondLevelSubmenu(userId: string, secondLevelSubmenuId: string) { return authorizedRequest<unknown>(`/api/v1/security/master/users/${encodeURIComponent(userId)}/second-level-submenus/${encodeURIComponent(secondLevelSubmenuId)}`, 'PUT', 'el submenú de segundo nivel asignado') },
  assignUserFormOption(userId: string, optionId: string) { return authorizedRequest<unknown>(`/api/v1/security/master/users/${encodeURIComponent(userId)}/form-options/${encodeURIComponent(optionId)}`, 'PUT', 'la acción asignada') },
  removeUserAccess(userId: string, accessId: string) { return authorizedRequest<void>(`/api/v1/security/master/users/${encodeURIComponent(userId)}/access/${encodeURIComponent(accessId)}`, 'DELETE', 'el acceso') },
  async listFormOptionsMaintenance(filters: Record<string, string | undefined> = {}) { const query = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value) }); return unwrapList(await get<FormOption[] | { data?: FormOption[]; items?: FormOption[] }>(`/api/v1/security/master/form-options${query.size ? `?${query}` : ''}`, 'las opciones de formulario')) },
  createFormOption(payload: FormOptionPayload) { return authorizedRequest<FormOption>('/api/v1/security/master/form-options', 'POST', 'la opción de formulario', payload) },
  updateFormOption(id: string, payload: FormOptionPayload) { return authorizedRequest<FormOption>(`/api/v1/security/master/form-options/${encodeURIComponent(id)}`, 'PUT', 'la opción de formulario', payload) },
  deleteFormOption(id: string) { return authorizedRequest<void>(`/api/v1/security/master/form-options/${encodeURIComponent(id)}`, 'DELETE', 'la opción de formulario') },
  async listUserProfiles(filters: Record<string, string | undefined> = {}) { const query = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value) }); return unwrapList(await get<UserProfile[] | { data?: UserProfile[]; items?: UserProfile[] }>(`/api/v1/security/user-profiles${query.size ? `?${query}` : ''}`, 'los perfiles')) },
  createUserProfile(payload: UserProfilePayload) { return authorizedRequest<UserProfile>('/api/v1/security/user-profiles', 'POST', 'el perfil', payload) },
  updateUserProfile(id: string, payload: UserProfilePayload) { return authorizedRequest<UserProfile>(`/api/v1/security/user-profiles/${encodeURIComponent(id)}`, 'PUT', 'el perfil', payload) },
  deleteUserProfile(id: string) { return authorizedRequest<void>(`/api/v1/security/user-profiles/${encodeURIComponent(id)}`, 'DELETE', 'el perfil') },
  async listProfileAccess(profileId: string, resource: 'modules' | 'menus' | 'submenus' | 'second-level-submenus' | 'form-options', parentId?: string) { const query = parentId ? `?parentId=${encodeURIComponent(parentId)}` : ''; return unwrapList(await get<AccessCatalogItem[] | { data?: AccessCatalogItem[]; items?: AccessCatalogItem[] }>(`/api/v1/security/user-profiles/${encodeURIComponent(profileId)}/${resource}${query}`, 'los permisos del perfil')) },
  assignProfileAccess(profileId: string, resource: 'modules' | 'menus' | 'submenus' | 'second-level-submenus' | 'form-options', resourceId: string) { return authorizedRequest<AccessCatalogItem>(`/api/v1/security/user-profiles/${encodeURIComponent(profileId)}/${resource}/${encodeURIComponent(resourceId)}`, 'PUT', 'el permiso del perfil') },
  removeProfileAccess(accessId: string) { return authorizedRequest<void>(`/api/v1/security/user-profiles/access/${encodeURIComponent(accessId)}`, 'DELETE', 'el permiso del perfil') },
  applyUserProfile(profileId: string, userId: string) { return authorizedRequest<ProfileApplicationResult>(`/api/v1/security/user-profiles/${encodeURIComponent(profileId)}/apply/users/${encodeURIComponent(userId)}`, 'PUT', 'el perfil de usuario') },

  getCurrentUser() { return getSharedSessionValue(AUTH_USER_KEY) },

  getSessionExpiresAt() { return getSharedSessionValue(ACCESS_TOKEN_EXPIRES_AT_KEY) },

  resendOtp(challengeId: string) {
    return post<void>('/auth/otp/resend', { challengeId })
  },

  clearOtpChallenge() {
    sessionStorage.removeItem(OTP_CHALLENGE_KEY)
  },

  clearAuthSession() {
    clearSessionStorage()
  },
}
