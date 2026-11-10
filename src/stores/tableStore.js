// tableStore.js
import { ref } from 'vue'

const storeRegistry = new Map()

/**
 * Mengambil atau membuat instance Table Store berdasarkan key unik.
 * @param {string} storeKey Contoh: 'TableShipment_ID01' atau 'TableRSR_ID01'
 */
export function useTableStoreInstance(storeKey = 'DefaultTableStore') {
  if (storeRegistry.has(storeKey)) {
    return storeRegistry.get(storeKey)
  }

  const tableData = ref([])
  const selectedRow = ref(null)
  const columns = ref([])
  const valuesCache = new Map()

  function setTableData(data) {
    valuesCache.clear()
    tableData.value = Array.isArray(data) ? data : []
  }

  function updateRow(savedData) {
    if (!savedData || !savedData.__rowID) return false

    const rowID = String(savedData.__rowID)
    const index = tableData.value.findIndex(
      row => String(row.__rowID) === rowID
    )

    if (index === -1) return false

    const updatedData = [...tableData.value]
    updatedData[index] = {
      ...updatedData[index],
      ...savedData
    }

    valuesCache.clear()
    tableData.value = updatedData
    return true
  }

  function getUniqueColumnValues(columnId) {
    const keyStr = String(columnId)
    if (valuesCache.has(keyStr)) {
      return valuesCache.get(keyStr)
    }

    const rawData = tableData.value
    if (!Array.isArray(rawData) || !rawData.length) {
      return []
    }

    const uniqueValues = [
      ...new Set(
        rawData
          .map(row => (row ? row[keyStr] : null))
          .filter(val => val !== null && val !== undefined && String(val).trim() !== '')
      )
    ]

    const result = uniqueValues.map(val => ({
      label: String(val),
      value: val
    }))

    valuesCache.set(keyStr, result)
    return result
  }

  const store = {
    storeKey,
    tableData,
    selectedRow,
    columns,
    valuesCache,
    setTableData,
    updateRow,
    getUniqueColumnValues
  }

  storeRegistry.set(storeKey, store)
  return store
}