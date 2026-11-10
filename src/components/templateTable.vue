<!-- templateTable.vue -->

<template>
  <div class="data-table-container">
    <div v-show="sheetData.status === 'success' && totalRows > 0" class="table-wrapper">
      <div ref="tableElement" class="data-table">gg</div>
    </div>

    <div class="table-toolbar">
      <div class="table-info">
        <span v-if="lastUpdated">
          Last Refresh: <strong>{{ lastUpdated }}</strong>
        </span>
      </div>

      <div class="table-actions">
        <div v-if="loading" class="status-box loading-container">
          <div class="progress-bar-wrapper">
            <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <span class="progress-text">Memuat data... {{ progressPercent }}%</span>
        </div>

        <div v-else-if="sheetData.status === 'error'"></div>

        <div v-else class="action-controls">
          <input v-model="searchText" type="text" class="table-search" placeholder="Cari data..." />

          <button type="button" class="filter-button" :class="{ 'filter-active': showFilters }" @click="toggleFilters"
            :title="showFilters ? 'Hide column filter' : 'Show column filter'">
            <icon :name="showFilters ? 'funnel-x' : 'funnel'" :size="12" />
          </button>

          <button type="button" class="filter-button" @click="clearAllFilters" title="Clear filter">
            <icon name="rotate-ccw" :size="12" />
          </button>

          <button type="button" class="filter-button" :class="{ 'wrap-active': wrapText }" @click="toggleWrap"
            :title="wrapText ? `Don't wrap text in data cell` : `Wrap text in data cell`">
            <icon :name="!wrapText ? 'WrapText' : 'Text'" :size="12" />
          </button>

          <button type="button" class="filter-button" :class="{ 'filter-active': freezeColumns }"
            @click="toggleFrozenColumns" :title="freezeColumns ? 'Unfreeze columns' : 'Freeze columns'">
            <icon :name="freezeColumns ? 'lock' : 'lock-open'" :size="12" />
          </button>

          <button type="button" class="refresh-button" :disabled="loading" @click="loadData" title="Reload All Data">
            <icon :name="loading ? 'refresh-cw' : 'refresh-ccw'" :size="12" />
          </button>

          <button type="button" class="filter-button" :disabled="reloadingDropdown" @click="handleReloadDropdownData"
            :title="reloadingDropdown ? 'Reloading dropdown...' : 'Reload Dropdown'">
            <icon name="refresh-cw" :size="12" :class="{ spinning: reloadingDropdown }" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, watch } from 'vue';
import icon from './icons.vue';
import { useTemplateTable } from '../composables/useTemplateTable.js';
import { useTableStoreInstance } from '../stores/tableStore.js';
import { APP_COLORS } from '../constants/colors.js';

const props = defineProps({
  // Identifikasi Instance unik (misal: tableName="TableShipment", instanceId="ID01")
  tableName: { type: String, default: 'DefaultTable' },
  instanceId: { type: String, default: 'ID01' },

  config: { type: Object, required: true },
  tableDateFormat: { type: String, default: '' },
  filterFn: { type: Function, default: null },
  store: { type: Object, default: null },
  tableStore: { type: Object, default: null }
});

const emit = defineEmits(['row-selected', 'relogin']);

// Buat Store Key unik dari gabungan tableName & instanceId
const computedStoreKey = computed(() => `${props.tableName}_${props.instanceId}`);

// Dapatkan store instance (menggunakan tableStore prop jika dikirim manual, 
// atau buat instance terisolasi otomatis dari registry)
const activeTableStore = computed(() => {
  return props.tableStore || useTableStoreInstance(computedStoreKey.value);
});

const {
  tableElement, loading, progressPercent, searchText, lastUpdated, showFilters, wrapText,
  freezeColumns, sheetData, totalRows, totalColumns, reloadingDropdown,
  loadData, refreshTableData, clearAllFilters, toggleWrap, toggleFrozenColumns, toggleFilters,
  addAndSelectRow, destroyTable, handleReloadDropdownData, applySearch
} = useTemplateTable(props, emit, {
  filterFn: props.filterFn,
  store: props.store,
  tableStore: activeTableStore.value
});

