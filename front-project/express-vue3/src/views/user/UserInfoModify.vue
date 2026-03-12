<script setup>
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';
import useRouterStore from '@/stores/useRouterStore';
import { ElMessage } from 'element-plus';
import { onMounted, ref } from 'vue';
defineOptions({
    name:'UserInfoModify',
});

const date = new Date();
const {state} = useRouterStore();

// 1、状态控制
const activeTab = ref('basic');//用于切换：basic(基本资料), password(修改密码)
const selectAreaShow = ref(false); 
const fileData = ref(null);


// 2、表单响应式数据
const nickName = ref('');
const gender = ref('');
const age = ref('');
const mailbox = ref('');
const address = ref('');
const phoneNumber = ref('');

const previewUrl = ref(''); // 用于存储本地预览地址

// 密码修改表单
const passwordForm = ref({
    oldPwd: '',
    newPwd: '',
    confirmPwd: ''
});

// const selectAreaShow = ref(false);
// const nickName = ref(null);
// const gender = ref(null);
// const age = ref(null);;
// const mailbox = ref(null);
// const address = ref(null);
// const fileData = ref(null);
// const currentAvatarUrl = ref(defaultAvatar);//用于存储用户头像路径
// const activeTab = ref('basic');

// 定义基础信息渲染数组
const infoArr = [
    { key: 'nickName', label: '昵称', ref: nickName, current: state.userInfo.username },
    { key: 'gender', label: '性别', ref: gender, current: state.userInfo.gender },
    { key: 'age', label: '年龄', ref: age, current: state.userInfo.age },
    { key: 'mailbox', label: '邮箱', ref: mailbox, current: state.userInfo.mailbox },
    { key: 'address', label: '住址', ref: address, current: state.userInfo.address },
    { key: 'phone_number', label: '联系电话',ref: phoneNumber, current: state.userInfo.phone_number }
];

// const infoArr = [
//     ['nickName','昵称',state.userInfo.username,nickName],
//     ['gender','性别',state.userInfo.gender,gender],
//     ['age','年龄',state.userInfo.age,age],
//     ['mailbox','邮箱',state.userInfo.mailbox,mailbox],
//     ['address','住址',state.userInfo.address,address],
// ];

// 逻辑处理

// 修改基本信息
const handleModifyInfo = async () => {
    try {
        const result = await axiosInstance.post(apiConfig.userInfoModify, {
            nickName: nickName.value || state.userInfo.username,
            gender: gender.value || state.userInfo.gender,
            age: age.value || state.userInfo.age,
            mailbox: mailbox.value || state.userInfo.mailbox,
            address: address.value || state.userInfo.address,
            phoneNumber: phoneNumber.value || state.userInfo.phone_number,
        });

        if (result.code === 200) {
            const { data, code } = await axiosInstance.get(apiConfig.updateUserData);
            if (code === 200) {
                state.userInfo = data;
                localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
                resetData();
                ElMessage.success('信息修改成功');
            }
        }
    } catch (error) {
        console.error('修改失败', error);
    }
};


// 修改密码
const handleModifyPassword = async () => {
    // 1. 拦截校验
    if (!passwordForm.value.oldPwd || !passwordForm.value.newPwd) {
        return ElMessage.warning('请填写完整信息！');
    }
    if (passwordForm.value.newPwd !== passwordForm.value.confirmPwd) {
        return ElMessage.error('两次新密码输入不一致！');
    }
    try{
        const {code, msg} = await axiosInstance.patch(apiConfig.updateUserPassword,{
            newPassword:passwordForm.value.newPwd,
            oldPassword:passwordForm.value.oldPwd,
        });
        if(code === 200){
            ElMessage.success(msg || '密码修改成功！');
            // 重置表单
            resetData();
        }
    }catch(error){

    };
};


