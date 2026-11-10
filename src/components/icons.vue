<!-- templateIcons.vue -->

<script setup>
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'

const props = defineProps({
  // Nama ikon Lucide (misal: 'SlidersHorizontal', 'X', 'User', 'Search', dll)
  name: {
    type: String,
    required: true
  },
  // Ukuran ikon (dalam pixel atau string css)
  size: {
    type: [Number, String],
    default: 18
  },
  // Ketebalan garis stroke
  strokeWidth: {
    type: [Number, String],
    default: 2
  },
  // Warna ikon (default mengikuti warna teks parent)
  color: {
    type: String,
    default: 'currentColor'
  }
})

// Mengambil komponen ikon berdasarkan prop `name`
const iconComponent = computed(() => {
  // Menerima penulisan PascalCase ('SlidersHorizontal') maupun kebab-case ('sliders-horizontal')
  const formattedName = props.name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  return icons[formattedName] || null
})
</script>

<template>
  <component :is="iconComponent" v-if="iconComponent" :size="size" :stroke-width="strokeWidth" :color="color"
    class="app-icon" />
  <span v-else class="icon-missing">?</span>
</template>

<style scoped>
.app-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}

.icon-missing {
  color: red;
  font-weight: bold;
}
</style>