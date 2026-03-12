import { defineStore } from "pinia";
import { reactive } from "vue";
import router from "@/router/router";


const useRouterStore = defineStore('useRouterStore',()=>{
    const state = reactive({
        menuList:[],//存放根据登录身份获取到的路由信息。
        routeArr:[],
        token:'',
 
        userInfo:{},
        routesAdded:false,
    })



    async function addRoutes(){

        const module = await import.meta.glob('@/views/**/*.vue');//懒加载views目录下的所有vue组件

        // const menu = state.menuList;
        // menu.forEach((menuItem)=>{
        //     // 对子路由作处理
        //     if(menuItem.children){
        //         const children = menuItem.children;
        //         children.forEach((val)=>{
        //             // 将读取到的子路由整理成对象。
        //             const childrenArr = {
        //                 ...val,
        //                 component:module[`/src/views${val.url}.vue`],
        //             };
        //             console.log("@@@children",childrenArr);
        //             state.routeArr.push(childrenArr);
        //         });

        //     }else{
        //         const parent = {
        //             ...menuItem,
        //             component:module[menuItem.url],
        //         };
        //         state.routeArr.push(parent);
        //     }
        // });

        // 遍历后端返回的menuList
        
        // 利用递归来解决层级问题
        const processRoutes = (menuItems)=>{
            return menuItems.map(item=>{
                const route = {
                    path:item.path,
                    name:item.name,
                    component:module[`/src/views${item.url}.vue`],
                    meta:{
                        label:item.label,
                    },
                };

                if(item.children && item.children.length > 0 ){
                    route.children = processRoutes(item.children);
                };

                return route;            
            });
        }

        const routesToAdd= processRoutes(state.menuList);
        //现行函数仅能处理层级为2的路由，不能处理任意层级的路由列表
        // const routesToAdd = state.menuList.map((menuItem)=>{        
        //     // 判断是否有子集路由
        //     if(menuItem.children && menuItem.children.length > 0)
        //     {               
        //         // 如果有子集路由
        //         const children = menuItem.children.map(child=>{
        //             // console.log('Module keys:', Object.keys(module));
        //             // console.log('Trying to load component for path:', `/src/views${child.url}.vue`);
        //             // console.log('Component found:', module[`/src/views${child.url}.vue`]);               
        //             return {
        //             // 此处是否直接用展开运算符更好？
        //             path:child.path,
        //             name:child.name,
        //             component:module[`/src/views${child.url}.vue`],
        //             meta:{//其它数据
        //                 label:child.label,
        //             },
        //         }});
        //         return {
        //             path:menuItem.path,
        //             name:menuItem.name,
        //             component:module[`/src/views${menuItem.url}.vue`],
        //             meta:{
        //                 label:menuItem.label,
        //             },
        //             children,               
        //         }
        //     }else{
        //         // 无子路由时
        //         return{
        //             path:menuItem.path,
        //             name:menuItem.name,
        //             component:module[`/src/views${menuItem.url}.vue`],
        //             meta:{
        //                 label:menuItem.label,
        //             },
        //         }
        //     };
        // });

        console.log("@routesToAdd",routesToAdd);//测试用

        // 批量动态注册路由
        routesToAdd.forEach(route=>{
            router.addRoute(route);
        });


        state.routesAdded = true;
    }



    const updateToken = (token)=>{
        state.token = token;//更新token
        localStorage.setItem('token',state.token);
    }

    const cleanToken = ()=>{//当token失效时清理token以及重置相关数据
        localStorage.removeItem('token');//此时清空token，以及将pinia中的相关数据重置。
        state.token = '';//将pinia中的token信息清空
        state.menuList = [];
        state.routeArr = [];

        // new add
        state.userInfo = {};
        localStorage.removeItem('userInfo');
        localStorage.removeItem('menuList');
        state.routesAdded = false;
    }

    // 初始化函数，用于从localStorage中加载数据
    const initializeStore = async ()=>{
        const storedUserInfo = localStorage.getItem('userInfo');
        if(storedUserInfo){
            state.userInfo = JSON.parse(storedUserInfo);
        }

        const storedToken = localStorage.getItem('token');
        if(storedToken){
            state.token = storedToken;
        }



        if (state.token && !state.routesAdded) {//
                const storedMenuList = localStorage.getItem('menuList');
                if (storedMenuList) {
                    state.menuList = JSON.parse(storedMenuList);
                    await addRoutes(); // 等待动态路由加载
                    state.routesAdded = true;
                }
            }
    }


// 利用return将外部需要用到的数据交出去。
    return {
        state,
        addRoutes,
        updateToken,
        cleanToken,
        initializeStore,
    };
});

export default useRouterStore;