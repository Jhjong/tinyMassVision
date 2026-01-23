<script setup lang="ts">
import SvgIcon from './SvgIcon.vue';
import { computed } from 'vue';

const emit = defineEmits(['update:modelValue', 'blur']);

const props = defineProps({
    modelValue: { type: String, default: '' },
    type: { type: String, default: 'text' },
    iconType: { type: String, required: true },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    pattern: { type: String, default: '.*' },
    minLength: { type: Number, default: 0 },
    maxLength: { type: Number, default: 100 },
    title: { type: String, default: '' }
});

const value = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
});
</script>

<template>
    <label class="input validator w-full">
        <SvgIcon :type="iconType" />
        <!-- v model 双向绑定 -->
        <input
            v-model="value"
            :type="type"
            :required="required"
            :placeholder="placeholder"
            :pattern="pattern"
            :minlength="minLength"
            :maxlength="maxLength"
            :title="title"
            @blur="emit('blur')" />
    </label>
    <slot />
</template>
