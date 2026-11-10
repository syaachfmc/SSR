<!-- App.vue --> 
<template>
  <!-- Main Wrapper dengan Halaman Full Screen -->
  <main class="page-container">
    <div class="table-card">
      <!-- Ditambahkan v-if agar tabel dimuat setelah token login tersimpan -->
      <templateTable v-if="isReady" tableName="Dropdownss" instanceId="ID01" :config="DropdownsConfig"
        @row-selected="handleRowSelected('ID01')" />
    </div>
    <div class="table-card">
      <!-- Ditambahkan v-if agar tabel dimuat setelah token login tersimpan -->
      <templateTable v-if="isReady" tableName="Dropdownss" instanceId="ID02" :config="DropdownsConfig"
        @row-selected="handleRowSelected('ID02')" />
    </div>

  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import templateTable from './components/templateTable.vue'
import { fetchGSheetData } from './api/dataApi'; // Sesuaikan path file API Anda

const isReady = ref(false);

// Variabel config dideklarasikan terlebih dahulu agar bisa dipakai fungsi & prop
const DropdownsConfig = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbyypeLHPZ_emDu3hrF2aYsYjCG6_qitL-RagpKbNcJEHx_N0HlPspULdkyXM1u0PjUM/exec',
  gsheetID: "1QnTPM7t8dgnboekqkwq1su1ycyRS7BbW1uVj83qrtEo",
  sheetName: "Dropdowns",
  columnIDRow: 1,
  columnTitleRow: 2,
  columnTitleDescriptionRow: 3,
  columnTypeRow: 4,
  dataRange: "B5:Z",
  rowIDColumn: "A",
  projectID: "18-1206",
  projectIDColumn: "B"
};
function handleRowSelected(id) {
  console.log("select", id)
}
// Menjalankan fungsi tes saat mounted
onMounted(async () => {
  await testFetchDropdownsVue();
});

async function testFetchDropdownsVue() {
  const loginUrl = "https://script.google.com/macros/s/AKfycbyypeLHPZ_emDu3hrF2aYsYjCG6_qitL-RagpKbNcJEHx_N0HlPspULdkyXM1u0PjUM/exec"; // URL API Login GAS
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

    // Simpan token & authUser ke sessionStorage
    sessionStorage.setItem("authToken", token);
    sessionStorage.setItem("authUser", JSON.stringify({
      username: testUsername,
      projectCode: testProjectCode
    }));

    // 2. Fetch Data dari GAS API
    console.log("2. Memanggil fetchGSheetData dengan ProjectID = 'any'...");
    const result = await fetchGSheetData(DropdownsConfig);

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

    // Aktifkan tampilan tabel setelah login & fetch berhasil
    isReady.value = true;

  } catch (err) {
    console.error("❌ Terjadi error internal saat menjalankan test:", err);
  }
}
</script>

<style>
/* Pastikan body dan html mengambil tinggi penuh layar */
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: Arial, sans-serif;
}

/* Pembungkus halaman utama */
.page-container {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  padding: 16px;
  box-sizing: border-box;
  background-color: #f4f6f8;
}

/* Container pembungkus tabel agar fleksibel & memiliki border/shadow */
.table-card {
  flex: 1 1 0%;
  width: 100%;
  min-height: 0;
  /* KRUSIAL untuk Tabulator virtual scroll */
  min-width: 0;
  /* Mencegah overflow horizontal pada flexbox */
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 8px;
  box-sizing: border-box;
}
</style>