// useTemplateTable.js

import { ref, computed, nextTick } from 'vue';
import { TabulatorFull } from 'tabulator-tables'
import { fetchGSheetData } from '../api/dataApi.js'

const pageSidebarWidth = ref()

export function useTemplateTable(props, emit, options = {}) {
  const loading = ref(false);
  const progressPercent = ref(0);
  let progressInterval = null;

  const searchText = ref('');
  const lastUpdated = ref('');
  const tableElement = ref(null);
  const showFilters = ref(false);
  const wrapText = ref(false);
  const freezeColumns = ref(true);
  const reloadingDropdown = ref(false);

  const sheetData = ref({
    status: 'loading',
    error: null,
    columnIDs: [],
    columnTitles: [],
    columnDescriptions: [],
    columnTypes: [],
    data: [],
    rowIDs: []
  });

  let table = null;
  let requestSequence = 0;

  const totalRows = computed(() => sheetData.value.data.length);
  const totalColumns = computed(() => sheetData.value.columnTitles.length);

  // --- Filter Logika Khusus Sub-Tabel (misal Filter Parent/Foreign Key) ---
  function getFilteredData() {
    const rawData = buildTableData(sheetData.value);
    if (typeof options.filterFn === 'function') {
      return options.filterFn(rawData);
    }
    return rawData;
  }

  function refreshTableData() {
    const filtered = getFilteredData();
    if (table) {
      table.replaceData(filtered);
    }
  }

  // --- Formatting Helpers ---
  function parseDateValue(value) {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    const match = text.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2}|\d{4})$/);

    if (!match) {
      const timestamp = Date.parse(text);
      return Number.isNaN(timestamp) ? null : timestamp;
    }

    const day = Number(match[1]);
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = monthNames.indexOf(match[2].toLowerCase());
    let year = Number(match[3]);

    if (month < 0) return null;
    if (match[3].length === 2) year += year >= 50 ? 1900 : 2000;

    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;

    return date.getTime();
  }

  function formatDateValue(value, format) {
    if (value === null || value === undefined || String(value).trim() === '') return value ?? '';
    if (!format || !String(format).trim()) return value;

    const timestamp = parseDateValue(value);
    if (timestamp === null) return value;

    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const tokens = {
      yyyy: String(year),
      yy: String(year).slice(-2),
      MMMM: longMonths[month - 1],
      MMM: shortMonths[month - 1],
      MM: String(month).padStart(2, '0'),
      M: String(month),
      dd: String(day).padStart(2, '0'),
      d: String(day)
    };

    return String(format).replace(/yyyy|MMMM|MMM|MM|M|dd|d|yy/g, token => tokens[token]);
  }

  function getSorter(type) {
    const numericTypes = ['number', 'numeric', 'integer', 'float', 'decimal', 'currency'];
    return numericTypes.includes(type) ? 'number' : 'string';
  }

  function sortDateValues(a, b) {
    const dateA = parseDateValue(a);
    const dateB = parseDateValue(b);
    if (dateA === null && dateB === null) return 0;
    if (dateA === null) return 1;
    if (dateB === null) return -1;
    return dateA - dateB;
  }

  function buildTableData(result) {
    const validRows = [];
    (result.data || []).forEach((row, rowIndex) => {
      const hasValue = row.some(value => {
        if (value === null || value === undefined) return false;
        const text = String(value).replace(/[\s\u00A0\u200B\uFEFF]/g, '').trim();
        return text !== '' && text.toUpperCase() !== 'FALSE';
      });

      if (hasValue) {
        const record = {
          __rowIndex: rowIndex,
          __rowID: result.rowIDs && result.rowIDs[rowIndex] !== undefined ? result.rowIDs[rowIndex] : ''
        };

        result.columnIDs.forEach((columnID, columnIndex) => {
          const value = row[columnIndex] ?? '';
          record[columnID] = String(value).trim().toUpperCase() === 'FALSE' ? '' : value;
        });

        validRows.push(record);
      }
    });

    return validRows;
  }

  // --- Dynamic Column Generator ---
  function buildColumns(result) {
    const frozenIndexes = Array.isArray(props.config.FrozenColumnIndex)
      ? props.config.FrozenColumnIndex.map(id => String(id))
      : [];

    const generatedColumns = [];

    const tabulatorCols = result.columnTitles
      .map((title, index) => {
        const rawType = String(result.columnTypes[index] || 'string').trim().toLowerCase();
        const columnID = result.columnIDs[index] || `col_${index + 1}`;
        const tooltips = result.columnDescriptions[index] || '';

        generatedColumns.push({
          id: columnID,
          title: String(title || columnID),
          tooltips: String(tooltips || title || columnID)
        });

        if (rawType.includes('hidden')) return null;

        const type = rawType.replace('hidden', '').trim() || 'string';
        const isFrozen = freezeColumns.value && frozenIndexes.includes(String(columnID));

        const column = {
          title: String(title || columnID),
          field: columnID,
          frozen: isFrozen,
          headerTooltip: tooltips || String(title || columnID),
          headerFilter: showFilters.value ? 'input' : false,
          headerFilterPlaceholder: '',
          headerFilterFunc: 'like',
          headerSort: true,
          sorter: ['date', 'datetime'].includes(type) ? sortDateValues : getSorter(type),
          headerHozAlign: 'center',
          maxWidth: 500,
          width: isFrozen ? pageSidebarWidth.value : undefined,
          widthGrow: 0,
          tooltip: true,
          headerWordWrap: true,
          formatter: function (cell) {
            const value = cell.getValue() ?? '';
            const displayValue = type === 'date'
              ? formatDateValue(value, props.tableDateFormat)
              : value;

            const div = document.createElement('div');
            div.className = 'cell-scroll';
            div.textContent = String(displayValue);
            div.classList.toggle('wrap-text', wrapText.value);
            div.classList.toggle('nowrap-text', !wrapText.value);
            return div;
          }
        };

        if (type === 'link') {
          column.hozAlign = 'center';
          column.width = 70;
          column.minWidth = 70;
          column.widthGrow = 0;
          column.headerSort = false;
          column.headerFilter = false;
          column.formatter = function (cell) {
            const url = String(cell.getValue() ?? '').trim();
            if (!url) return '';
            try {
              const parsedURL = new URL(url);
              if (!['http:', 'https:'].includes(parsedURL.protocol)) return '';
            } catch {
              return '';
            }
            const safeURL = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<a href="${safeURL}" target="_blank" rel="noopener noreferrer" title="Buka link" style="text-decoration:none;font-size:18px;">📁</a>`;
          };
        }

        return column;
      })
      .filter(col => col !== null);

    if (options.store) {
      options.store.columns.value = generatedColumns;
    }

    return tabulatorCols;
  }

  // --- Render & Core Functions ---
  function applySearch() {
    if (!table) return;
    const keyword = searchText.value.trim().toLowerCase();
    if (!keyword) {
      table.clearFilter(false);
      return;
    }
    table.setFilter(data => {
      return sheetData.value.columnIDs.some(columnID => {
        const value = data[columnID];
        return String(value ?? '').toLowerCase().includes(keyword);
      });
    });
  }

  async function renderTable() {
    await nextTick();
    if (!tableElement.value || sheetData.value.status !== 'success') return;

    if (totalRows.value === 0 || totalColumns.value === 0) {
      destroyTable();
      return;
    }

    const columns = buildColumns(sheetData.value);
    const result = getFilteredData();

    if (!table) {
      table = new TabulatorFull(tableElement.value, {
        data: result,
        columns,
        selectableRows: 1,
        layout: 'fitData',
        autoResize: false,
        height: "100%",
        renderVertical: "virtual",
        renderVerticalBuffer: false,
        index: '__rowIndex',
        placeholder: 'Tidak ada data',
        movableColumns: true,
        resizableColumnFit: true,
        columnDefaults: { headerSort: true, resizable: true },
        pagination: false,
        locale: 'id-id',
        langs: {
          'id-id': {
            pagination: {
              page_size: 'Baris', first: 'Pertama', first_title: 'Halaman pertama',
              last: 'Terakhir', last_title: 'Halaman terakhir', prev: 'Sebelumnya',
              prev_title: 'Halaman sebelumnya', next: 'Berikutnya', next_title: 'Halaman berikutnya',
              all: 'Semua', counter: { showing: 'Menampilkan', of: 'dari', rows: 'baris', pages: 'halaman' }
            }
          }
        }
      });

      await new Promise(resolve => {
        table.on('tableBuilt', () => {
          applySearch();
          resolve();
        });
      });

      table.on('rowClick', (e, row) => {
        const rowData = row.getData();
        if (options.store) {
          options.store.selectedRow.value = { ...rowData };
        }
        const firstColumnID = sheetData.value.columnIDs[4];
        const firstColumnValue = firstColumnID ? rowData[firstColumnID] : '';
        const rowID = rowData.__rowID || '';

        emit('row-selected', { value: firstColumnValue, rowID });
      });
    } else {
      await table.setColumns(columns);
      await table.replaceData(result);
      applySearch();
    }
  }

  // --- Load Data dari API ---
  async function loadData() {
    if (options.store) {
      options.store.selectedRow.value = null;
    }

    const currentRequest = ++requestSequence;
    loading.value = true;
    window.dispatchEvent(new CustomEvent('data-table-loading', { detail: { loading: true } }));

    startProgressSimulation();

  
    try {
      const config = props.config;

      // ✅ PERBAIKAN: Kirim sebagai Objek tunggal dengan destructuring & fallback casing
      const result = await fetchGSheetData({
        webAppUrl: config.webAppUrl,
        gsheetID: config.gsheetID,
        sheetName: config.sheetName,
        columnIDRow: config.columnIDRow ?? 1,
        columnTitleRow: config.columnTitleRow ?? 2,
        columnTitleDescriptionRow: config.columnTitleDescriptionRow ?? 3,
        columnTypeRow: config.columnTypeRow ?? 4,
        dataRange: config.dataRange ?? 'A5:Z',
        rowIDColumn: config.rowIDColumn ?? config.RowIDColumn ?? '',
        projectID: config.projectID ?? config.ProjectID ?? '',
        projectIDColumn: config.projectIDColumn ?? config.ProjectIDColumn ?? ''
      });

      if (currentRequest !== requestSequence) return;

      if (result.status !== 'success') {
        sheetData.value = {
          status: 'error',
          error: result.error || 'Terjadi kesalahan saat mengambil data.',
          columnIDs: [], columnTitles: [], columnDescriptions: [], columnTypes: [], data: [], rowIDs: []
        };
        if (options.tableStore) options.tableStore.setTableData([]);
        destroyTable();
        return;
      }

      progressPercent.value = 100;
      sheetData.value = result;

      const formattedTableData = buildTableData(result);
      if (options.tableStore) options.tableStore.setTableData(formattedTableData);

      lastUpdated.value = new Date().toLocaleString('id-ID');
      await renderTable();
      await selectLastRow();
    } catch (error) {

      if (currentRequest !== requestSequence) return;
      sheetData.value = {
        status: 'error',
        error: error.message || String(error),
        columnIDs: [], columnTitles: [], columnDescriptions: [], columnTypes: [], data: [], rowIDs: []
      };
      if (options.tableStore) options.tableStore.setTableData([]);
      destroyTable();
    } finally {
      if (currentRequest === requestSequence) {
        stopProgressSimulation();
        setTimeout(() => {
          if (currentRequest !== requestSequence) return;
          loading.value = false;
          window.dispatchEvent(new CustomEvent('data-table-loading', { detail: { loading: false } }));
        }, 150);
      }
    }
  }

  // --- Selection & Actions ---
  async function selectLastRow() {
    if (!table) return null;
    const rows = table.getRows();
    if (!rows.length) {
      if (options.store) options.store.selectedRow.value = null;
      return null;
    }
    const lastRow = rows[rows.length - 1];
    lastRow.select();
    await lastRow.scrollTo();

    const rowData = lastRow.getData();
    if (options.store) options.store.selectedRow.value = { ...rowData };

    const firstColumnID = sheetData.value.columnIDs[4];
    const firstColumnValue = firstColumnID ? rowData[firstColumnID] : '';
    emit('row-selected', { value: firstColumnValue, rowID: rowData.__rowID || '' });
    return rowData;
  }

  async function addAndSelectRow(rowID, mainIDColumnID, newMainIDValue) {
    if (!rowID) throw new Error('RowID tidak tersedia.');
    searchText.value = '';
    if (table) table.clearFilter(true);

    await loadData();
    if (sheetData.value.status !== 'success') throw new Error(sheetData.value.error || 'Gagal memuat ulang data.');
    if (!table) throw new Error('Tabulator belum siap.');

    refreshTableData();
    table.clearFilter(true);

    const targetRow = table.getRows().find(row => String(row.getData().__rowID) === String(rowID));
    if (!targetRow) throw new Error(`Baris baru dengan RowID ${rowID} tidak ditemukan di tabel.`);

    targetRow.select();
    await targetRow.scrollTo();

    const rowData = targetRow.getData();
    if (options.store) options.store.selectedRow.value = { ...rowData };

    const firstColumnID = sheetData.value.columnIDs[4];
    const firstColumnValue = firstColumnID ? rowData[firstColumnID] : '';
    emit('row-selected', { value: firstColumnValue, rowID: rowData.__rowID || '' });
    return rowData;
  }



  function destroyTable() {
    if (table) {
      table.destroy();
      table = null;
    }
  }

  function startProgressSimulation() {
    stopProgressSimulation();
    progressPercent.value = 5;
    progressInterval = setInterval(() => {
      if (progressPercent.value < 90) {
        progressPercent.value = Math.min(progressPercent.value + Math.floor(Math.random() * 5) + 3, 90);
      }
    }, 200);
  }

  function stopProgressSimulation() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  function clearAllFilters() {
    searchText.value = '';
    if (table) {
      table.clearFilter(true);
      applySearch();
    }
  }

  function toggleWrap() {
    wrapText.value = !wrapText.value;
    if (table) {
      table.getRows().forEach(row => row.reformat());
      table.redraw();
    }
  }

  function toggleFrozenColumns() {
    freezeColumns.value = !freezeColumns.value;
    if (!table || sheetData.value.status !== 'success') return;
    table.setColumns(buildColumns(sheetData.value));
  }

  async function toggleFilters() {
    showFilters.value = !showFilters.value;
    if (!table || sheetData.value.status !== 'success') return;
    const columns = buildColumns(sheetData.value);
    await table.setColumns(columns);
    if (!showFilters.value) table.clearFilter(true);
    applySearch();
  }

  return {
    tableElement, loading, progressPercent, searchText, lastUpdated, showFilters, wrapText,
    freezeColumns, sheetData, totalRows, totalColumns, reloadingDropdown,
    loadData, renderTable, refreshTableData, clearAllFilters, toggleWrap, toggleFrozenColumns,
    toggleFilters, addAndSelectRow, selectLastRow, destroyTable, applySearch, buildTableData
  };
}