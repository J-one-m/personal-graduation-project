<script setup>
/* 
    可选事项：
            1、表单内容的持久化处理（建议使用pinia）
            2、对于打印语句：在正式上线后可以通过vite在构建时统一处理
*/

import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';
import { ref,reactive, onMounted } from 'vue';


// 1.定义状态变量
const isSubmitting = ref(false);//定义提交状态


// 2.定义数据变量
const userInfo = JSON.parse(localStorage.getItem('userInfo'));//获取用户登录后保存的信息

const afficheFormRef = ref(null);//获取表单组件实例
// 定义表单数据对象，里面的key是对象里的键名
const form = reactive({
    afficheTitle:'',//定义公告标题
    afficheContent:'',//定义公告内容
});
//定义校验规则，里面的key也必须与form对象里的命名保持一致
const rules = reactive({
    // 数组表明可以有多个校验规则，虽然可以使用对象（但不建议）
    afficheContent:[
        {required:true, message:'公告内容不能为空！', trigger:'blur'},
        {min:7, message:'公告内容太短了，再多写点吧！', trigger:'blur'},
    ],
    afficheTitle:[
        {required:true, message:'标题是必填项哦！', trigger:'blur'},
        {min:2, max:50, message:'标题长度需在2 ~ 50个字符之间！', trigger:'blur'},
    ],
});

// 重置表单（带弹窗）
const handleUserReset = async()=>{
    try {
        if (form.afficheContent || form.afficheTitle) {
            await ElMessageBox.confirm('确定要清空所有已输入的内容吗？', '提示', {
                confirmButtonText: '确定重置',
                cancelButtonText: '取消',
                type: 'warning',
            });
        }
        resetForm();
    } catch {
        // 用户点击取消，不做处理
    }
}

// 核心清理逻辑（不带弹窗）
const resetForm = ()=>{
    afficheFormRef.value.resetFields();
}

// 发布公告
const issueAffiche = async()=>{
    if(!afficheFormRef.value || isSubmitting.value) return;

    try{
        await afficheFormRef.value.validate();
    }catch(err){
        // 校验没通过
        return ElMessage.warning('请检查输入内容是否合规！');
    }

    try{
        isSubmitting.value = true;

        const {code,msg} = await axiosInstance.post(apiConfig.issueAffiche,{
            id:userInfo.id,
            title:form.afficheTitle,
            content:form.afficheContent,
        });

        // // 模拟API请求
        // await  new Promise(resolve =>{
        //     return setTimeout(resolve,1500);
        // })
        if(code === 200){
            ElMessage.success(msg);
        }
        console.log('@@issue-affiche.vue',form);
        // 发布成功后重置表单
        resetForm()

    }catch(error){
        // 网络或者服务器错误
        ElMessage.error('服务器开小差了，请稍后再试！');
    }finally{
        isSubmitting.value = false;
    }
}

onMounted(()=>{

    console.log('@issue.affiche.vue',userInfo);
});


</script>


<template>

<div class="issue-affiche-container">
    <div class="content-card">
        <h2 class="form-title">📢 发布新公告</h2>
        <el-form
            label-position="top"
            class="custom-form"
            ref="afficheFormRef"
            :rules="rules"
            :model="form"
        >
            <el-form-item
              label="公告标题"
              prop="afficheTitle"
            >
            <el-input 
                v-model.trim="form.afficheTitle"
                placeholder="请输入简洁的标题"
                :clearable="true"
                maxlength="50"
                show-word-limit
            >
            </el-input>
            </el-form-item>

            <el-form-item
              label="公告内容"
              prop="afficheContent"
            >
                <el-input
                  :maxlength = '800'
                  :show-word-limit="true"
                  word-limit-position="inside"
                  v-model="form.afficheContent"
                  type="textarea"
                  resize="none"
                  :autosize="{minRows:10}"
                  placeholder="请输入公告内容..."
                >
                </el-input>
            </el-form-item>

            <div class="form-actions">
                <el-button 
                    type="info"
                    plain
                    size="default"
                    :round="false"
                    @click="handleUserReset"
                >
                    重置公告文本
                </el-button>

                <el-button 
                    plain
                    type="primary"
                    size="default"
                    :round="false"
                    :loading="isSubmitting"
                    @click="issueAffiche"
                >
                    发布
                </el-button>
            </div>
        </el-form> 
    </div>
</div>


</template>


<style scoped>

.issue-affiche-container{
    height: 100%;
    width: 100%;
    background-color: #f5f7fa;
    display: flex;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
}
.content-card{
    padding: 25px;
    background-color: #fff;
    width: 100%;
    max-width: 800px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.form-title{
    font-size: large;
    margin-bottom: 20px;
    color: #303133;
    font-weight: 600;
}
.custom-form{
    width: 100%;
}
/* :deep为深度选择器 */
.custom-form :deep(.el-textarea__inner){
    max-height: 480px;
    line-height: 1.6;
    padding: 12px;
}
.form-actions{
    display: flex;
    justify-content: flex-end;
}


/* 当屏幕宽度小于768px（通常是手机）时执行 */
@media (max-width: 768px) {
  .custom-form :deep(.el-textarea__inner){
    max-height: 520px;
  }


  .form-actions {
    justify-content: space-between; /* 移动端按钮平铺或靠两边 */
  }

  /* 调整 Element Plus 按钮在移动端的表现 */
  .form-actions .el-button {
    padding: 8px 12px;  /* 减小内边距 */
    font-size: 12px;    /* 减小字号 */
    height: auto;       /* 让高度自适应内容 */
    flex: 1;            /* 让两个按钮平分宽度（可选） */
    margin: 0 5px;      /* 增加按钮间距 */
  }
}

</style>