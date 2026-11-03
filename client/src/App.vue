<template>
  <div class="app" :class="{ 'drawer-open': drawerOpen }">
    <div v-if="isMobile" class="mobile-topbar">
      <button
        ref="hamburgerRef"
        type="button"
        class="icon-button"
        :aria-label="t('nav.menu')"
        aria-controls="app-sidebar"
        :aria-expanded="drawerOpen ? 'true' : 'false'"
        @click="toggleDrawer"
      >
        <NavIcon name="menu" />
      </button>
      <span class="mobile-title">{{ t('nav.companyName') }}</span>
    </div>

    <div
      v-if="isMobile && drawerOpen"
      class="sidebar-backdrop"
      @click="closeDrawer"
    ></div>

    <aside
      id="app-sidebar"
      ref="sidebarRef"
      class="sidebar"
      :class="{ collapsed: isCollapsed, 'is-open': drawerOpen }"
      :role="isMobile && drawerOpen ? 'dialog' : null"
      :aria-modal="isMobile && drawerOpen ? 'true' : null"
      :aria-label="isMobile && drawerOpen ? t('nav.companyName') : null"
    >
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <h1>{{ t('nav.companyName') }}</h1>
          <span class="sidebar-subtitle">{{ t('nav.subtitle') }}</span>
        </div>
        <button
          v-if="!isMobile"
          type="button"
          class="icon-button collapse-toggle"
          :aria-label="t('nav.toggleSidebar')"
          :title="t('nav.toggleSidebar')"
          aria-controls="app-sidebar"
          :aria-expanded="isCollapsed ? 'false' : 'true'"
          @click="toggleCollapsed"
        >
          <NavIcon name="collapse" />
        </button>
      </div>

      <nav class="sidebar-nav" :aria-label="t('nav.mainNav')">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :title="isCollapsed ? t(item.label) : null"
        >
          <NavIcon :name="item.icon" />
          <span class="nav-label" :class="{ 'visually-hidden': isCollapsed }">{{ t(item.label) }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <LanguageSwitcher />
        <ProfileMenu
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
      </div>
    </aside>

    <div class="app-body">
      <FilterBar />
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
import NavIcon from './components/NavIcon.vue'

export default {
  name: 'App',
  components: {
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher,
    NavIcon
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    const navItems = [
      { to: '/', label: 'nav.overview', icon: 'overview' },
      { to: '/inventory', label: 'nav.inventory', icon: 'inventory' },
      { to: '/orders', label: 'nav.orders', icon: 'orders' },
      { to: '/spending', label: 'nav.finance', icon: 'finance' },
      { to: '/demand', label: 'nav.demandForecast', icon: 'demand' },
      { to: '/reports', label: 'nav.reports', icon: 'reports' }
    ]

    // Sidebar state
    const STORAGE_KEY = 'sidebar-collapsed'
    const readCollapsed = () => {
      try {
        return localStorage.getItem(STORAGE_KEY) === 'true'
      } catch {
        return false
      }
    }
    const collapsed = ref(readCollapsed())
    const isMobile = ref(false)
    const drawerOpen = ref(false)
    const hamburgerRef = ref(null)
    const sidebarRef = ref(null)
    const route = useRoute()

    const isCollapsed = computed(() => collapsed.value && !isMobile.value)

    const toggleCollapsed = () => {
      collapsed.value = !collapsed.value
      try {
        localStorage.setItem(STORAGE_KEY, String(collapsed.value))
      } catch {
        // storage unavailable; state stays in memory
      }
    }

    const openDrawer = async () => {
      drawerOpen.value = true
      await nextTick()
      const first = sidebarRef.value && sidebarRef.value.querySelector('a')
      if (first) first.focus()
    }

    const closeDrawer = () => {
      if (!drawerOpen.value) return
      drawerOpen.value = false
      nextTick(() => {
        if (hamburgerRef.value) hamburgerRef.value.focus()
      })
    }

    const toggleDrawer = () => (drawerOpen.value ? closeDrawer() : openDrawer())

    const onKeydown = (e) => {
      if (e.key === 'Escape' && drawerOpen.value) closeDrawer()
    }

    let mql = null
    const onMediaChange = (e) => {
      isMobile.value = e.matches
      if (!e.matches) drawerOpen.value = false
    }

    watch(drawerOpen, (open) => {
      document.body.style.overflow = open ? 'hidden' : ''
    })

    watch(() => route.path, () => {
      if (drawerOpen.value) closeDrawer()
    })

    onMounted(() => {
      loadTasks()
      mql = window.matchMedia('(max-width: 899px)')
      isMobile.value = mql.matches
      mql.addEventListener('change', onMediaChange)
      document.addEventListener('keydown', onKeydown)
    })

    onBeforeUnmount(() => {
      if (mql) mql.removeEventListener('change', onMediaChange)
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    })

    return {
      t,
      navItems,
      isMobile,
      isCollapsed,
      drawerOpen,
      hamburgerRef,
      sidebarRef,
      toggleCollapsed,
      toggleDrawer,
      closeDrawer,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>

<style>
.app {
  display: flex;
  min-height: 100vh;
}

.app-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width var(--transition-base);
  z-index: 110;
}

.sidebar.collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.sidebar-brand {
  min-width: 0;
}

.sidebar-brand h1 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-ink);
  letter-spacing: -0.025em;
  line-height: 1.3;
}

.sidebar-subtitle {
  display: block;
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.sidebar.collapsed .sidebar-brand {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--color-muted);
  cursor: pointer;
}

.icon-button:hover {
  background: var(--color-hover);
  color: var(--color-ink);
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
}

.nav-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-muted);
  text-decoration: none;
  font-weight: 500;
  font-size: var(--font-size-base);
  transition: background-color var(--transition-base), color var(--transition-base);
}

