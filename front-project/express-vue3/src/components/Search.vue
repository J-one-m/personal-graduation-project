<script setup>
import { ref } from 'vue';
import useAppStore from '@/stores/useAppStore';
import { storeToRefs } from 'pinia';

const appStore = useAppStore();
const { isMobile } = storeToRefs(appStore);
// defineOptions({
//     name:'search'
// });//除了路由级别的组件，其它不建议使用该方法来命名
let searchQuery = ref('');

const handleSearch = (value)=>{
    console.log(value)
}

</script>

<template>
    <div class="searchBox">
        <input type="text" v-model="searchQuery" placeholder="快捷预约" @keyup.enter="handleSearch(searchQuery)">
        <img 
          src="/src//assets/images/icon/搜索Icon.svg" 
          :width="isMobile ? 10 : 30" 
          :height="isMobile ? 10 : 30"
          alt="搜索图标" 
          @click="handleSearch(searchQuery)">
    </div>
</template>

<style scoped>

    .searchBox{
        padding: 3px 8px 3px 15px;
        display: flex;
        flex-direction: row;
        background-color: #F2F3F4;
        border-radius: 8px;
        box-sizing: border-box;
    }

    input{
        border: none;
        background-color: transparent;
        outline: none;
    }

</style>