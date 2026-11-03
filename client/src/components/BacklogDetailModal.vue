<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && backlogItem" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ t('modal.backlog.title') }}</h3>
            <button class="close-button" :aria-label="t('common.close')" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="shortage-header">
              <div class="shortage-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 8L24 28M24 34L24 36" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="3"/>
                </svg>
              </div>
              <div class="shortage-title-section">
                <h4 class="item-name">{{ translateProductName(backlogItem.item_name) }}</h4>
                <div class="item-sku">{{ t('modal.common.sku', { sku: backlogItem.item_sku }) }}</div>
              </div>
              <span class="priority-badge" :class="backlogItem.priority">
                {{ t('modal.backlog.priorityBadge', { priority: priorityLabel }) }}
              </span>
            </div>

            <div class="shortage-summary">
              <div class="summary-card danger">
                <div class="summary-label">{{ t('modal.backlog.shortageAmount') }}</div>
                <div class="summary-value">{{ t('modal.common.units', { count: shortage }) }}</div>
              </div>
              <div class="summary-card warning">
                <div class="summary-label">{{ t('modal.backlog.daysDelayed') }}</div>
                <div class="summary-value">{{ t('modal.backlog.daysValue', { count: backlogItem.days_delayed }) }}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">{{ t('modal.backlog.orderId') }}</div>
                <div class="info-value order-id">{{ backlogItem.order_id }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.backlog.itemSku') }}</div>
                <div class="info-value sku">{{ backlogItem.item_sku }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.backlog.quantityNeeded') }}</div>
                <div class="info-value">{{ t('modal.common.units', { count: backlogItem.quantity_needed }) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.backlog.quantityAvailable') }}</div>
                <div class="info-value">{{ t('modal.common.units', { count: backlogItem.quantity_available }) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.backlog.expectedDate') }}</div>
                <div class="info-value">{{ formatDate(backlogItem.expected_date) }}</div>
              </div>

              <div class="info-item">
                <div class="info-label">{{ t('modal.common.status') }}</div>
                <div class="info-value">
                  <span class="badge danger">{{ t('status.backordered') }}</span>
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

const { t, currentLocale, translateProductName } = useI18n()

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  backlogItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const shortage = computed(() => {
  if (!props.backlogItem) return 0
  return props.backlogItem.quantity_needed - props.backlogItem.quantity_available
})

// Priority arrives as a lowercase key (high/medium/low); fall back to the raw
// value if the backend ever sends something outside that set.
const priorityLabel = computed(() => {
  const priority = props.backlogItem?.priority
  if (['high', 'medium', 'low'].includes(priority)) return t(`priority.${priority}`)
  return priority || ''
})

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
</script>

<style scoped>
.shortage-header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-6);
}

.shortage-icon {
  width: 64px;
  height: 64px;
  background: var(--color-danger);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-surface);
  flex-shrink: 0;
}

.shortage-title-section {
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

.priority-badge {
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  flex-shrink: 0;
}

.priority-badge.high {
  background: var(--color-danger-soft);
  color: var(--color-danger-ink);
}

.priority-badge.medium {
  background: var(--color-warning-soft);
  color: var(--color-warning-ink);
}

.priority-badge.low {
  background: var(--color-info-soft);
  color: var(--color-info-ink);
}

.shortage-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.summary-card.danger {
  border-color: var(--color-danger-border);
  background: var(--color-danger-soft);
}

.summary-card.warning {
  border-color: var(--color-warning);
  background: var(--color-warning-soft);
}

.summary-card.danger .summary-value {
  color: var(--color-danger);
}

.summary-card.warning .summary-value {
  color: var(--color-warning);
}

.info-value.order-id,
.info-value.sku {
  font-family: 'Monaco', 'Courier New', monospace;
  color: var(--color-accent);
}

@media (max-width: 899px) {
  .shortage-summary {
    grid-template-columns: 1fr;
  }

  .shortage-header {
    flex-wrap: wrap;
  }
}
</style>
