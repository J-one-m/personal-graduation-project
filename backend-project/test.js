// 测试区域：
const date = new Date();
const userModle = require('./models/userModle');
const adminModle = require('./models/adminModle');
require('dotenv').config();
const { transporter,sendEmail } = require('./models/emailService');

const test = async()=>{

    try{
        // 数据库测试区域
        const testData = async()=>{
            // .getVenueReservationInfo('2025-10-15')
            // userModle.getCandidateCode(20)
            try{
                const data = await adminModle.getAdminPassword(1);
                console.log('server.js',data);
            }catch(error){
                console.error(error);
            }
        }
        

        // 邮件连接测试
        // await transporter.verify();
        // console.log('Server is ready to take our messages');
        const qqCode = '3501114830@qq.com';
        const subject = process.env.EMAIL_FROM;
        const text = '测试，第一封邮件！';
        const html = '<b>第一封邮件！</b>';
        // const info = await sendEmail(qqCode,subject,text,html);
        /* 
            就sendEmail函数返回的值作如下补充说明：
                1.ehlo：这是与 SMTP 服务器进行的 EHLO（扩展的 HELO）命令的响应。它列出了服务器支持的功能。
                        （1）PIPELINING：允许客户端在等待服务器响应之前发送多个命令，可以提高发送效率。
                        （2）SIZE 73400320：表示服务器允许的最大邮件大小为 73,740,320 字节（约 70 MB）。
                        （3）AUTH LOGIN PLAIN XOAUTH XOAUTH2：支持的身份验证机制，包括登录（LOGIN）、普通文本（PLAIN）、OAuth（XOAUTH 和 XOAUTH2）。
                        （4）AUTH=LOGIN：表示当前使用的身份验证机制为 LOGIN。
                        （5）MAILCOMPRESS：支持邮件压缩。
                        （6）SMTPUTF8：支持 UTF-8 编码的邮件地址。
                        （7）8BITMIME：支持 8 位 MIME 数据，可以发送更丰富的内容。
                2.envelopeTime：这个值表示从发送邮件的开始到邮件信封（包括发件人、收件人等信息）被处理完所消耗的时间（以毫秒为单位）。在这个例子中，处理时间为 228 毫秒。
                3.messageTime：表示邮件内容被处理和排队的时间（以毫秒为单位）。在这个例子中，处理时间为 364 毫秒。
                4.messageSize：表示发送的邮件的大小（以字节为单位）。在这个例子中，邮件大小为 646 字节。
                5.response：这是服务器的最终响应，表示邮件已经成功排队发送。状态码 250 表示操作成功，后面的内容通常是关于邮件排队的进一步信息。
                6.info.messageId：这是邮件服务提供的唯一标识符，用于识别已发送的邮件。可以用于后续的邮件跟踪或调试。
                7.info.envelope：这个属性包含了邮件的发件人和收件人信息，能帮助确认邮件的发送情况。

            演示示例如下：
            {
                accepted: [ '3501114830@qq.com' ],
                rejected: [],
                ehlo: [
                    'PIPELINING',
                    'SIZE 73400320',
                    'AUTH LOGIN PLAIN XOAUTH XOAUTH2',
                    'AUTH=LOGIN',
                    'MAILCOMPRESS',
                    'SMTPUTF8',
                    '8BITMIME'
                ],
                envelopeTime: 228,
                messageTime: 364,
                messageSize: 646,
                response: '250 OK: queued as.',
                envelope: { from: '3836988332@qq.com', to: [ '3501114830@qq.com' ] },
                messageId: '<7c9ab520-8176-e691-b217-f6ea23e2fb0e@qq.com>'
            }
        */

        testData();
        // console.log('测试函数',data); 

    }catch(error){
        console.error({
            errorTime:date.toLocaleString(),
            errorAddress:'test.js',
            errorMessge:error,
        });
    }
}

// test();

module.exports = test;
