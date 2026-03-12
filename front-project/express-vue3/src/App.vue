<script setup> 
import { RouterLink,RouterView } from 'vue-router';
import { ref,onMounted,onUnmounted } from 'vue';
import useAppStore from './stores/useAppStore';
import { storeToRefs } from 'pinia';

defineOptions({
  name:'App',
});

const appStore = useAppStore();
const {updateDeviceType} = appStore;

// 防抖更新
let timer = null;//防抖计时器
const debounceUpdate = ()=>{
  if(timer) clearTimeout(timer);

  timer = setTimeout(() => {
    updateDeviceType();
  }, 400);
}

onMounted(()=>{
  // 初始化执行一次
  updateDeviceType();
  
  window.addEventListener('resize',debounceUpdate);
});

onUnmounted(()=>{
  if(timer) clearTimeout(timer);
  window.removeEventListener('resize',debounceUpdate);
});

</script>

<template>
  <!-- <div  id="app">  
  </div> -->
  <router-view></router-view>
</template>


<style>
/* 多余 */
  #app{
    height: 100vh;
  }
</style>