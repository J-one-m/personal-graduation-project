<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { IconBell, IconUser, IconLock, IconPlus } from '@/config/adminIcons';
import useRouterStore from '@/stores/useRouterStore';
import { apiBaseUrl, apiConfig } from '@/config/apiConfig';
import axiosInstance from '@/api/axios';
import checkPictureInfo from '@/utils/beforeAvatarUpload';

defineOptions({
    name: 'AdminSetting',
});

const {state} = useRouterStore();
const {userInfo} = state;//无响应式
// 状态控制
const activeTab = ref('profile'); // 控制当前激活的标签页

// 表单数据：严格对应数据库字段
const profileForm = reactive({
    id: '',             // 极其重要：修改接口需要 ID
    account: '', 
    username: '',
    mailbox: '',
    phone_number: '',
    user_image: '',
    role: '',
});


// 安全设置表单
const passwordForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
});

// 消息通知开关
const noticeSettings = reactive({
    systemNotice: true,
    auditNotice: true
});



// 逻辑处理

// 检查图片
const beforeAvatarUpload = (rawFile)=>{
    const result = checkPictureInfo(rawFile);
    if (!result.valid) {
        ElMessage.error(result.msg);
        return false; // 拦截上传
    }
    return true; // 允许上传        
};

// 图片上传
const handleAvatarSuccess = async(response)=>{
    if(response.code === 200){
        profileForm.user_image = response.data;
        ElMessage.success('图片上传成功，点击保存后生效！');
    }else{
        ElMessage.error(response.msg || '上传失败，后端逻辑错误！');
    };
    
};

// 保存个人资料
const saveProfile = async () => {
    console.log('@',state.userInfo);
    try {
        const res = await axiosInstance.patch(apiConfig.modifyAdminInfo, {
            id: profileForm.id,
            adminName: profileForm.username, // 对应后端接口字段名
            mailbox: profileForm.mailbox,
            phone_number: profileForm.phone_number,
            user_image: profileForm.user_image
        });

        if (res.code === 200) {

            ElMessage.success('同步数据库成功！');
            
            // 重要：后端修改成功后，必须同步更新 Pinia
            // 这样侧边栏、顶栏的头像和名字才会变
            state.userInfo = { ...state.userInfo, ...profileForm };
            
            // 之后手动更新一次缓存，确保刷新页面后也是最新的
            localStorage.setItem('userInfo', JSON.stringify(state.userInfo));
        }
    } catch (error) {
        ElMessage.error('更新失败');
    }
};

// 修改密码
const updatePassword = async() => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
        return ElMessage.warning('密码字段不能为空');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        return ElMessage.error('两次输入的新密码不一致');
    }
    
    try{
        const { code, msg} = await axiosInstance.patch(apiConfig.modifyAdminPassword,{
            id: profileForm.id,
            oldPassword: passwordForm.oldPassword,
            newPassword: passwordForm.newPassword,
        });

        if(code === 200){

            ElMessage.success(msg || '密码修改成功！');
            // 重置表单
            passwordForm.oldPassword = '';
            passwordForm.newPassword = '';
            passwordForm.confirmPassword = '';
        }
    }catch(error){
        if (error.response) {
            // 获取后端返回的错误消息，如果没有则显示默认值
            const errorMsg = error.response.data.msg || '请求参数错误或原密码不正确';
            ElMessage.error(errorMsg);
        } else {
            // 其他错误（如 500 或网络问题）
            ElMessage.error(error.message || '系统繁忙，请稍后再试');
        }
    }
};


// 初始化：模拟从数据库加载数据
onMounted(() => {

    Object.assign(profileForm, userInfo);

});
</script>