// 取消修改，并将相关信息置空
const resetData = () => {
    nickName.value = '';
    gender.value = '';
    age.value = '';
    mailbox.value = '';
    address.value = '';
    passwordForm.value = { oldPwd: '', newPwd: '', confirmPwd: '' };
};


// 头像上传逻辑
const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        // 校验文件大小
        if (file.size > 3 * 1024 * 1024) {
            return ElMessage.warning('图片大小不能超过 3MB');
        }
        fileData.value = file;
        // 创建本地预览 URL
        previewUrl.value = URL.createObjectURL(file);
    }
};
// 定义真正的上传逻辑函数
const performUpload = async () => {
    if (!fileData.value) return;
    try {
        const formData = new FormData();
        formData.append('avatar', fileData.value);
        
        // 发送请求
        const result = await axiosInstance.post(apiConfig.storagePicture, formData);
        
        // 更新状态 (注意：根据你后端的返回字段调整，假设返回的是 avatarUrl)
        state.userInfo.user_image = result.avatarUrl || result.data.avatarUrl;
        
        // 同步到本地存储
        localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
        
        ElMessage.success('头像上传成功');
        selectAreaShow.value = false;
        return true;
    } catch (error) {
        console.error('上传失败', error);
        ElMessage.error('头像上传失败');
        return false;
    }
};

// 调用的点击函数
const uploadFile = async () => {
    const success = await performUpload();
    if (success) {
        previewUrl.value = ''; // 上传成功后清空预览
        fileData.value = null; // 清空文件对象
    }
};

// 修改取消逻辑
const handleCancelUpload = () => {
    selectAreaShow.value = false;
    fileData.value = null;
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value); // 释放内存
        previewUrl.value = '';
    }
};


// 处理用户修改信息，发送请求，对于为空的项不予处理
// const handleMdifyInfo = async()=>{
//     try{
//         const result = await axiosInstance.post(apiConfig.userInfoModify,{
//             // user_account:state.userInfo.account,
//             nickName:nickName.value,
//             gender:gender.value,
//             age:age.value,
//             mailbox:mailbox.value,
//             address:address.value,
//         });
//         // console.log('userInfo',result);
//         if(result.code === 200){
//             const {data,code} = await axiosInstance.get(apiConfig.updateUserData,null);
//             if(code === 200){
//                 // 若code正确，则更新state.userInfo的值，以及将存储在浏览器中的用户信息也更新
//                 state.userInfo = data;
//                 localStorage.setItem('userInfo',JSON.stringify(state.userInfo));
//                 // 只有当修改成功且更新数据后才重置表单
//                 resetData();
//             }else{
//                 // console.log('返回的数据有问题！');
//             };
//         }
//     }catch(error){
//         // console.error('修改失败',error);
//     };
// };



// const changeAvatar = async()=>{//更换头像
//     selectAreaShow.value = true;    
// };

// const uploadFile = async()=>{//文件上传（将用户选择的文件传输给后端存储起来）
//     if(!fileData.value){
//         return console.log('请选择一张作为头像的图片！');//后续采用弹窗组件实现
//     }

//     try{
//         const formData = new FormData();
//         formData.append('avatar',fileData.value);
//         // formData.append('userAccount',state.userInfo.account);
//         const data = await axiosInstance.post(apiConfig.storagePicture,formData);
//         // 当用户更换头像时，后端应该返回用户更换后的头像完整访问路径，并及时更新数据库中的该字段
//         // 删除服务器中旧的资源（待实现）（若是有头像历史功能，可以决定不删除）
//         state.userInfo.user_image = data.avatarUrl;

//         // console.log('userInfoModify.vue',data.avatarUrl);
//     }catch(error){
//         console.error({
//             time: date.toLocaleString(),
//             where: 'userInfoModify.vue@uploadFile',
//             stack: error.stack,
//         });
//     }

//     // console.log('userInfoModify.vue',fileData.value);
//     selectAreaShow.value = false;
// };



