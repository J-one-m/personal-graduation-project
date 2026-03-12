
import { createApp } from 'vue'
import "./assets/style/index.css"//引入重置样式文件
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import router from './router/router'
import App from './App.vue'
import useRouterStore from './stores/useRouterStore'

// import 'default-passive-events'
// npm uninstall default-passive-events（可删掉）
const app = createApp(App)





app.use(createPinia())


const {initializeStore} = useRouterStore();
await initializeStore();//在应用启动时初始化需要用到的数据。
// console.log(1);//测试用



app.use(router)
// console.log(2)
// // 确保在挂载应用前，调用 pinia.use()
// // 传递 pinia 实例给 router
// router.isReady().then(() => {
//   app.mount('#app');
// });
app.mount('#app');
