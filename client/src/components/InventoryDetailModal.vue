<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && inventoryItem" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ t('modal.inventory.title') }}</h3>
            <button class="close-button" :aria-label="t('common.close')" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="item-header">
              <div class="item-icon" :class="getStockIconClass()">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="12" width="32" height="28" rx="2" stroke="currentColor" stroke-width="2.5"/>
                  <path d="M16 8V16M32 8V16M8 20H40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M16 28H32M16 34H24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="item-title-section">
                <h4 class="item-name">{{ translateProductName(inventoryItem.name) }}</h4>
                <div class="item-sku">{{ t('modal.common.sku', { sku: inventoryItem.sku }) }}</div>
              </div>
              <span class="stock-badge" :class="getStockStatusClass()">
                {{ getStockStatusLabel() }}
              </span>
            </div>

            <div class="stock-summary">
              <div class="summary-card primary">
                <div class="summary-label">{{ t('modal.inventory.quantityOnHand') }}</div>
                <div class="summary-value">{{ t('modal.common.units', { count: inventoryItem.quantity_on_hand }) }}</div>
              </div>
              <div class="summary-card" :class="getSummaryCardClass()">
                <div class="summary-label">{{ t('modal.inventory.stockLevel') }}</div>
                <div class="summary-value">{{ stockPercentage }}%</div>
                <div class="summary-subtitle">{{ t('modal.inventory.vsReorderPoint') }}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">{{ t('filters.category') }}</div>
                <div class="info-value">{{ inventoryItem.category }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('filters.location') }}</div>
                <div class="info-value">{{ inventoryItem.location }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.common.reorderPoint') }}</div>
                <div class="info-value">{{ t('modal.common.units', { count: inventoryItem.reorder_point }) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.inventory.unitsRemaining') }}</div>
                <div class="info-value">
                  <span :style="{ color: inventoryItem.quantity_on_hand <= inventoryItem.reorder_point ? 'var(--color-danger)' : 'var(--color-success)' }">
                    {{ t('modal.common.units', { count: inventoryItem.quantity_on_hand - inventoryItem.reorder_point }) }}
                  </span>
                </div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.inventory.unitCost') }}</div>
                <div class="info-value">{{ currencySymbol }}{{ inventoryItem.unit_cost.toFixed(2) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.inventory.totalValue') }}</div>
                <div class="info-value total-value">
                  {{ currencySymbol }}{{ totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}
                </div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.common.warehouse') }}</div>
                <div class="info-value">{{ translateWarehouse(inventoryItem.location) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.common.status') }}</div>
                <div class="info-value">
                  <span :class="['badge', getStockStatusClass()]">
                    {{ getStockStatusLabel() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="close">{{ t('common.close') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n'

const { t, currentCurrency, translateProductName, translateWarehouse } = useI18n()

const currencySymbol = computed(() => {
  return currentCurrency.value === 'JPY' ? '¥' : '$'
})

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  inventoryItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const totalValue = computed(() => {
  if (!props.inventoryItem) return 0
  return props.inventoryItem.quantity_on_hand * props.inventoryItem.unit_cost
})

const stockPercentage = computed(() => {
  if (!props.inventoryItem || props.inventoryItem.reorder_point === 0) return 0
  return Math.round((props.inventoryItem.quantity_on_hand / props.inventoryItem.reorder_point) * 100)
})

const close = () => {
  emit('close')
}

// Status strings stay English internally because the class helpers below
// compare against them; only the displayed label goes through t().
const getStockStatus = () => {
  if (!props.inventoryItem) return 'Unknown'
  if (props.inventoryItem.quantity_on_hand <= props.inventoryItem.reorder_point) {
    return 'Low Stock'
  } else if (props.inventoryItem.quantity_on_hand <= props.inventoryItem.reorder_point * 1.5) {
    return 'Adequate'
  } else {
    return 'In Stock'
  }
}

const getStockStatusLabel = () => {
  const status = getStockStatus()
  if (status === 'Low Stock') return t('status.lowStock')
  if (status === 'Adequate') return t('status.adequate')
  if (status === 'In Stock') return t('status.inStock')
  return t('modal.inventory.unknown')
}

const getStockStatusClass = () => {
  const status = getStockStatus()
  if (status === 'Low Stock') return 'danger'
  if (status === 'Adequate') return 'warning'
  return 'success'
}

const getStockIconClass = () => {
  const status = getStockStatus()
  if (status === 'Low Stock') return 'danger-icon'
  if (status === 'Adequate') return 'warning-icon'
  return 'success-icon'
}

const getSummaryCardClass = () => {
  const status = getStockStatus()
  if (status === 'Low Stock') return 'danger-card'
  if (status === 'Adequate') return 'warning-card'
  return 'success-card'
}
</script>

<style scoped>
.item-header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-6);
}

.item-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-surface);
  flex-shrink: 0;
}

.item-icon.success-icon {
  background: var(--color-success);
}

.item-icon.warning-icon {
  background: var(--color-warning);
}

.item-icon.danger-icon {
  background: var(--color-danger);
}

.item-title-section {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 var(--space-2) 0;
}

.item-sku {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  font-family: 'Monaco', 'Courier New', monospace;
}

.stock-badge {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  flex-shrink: 0;
}

.stock-badge.success {
  background: var(--color-success-soft);
  color: var(--color-success-ink);
}

.stock-badge.warning {
  background: var(--color-warning-soft);
  color: var(--color-warning-ink);
}

.stock-badge.danger {
  background: var(--color-danger-soft);
  color: var(--color-danger-ink);
}

.stock-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.summary-card.primary {
  border-color: var(--color-info-soft);
  background: var(--color-accent-soft);
}

.summary-card.success-card {
  border-color: var(--color-success);
  background: var(--color-success-soft);
}

.summary-card.warning-card {
  border-color: var(--color-warning);
  background: var(--color-warning-soft);
}

.summary-card.danger-card {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
}

.summary-subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-top: var(--space-1);
}

.info-value.total-value {
  font-size: var(--font-size-lg);
  color: var(--color-accent);
  font-weight: 700;
}

@media (max-width: 899px) {
  .stock-summary {
    grid-template-columns: 1fr;
  }

  .item-header {
    flex-wrap: wrap;
  }
}
</style>