onMounted(()=>{
    console.log('userInfoModify.vue',state.userInfo.user_image);
});
</script>

<template>
    <div class="modify-container">
        <div class="tab-nav">
            <div 
              :class="['tab-item', { active: activeTab === 'basic' }]" 
              @click="activeTab = 'basic'"
            >
                基本信息修改</div>
            <div 
              :class="['tab-item', { active: activeTab === 'password' }]" 
              @click="activeTab = 'password'"
            >
                修改登录密码
            </div>
        </div>

        <div class="tab-content">
            <div class="account-display">
                <label class="text">当前登录账号：</label>
                <span class="readonly-value">{{ state.userInfo.user_account }}</span>
                <!-- <span class="lock-icon">🔒 系统唯一标识</span> -->
            </div>

            <hr class="divider">

            <div v-if="activeTab === 'basic'" class="panel">
                <div class="avatar-edit-box">
                    <img :src="state.userInfo.user_image" alt="avatar" class="preview-img">
                    <button @click="selectAreaShow = true" class="btn-mini">更换头像</button>
                </div>

                <div class="info-form">
                    <div v-for="item in infoArr" :key="item.key" class="form-item">
                        <label class="text">{{ item.label }}：</label>
                        <input 
                            type="text" 
                            v-model="item.ref.value" 
                            :placeholder="'当前: ' + item.current"
                        >
                    </div>
                </div>

                <div class="btn-group">
                    <button class="btn-cancel" @click="resetData">取消</button>
                    <button class="btn-submit" @click="handleModifyInfo">保存资料</button>
                </div>
            </div>

            <div v-if="activeTab === 'password'" class="panel">
                <div class="info-form">
                    <div class="form-item">
                        <label class="text">原密码：</label>
                        <input type="password" v-model="passwordForm.oldPwd" placeholder="请输入当前密码">
                    </div>
                    <div class="form-item">
                        <label class="text">新密码：</label>
                        <input type="password" v-model="passwordForm.newPwd" placeholder="6-18位字母数字组合">
                    </div>
                    <div class="form-item">
                        <label class="text">确认新密码：</label>
                        <input type="password" v-model="passwordForm.confirmPwd" placeholder="请再次输入新密码">
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn-submit" @click="handleModifyPassword">提交修改</button>
                </div>
            </div>
        </div>

        <div v-if="selectAreaShow" class="modal-overlay" @click.self="selectAreaShow = false">
            <div class="modal-box">
                <div class="modal-header">
                    <h3>更换头像</h3>
                    <button class="close-icon" @click="selectAreaShow = false">×</button>
                </div>
                
                <div class="upload-area" :class="{ 'has-file': fileData }">
                    <input 
                        id="avatarInput"
                        type="file" 
                        accept="image/*" 
                        @change="onFileChange"
                        class="hidden-input"
                    >
                    <label for="avatarInput" class="upload-label">
                        <div v-if="!previewUrl" class="upload-placeholder">
                            <span class="plus-icon">+</span>
                            <p>点击或拖拽图片到此处</p>
                            <span class="hint">支持 JPG, PNG, GIF (最大 2MB)</span>
                        </div>
                        <div v-else class="upload-preview">
                            <img :src="previewUrl" alt="预览图">
                            <div class="change-mask">更换图片</div>
                        </div>
                    </label>
                </div>

                <div class="modal-footer">
                    <button class="btn-cancel" @click="handleCancelUpload">取消</button>
                    <button 
                        class="btn-primary" 
                        :disabled="!fileData" 
                        :class="{ 'btn-disabled': !fileData }"
                        @click="uploadFile"
                    >
                        开始上传
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modify-container{
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* Tab导航 */
.tab-nav {
    display: flex;
    gap: 20px;
    border-bottom: 2px solid rgba(78, 245, 162, 0.2);
    margin-bottom: 20px;
}
.tab-item {
    padding: 10px 20px;
    cursor: pointer;
    font-weight: bold;
    color: #464646;
    transition: 0.3s;
    position: relative;
}
.tab-item.active {
    color: #f2eded;
}
.tab-item.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background: #4ef5a2;
}

