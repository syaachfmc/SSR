/** testdataApi.js */

import { fetchGSheetData } from '../api/dataApi'; // Sesuaikan path file API Anda

/**
 * Fungsi pengujian integrasi Frontend Vue ke GAS Web API.
 * Menyimulasikan alur: Login -> Fetch Dropdowns (ProjectID: "any") -> Logout
 */
export async function testFetchDropdownsVue() {
  const loginUrl = "https://script.google.com/macros/s/AKfycbyypeLHPZ_emDu3hrF2aYsYjCG6_qitL-RagpKbNcJEHx_N0HlPspULdkyXM1u0PjUM/exec"; // URL API Login GAS
  const webAppUrl = "https://script.google.com/macros/s/AKfycbyypeLHPZ_emDu3hrF2aYsYjCG6_qitL-RagpKbNcJEHx_N0HlPspULdkyXM1u0PjUM/exec"; // URL Data API GAS

  const testUsername = "nana";
  const testPassword = "abc";
  const testProjectCode = "18-1206";

  console.log("1. Melakukan login untuk mendapatkan token tes...");

  try {
    // 1. Proses Login
    const loginResponse = await fetch(loginUrl, {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        username: testUsername,
        password: testPassword,
        projectCode: testProjectCode
      })
    });

    const loginResult = await loginResponse.json();

    if (!loginResult || !loginResult.success) {
      console.error("❌ Gagal login untuk testing:", loginResult?.message || "No response");
      return;
    }

    const token = loginResult.token;
    console.log("✅ Token berhasil didapat:", token);

    // Simpan token & authUser ke sessionStorage sesuai kebutuhan fetchGSheetData
    sessionStorage.setItem("authToken", token);
    sessionStorage.setItem("authUser", JSON.stringify({
      username: testUsername,
      projectCode: testProjectCode
    }));

    // 2. Fetch Data dari GAS API dengan ProjectID = "any"
    console.log("2. Memanggil fetchGSheetData dengan ProjectID = 'any'...");

    const result = await fetchGSheetData({
      webAppUrl: webAppUrl,
      gsheetID: "1QnTPM7t8dgnboekqkwq1su1ycyRS7BbW1uVj83qrtEo",
      sheetName: "Dropdowns",
      columnIDRow: 1,
      columnTitleRow: 2,
      columnTitleDescriptionRow: 3,
      columnTypeRow: 4,
      dataRange: "B5:Z",
      rowIDColumn: "A",
      projectID: "any",
      projectIDColumn: "B"
    });

    console.log("API DEBUG:", result.debugInfo);
    console.log("DATA:", result.data);

    console.log("========== TEST FETCH DROPDOWNS RESULT ==========");
    console.log("Status Response :", result.status);
    console.log("Error Response :", result.error);
    console.log("Jumlah Kolom    :", result.columnIDs ? result.columnIDs.length : 0);
    console.log("Jumlah Baris    :", result.data ? result.data.length : 0);

    if (result.status === "success" && result.data && result.data.length > 0) {
      console.log("✅ BERHASIL: Data dropdown dengan ProjectID 'any' berhasil ditarik!");
      console.log("Sample Data Baris Pertama:", result.data[0]);
      console.log("Sample Akses method .get(1, 1):", result.get(1, 1));
    } else {
      console.warn("⚠️ PERHATIAN: Response success tetapi array data kosong atau terjadi error:", result.error);
    }

    // 3. Cleanup / Logout Sesi
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authUser");
    console.log("3. Sesi tes dibersihkan (logout/sessionStorage cleared).");

  } catch (err) {
    console.error("❌ Terjadi error internal saat menjalankan test:", err);
  }
}