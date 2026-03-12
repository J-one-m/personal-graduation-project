<script setup>
import {ref,reactive} from 'vue'
import router from '@/router/router';
import useRouterStore from '@/stores/useRouterStore';
import axiosInstance from '@/api/axios'
import { apiConfig} from '@/config/apiConfig';
import defaultAvatar from '../../src/assets/images/user.jpg'

defineOptions({
    name:'Login',
});


const {state,addRoutes,updateToken} = useRouterStore();//解构（也可以重命名）

const loginInfo = reactive({
    user_account:'',
    password:'',
})


const handleLogin = async()=>{
   try{
        // console.log(loginInfo);
        const data = await axiosInstance.post(apiConfig.login,loginInfo);
        if(data.code === 200){
            state.menuList = data.data.menuList;//根据登录身份返回对应的路由信息
            state.userInfo = data.data.userInfoData;//根据后端登录身份返回与用户相关的信息
            // 为头像设置默认值，若没有值的话
            if(!state.userInfo.user_image){
                state.userInfo.user_image = defaultAvatar;
            }
            console.log('@login.vue',state.userInfo.username);
            // 登陆成功后，将取到的路由持久化存储
            localStorage.setItem('menuList',JSON.stringify(state.menuList));//此处后续还需要根据登录身份作判断，清空前一个登录身份的路由信息
            localStorage.setItem('userInfo',JSON.stringify(state.userInfo));

            updateToken(data.data.token);

            await addRoutes();//为异步函数，但下面的replace方法会同步执行//多余？
            // 根据角色动态跳转
            const targetPath = state.userInfo.role === 'admin' ? '/adminLayout' : '/appLayout';
            router.replace(targetPath);
        }else{
            console.log('用户或密码错误');
        }
    }catch(error){
        if(error.response && error.response.status === 401){
            console.error("登陆失败：",error.response.data.msg);
            alert(error.response.data.msg);//向用户显示错误提示
        }else{
            console.error('请求失败：',error);
            alert("网络请求失败，请稍后再试。");//后续弹窗用组件实现
        }
    }
}

</script>

<template>
    <div class="login">
        <div class="loginForm">
            <div class="title"><h1>欢迎登录</h1></div>
            <!-- submit为表单的提交事件，其中prevent为阻止其默认行为 -->
            <form @submit.prevent="handleLogin">
                <div class="username">
                    <!-- label（标签、标记）增强用户体验。for属性与id属性相关联，required属性表示必填 -->
                    <label for="user_account">账号：</label>
                    <input type="text" id="user_account" required placeholder="请输入账号" v-model="loginInfo.user_account">
                </div>
                <div class="password">
                    <label for="password">密码：</label>
                    <!-- autocomplete="username"字段的意义？？？ -->
                    <input type="password" id="password" required placeholder="请输入密码" v-model="loginInfo.password" autocomplete="username">
                </div>
                <div class="button">
                    <button type="button">注册</button>
                    <button type="submit">登录</button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
    .login{
        color: #fff;
        height: 100%;
        width: 100%;
        background-color: antiquewhite;
        background-image: url('../assets/images/image.png');
        background-size: cover;
        background-origin: border-box;
        /* 第一个为水平方向，第二个为垂直方向 */
        background-position: center top;
        background-repeat: no-repeat;
        position: relative;
    }
    .loginForm{
        padding: 0px 25px 20px 0px;
        border: 1px solid #fff;
        width:400px;
        height: 300px;
        border-radius: 10px;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%,-65%);
        /* box-sizing: border-box; */
    }
    .title{
        height: 20%;
        font-size: 50px;
        text-align: center;
        margin-top: 20px;
        /* 设置文字间隙 */
        letter-spacing: 5px;
    }
    .loginForm form{
        height: 100%;
        width: 100%;
        display: grid;
        grid-template-rows: 30% 30% 20%;
        grid-template-columns: 90%;
        justify-content: center;

    }
    .username{
        font-size: 25px;
        display: flex;
        align-items: center;
        justify-content:end;
        margin-bottom: -30px;
    }
    .password{
        font-size: 25px;
        display: flex;
        align-items: center;
        justify-content: end;
    }
    input{
        /* margin-left: 20px; */
        height: 30px;
        width: 220px;
        color: lightblue;
        font-size: 20px;
        /* background-color: rgba(240, 240, 240,0); */
        border: 1px solid rgba(173, 216, 230,0.7);
        outline: none; /* 去掉默认的轮廓 */
        appearance: none; /* 禁用默认样式 */
        background-color: transparent;
    }

    /* 利用伪类来设置输入框聚焦后的样式 */
    /* outline用于设置聚焦轮廓 */
    /* box-shadow添加阴影：box-shadow: h-offset v-offset blur-radius spread-radius color inset; */
    /* 此处有一个浏览器自动填充行为会修改输入框背景色的问题！！！ */
    input:focus{
        color:lightblue;
        outline:none;
        /* 若在阴影中最后一个参数上添加inset 则为内嵌阴影*/
        box-shadow: 0 0 15px 5px rgba(163, 189, 216, 0.8);
        background-color: transparent;
    }

    /* 通过::placeholder来设置输入框默认值的颜色 */
    input::placeholder{
        color:rgba(173, 216, 230,0.7);
    }

    .button{
        /* margin-top: 30px; */
        /* width: 100px; */
        display: flex;  
        justify-content: space-evenly;
        align-items: center;
    }
    .button button{
        color: lightblue;
        width: 70px;
        height: 30px;
        border-radius: 5px;
        /* background-color: rgba(0, 255, 255,0.8); */
        border:1px solid lightblue;
        background-color :transparent;
    }

</style>