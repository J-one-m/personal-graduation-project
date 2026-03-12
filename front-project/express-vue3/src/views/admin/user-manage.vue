<script setup>
defineOptions({
    name:'userManage',
});
import { Edit, IconDelete,IconClose,IconSearch } from '@/config/adminIcons';
import {ref,reactive, computed,watch, onMounted} from 'vue';
import useAppStore from '@/stores/useAppStore';
import { storeToRefs } from 'pinia';
import axiosInstance from '@/api/axios';
import { apiConfig } from '@/config/apiConfig';
import { ElMessage, ElMessageBox } from 'element-plus';

const appStore = useAppStore();
const {isMobile} = storeToRefs(appStore);

// 1.数据定义
const inputValue = ref('');//存储搜索框的值
const lastQuery = ref('');
const usersData = ref([]);//由后端返回
// 定义分页数据变量
const currentPage = ref(1);
const batchSize = ref(48);// 每次向后端请求的“一捆”数据量
const pageSize = ref(12);
const totalNum = ref(0);//后端返回的数据库的总数据个数
let timer = null;
const userForm = reactive({
    id: null,
    username: '',
    age: null,
    gender: '保密',
    user_account: '',
    phone_number: '',
    mailbox: '',
    is_active: 1,
    address:'',
    credit_score:10,
    last_login:'',
    user_image:'',
});


// 2.定义状态变量
const dialogVisible = ref(false); // 控制编辑弹窗
const isEdit = ref(false); // 区分是新增还是编辑
const showStatus = ref(true);//用于切换用户信息展示方式
const isMore = ref(true);//是否还有更多

const displayData = computed(() => {
    // 基础防御：没数据就返空
    if (usersData.value.length === 0) return [];
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return usersData.value.slice(start, end);
});

const totalPages = computed(()=>{   
    return Math.ceil(totalNum.value / pageSize.value);
});


// 编辑按钮
const handleEdit = (scoped)=>{

    isEdit.value = true;
    dialogVisible.value = true;

    Object.assign(userForm,scoped.row);
    console.log('@user-manage.vue',scoped);
};
// 删除按钮
const handleDelete = async(scoped)=>{

    await ElMessageBox.confirm(`确定要删除用户 "${scoped.row.username}" 吗？`,'警告',{
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
    });

    try{
        const {code, msg} = await axiosInstance.patch(apiConfig.deleteUser,{
            id: scoped.row.id,
        });

        if(code === 200){
            ElMessage.success(msg || '删除成功！');
            // 从本地数组中剔除
            usersData.value = usersData.value.filter(u => u.id !== scoped.row.id);
            totalNum.value--;
        }
    }catch(e){
        if (e !== 'cancel') console.error(e);
    }
    console.log('@user-manage.vue',scoped.row,scoped.column,scoped.$index);
}


const submitForm = async()=>{
    
    try{
        const {code, msg} = await axiosInstance.post(apiConfig.updateUserInfo,userForm)


        if(code === 200){
            ElMessage.success(msg);
            dialogVisible.value = false;

            const index = usersData.value.findIndex(u => u.id === userForm.id);
            if (index !== -1) {
                // 使用解构赋值，确保usersData[index]指向一个新的对象，触发 Vue 的响应式更新
                usersData.value[index] = { ...usersData.value[index], ...userForm };
            }
        }else{
            ElMessage.error(msg || '保存失败');
        }
    }catch(error){
        console.error(error);
        ElMessage.error('网络请求失败');
    };

    console.log('@@@@user-manage.vue',userForm);
}

// 搜索框
const handleSearch = ()=>{
    // 1. 清除正在等待的防抖定时器，避免重复请求
    if (timer) clearTimeout(timer);
    
    // 2. 立即重置分页并触发请求
    currentPage.value = 1;
    usersData.value = []; 
    isMore.value = true;
    
    console.log('@user-manage.vue 手动触发搜索:', inputValue.value);
    loadAllUserInfo();
};

const loadAllUserInfo = async()=>{
    const queryStr = inputValue.value.trim();

    // 计算当前页所需的数据范围
    const neededEnd = currentPage.value * pageSize.value;

    // 只有当内存里的数据不够覆盖当前页时，才去后端拿
    // 或者当用户在搜索（queryStr 变化）时，必须重新加载
    const isSearch = lastQuery.value !== queryStr;
    // 如果需要的索引已经加载过了，且不是搜索行为，则不请求
    if (!isSearch && usersData.value.length >= neededEnd) {
        return; // 内存充足，直接用 computed 切换展示，不发请求
    }

    // 判断是否向后端请求数据
    if(!isMore.value) return;//没有就不加载    

    try{
        // 如果是搜索，offset 从 0 开始，否则从当前长度开始追加
        const currentOffset = isSearch ? 0 : usersData.value.length;

        const {code, data, hasMore, msg, total} = await axiosInstance.get(apiConfig.getAllUserInfo,{
            params:{
                offset:currentOffset,
                limit:batchSize.value,
                keyWords:queryStr,
            }
        });

        if (code === 200){
            if (isSearch){
                usersData.value = data; // 搜索则替换
                lastQuery.value = queryStr; // 记录上次搜索词
            } else{
                usersData.value = [...usersData.value, ...data]; // 翻页则追加
            }
            totalNum.value = total;
            isMore.value = hasMore;
        }
        
        console.log('@user-manager.vue',data);
    }catch(error){
        console.error("加载失败", error);
    }
}


watch(inputValue, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
        currentPage.value = 1;
        usersData.value = []; 
        isMore.value = true;
        loadAllUserInfo();
    }, 750); // 用户停止输入500ms后才发请求
});

watch(currentPage, () => {
    loadAllUserInfo();
});

