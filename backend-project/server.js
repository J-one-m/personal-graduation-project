require('dotenv').config();//引入加载.env文件的库，默认加载.env文件，若想加载指定路径下的配置文件，建议在config中添加配置对象{path:'相关配置文件路径'}
const express = require('express');
const db = require('./db/connection');
const config = require('./config/config');
const router = require('./routes/route');
const cors = require('cors');
const expressJWT = require('express-jwt');
const cron = require('node-cron');
const path = require('path');
const test = require('./test.js');

const {initTaskLog,executeFullTask} = require('./utils/updateMysqlDate');
const initStatusTask = require('./utils/statusUpdater.js');
const app = express();

const EMAIL_PORT = process.env.EMAIL_PORT ;
const EMAIL_USER = process.env.EMAIL_USER ;
const EMAIL_HOST = process.env.EMAIL_HOST ;//指定SMTP服务器的主机名。当前使用的是QQ邮箱的SMTP服务器。应用程序将通过这个主机名与邮件服务器进行通信。
const EMAIL_PASS = process.env.EMAIL_PASS ;
const EMAIL_FROM = process.env.EMAIL_FROM ;
// 打印测试
// console.log('端口：',EMAIL_PORT,'发件人：', EMAIL_USER,'主机名：',EMAIL_HOST,'SMTP授权码：',EMAIL_PASS,'发件机构：',EMAIL_FROM);

// test();

app.use(express.urlencoded());//引入（json与urlencoded）这两个中间件来解析请求体中的参数。
app.use(express.json());
app.use(cors(config.corsOptions));

app.use('/uploads',express.static(path.join(__dirname,'uploads')));//设置静态文件访问目录

app.use('/appV1',router);

// cron.schedule('0 0 * * *',async()=>{
//     try{
//         const data = await userModle.getVenueId();
//         for(const item of data){
//             // 每日凌晨生成3天记录
//             for(let i=0;i<3;i++){
//                 let date = new Date();
//                 date.setDate(date.getDate() + i);
//                 await userModle.createSchedule(item.id,date.toISOString().split('T')[0]);
//             }
//         }
//     }catch(error){
//         console.error('创建失败！',error);
//     }
// });



// 初始化
initTaskLog();
// 服务启动时立即执行一次完整任务（补偿+每日任务）
executeFullTask();
// 设置每天0点的定时任务
cron.schedule('0 0 * * *',async() => {
  console.log('定时任务触发，开始执行完整任务流程...');
  try {
    await executeFullTask();
    console.log('每日定时任务执行完成');
  } catch (error) {
    console.error('每日定时任务执行失败:', error);
  }
});


// 状态自动更新
initStatusTask();

console.log('定时任务系统已启动');

app.listen(config.port,'0.0.0.0',()=>{
    console.log(`Server is running at http://0.0.0.0:${config.port}`);
})

process.on('SIGINT',async()=>{
    try {
        await db.end(); // 等待数据库连接关闭
        console.log('数据库连接池已成功关闭');
    } catch (err) {
        console.log('关闭数据库连接池时出错：', err);
    } finally {
        process.exit(0); // 确保在所有情况下都退出
    }
});