/* 内容布局 */
.tab-content {
    padding: 0 15px 10px 15px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.account-display {
    margin-bottom: 15px;
    font-size: 15px;
}
.text{
    color: #1f1d1d;
}
.readonly-value {
    font-weight: bold;
    color: #444;
    background: #f0f0f0;
    padding: 2px 8px;
    border-radius: 4px;
}
.lock-icon {
    font-size: 12px;
    color: #999;
    margin-left: 10px;
}

.divider {
    border: none;
    border-top: 1px solid #eee;
    margin-bottom: 20px;
}

.panel{
    flex: 1;
    display: flex;
    flex-direction: column;
}

/* 头像预览 */
.avatar-edit-box {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 30px;
}
.preview-img {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #4ef5a2;
}

/* 表单样式 */
.info-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-width: 400px;
}
.form-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.form-item label {
    width: 100px;
    font-weight: 500;
}
.form-item input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    outline: none;
}
.form-item input:focus {
    border-color: #4ef5a2;
}

/* 按钮组 */
.btn-group {
    flex: 1;
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 30px;
}
button {
    display: flex;
    align-items: center;
    justify-content: center; /* 统一居中 */
    height: 36px; /* 稍微增加高度提升手感 */
    cursor: pointer;
    padding: 8px 24px;
    border-radius: 6px;
    border: none;
    transition: 0.2s;
    font-size: 14px;
}
.btn-mini { padding: 4px 12px; background: #eee; font-size: 12px; }
.btn-submit { background: #4ef5a2; color: white; font-weight: bold; }
.btn-submit:hover { background: #42d88d; }
.btn-cancel { background: #d6e0eb; color: #666; }

/* 弹窗样式 */
/* 弹窗遮罩层 */
.modal-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px); /* 增加背景模糊，更有高级感 */
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
    transition: all 0.3s;
}

/* 弹窗主体 */
.modal-box {
    background: rgba(255, 255, 255, 0.95);
    padding: 24px;
    border-radius: 20px;
    width: 360px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    gap: 20px;
    animation: modalShow 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

@keyframes modalShow {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

/* 弹窗标题栏 */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.modal-header h3 { margin: 0; color: #333; font-size: 1.2rem; }
.close-icon {
    background: none; border: none; font-size: 24px; color: #999;
    padding: 0; width: auto; height: auto; line-height: 1;
}

/* 上传核心区域 */
.upload-area {
    border: 2px dashed #ddd;
    border-radius: 15px;
    height: 200px;
    position: relative;
    transition: all 0.3s;
    overflow: hidden;
}
.upload-area:hover {
    border-color: #4ef5a2;
    background: rgba(78, 245, 162, 0.05);
}
.hidden-input { display: none; }

.upload-label {
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    cursor: pointer;
}

/* 占位文本样式 */
.upload-placeholder { text-align: center; color: #999; }
.plus-icon { font-size: 40px; color: #ccc; margin-bottom: 8px; display: block; }
.hint { font-size: 12px; color: #bbb; margin-top: 4px; }

/* 预览图样式 */
.upload-preview {
    width: 100%; height: 100%;
    position: relative;
}
.upload-preview img {
    width: 100%; height: 100%;
    object-fit: cover;
}
.change-mask {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.4);
    color: white; display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: 0.3s;
}
.upload-preview:hover .change-mask { opacity: 1; }

/* 底部按钮 */
.modal-footer {
    display: flex; gap: 12px;
}
.modal-footer button { flex: 1; justify-content: center; }
.btn-primary{
    background-color: #4ef5a2;
    /* font-weight: bold; */
}
.btn-primary.btn-disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none !important;
}
</style>