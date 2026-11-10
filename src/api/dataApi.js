
/** dataApi.js
 * 
 * Memanggil GAS Web API dan mengembalikan result object
 * ter-wrapper dengan method .get().
 *
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function fetchGSheetData({
  webAppUrl,
  gsheetID,
  sheetName,
  columnIDRow,
  columnTitleRow,
  columnTitleDescriptionRow,
  columnTypeRow,
  dataRange,
  rowIDColumn,
  projectID,
  projectIDColumn
}) {
  try {
    // ============================================
    // 1. VALIDASI URL
    // ============================================

    if (!webAppUrl) {
      throw new Error("webAppUrl tidak boleh kosong.");
    }

    const url = new URL(webAppUrl);

    // ============================================
    // 2. AMBIL SESSION
    // ============================================

    const token = sessionStorage.getItem("authToken") || "";

    let authUser = {};

    try {
      authUser = JSON.parse(
        sessionStorage.getItem("authUser") || "{}"
      );
    } catch (err) {
      authUser = {};
    }

    // ============================================
    // 3. TENTUKAN PROJECT ID
    // ============================================

    let effectiveProjectID = projectID;

    // Jika tidak dikirim, gunakan projectCode user.
    if (
      effectiveProjectID === undefined ||
      effectiveProjectID === null ||
      String(effectiveProjectID).trim() === ""
    ) {
      effectiveProjectID = authUser.projectCode;
    }

    if (
      effectiveProjectID !== undefined &&
      effectiveProjectID !== null
    ) {
      effectiveProjectID = String(effectiveProjectID).trim();
    }

    // ============================================
    // 4. SUSUN QUERY PARAMETERS
    // ============================================

    const queryParams = {
      token,
      GSheetID: gsheetID,
      sheetName,
      columnIDRow,
      columnTitleRow,
      columnTitleDescriptionRow,
      columnTypeRow,
      dataRange,
      ...(rowIDColumn && {
        RowIDColumn: rowIDColumn
      }),
      ...(effectiveProjectID !== undefined &&
          effectiveProjectID !== null &&
          effectiveProjectID !== "" && {
        ProjectID: effectiveProjectID
      }),
      ...(projectIDColumn && {
        ProjectIDColumn: projectIDColumn
      })
    };

    // Tambahkan parameter ke URL.
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    // ============================================
    // 5. REQUEST DEBUG
    // ============================================

    const requestDebug = {
      requestedProjectID: projectID ?? null,
      effectiveProjectID: effectiveProjectID ?? null,
      authenticatedProjectCode: authUser.projectCode ?? null,
      projectIDWillBeSent:
        url.searchParams.get("ProjectID") ?? null
    };

    // ============================================
    // 6. CALL GAS API
    // ============================================

    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow"
    });

    if (!response.ok) {
      return attachClientWrapper({
        status: "error",
        error: `HTTP Error ${response.status}: ${response.statusText}`,
        debugInfo: requestDebug
      });
    }

    const rawResult = await response.json();

    // Gabungkan debug frontend dan backend.
    rawResult.debugInfo = {
      ...(rawResult.debugInfo || {}),
      frontend: requestDebug
    };

    return attachClientWrapper(rawResult);

  } catch (err) {
    return attachClientWrapper({
      status: "error",
      error: err.message || "Terjadi kesalahan pada fetchGSheetData.",
      debugInfo: {
        exception: err.name || "Error"
      }
    });
  }
}


/**
 * Menambahkan method .get(rowIndex, colIndex)
 * secara non-enumerable pada objek client-side.
 */
function attachClientWrapper(obj) {
  const safeObj = {
    status: obj?.status || "error",
    error: obj?.error !== undefined
      ? obj.error
      : "Unknown client error",

    columnIDs: Array.isArray(obj?.columnIDs)
      ? obj.columnIDs
      : [],

    columnTitles: Array.isArray(obj?.columnTitles)
      ? obj.columnTitles
      : (
          Array.isArray(obj?.columnHeaders)
            ? obj.columnHeaders
            : []
        ),

    columnDescriptions: Array.isArray(obj?.columnDescriptions)
      ? obj.columnDescriptions
      : [],

    columnTypes: Array.isArray(obj?.columnTypes)
      ? obj.columnTypes
      : [],

    data: Array.isArray(obj?.data)
      ? obj.data
      : [],

    rowIDs: Array.isArray(obj?.rowIDs)
      ? obj.rowIDs
      : [],

    debugInfo: obj?.debugInfo ?? null
  };

  Object.defineProperty(safeObj, "get", {
    value: function(rowIndex, colIndex) {
      return this.data?.[rowIndex]?.[colIndex] ?? null;
    },
    writable: false,
    configurable: true,
    enumerable: false
  });

  return safeObj;
}
