import Login from "@/views/Login.vue";//与之前的动态导入冲突（使用vite工具打包时）
// 静态导入会覆盖动态导入的效果。 一旦一个模块被静态导入，它就会被包含在主 JavaScript 文件中，导致动态导入创建独立分块的目的无法实现。
import { createRouter,createWebHashHistory } from "vue-router";
import useRouterStore from "@/stores/useRouterStore";
import { isTokenExpired } from "@/utils/token";


const router = createRouter({
    history:createWebHashHistory(),
    routes:[
        {
            path:'/login',
            name:'login',
            // component:Login,
            component:()=>import('@/views/Login.vue'),
        },
        {
            path:'/adminLayout',
            name:'adminLayout',
            component:()=> import('@/views/layouts/AdminLayout.vue'),
            meta: { requiresAuth: true, role: 'admin' }, // 标记：需要登录且必须是管理员
            children:[
                {
                    path:'userManage',
                    name:'userManage',
                    component:()=> import('@/views/admin/user-manage.vue'),
                },
                {
                    path:'createUsers',
                    name:'createUsers',
                    component:()=> import('@/views/admin/create-users.vue'),
                },
                {
                    path:'checkAffiche',
                    name:'checkAffiche',
                    component:()=> import('@/views/admin/check-affiche.vue'),
                },
                {
                    path:'issueAffiche',
                    name:'issueAffiche',
                    component:()=> import('@/views/admin/issue-affiche.vue'),
                },
                {
                    path:'lossProcessing',
                    name:'lossProcessing',
                    component:()=> import('@/views/admin/loss-processing.vue'),
                },
                {
                    path:'placeManage',
                    name:'placeManage',
                    component:()=> import('@/views/admin/place-manage.vue'),
                },
                {
                    path:'placeServiceCondition',
                    name:'placeServiceCondition',
                    component:()=> import('@/views/admin/place-service-condition.vue'),
                },
                {
                    path:'publishReview',
                    name:'publishReview',
                    component: ()=> import('@/views/admin/publish-review.vue'),
                },
                {
                    path:'adminSetting',
                    name:'adminSetting',
                    component: ()=> import('@/views/admin/admin-setting.vue'),
                },
            ],
        },
        {
            path:'/',
            // redirect:'/login',//指定重定向的路径
            redirect:{name:'login'},//也可以用name属性来重定向路径
        },
        {
            // 匹配任何路径
            path: '/:pathMatch(.*)*', 
            name: 'NotFound',
            component: () => import('@/views/NotFound.vue') // 创建一个简单的404组件
        },
    ],
});

// router.beforeEach((to, from, next) => {
//     const routerStore = useRouterStore();
//     const { token, userInfo } = routerStore.state;
//     const isLoginPage = to.path === '/login';
//     const tokenIsExpired = token ? isTokenExpired(token) : true;
    
//     if (token && tokenIsExpired && !isLoginPage) {//token存在且token已失效且导航的页面不是login页面
//         routerStore.cleanToken();
//         next('/login');
//     } else if (!token && !isLoginPage) {//token不存在且导航的不是login页面
//         next('/login');
//     } else {//否则放行
//         next();
//     }
// });

// router.beforeEach((to, from, next) => {
//     const routerStore = useRouterStore();
//     const { token, userInfo } = routerStore.state;
//     const isLoginPage = to.path === '/login';

//     // 1. 未登录处理
//     if (!token && !isLoginPage) {
//         return next('/login');
//     }

//     // 2. 权限校验
//     if (token) {
//         // 如果页面要求 admin 权限，但用户角色不符
//         if (to.meta.role === 'admin' && userInfo.role !== 'admin') {
//             alert('您没有权限访问管理员后台！');
//             return next('/appLayout'); // 踢回普通用户主页
//         }
//     }

//     next();
// });

router.beforeEach(async (to, from, next) => {
    const routerStore = useRouterStore();
    const { token, userInfo } = routerStore.state;
    const isLoginPage = to.path === '/login';

    // 未登录处理
    if (!token) {
        if (isLoginPage) {
            return next(); // 没 Token 去登录页，放行
        } else {
            return next('/login'); // 没 Token 想去别处，踢回登录
        }
    }

    // Token过期校验
    const tokenIsExpired = isTokenExpired(token);
    if (tokenIsExpired && !isLoginPage) {
        routerStore.cleanToken(); // 清除本地缓存和状态
        alert('登录已过期，请重新登录');
        return next('/login');
    }

    // 管理员权限越权校验
    // 假设在router.js中给管理员路由配置了meta: { role: 'admin' }
    const isAdminRoute = to.matched.some(record => record.meta.role === 'admin');
    if (isAdminRoute && userInfo.role !== 'admin') {
        alert('权限不足，无法进入管理后台');
        // 如果是普通用户越权，踢回他的主页；如果是未定义角色，踢回登录
        return next(userInfo.role === 'user' ? '/appLayout' : '/login');
    }

    // 已登录用户禁止跳回登录页
    if (isLoginPage && token && !tokenIsExpired) {
        return next(userInfo.role === 'admin' ? '/adminLayout' : '/appLayout');
    }

    // 所有的关卡都过了，放行
    next();
});


export default router;//创建的router为路由器（用来管理项目中的一个个路由）