watch(searchText, () => applySearch());
watch(() => props.config, () => loadData(), { deep: true });

onMounted(() => loadData());
onBeforeUnmount(() => destroyTable());

defineExpose({ 
  loadData, 
  addAndSelectRow, 
  refreshTableData 
});
</script>

<style scoped>
.data-table-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.table-wrapper {
  flex: 1 1 0%;
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.data-table {
  width: 100%;
  height: 100%;
  min-width: 0;
  border: 1px solid v-bind('APP_COLORS.borderDefault');
  border-radius: 3px;
}

.table-toolbar {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 4px 0;
}

.table-info {
  width: 100%;
  display: flex;
  justify-content: flex-end;
}

.table-info span {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  color: v-bind('APP_COLORS.textSecondary');
  margin: 4px;
}

.table-info strong {
  color: v-bind('APP_COLORS.textPrimary');
  font-size: 10px;
}

.table-actions {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  justify-content: flex-end;
}

.table-search {
  box-sizing: border-box;
  width: 160px;
  max-width: 100%;
  padding: 2px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
}

.table-search:focus {
  border-color: #4285f4;
  box-shadow: 0 0 0 2px rgb(66 133 244 / 15%);
}

.refresh-button {
  padding: 2px 8px;
  border: 1px solid #1a73e8;
  border-radius: 4px;
  background: #1a73e8;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.refresh-button:hover:not(:disabled) {
  background: #1558b0;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.relogin-button {
  padding: 2px 8px;
  border: 1px solid #d93025;
  border-radius: 4px;
  background: #d93025;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  margin-left: 4px;
}

.relogin-button:hover {
  background: #a50e0e;
}

.filter-button {
  padding: 2px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-size: 10px;
  cursor: pointer;
}

.filter-button:hover {
  background: #f2f2f2;
}

.filter-button.wrap-active {
  border-color: #1a73e8;
  background: #e8f1fe;
  color: #1a73e8;
}

.filter-button.filter-active {
  border-color: #1a73e8;
  background: #e8f1fe;
  color: #1a73e8;
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
  border: 1px solid #b3d4fc;
  border-radius: 4px;
  background: #f0f7ff;
}

.progress-bar-wrapper {
  flex: 1;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4285f4 0%, #1a73e8 50%, #0d47a1 100%);
  transition: width 0.2s ease-in-out;
}

.progress-text {
  font-size: 11px;
  font-weight: 600;
  color: #1a73e8;
  white-space: nowrap;
}

.empty-state {
  flex: 1;
  text-align: center;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  padding: 4px;
}

.error {
  flex: 1;
  text-align: center;
  color: #b42318;
  background: #fff4f2;
  border: 1px solid #f1b5ae;
  border-radius: 4px;
  font-size: 12px;
  padding: 4px;
}

.error p {
  overflow-wrap: anywhere;
}

.data-table :deep(.tabulator-col-content) {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  box-sizing: border-box;
}

.data-table :deep(.tabulator-col-title-holder) {
  width: 100%;
}

.data-table :deep(.tabulator-col-title) {
  width: 100%;
  font-weight: normal;
  text-align: center;
  color: v-bind('APP_COLORS.textPrimaryAksen');
}

.data-table :deep(.cell-scroll) {
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  line-height: 1.4;
  text-overflow: clip;
  scrollbar-width: none;
}

.data-table :deep(.cell-scroll::-webkit-scrollbar) {
  height: 0;
}

.data-table :deep(.cell-scroll.wrap-text) {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  overflow-x: hidden;
  overflow-y: hidden;
}

.data-table :deep(.cell-scroll.nowrap-text) {
  display: block;
  width: 100%;
  max-width: 100%;
  white-space: nowrap;
  overflow-wrap: normal;
  word-break: normal;
  overflow-x: auto;
  overflow-y: hidden;
  text-overflow: clip;
  line-height: 1.4;
  box-sizing: border-box;
}

.data-table :deep(.cell-scroll.nowrap-text:hover) {
  scrollbar-width: thin;
}

.data-table :deep(.cell-scroll.nowrap-text:hover::-webkit-scrollbar) {
  height: 6px;
}

.data-table :deep(.cell-scroll.nowrap-text:hover::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 3px;
}

.data-table :deep(.cell-scroll.nowrap-text:hover::-webkit-scrollbar-thumb) {
  background: #999;
  border-radius: 3px;
}

.data-table :deep(.cell-scroll.nowrap-text:hover::-webkit-scrollbar-thumb:hover) {
  background: #666;
}

.data-table :deep(.tabulator-row),
.data-table :deep(.tabulator-row.tabulator-row-even),
.data-table :deep(.tabulator-row.tabulator-row-odd) {
  height: auto;
  min-height: 0;
  background: v-bind('APP_COLORS.bgGradNormal');
  color: v-bind('APP_COLORS.bgGradTextNormal');
}

.data-table :deep(.tabulator-row:hover) {
  background: v-bind('APP_COLORS.bgGradHover');
  color: v-bind('APP_COLORS.bgGradTextHover');
}

.data-table :deep(.tabulator-row.tabulator-selected) {
  background: v-bind('APP_COLORS.bgGradSelected');
  color: v-bind('APP_COLORS.bgGradTextSelected');
}

.data-table :deep(.tabulator-cell) {
  height: auto;
  white-space: normal;
  background: transparent !important;
  border: 1px dotted v-bind('APP_COLORS.borderDefault');
}

.data-table :deep(.tabulator-col-content) {
  background: v-bind('APP_COLORS.buttonBg');
}

.data-table :deep(.tabulator-header-filter input) {
  background: v-bind('APP_COLORS.bgPrimaryGrad');
  border-color: v-bind('APP_COLORS.borderDefault');
  border-style: solid;
  border-width: 1px;
  box-shadow: 0px 2px 4px 0px v-bind('APP_COLORS.shadowColorNormal');
  outline: none;
}

.data-table :deep(.tabulator-header-filter input:focus) {
  outline: none;
  border-style: solid;
  border-width: 1px;
  box-shadow: inset 0px 2px 4px 0px v-bind('APP_COLORS.shadowColorNormal');
}

.data-table :deep(.tabulator-cell.tabulator-frozen) {
  background: v-bind('APP_COLORS.bgGradNormal') !important;
  color: v-bind('APP_COLORS.bgGradTextNormal') !important;
}

.data-table :deep(.tabulator-col.tabulator-frozen) {
  background: v-bind('APP_COLORS.buttonBg') !important;
}

.data-table :deep(.tabulator-row:hover .tabulator-cell.tabulator-frozen) {
  background: v-bind('APP_COLORS.bgGradHover') !important;
  color: v-bind('APP_COLORS.bgGradTextHover') !important;
}

.data-table :deep(.tabulator-row.tabulator-selected .tabulator-cell.tabulator-frozen) {
  background: v-bind('APP_COLORS.bgGradSelected') !important;
  color: v-bind('APP_COLORS.bgGradTextSelected') !important;
}

@media (max-width: 600px) {
  .table-toolbar {
    align-items: stretch;
  }

  .table-actions {
    width: 100%;
  }

  .table-search {
    flex: 1;
    width: auto;
  }

  .table-info {
    gap: 8px 12px;
  }
}

.data-table :deep(.tabulator-frozen) {
  border-left: 1px solid v-bind('APP_COLORS.textPrimaryAksen20') !important;
  border-right: 1px solid v-bind('APP_COLORS.textPrimaryAksen20') !important;
}

:global(.custom-tooltip) {
  position: fixed;
  z-index: 99999;
  max-width: min(320px, calc(100vw - 16px));
  padding: 7px 10px;
  color: #222;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-family: Arial, sans-serif;
  font-size: 12px;
  font-weight: normal;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  box-shadow: 0 3px 10px rgb(0 0 0 / 15%);
  pointer-events: none;
}

.filter-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>