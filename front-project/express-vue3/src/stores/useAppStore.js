import { defineStore } from "pinia";
import { reactive,ref } from "vue";


const useAppStore = defineStore('useAppStore',()=>{

    const isMobile = ref(window.innerWidth <= 768);

    function updateDeviceType(){
        const status = window.innerWidth <= 768;
        if(isMobile.value !== status){
            isMobile.value = status;
        }
    }

    // 导出需要被引用的变量以及方法
    return {
        isMobile,
        updateDeviceType,
    }
});

export default useAppStore;