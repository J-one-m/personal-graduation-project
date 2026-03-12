import axios from "axios";
import { apiBaseUrl,timeOut } from "@/config/apiConfig";
import useRouterStore from "@/stores/useRouterStore";
import { ElMessage } from "element-plus";
// instance（实例，例子），通过create方法自定义一个axios实例
const axiosInstance = axios.create({
    baseURL:apiBaseUrl,
    timeout:timeOut,
});

// 以下为配置请求拦截器以及响应拦截器
// axiosInstance.interceptors.request.use(()=>{

// });

axiosInstance.interceptors.request.use(
    (config) => {
        const routerStore = useRouterStore();
        // 优先从Pinia内存读取，刷新页面后则从本地存储读取
        const token = routerStore.state.token || localStorage.getItem('token');

        if (token) {
            // 严格遵守Bearer规范（注意空格）
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use((response)=>{
    return response.data;


},(error)=>{
    // console.error(error);

    // 拦截业务错误 (400, 403, 409 等)
    if (error.response) {
      const { status, data } = error.response;
      
      // 只有在非超时的情况下才弹出业务消息
      if (status !== 408 && status !== 504) {
         // 这里可以统一根据后端返回的 msg 弹窗
         ElMessage.error(data.msg || '系统异常！');
      }
      
      // 返回一个正常的 Promise resolve，或者带信息的 reject
      // 如果不想让外层的 try...catch 捕获到“红字”异常，甚至可以 return Promise.resolve(data);
      // 但通常建议返回 Promise.reject，只是在业务代码里不打印它。
      return Promise.reject(data); 
    }



    // 处理超时
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({ msg: '请求超时，请重试' });
    }
    return Promise.reject(error);
});


export default axiosInstance;