<script setup>
defineOptions({
    name:'LostAndFoundInfo',
});
import { ref,reactive } from 'vue'

const handleImport = ()=>{
    const vueFileObject = import.meta.glob('./*.vue');
    //将对象中的所有key整理成数组
    const KeyArr = Object.keys(vueFileObject);
    // 将对象中键对应的值整理成数组
    const valuesArr = Object.values(vueFileObject);
    // 将对象中的键值对整理成数组[key,value]
    const keyValuesArr = Object.entries(vueFileObject);
    for(let key in vueFileObject){
        /* 
        《 知识点，js事件循环（部分） 》

            js是一种单线程语言，这意味着其在任何时刻仅能执行一个任务。
        为了处理异步操作，js采用事件循环（Event Loop）机制来处理，
        并维护了两个主要的任务队列：微任务队列和宏任务队列。
        这种机制确保了在执行代码时，有效处理异步事件而不阻塞主线程。

            任务队列类型（按执行优先级来排列）：
            1.主线程：js代码的执行从主线程开始，一开始将代码推入执行栈。
            2.微任务队列：
                · 微任务队列通常包括Promise的回调和MutationObserver的回调。
                · 微任务队列在主线程的当前任务执行完毕后会立即进行处理。微任务可以由当前任务引发，并可以导致新的微任务加入。
            3.宏任务：
                · 宏任务包括setTimeout、setInterval的回调和I/O操作等。
                · 宏任务的执行是在当前执行栈和所有微任务完成后才会进行的。
        
        // 注意：无论是微任务还是宏任务产生的同步任务，其优先级都是最高的，都会阻塞当前非同步任务的执行。
        */
        setTimeout(()=>{
            console.log('宏任务执行！');
        },100);

        vueFileObject[key]().then((mod)=>{
            console.log(key,mod);
        });
        
        console.log('pending');
    }

    // console.log('lostAndFoundInfo',keyValuesArr);
};

</script>

<template>
    <div class="lost-and-found-info">

        <h1>个人失物招领管理</h1>
        <span>测试</span>
        <button @click="handleImport" type="button">导入测试</button>
    </div>

</template>

<style scoped>
.lost-and-found-info{
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 20px;
}
h1{
    color: rgb(38, 208, 75);
    font-size: 50px;
}


span{
    font-size: 40px;
    color: #008c8c;
}
</style> 