<template>
    <div class="setting-container">
        <el-card class="setting-card" shadow="never">
            <el-tabs v-model="activeTab" class="setting-tabs">
                
                <el-tab-pane name="profile">
                    <template #label>
                        <span class="custom-tab-label">
                            <el-icon><IconUser /></el-icon>
                            <span>身份资料</span>
                        </span>
                    </template>
                    
                    <div class="tab-content">
                        <div class="avatar-section">
                            <el-upload
                                class="avatar-uploader"
                                :action="apiBaseUrl + apiConfig.uploadAdminAvatar"
                                :show-file-list="false"
                                :on-success="handleAvatarSuccess"
                                :before-upload="beforeAvatarUpload"
                                name="adminAvatar" 
                            >
                                <img v-if="profileForm.user_image" :src="profileForm.user_image" class="avatar-preview" />
                                <el-icon v-else class="avatar-uploader-icon"><IconPlus /></el-icon>
                                
                                <div class="avatar-mask">
                                    <el-icon><IconUser /></el-icon>
                                    <span>点击更换</span>
                                </div>
                            </el-upload>
                            
                            <div class="role-badge">
                                <el-tag size="small" effect="dark" type="danger">
                                    {{ profileForm.username }}
                                </el-tag>
                            </div>
                            <p class="upload-tip">支持 JPG、PNG 格式，小于 2MB</p>
                        </div>


                        <el-form :model="profileForm" label-position="top" class="main-form">
                            <el-row :gutter="25">
                                <el-col :span="12">
                                    <el-form-item label="管理账号">
                                        <el-input v-model="profileForm.account" disabled />
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item label="显示名称">
                                        <el-input v-model="profileForm.username" placeholder="请输入昵称" />
                                    </el-form-item>
                                </el-col>
                            </el-row>

                            <el-form-item label="工作邮箱">
                                <el-input v-model="profileForm.mailbox" placeholder="admin@example.com" />
                            </el-form-item>

                            <el-form-item label="联系电话">
                                <el-input v-model="profileForm.phone_number" placeholder="请输入手机号" />
                            </el-form-item>

                            <div class="action-bar">
                                <el-button type="primary" @click="saveProfile">保存资料更新</el-button>
                            </div>
                        </el-form>
                    </div>
                </el-tab-pane>

                <el-tab-pane name="security">
                    <template #label>
                        <span class="custom-tab-label">
                            <el-icon><IconLock /></el-icon>
                            <span>安全验证</span>
                        </span>
                    </template>
                    
                    <div class="tab-content narrow-wrapper">
                        <div class="security-info">
                            <h3>修改登录密码</h3>
                            <p>建议定期更换密码以确保系统安全</p>
                        </div>
                        <el-form :model="passwordForm" label-position="top">
                            <el-form-item label="当前原密码">
                                <el-input v-model="passwordForm.oldPassword" type="password" show-password />
                            </el-form-item>
                            <el-form-item label="设定新密码">
                                <el-input v-model="passwordForm.newPassword" type="password" show-password />
                            </el-form-item>
                            <el-form-item label="确认新密码">
                                <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
                            </el-form-item>
                            <el-button type="danger" style="width: 100%" @click="updatePassword">
                                更新账户密码
                            </el-button>
                        </el-form>
                    </div>
                </el-tab-pane>

                <el-tab-pane name="notification">
                    <template #label>
                        <span class="custom-tab-label">
                            <el-icon><IconBell /></el-icon>
                            <span>推送偏好</span>
                        </span>
                    </template>
                    
                    <div class="tab-content">
                        <div class="setting-group">
                            <div class="setting-item">
                                <div class="item-text">
                                    <h4>系统安全警告</h4>
                                    <p>当系统检测到异常登录或越权操作时发送通知</p>
                                </div>
                                <el-switch v-model="noticeSettings.systemNotice" />
                            </div>
                            <el-divider />
                            <div class="setting-item">
                                <div class="item-text">
                                    <h4>待办审核提醒</h4>
                                    <p>当有新的失物招领申请等待处理时提醒我</p>
                                </div>
                                <el-switch v-model="noticeSettings.auditNotice" />
                            </div>
                        </div>
                    </div>
                </el-tab-pane>

            </el-tabs>
        </el-card>
    </div>
</template>

<style scoped>
.setting-container {
    padding: 24px;
    max-width: 1000px;
    margin: 0 auto;
}

.setting-card {
    border-radius: 12px;
    border: 1px solid #ebeef5;
}

.custom-tab-label {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 10px;
}

.tab-content {
    padding: 30px 40px;
}

/* 资料页样式 */
.avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 35px;
}

.role-badge {
    margin-top: 8px;
}

.main-form {
    max-width: 700px;
    margin: 0 auto;
}

.mt-4 {
    margin-top: 16px;
}

.action-bar {
    margin-top: 20px;
    border-top: 1px solid #f2f6fc;
    padding-top: 20px;
}

/* 安全页样式 */
.narrow-wrapper {
    max-width: 420px;
    margin: 0 auto;
}

.security-info {
    margin-bottom: 25px;
    text-align: center;
}

.security-info h3 {
    margin: 0 0 8px 0;
    color: #303133;
}

.security-info p {
    font-size: 14px;
    color: #909399;
}

/* 通知项样式 */
.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
}

.item-text h4 {
    margin: 0 0 6px 0;
    color: #303133;
}

.item-text p {
    margin: 0;
    font-size: 13px;
    color: #999;
}

.avatar-uploader {
    position: relative;
    width: 120px;
    height: 120px;
    border: 2px dashed #d9d9d9;
    border-radius: 50%;
    cursor: pointer;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
}

.avatar-uploader:hover {
    border-color: var(--el-color-primary);
}

.avatar-preview {
    width: 120px;
    height: 120px;
    object-fit: cover;
    display: block;
}

.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 120px;
    height: 120px;
    text-align: center;
    line-height: 120px;
}

/* 悬浮遮罩 */
.avatar-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s;
    font-size: 12px;
    gap: 5px;
}

.avatar-uploader:hover .avatar-mask {
    opacity: 1;
}

.upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 10px;
}

/* 响应式适配 */
@media (max-width: 768px) {
    .tab-content {
        padding: 20px 10px;
    }
    .el-col {
        width: 100% !important;
    }
}

:deep(.el-tabs__nav-wrap::after) {
    height: 1px;
}

:deep(.el-tabs__item) {
    font-size: 15px;
    height: 50px;
}
</style>