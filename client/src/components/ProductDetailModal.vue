<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && product" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ t('modal.product.title') }}</h3>
            <button class="close-button" :aria-label="t('common.close')" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="product-header">
              <div class="product-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="8" y="12" width="32" height="28" rx="2" stroke="currentColor" stroke-width="2.5"/>
                  <path d="M16 8V16M32 8V16M8 20H40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="product-title-section">
                <h4 class="product-name">{{ product.name }}</h4>
                <div class="product-sku">{{ t('modal.common.sku', { sku: product.sku }) }}</div>
              </div>
              <span class="stock-badge" :class="getStockBadgeClass(product.stockLevel)">
                {{ getStockLevelLabel(product.stockLevel) }}
              </span>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">{{ t('filters.category') }}</div>
                <div class="info-value">{{ product.category }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.common.warehouse') }}</div>
                <div class="info-value">{{ product.warehouse }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.product.unitsOrdered') }}</div>
                <div class="info-value">{{ product.unitsOrdered }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.product.totalRevenue') }}</div>
                <div class="info-value">{{ currencySymbol }}{{ product.revenue.toLocaleString() }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.product.currentStock') }}</div>
                <div class="info-value">{{ t('modal.common.units', { count: product.quantityOnHand }) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.common.reorderPoint') }}</div>
                <div class="info-value">{{ t('modal.common.units', { count: product.reorderPoint }) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.product.firstOrderDate') }}</div>
                <div class="info-value">{{ formatDate(product.firstOrderDate) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.product.stockStatus') }}</div>
                <div class="info-value">
                  <span :class="['badge', getStockBadgeClass(product.stockLevel)]">
                    {{ getStockLevelLabel(product.stockLevel) }}
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

const { t, currentLocale, currentCurrency } = useI18n()

const currencySymbol = computed(() => {
  return currentCurrency.value === 'JPY' ? '¥' : '$'
})

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  product: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

const formatDate = (dateString) => {
  if (!dateString) return t('modal.common.notAvailable')
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return t('modal.common.notAvailable')
  return date.toLocaleDateString(currentLocale.value === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// stockLevel comes from the data layer as an English string and drives the
// badge class below, so only the displayed text is translated.
const getStockLevelLabel = (stockLevel) => {
  if (stockLevel === 'In Stock') return t('status.inStock')
  if (stockLevel === 'Low Stock') return t('status.lowStock')
  if (stockLevel === 'Out of Stock') return t('modal.product.outOfStock')
  return stockLevel
}

const getStockBadgeClass = (stockLevel) => {
  if (stockLevel === 'In Stock') return 'success'
  if (stockLevel === 'Low Stock') return 'warning'
  if (stockLevel === 'Out of Stock') return 'danger'
  return 'info'
}
</script>

<style scoped>
.product-header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-8);
}

.product-icon {
  width: 64px;
  height: 64px;
  background: var(--color-accent);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-surface);
  flex-shrink: 0;
}

.product-title-section {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-ink);
  margin: 0 0 var(--space-2) 0;
}

.product-sku {
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

@media (max-width: 899px) {
  .product-header {
    flex-wrap: wrap;
  }
}
</style>
