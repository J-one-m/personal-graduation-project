<script setup>
import { ref } from 'vue';

const propsInfo = defineProps(['isShow']);

</script>

<template>

    <div  :class="{overlay:propsInfo.isShow}">
        
        <slot></slot>
    </div>

</template>

<style scoped>

.overlay{
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
}


</style>