onMounted(()=>{
    loadAllUserInfo();
});

</script>


<template>

    <div class="user-manager-container">
        <div class="user-search">
            <el-input 
              @keydown.enter="handleSearch" 
              @click-prefix="handleSearch"  style="cursor: pointer"
              placeholder="按姓名或账号查询..." 
              v-model="inputValue"
              :prefix-icon="IconSearch"
              :clearable="true"
              :clear-icon="IconClose"
              class="search-input"
            >
            </el-input>

            <div class="user-manager-button">
                <!-- 后续实现 -->
                <el-button type="primary" :plain="true" @click="showStatus = !showStatus">{{ showStatus? '卡片展示' : '表格展示' }}</el-button>
            </div>
        </div>
        <div class="user-table-container">
            <el-table 
                :data="displayData" 
                :height="isMobile ? '600px' : '550px'"
                :border = "true"
                size="default" 
            > 
                <el-table-column fixed prop="username" label="姓名"></el-table-column>
                <el-table-column width="120" prop="user_account" label="账号"></el-table-column>
                <el-table-column prop="age" label="年龄"></el-table-column>
                <el-table-column width="75" prop="gender" label="性别"></el-table-column>
                <el-table-column prop="address" label="住址"></el-table-column>
                <el-table-column prop="last_login" label="上次登录时间"></el-table-column>
                <el-table-column prop="mailbox" label="邮箱"></el-table-column>
                <el-table-column prop="phone_number" label="电话号码"></el-table-column>
                <el-table-column prop="is_active" label="状态">
                    <template #default="{row}">
                        <el-tag :type="row.is_active ? 'success' : 'danger'">{{ row.is_active ? '正常' : '封禁' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column width="120" label="操作">
                    <!-- 使用自定义表头后，列的label属性就无用了 -->
                    <!-- <template #header>

                    </template> -->
                    <template #default="scoped">
                        <el-tooltip content="编辑用户信息" placement="top">
                            <el-button @click="handleEdit(scoped)" size="small" :icon="Edit"></el-button>
                        </el-tooltip>
                        <el-tooltip content="删除用户" placement="top">
                            <el-button @click="handleDelete(scoped)" size="small" type="danger" :icon="IconDelete"></el-button>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>
            
        </div>
        <div>
            <span>共有</span>{{ totalNum }}<span>条相关数据</span>
        </div>
        <div class="pagination">
            <el-pagination
                v-model:current-page="currentPage"  
                v-model:page-size="pageSize"
                :size="isMobile ? 'small' : 'default'"
                :background="true"
                :page-count= "totalPages"
                :hide-on-single-page="true"
                layout="prev, pager, next, jumper"
            >
            </el-pagination>
        </div>
        <!-- 编辑部分 -->
        <el-dialog
          v-model="dialogVisible"
          :title="isEdit ? '编辑用户信息' : '新增用户'"
          :width="isMobile ? '400px' : '500px'"
          destroy-on-close
        >
          <el-form 
            :model="userForm" 
            label-width="80px"

          >
            <el-form-item label="姓名">
              <el-input v-model="userForm.username" />
            </el-form-item>
            <el-form-item label="账号">
              <el-input v-model="userForm.user_account" :disabled="isEdit" placeholder="账号创建后不可修改"/>
            </el-form-item>
            <el-form-item label="年龄">
              <el-input-number v-model="userForm.age" :min="1" :max="120" />
            </el-form-item>
            <el-form-item label="性别">
              <el-select v-model="userForm.gender" placeholder="请选择性别">
                <el-option label="男" value="男" />
                <el-option label="女" value="女" />
                <el-option label="保密" value="保密" />
              </el-select>
            </el-form-item>
            <el-form-item label="住址">
              <el-input v-model="userForm.address" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="userForm.mailbox" />
            </el-form-item>
            <el-form-item label="电话号码">
              <el-input v-model="userForm.phone_number" />
            </el-form-item>
            <el-form-item label="信誉分">
              <el-input-number v-model="userForm.credit_score" :min="0" :max="10" />
            </el-form-item>
            <el-form-item>
              <el-switch 
                v-model="userForm.is_active" 
                :active-value="1" 
                :inactive-value="0" 
                active-text="正常" 
                inactive-text="封禁"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitForm">确认保存</el-button>
            </span>
          </template>
        </el-dialog>

        
    </div>
    
    <!-- <h1>用户管理页面</h1> -->
</template>


<style scoped>
.user-manager-container{
    box-sizing: border-box;
    height: 100%;
    width: 100%;
    background-color: #f6f8fb;
    display: flex;
    flex-direction: column;
    padding: 15px 10px;
    gap: 20px;
    position: relative;
}

.user-search{
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    row-gap: 15px;
}
.search-input{
    width: 240px;
}
/* 移动端表格呈现效果不好，有时间的话（适配）就采用卡片布局 */
.user-table-container{
    /* padding: 20px; */
    flex: 1;
    width: 100%;
    box-sizing: border-box;
}

.user-table-container + div{
    position: absolute;
    bottom: 90px;
    right: 10px;
    letter-spacing: 2px;
}
.user-table-container + div span{
    margin: 2px;
}

.pagination{
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  left: 20px;
  right: 20px;
  bottom: 25px;
  /* width: 100%; */
  height: 40px;
  margin-top: 10px;
  overflow-x: auto;
  white-space: nowrap;/* 强制不换行 */
  -webkit-overflow-scrolling: touch; /* 优化移动端滚动流畅度 */
}





@media screen and (max-width: 768px){
  .pagination {
    justify-content: flex-start; /* 移动端靠左展示，方便滑动 */
    padding-bottom: 5px;        /* 留出一点手感空间 */
  }
}
</style>