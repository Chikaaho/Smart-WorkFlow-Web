<script setup lang="ts">
import { useDict } from './index'

const props = defineProps<{ type: string }>()
const model = defineModel<string | undefined>()
const { items } = useDict(props.type)
</script>

<template>
  <select v-model="model">
    <option v-for="item in items" :key="item.value" :value="item.value">
      {{ item.label }}
    </option>
  </select>
</template>
