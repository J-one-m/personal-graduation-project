<!-- 
    1.对于时间格式化这些：代码中的硬编码建议使用dayjs库
    来处理时间显示以兼容不同时区或展示习惯
    2.驳回部分需要补充完整结构
-->

<script setup>
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ref,reactive, onMounted } from 'vue';

const pendingReviewInfo = ref([]);
const srcList = [
  'https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg',
  'https://fuss10.elemecdn.com/1/34/19aa98b1fcb2781c4fba33d850549jpeg.jpeg',
  'https://fuss10.elemecdn.com/0/6f/e35ff375812e6b0020b6b4e8f9583jpeg.jpeg',
  'https://fuss10.elemecdn.com/9/bb/e27858e973f5d7d3904835f46abbdjpeg.jpeg',
  'https://fuss10.elemecdn.com/d/e6/c4d93a3805b3ce3f323f7974e6f78jpeg.jpeg',
  'https://fuss10.elemecdn.com/3/28/bbf893f792f03a54408b3b7a7ebf0jpeg.jpeg',
  'https://fuss10.elemecdn.com/2/11/6535bcfb26e4c79b48ddde44f4b6fjpeg.jpeg',
]

// 加载待审核数据
const loadPendingReviewInfo = async()=>{
    try{
        const {data,msg} = await axiosInstance.get(apiConfig.getPendingReviewInfo);
        if(data.length === 0){
            ElMessage.success(msg);
        }

        pendingReviewInfo.value = data;

        console.log('@publish-review.vue',data);
    }catch(error){
        console.log('@publish-review.vue',error);
    }
}

// 通过函数
const handlePass = async(id)=>{
    try{
        await ElMessageBox.confirm('确定通过该失物招领审核吗？','注意：',{
            type:'success',
            confirmButtonText: '确认',
            cancelButtonText: '取消',
        });

        const {code,msg} = await axiosInstance.patch(apiConfig.approveLostInfo,{
            id
        });

        if(code === 200){
            ElMessage.success(msg);
            loadPendingReviewInfo()
        }

    }catch(error){
        console.log('@publish-review.vue',error);
    }
} 

// 驳回函数
const handleReject = async(id)=>{
    try{
        ElMessageBox.prompt('请输入驳回理由！','操作确认',{
            confirmButtonText: '确认',
            cancelButtonText: '取消',  
            inputPattern: /\S+/, // 正则：不能为空格
            inputErrorMessage: '理由不能为空',  
        }).then(async(res)=>{
            /* 
                其中的res为一个包含两个属性的对象：
                    1.value: 用户在输入框里输入的字符串。
                    2.action: 用户触发的操作（通常是 'confirm'）。
            */
            const {code,msg} = await axiosInstance.patch(apiConfig.rejectLostInfo,{
                id,
                rejectReason:res.value,
            });

            if(code === 200){
                ElMessage.success(msg);
                // 重新像后端请求数据（但这种做法并不好）（偷懒。。。）
                loadPendingReviewInfo();
            }
            
            // console.log(data);//inputTest
        })
    }catch(error){
        if (error !== 'cancel') { // 排除用户点击“取消”的情况
            console.error('审核驳回异常:', error);
            ElMessage.error('系统繁忙，请稍后再试');
        }
    }
}


onMounted(async()=>{
    loadPendingReviewInfo();
});
</script>

<template>

<!-- <h1>失物审核</h1> -->

  <div class="audit-container">

    <div class="header-section">
        <h2>🔍 失物招领审核</h2>
        <el-tag type="info">{{ `待审核数量：${pendingReviewInfo.length}` }}</el-tag>
    </div>
<!-- flexWrap:'wrap', -->
    <div class="audit-card-container">
        <el-scrollbar >
            <el-card 
              v-for="item in pendingReviewInfo" :key="item.property_id"
              class="audit-card"
              shadow="hover"
              :body-style="{ paddingRight: '10px',paddingLeft:'10px'}"
            > 
                <div class="audit-content">
                    <el-image
                      class="audit-image"
                      :src="item.property_image"
                      :preview-src-list="srcList"
                      :initial-index="1"
                      fit="cover"
                    >
                    </el-image>

                    <div class="audit-info">
                        <h2>失物名称：{{ item.property_name }}</h2>
                        <div class="audit-describe">
                            <span>详情描述：</span>
                            <p>
                                {{ item.property_describe }}
                            </p>
                        </div>
                        <div class="info-grid">
                            <span>发布人：{{ item.publisher_name }}</span>
                            <span>发布人账号：{{ item.publisher_account }}</span>
                            <span>遗失地：{{ item.losePlace }}</span>
                            <span>时间：{{ new Date(item.pubdate).toLocaleString() }}</span>
                            <span>联系方式：{{ item.contact_way }}</span>
                        </div>
                    </div>

                    <div class="audit-operate">
                        <el-button
                            type="success"
                            plain
                            @click="handlePass(item.property_id)"
                        >
                            通过
                        </el-button>
                        <el-button
                            type="danger"
                            plain
                            @click="handleReject(item.property_id)"
                        >   
                            驳回
                        </el-button>
                    </div>
                </div>
            </el-card>
        </el-scrollbar>  
    </div>
    
  </div>


</template>


<style scoped>

.audit-container{
    height: 100%;
    max-width: 1000px;
    /* min-width: 400px; */
    background-color: #f8f9fa;
    /* background-color: #1e6ebe; */
    border-radius: 8px;
    margin: 0 auto;
    box-sizing: border-box;
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
}
.header-section{
    display: flex;
    height: 40px;
    margin: 10px 0;
    justify-content: flex-start;
    align-items: center;
    gap: 10px;
}
.audit-card-container{
    border-top: 2px solid lightblue;
    padding-top: 10px;
    width: 100%;
    overflow: hidden;
    flex: 1;
}
.audit-card{
    margin-bottom: 20px;
    background-color: #FFF;
}
.audit-content{
    display: flex;
    justify-content: flex-start;
    /* align-items: center; */
    align-items: stretch;
}
.audit-image{
    height: 180px;
    width: 180px;
    border-radius: 7px;
}
.audit-info{
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
    padding: 0 5px;
    border-right: 1px solid lightblue;
    justify-content: space-between;
    
    flex: 1;
    min-width: 0;
}
.audit-describe{
    /* padding: 2.5px  0px; */
    font-size: 14px;
    color: #606266;
    margin-top: 10px;
    flex: 0.9;
    overflow: auto;
    width: 100%;
}
.audit-describe>span{
    float: left;
    font-size: 15px;
}
.audit-describe>p{
    padding-top: 4px;
    line-height: 1.5;
    font-size: 12px;
}
.info-grid{
    width: 100%;
    display: grid;
    font-size: 13px;
    color: #909399;
    gap: 10px;
    grid-template-columns: 1fr 1fr;
}
.audit-operate{
    width: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;
}
.audit-operate :deep(.el-button){
    margin:0 !important;
}

@media (max-width:768px) {
    .audit-content{
        flex-direction: column;
    }
    .audit-image{
        width: 100%;
        height: 200px;
    }
    .audit-info{
        border-right: none;
        border-bottom: 1px solid lightblue;
        width: 100%;
    }
    .info-grid{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    .audit-operate{
        margin-top: 10px;
        width: 100%;
        flex-direction: row;
        align-items: center;
    }
    .audit-operate .el-button{
        flex: 1;
    }
}
</style>