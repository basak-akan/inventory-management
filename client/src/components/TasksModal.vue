<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="close">
        <div class="modal-container tasks-modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ t('tasks.title') }}</h3>
            <button class="close-button" :aria-label="t('common.close')" @click="close">
              <NavIcon name="close" />
            </button>
          </div>

          <div class="modal-body">
            <!-- Add Task Form -->
            <div class="task-form">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label for="task-title">{{ t('tasks.taskTitle') }}</label>
                  <input
                    id="task-title"
                    v-model="newTask.title"
                    type="text"
                    :placeholder="t('tasks.taskTitlePlaceholder')"
                    class="task-input"
                    @keyup.enter="handleAddTask"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="task-priority">{{ t('tasks.priority') }}</label>
                  <select
                    id="task-priority"
                    v-model="newTask.priority"
                    class="task-select"
                  >
                    <option value="high">{{ t('priority.high') }}</option>
                    <option value="medium">{{ t('priority.medium') }}</option>
                    <option value="low">{{ t('priority.low') }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="task-due-date">{{ t('tasks.dueDate') }}</label>
                  <input
                    id="task-due-date"
                    v-model="newTask.dueDate"
                    type="date"
                    class="task-input"
                  />
                </div>

                <div class="form-group-btn">
                  <button @click="handleAddTask" class="task-add-btn" :disabled="!newTask.title.trim() || !newTask.dueDate">
                    {{ t('tasks.addTask') }}
                  </button>
                </div>
              </div>
            </div>

            <div class="tasks-divider"></div>

            <!-- Tasks List -->
            <div v-if="sortedTasks.length === 0" class="no-tasks">
              {{ t('tasks.noTasks') }}
            </div>

            <div v-else class="tasks-list">
              <div
                v-for="task in sortedTasks"
                :key="task.id"
                class="task-item"
                :class="[`priority-${task.priority}`, { completed: task.status === 'completed' }]"
              >
                <div class="task-header">
                  <div class="task-check-title">
                    <input
                      type="checkbox"
                      :checked="task.status === 'completed'"
                      @change="$emit('toggle-task', task.id)"
                      class="task-checkbox"
                    />
                    <span class="task-title" @click="$emit('toggle-task', task.id)">{{ task.title }}</span>
                  </div>
                  <button @click="$emit('delete-task', task.id)" class="task-delete-btn" :title="t('tasks.deleteTask')" :aria-label="t('tasks.deleteTask')">
                    <NavIcon name="close" />
                  </button>
                </div>

                <div class="task-footer">
                  <span class="priority-badge" :class="task.priority">
                    {{ translatePriority(task.priority) }}
                  </span>
                  <div class="task-due-date">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="2" y="3" width="10" height="9" rx="1" stroke="currentColor" stroke-width="1.2"/>
                      <path d="M4.5 1.5V4.5M9.5 1.5V4.5M2 6H12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                    {{ formatDueDate(task.dueDate) }}
                  </div>
                  <span class="status-badge" :class="getStatusClass(task.dueDate, task.status)">
                    {{ getStatusText(task.dueDate, task.status) }}
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

<script>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from '../composables/useI18n'
import NavIcon from './NavIcon.vue'

export default {
  name: 'TasksModal',
  components: { NavIcon },
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    tasks: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close', 'add-task', 'delete-task', 'toggle-task'],
  setup(props, { emit }) {
    const { t, currentLocale } = useI18n()
    const newTask = ref({
      title: '',
      priority: 'medium',
      dueDate: ''
    })

    const sortedTasks = computed(() => {
      // Don't sort - just return tasks in their current order (newest first)
      return [...props.tasks]
    })

    const close = () => {
      emit('close')
    }

    const onKeydown = (e) => {
      if (e.key === 'Escape') close()
    }

    // Listen only while open so a closed (but mounted) modal never swallows Escape from the page.
    watch(() => props.isOpen, (open) => {
      if (open) document.addEventListener('keydown', onKeydown)
      else document.removeEventListener('keydown', onKeydown)
    }, { immediate: true })

    onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

    const handleAddTask = () => {
      if (newTask.value.title.trim() && newTask.value.dueDate) {
        emit('add-task', {
          title: newTask.value.title.trim(),
          priority: newTask.value.priority,
          dueDate: newTask.value.dueDate
        })
        newTask.value = {
          title: '',
          priority: 'medium',
          dueDate: ''
        }
      }
    }

    const formatDueDate = (dateString) => {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dueDate = new Date(date)
      dueDate.setHours(0, 0, 0, 0)

      const diffTime = dueDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const isJapanese = currentLocale.value === 'ja'

      if (diffDays === 0) return t('tasks.today')
      if (diffDays === 1) return t('tasks.tomorrow')
      if (diffDays === -1) return t('tasks.yesterday')
      if (diffDays < 0) return t('tasks.daysAgo', { count: Math.abs(diffDays) })
      if (diffDays < 7) return t('tasks.inDays', { count: diffDays })

      const locale = isJapanese ? 'ja-JP' : 'en-US'
      return date.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }

    const getStatusClass = (dueDate, status) => {
      if (status === 'completed') return 'completed'

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(dueDate)
      due.setHours(0, 0, 0, 0)

      const diffTime = due - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return 'overdue'
      if (diffDays <= 1) return 'urgent'
      return 'upcoming'
    }

    const getStatusText = (dueDate, status) => {
      if (status === 'completed') return t('tasks.completed')

      const statusClass = getStatusClass(dueDate, status)
      if (statusClass === 'overdue') return t('tasks.overdue')
      if (statusClass === 'urgent') return t('tasks.dueSoon')
      return t('tasks.upcoming')
    }

    const translatePriority = (priority) => {
      const priorityMap = {
        'high': t('priority.high'),
        'medium': t('priority.medium'),
        'low': t('priority.low')
      }
      return priorityMap[priority] || priority
    }

    return {
      t,
      newTask,
      sortedTasks,
      close,
      handleAddTask,
      formatDueDate,
      getStatusClass,
      getStatusText,
      translatePriority
    }
  }
}
</script>

<style scoped>
/* Wider than the shared 700px default; tasks list needs the room */
.tasks-modal-container {
  max-width: 900px;
}

/* Task Form */
.task-form {
  background: var(--color-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
}

.form-row {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
}

.form-group.flex-1 {
  flex: 1;
}

.form-group-btn {
  display: flex;
  align-items: flex-end;
}

label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text);
}

