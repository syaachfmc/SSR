<!-- /** testdataApi.vue */ -->

<template>
    <div class="p-4">
      <button 
        @click="runTest" 
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Jalankan Test Fetch Dropdowns
      </button>
    </div>
  </template>
  
  <script setup>
  import { testFetchDropdownsVue } from './testdataApi';
  
  const runTest = async () => {
    await testFetchDropdownsVue();
  };
  </script>