<template>
  <div class="backlog">
    <div class="page-header">
      <h2>{{ t('backlog.title') }}</h2>
      <p>{{ t('backlog.description') }}</p>
    </div>

    <div v-if="loading" class="loading">{{ t('backlog.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="stats-grid">
        <div class="stat-card danger">
          <div class="stat-label">{{ t('backlog.stats.high') }}</div>
          <div class="stat-value">{{ getBacklogByPriority('high').length }}</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-label">{{ t('backlog.stats.medium') }}</div>
          <div class="stat-value">{{ getBacklogByPriority('medium').length }}</div>
        </div>
        <div class="stat-card info">
          <div class="stat-label">{{ t('backlog.stats.low') }}</div>
          <div class="stat-value">{{ getBacklogByPriority('low').length }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('backlog.stats.total') }}</div>
          <div class="stat-value">{{ backlogItems.length }}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ t('backlog.items') }}</h3>
        </div>
        <div v-if="backlogItems.length === 0" class="empty-state">
          <p class="empty-message">
            <NavIcon name="check" />
            <span>{{ t('backlog.empty') }}</span>
          </p>
        </div>
        <div v-else class="table-container">
          <table>
            <thead>
              <tr>
                <th>{{ t('backlog.table.orderId') }}</th>
                <th>{{ t('backlog.table.sku') }}</th>
                <th>{{ t('backlog.table.itemName') }}</th>
                <th>{{ t('backlog.table.quantityNeeded') }}</th>
                <th>{{ t('backlog.table.quantityAvailable') }}</th>
                <th>{{ t('backlog.table.shortage') }}</th>
                <th>{{ t('backlog.table.daysDelayed') }}</th>
                <th>{{ t('backlog.table.priority') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in backlogItems" :key="item.id">
                <td><strong>{{ item.order_id }}</strong></td>
                <td><strong>{{ item.item_sku }}</strong></td>
                <td>{{ item.item_name }}</td>
                <td>{{ item.quantity_needed }}</td>
                <td>{{ item.quantity_available }}</td>
                <td>
                  <span class="badge danger">
                    {{ t('backlog.unitsShort', { count: item.quantity_needed - item.quantity_available }) }}
                  </span>
                </td>
                <td>
                  <span :class="item.days_delayed > 7 ? 'delay-severe' : 'delay-moderate'">
                    {{ t('backlog.daysCount', { count: item.days_delayed }) }}
                  </span>
                </td>
                <td>
                  <span :class="['badge', item.priority]">
                    {{ t(`backlog.priority.${item.priority}`) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { api } from '../api'
import { useFilters } from '../composables/useFilters'
import { useI18n } from '../composables/useI18n'
import NavIcon from '../components/NavIcon.vue'

export default {
  name: 'Backlog',
  components: { NavIcon },
  setup() {
    const { t } = useI18n()
    const loading = ref(true)
    const error = ref(null)
    const allBacklogItems = ref([])
    const inventoryItems = ref([])

    // Use shared filters
    const { selectedLocation, selectedCategory, getCurrentFilters } = useFilters()

    // Filter backlog based on inventory filters
    const backlogItems = computed(() => {
      if (selectedLocation.value === 'all' && selectedCategory.value === 'all') {
        return allBacklogItems.value
      }

      // Get SKUs of items that match the filters
      const validSkus = new Set(inventoryItems.value.map(item => item.sku))
      return allBacklogItems.value.filter(b => validSkus.has(b.item_sku))
    })

    const loadBacklog = async () => {
      try {
        loading.value = true
        const filters = getCurrentFilters()

        const [backlogData, inventoryData] = await Promise.all([
          api.getBacklog(),
          api.getInventory({
            warehouse: filters.warehouse,
            category: filters.category
          })
        ])

        allBacklogItems.value = backlogData
        inventoryItems.value = inventoryData
      } catch (err) {
        error.value = t('backlog.loadFailed', { message: err.message })
      } finally {
        loading.value = false
      }
    }

    const getBacklogByPriority = (priority) => {
      return backlogItems.value.filter(item => item.priority === priority)
    }

    // Watch for filter changes and reload data
    watch([selectedLocation, selectedCategory], () => {
      loadBacklog()
    })

    onMounted(loadBacklog)

    return {
      t,
      loading,
      error,
      backlogItems,
      getBacklogByPriority
    }
  }
}
</script>

<style scoped>
.empty-state {
  padding: var(--space-8);
  text-align: center;
}

.empty-message {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-lg);
  color: var(--color-success);
  font-weight: 600;
}

.delay-severe {
  color: var(--color-danger);
}

.delay-moderate {
  color: var(--color-warning);
}

@media (max-width: 899px) {
  .empty-state {
    padding: var(--space-6) var(--space-4);
  }
}
</style>