.nav-link:hover {
  background: var(--color-hover);
  color: var(--color-ink);
}

.nav-link[aria-current="page"] {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.nav-link[aria-current="page"]::before {
  content: '';
  position: absolute;
  left: 0;
  top: var(--space-2);
  bottom: var(--space-2);
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--color-accent);
}

.nav-icon {
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
}

.sidebar.collapsed .nav-link {
  justify-content: center;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.icon-button:focus-visible,
.nav-link:focus-visible,
.sidebar-footer button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.sidebar-footer .language-button,
.sidebar-footer .profile-button {
  width: 100%;
}

.sidebar-footer .language-button {
  justify-content: flex-start;
}

.sidebar-footer .profile-button {
  justify-content: flex-start;
}

.sidebar-footer .language-button .chevron,
.sidebar-footer .profile-button .chevron {
  margin-left: auto;
}

/* Dropdowns open upward from the footer */
.sidebar .sidebar-footer .dropdown-menu {
  top: auto;
  bottom: calc(100% + var(--space-2));
  left: 0;
  right: auto;
  min-width: 220px;
}

.sidebar.collapsed .sidebar-footer .language-label,
.sidebar.collapsed .sidebar-footer .profile-name,
.sidebar.collapsed .sidebar-footer .chevron {
  display: none;
}

.sidebar.collapsed .sidebar-footer .language-button,
.sidebar.collapsed .sidebar-footer .profile-button {
  justify-content: center;
  padding-left: var(--space-2);
  padding-right: var(--space-2);
}

.sidebar.collapsed .sidebar-footer .dropdown-menu {
  min-width: 260px;
}

.mobile-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  z-index: 100;
}

.mobile-title {
  font-weight: 700;
  color: var(--color-ink);
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  z-index: 105;
}

.main-content {
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: var(--space-6);
}

@media (max-width: 899px) {
  .app-body {
    padding-top: var(--topbar-height);
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(var(--sidebar-width), 85vw);
    transform: translateX(-100%);
    transition: transform var(--transition-base);
    visibility: hidden;
  }

  .sidebar.is-open {
    transform: translateX(0);
    visibility: visible;
  }

  .main-content {
    padding: var(--space-4);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .nav-link {
    transition: none;
  }
}

</style>
