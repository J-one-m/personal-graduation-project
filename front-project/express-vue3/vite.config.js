import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vueDevTools from 'vite-plugin-vue-devtools'
import path, { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // vite构建工具插件部分：
  // 插件配置
  plugins: [
    vue(),
    // vueDevTools(),
    AutoImport({
      resolvers:[ElementPlusResolver()],
    }),
    Components({
      resolvers:[ElementPlusResolver()],
    }),
  ],


  // 解析配置
  resolve: {
    alias: {
      // 取别名
      /* 
        1.第一种 (使用 import.meta.url) 是最符合现代 Vite/ESM 规范的推荐写法。
        2.第二种 (使用 path.resolve 和 __dirname) 是传统且兼容的写法。
        3.第三种 (直接使用 resolve) 无法直接工作，除非手动导入了与 path.resolve 功能相同的函数。
      */
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // '@':path.resolve(__dirname,'src'),
      // '@':resolve(__dirname,'src'),
    },
  },

  
  // // 服务器配置
  // server:{
  //   proxy:{
  //     // 代理配置
  //   }
  // } ,


  // 构建配置
  build:{
    // 构建选项
  }
})