.task-input,
.task-select {
  padding: var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-base);
  font-family: inherit;
}

.task-input:focus,
.task-select:focus {
  outline: none;
  border-color: var(--color-accent);
}

.task-select {
  cursor: pointer;
  background: var(--color-surface);
}

.task-add-btn {
  padding: var(--space-3) var(--space-6);
  background: var(--color-accent);
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: opacity var(--transition-base);
  white-space: nowrap;
  height: fit-content;
}

.task-add-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.task-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tasks-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-6) 0;
}

.no-tasks {
  text-align: center;
  padding: var(--space-8);
  color: var(--color-muted);
  font-size: var(--font-size-base);
  font-style: italic;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.task-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  transition: border-color var(--transition-base), box-shadow var(--transition-base);
}

.task-item:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-card);
}

.task-item.priority-high {
  border-left: 4px solid var(--color-danger);
}

.task-item.priority-medium {
  border-left: 4px solid var(--color-warning);
}

.task-item.priority-low {
  border-left: 4px solid var(--color-accent);
}

.task-item.completed {
  opacity: 0.6;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-3);
  gap: var(--space-4);
}

.task-check-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-accent);
  flex-shrink: 0;
}

.task-title {
  flex: 1;
  cursor: pointer;
  user-select: none;
  color: var(--color-ink);
  font-size: var(--font-size-base);
  font-weight: 600;
  line-height: 1.4;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: var(--color-muted);
}

.task-delete-btn {
  width: 28px;
  height: 28px;
  background: var(--color-danger);
  color: var(--color-surface);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: opacity var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
}

.task-delete-btn :deep(.nav-icon) {
  width: 16px;
  height: 16px;
}

.task-delete-btn:hover {
  opacity: 0.85;
}

.task-footer {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex-wrap: wrap;
}

.priority-badge {
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  letter-spacing: 0.025em;
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

.task-due-date {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.task-due-date svg {
  color: var(--color-muted);
}

.status-badge {
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  margin-left: auto;
}

.status-badge.overdue {
  background: var(--color-danger-soft);
  color: var(--color-danger-ink);
}

.status-badge.urgent {
  background: var(--color-warning-soft);
  color: var(--color-warning-ink);
}

.status-badge.upcoming {
  background: var(--color-info-soft);
  color: var(--color-info-ink);
}

.status-badge.completed {
  background: var(--color-success-soft);
  color: var(--color-success-ink);
}

@media (max-width: 899px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
