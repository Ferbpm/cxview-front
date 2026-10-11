import type { Component } from 'vue'
import IntegratedLogisticsProductsView from '@/modules/security/components/IntegratedLogisticsProductsView.vue'
import IntegratedLogisticsCampaignsView from '@/modules/security/components/IntegratedLogisticsCampaignsView.vue'
import IntegratedLogisticsFixedCostsView from '@/modules/security/components/IntegratedLogisticsFixedCostsView.vue'
import IntegratedLogisticsDepositsView from '@/modules/security/components/IntegratedLogisticsDepositsView.vue'
import ContainerDimensionsView from '@/modules/security/components/ContainerDimensionsView.vue'
import EntityAddressTypesView from '@/modules/security/components/EntityAddressTypesView.vue'
import PaymentTypesView from '@/modules/security/components/PaymentTypesView.vue'
import ShippingLinesView from '@/modules/security/components/ShippingLinesView.vue'
import PickupPlacesView from '@/modules/security/components/PickupPlacesView.vue'
import CurrenciesView from '@/modules/security/components/CurrenciesView.vue'
import CurrentAccountDocumentTypesView from '@/modules/security/components/CurrentAccountDocumentTypesView.vue'
import PackagingTypesView from '@/modules/security/components/PackagingTypesView.vue'

export const workspaceViewOptions = [
  { label: 'Productos', value: 'master.products' },
  { label: 'Campaña', value: 'master.campaigns' },
  { label: 'Costos fijos', value: 'master.fixed-costs' },
  { label: 'Depósitos', value: 'master.deposits' },
  { label: 'Dimensión de contenedor', value: 'master.container-dimensions' },
  { label: 'Tipo de dirección de entidad', value: 'master.entity-address-types' },
  { label: 'Tipo de pago', value: 'master.payment-types' },
  { label: 'Línea naviera', value: 'master.shipping-lines' },
  { label: 'Lugar de recojo', value: 'master.pickup-places' },
  { label: 'Moneda', value: 'master.currencies' },
  { label: 'Tipo de documento de cuenta corriente', value: 'master.current-account-document-types' },
  { label: 'Tipo de embalaje', value: 'master.packaging-types' },
]

export const workspaceViewRegistry: Record<string, Component> = {
  'master.products': IntegratedLogisticsProductsView,
  'master.campaigns': IntegratedLogisticsCampaignsView,
  'master.fixed-costs': IntegratedLogisticsFixedCostsView,
  'master.deposits': IntegratedLogisticsDepositsView,
  'master.container-dimensions': ContainerDimensionsView,
  'master.entity-address-types': EntityAddressTypesView,
  'master.payment-types': PaymentTypesView,
  'master.shipping-lines': ShippingLinesView,
  'master.pickup-places': PickupPlacesView,
  'master.currencies': CurrenciesView,
  'master.current-account-document-types': CurrentAccountDocumentTypesView,
  'master.packaging-types': PackagingTypesView,
}
