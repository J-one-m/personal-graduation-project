const nodemailer = require('nodemailer');//1.引入邮件发送库
// 加载环境变量
require('dotenv').config();

const date = new Date();

// 2.配置邮件传输器
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,//启用的邮件服务对象（即类型）
    port: process.env.EMAIL_PORT,
    secure: true,//使用SSL
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 发送邮件函数
const sendEmail = async(to,subject,text,html)=>{
    try{
        // 配置信息
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,//收件人
            subject,//主题
            text,//纯文本内容，用于不支持HTML格式的邮件客户端
            html,//HTML内容
        };

        // 发送邮件
        const info = await transporter.sendMail(mailOptions);

        console.log('邮件发送成功：%s',info.messageId);
        return info;

    }catch(error){
        console.error({
            errorTime: date.toLocaleString(),
            errorAddress:'错误文件emailService.js@错误函数：sendEmail',
            errorMessage:error.message,
        });
        throw new Error(`邮件发送失败：${error.message}`);
    }
};

module.exports = {
    transporter,
    sendEmail,
}