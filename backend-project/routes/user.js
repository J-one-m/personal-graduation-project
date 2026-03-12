const express = require('express');
const router = express.Router();
const userModle = require('../models/userModle');
const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const calculationDuration = require('../utils/calculationDuration.js');
const changeStatus = require('../utils/changeStatus.js');
const calculationPeriod = require('../utils/calculationPeriod.js');
const computingTime = require('../utils/computingTime.js');
const {nanoid} = require('nanoid');
const {uploadAvatar,uploadLost} = require('../middlewares/upload.js');
const db = require('../db/connection');
const date = new Date();
const fs = require('fs');
const getImageAddress = require('../utils/getImageAddress.js');//获取后端存储后的图片路径
const logError = require('../utils/logError.js');
const verifyToken = require('../utils/verifyToken.js');
const crypto = require('crypto');//用于邀请码加密
const { encrypt, decrypt } = require('../utils/security.js');

router
.post('/login',async(req,res)=>{
    const {user_account,password} = req.body;

    try{
        const userData = await userModle.userLogin(user_account);
        const user = userData[0];

        if (!user || user.password !== password) {
            return res.status(401).json({ code: 401, msg: '账号或密码错误' });
        }

        // 1. 根据角色生成不同的菜单（管理员部分在前端已经定义好了，仅需返回普通用户部分）
        let menuList = [];
        if (user.role === 'admin') {
            menuList = [ /* 管理员独有菜单... */ ];
        } else {
            menuList = [
                {
                    path:'/appLayout',
                    name:'appLayout',
                    url:'/layouts/AppLayout',
                    label:'用户页面',
                    children:[
                        {
                            path:'/announcement',
                            name:'announcement',
                            url:'/user/Announcement',
                            label:'公告',
                        },
                        {
                            path:'/lostAndFound',
                            name:'lostAndFound',
                            url:'/user/LostAndFound',
                            label:'失物招领',
                        },
                        {
                            path:'/serviceCondition',
                            name:'serviceCondition',
                            url:'/user/ServiceCondition',
                            label:'使用情况',
                        },
                        {
                            path:'/subscriber',
                            name:'subscriber',
                            url:'/user/Subscriber',
                            label:'用户',
                            children:[
                                {
                                    path:'/userInfoModify',
                                    name:'userInfoModify',
                                    url:'/user/UserInfoModify',
                                    label:'个人资料',                                                                        
                                },
                                {
                                    path:'/userPlan',
                                    name:'userPlan',
                                    url:'/user/UserPlan',
                                    label:'个人计划',                                                                        
                                },
                                {
                                    path:'/userRecord',
                                    name:'userRecord',
                                    url:'/user/UserRecord',
                                    label:'个人记录',                                                                        
                                },
                                {
                                    path:'/candidateRecord',
                                    name:'candidateRecord',
                                    url:'/user/CandidateRecord',
                                    label:'候补记录',                                                                        
                                },
                                {
                                    path:'/lostAndFoundInfo',
                                    name:'lostAndFoundInfo',
                                    url:'/user/LostAndFoundInfo',
                                    label:'个人失物招领管理',                                                                        
                                },
                            ],
                        },
                        {
                            path:'demoTest',
                            name:'demoTest',
                            url:'/user/DemoTest',
                            label:'demo测试用',
                        },
                        {
                            path:'/venueReservations',
                            name:'venueReservations',
                            url:'/user/VenueReservations',
                            label:'预约',
                        },
                    ],
                },   
            ];
        }

        // 2. 生成包含角色的 Token
        // username字段是载荷，头部由jsonwebtoken库自动生成。其中secretKey是用于签名的密钥
        let token = jwt.sign({user_account,userId:user.id},config.secretKey,{expiresIn:'360000s'});

        // 统一返回
        res.status(200).json({
            code: 200,
            msg: '登录成功',
            data: {
                token,
                menuList,
                userInfoData: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    account: user.user_account,
                    phone_number: user.phone_number,
                    age: user.age,
                    gender: user.gender,
                    mailbox :user.mailbox,
                    address: user.address,
                    user_image: user.user_image,
                    credit_score: user.credit_score,
                    is_active: user.is_active,
                    last_login: user.last_login,
                }
            }
        });

        // if(user.role === 'admin' && password === user.password){
        //     res.status(200).json({
        //         code:200,
        //         msg:'当前登录用户为管理员',
        //         data:{
        //             userInfoData:{
        //                 id:user.id,
        //                 username:user.username,
        //                 account:user.user_account,
        //                 gender:user.gender,
        //                 age:user.age,
        //                 mailbox:user.mailbox,
        //                 address:user.address,
        //                 phone_number:user.phone_number,
        //             },
        //             // 若登录用户为admin，则返回admin相关的路由列表
        //             menuList:[

        //             ],
        //             token,
        //         }
        //     })
        // }else if(password === user.password && user.role === 'user'){
        //     // 对数据做处理，仅返回需要的数据，以及屏蔽一些敏感数据
        //     const {role,username,age,gender,mailbox,credit_score,user_image,address,id,phone_number} = user;
        //     res.status(200).json({
        //         code:200,
        //         msg:'返回与普通用户相关的信息',
        //         data:{
        //             token,
        //             userInfoData:{
        //                 id,
        //                 username,
        //                 account:user.user_account,
        //                 gender,
        //                 age,
        //                 mailbox,
        //                 address,
        //                 credit_score,
        //                 user_image,
        //                 role,
        //                 phone_number,
        //             },
        //             menuList,      
        //         }
        //     });
        // }else{
        //     res.status(401).json({
        //         code:401,//401状态码表示未授权，即身份验证问题。
        //         msg:'密码或账号错误',
        //     })
        // }
    }catch(error){
        console.error('Login error:', error);
        return res.status(500).json({
            code: 500,
            msg: '服务器内部错误'
        });
    }
})
.post('/register',(req,res)=>{

})
.get('/announcement',async(req,res)=>{
    // queryPageNum为查询的公告条数
    const {last_id:lastId,queryPageNum} = req.query;

    // 转换并限流
    const limit = Math.min(parseInt(queryPageNum) || 10, 50); // 最多只允许查 50 条
    const cursor = lastId ? parseInt(lastId) : null;

    try{
        const afficheData = await userModle.requestAfficheData(cursor,limit);
        // // 利用数组的map方法将其中的日期格式化后返回
        // afficheData.data = afficheData.data.map((item)=>{
        //     return {
        //         user_id: item.user_id,
        //         affiche_id: item.affiche_id,
        //         affiche_content: item.affiche_content,
        //         // toLocaleString()方法是一个Date对象方法，用于将日期和时间格式化为本地字符串。（后续补充：在数据库查询便可以格式化）
        //         created_at: new Date(item.created_at).toLocaleString(),
        //         affiche_title: item.affiche_title,
        //     };
        // });
        
        let message = '响应成功';
        if (!cursor && afficheData.data.length === 0) {
            message = '暂无任何公告';
        }

        res.status(200).json({
            code:200,
            msg:message,
            data:{
                afficheData
            },
        })
    }catch(error){
        logError(error,'@user.js /announcement');
        return res.status(500).json({
            code:500,
            error:'网络服务错误！',
        });
    }
})
.post('/userInfoModify',verifyToken,async(req,res)=>{
    const {nickName,gender,age,mailbox,address,phoneNumber} = req.body;
    const user_account = req.userAccount;//从token中获取用户账号信息
    const id = req.userId;

    if(!id && isNaN(Number(id)) && !user_account){
        return res.status(400).json({
            code:400,
            msg:'参数错误，操作非法！',
        })
    }

    try{
        if(!nickName){
            return res.status(200).json({
                code:200,
                msg:'用户名不允许为空！',
            })
        }
        
        const result = await userModle.userInfoModify(id,nickName,gender,age,mailbox,address,phoneNumber);

        if(!result || result.affectedRows === 0){
           return res.status(404).json({
                code:404,
                msg:'更新失败！',
           }) 
        }

        res.status(200).json({
            code:200,
            msg:'用户信息修改成功！',
        });
    }catch(error){
        logError(error,"@user.js @/userInfoModify");
        res.status(500).json({
            code:500,
            msg:'服务器内部错误，修改失败！',
        });
    }
})
// 更新用户密码
.patch('/updateUserPassword',verifyToken,async(req,res)=>{
    const id = req.userId;
    const userAccount = req.userAccount;
    const { oldPassword, newPassword} = req.body;
    try{
        if(!id && isNaN(Number(id)) && !user_account){
            return res.status(400).json({
                code:400,
                msg:'参数错误，操作非法！',
            })
        };
    
        const password = await userModle.getUserPassword(id,userAccount);
        // 打印出来对比
        console.log('数据库存的密码:', password);
        console.log('前端传的旧密码:', oldPassword);
        if(!password){
            return res.status(404).json({
                code: 404,
                msg: '该用户不存在！',
            });
        };
        if(password !== oldPassword){
            return res.status(400).json({
                code:400,
                msg:'原密码错误！',
            })
        }

        const {affectedRows} = await userModle.updateUserPassword(id,newPassword,userAccount);
        if(affectedRows === 0){
            return res.status(404).json({
                code:404,
                msg:'该用户不存在！',
            })
        };

        res.status(200).json({
            code:200,
            msg:'密码修改成功！',
        });
    }catch(error){
        logError(error,'@user.js @/updateUserPassword');
        res.status(500).json({
            code:500,
            msg:'服务器内部错误，修改失败！',
        });
    };
})
.get('/updateUser',verifyToken,async(req,res)=>{
    // const {user_account} = req.query;
    
    const id = req.userId;
    const user_account = req.userAccount;

    if(!id && isNaN(Number(id)) && !user_account){
        return res.status(400).json({
            code:400,
            msg:'参数错误，操作非法！',
        })
    }
    try{
        const userData = await userModle.findByUser_account(id);
        // console.log('@',userData);
        const userInfo = userData[0];
        // const {username,age,gender,mailbox,credit_score,user_image,address} = user;
        res.status(200).json({
            code:200,
            data:userInfo,
        });
    }catch(error){
        logError(error,"@user.js @/updateUser");
        res.status(500).json({
            code:500,
            msg:'服务器内部错误，修改失败！',
        });
    };
})
// 获取用户的预约记录
.get('/userRecord',verifyToken,async(req,res)=>{
    // 返回的数据：预约日期、预约的起止时间、地址、具体项目、预约的人数、预约的状态。还有用户记录的总页数（补充：外加一个邀请状态）
    // 前端返回用户账号用以数据库查询、每页最大显示条数pageSize、跳转页数（如果存在）。
    // 后端单次返回的数据为100条（可变更），当前端本地数据读取完或者跳转的页数大于本地数据时向后端请求数据
    const {account,pageSize,nativeMaxPageNum} = req.query;
    const id = req.userId;
    try{
        // let data = await userModle.queryUserRecords(account);//保存从数据库中读取到的数据。
        let data = await userModle.getUserRecords(Number(id));
        // console.log('@',data);
        const totalPageNum = Math.ceil(data.length/pageSize);
        let sendPageNum = 10;//单次传递给前端的数据的页数，与pageSize配合算出dataChunk
        let dataChunk = [];
        const startIndex = (nativeMaxPageNum - 1) * pageSize;
        const endIndex = startIndex + pageSize * sendPageNum;
        dataChunk = data.slice(startIndex,endIndex);
        dataChunk.forEach((item,index)=>{
            dataChunk[index] = {
                id:item.timeSlotId,
                duration:calculationDuration(item.start_time,item.end_time),
                reservation_date: new Date(item.schedule_date).toLocaleDateString() + ` ${item.start_time.substring(0,5)}`,
                reservation_address: item.venue_address,
                reservation_item: item.venue_name,
                reservation_number: item.current_participants,
                status: changeStatus(item.status),
                role:item.role,
            };
        });
        // console.log(dataChunk,pageSize,nativeMaxPageNum,startIndex,endIndex);
        if(data){
            res.status(200).json({
                code:200,
                msg:'查询成功！',
                data:{
                    dataChunk,
                    totalPageNum,
                },
            });
        }else{
            res.status(404).json({
                code:'404',
                msg:'未找到相关数据！',
            });
        }
    }catch(error){
        console.error('查询失败！',error);
        res.status(500).json({
            code:500,
            msg:'服务器内部问题！',
        });
    };
})
.get('/getLostPropertyData',async(req,res)=>{

    try{
        const { keyword, type } = req.query;
        const page = parseInt(req.query.page) || 1;
        const pageSize = 24; // 固定每页24条
        // 计算跳过的条数
        const offset = (page - 1) * pageSize;

        const { list, total } = await userModle.getLostPropertyData(pageSize, offset,keyword,type);

        const formattedData = list.map(item => ({
            ...item,
            pubdate: new Date(item.pubdate).toLocaleString(),
        }));

        res.status(200).json({
            code: 200,
            msg: '响应成功！',
            data: formattedData,
            total: total,
            hasMore: (offset + list.length) < total // 告知前端是否还有后续
        });

        // let data = await userModle.getLostPropertyData();
        // data.forEach((item,index)=>{
        //     data[index] = {
        //         username:item.username,
        //         losePlace:item.losePlace,
        //         contact_way: item.contact_way,
        //         is_revert: item.is_revert,
        //         property_describe: item.property_describe,
        //         property_id: item.property_id,
        //         property_image: item.property_image,
        //         pubdate: new Date(item.pubdate).toLocaleString(),
        //     }
        // });
        // if(data && data.length > 0){
        //     res.status(200).json({
        //         code:200,
        //         msg:'响应成功！',
        //         data,
        //     });
        // }else{
        //     res.status(404).json({
        //         code:404,
        //         msg:'未找到相关数据！',
        //     });
        // }
    }catch(error){
        logError(error,'@user.js @/getLostPropertyData');
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    }

})
// 失物表插入数据
.post('/insertLostPropertyData',verifyToken,uploadLost.single('picture'),async(req,res)=>{
    const {pubdate,contactWay,describe,losePlace,propertyName} = req.body;

    const id = req.userId;//从token中获取用户id这类信息更安全

    // console.log('@',id)
    if(!id || isNaN(Number(id))){
        return res.status(400).json({
            code:400,
            msg:'参数错误，操作非法！',
        });
    }

    if(!propertyName || !contactWay){
        return res.status(400).json({
            code:400,
            msg:'必要信息未填，请填完后再试！',
        });
    }

    const lostURL = getImageAddress(req,'uploads/lostAndFound');
    // console.log('@user.js',id,pubdate,contactWay,describe,losePlace,propertyName,lostURL);
    try{

        const data = await userModle.insertLostPropertyData(id,lostURL,losePlace,contactWay,describe,pubdate,propertyName);
        // console.log(data);
        if(data && data.affectedRows > 0){
            res.status(200).json({
                code:200,
                msg:'发布成功！',
                data,
                // lostURL
            });
        }else{
            res.status(404).json({
                code:404,
                msg:'发布失败，未插入任何数据！',
            });
        }
    }catch(error){
        logError(error,'@user.js @/insertLostPropertyData');
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    }
})
// 获取场地信息
// .get('/getVenueInfo',async(req,res)=>{
//     // 
//     const {scheduleDate,search} = req.query;
//     console.log('search:',search);
//     try{    
//         // console.log(scheduleDate);
//         let venueDataInfo = await userModle.getVenueInfo(scheduleDate,search);
//         // 获取对应日期的时段信息
//         const timeSlotsData = await userModle.getVenueReservationInfo(scheduleDate);
//         let tempDate = scheduleDate;
//         tempDate = tempDate.replace(/-/g,'/');//统一格式，用于匹配。
//         const data = [];//最终数据结果
//         // 对数据作处理
//         venueDataInfo.forEach((itemV)=>{//场地信息（仅与场地相关的信息：id、name、address）
//             const timeSlotArr = [];//每一次循环开始时将timeSlotArr置空。
//             timeSlotsData.forEach((itemT)=>{

//                 const dbDate = new Date(itemT.schedule_date).toISOString().split('T')[0];
//                 const frontDate = scheduleDate;
//                 // console.log('比较日期:', dbDate, '===', frontDate);
//                 // console.log('比较日期:', itemV.venue_id === itemT.venue_id);               
//                 if(itemV.venue_id === itemT.venue_id && dbDate === frontDate){
                    
//                     // 将同一场地下同一日期内的时段整理成长度为2的数组存入到timeSlotArr中去
//                     timeSlotArr.push({
//                         id: itemT.time_slots_id,//时段id
//                         time: calculationPeriod(itemT.start_time,itemT.end_time),//时段
//                         waitlist: itemT.waitlist_count,//当前候补人数
//                         maxWaitlist: itemT.max_waitlist,//最大候补人数
//                     });
//                 }
//             });
//             // 为了适应前端的检查时段是否合法的函数（ps：懒得修改了）
//             timeSlotArr.push({
//                 id:null,
//                 time:[840,840],
//                 isBoundary: true,//标记为边界，也许有用
//             });
//             timeSlotArr.unshift({
//                 id: null,
//                 time: [0,0],
//                 isBoundary: true,//标记为边界，也许有用
//             });
//             // 排序
//             timeSlotArr.sort((a,b)=>{
//                 return a.time[0] - b.time[0];
//             });
//             data.push({
//                 venueId:itemV.venue_id,
//                 scheduleId:itemV.schedule_id,
//                 venueName:itemV.venue_name,
//                 venueImage:itemV.venue_image,
//                 venueAddress:itemV.venue_address,
//                 slotArr:timeSlotArr,
//             });
//         });

//         if(data && data.length > 0){
//             res.status(200).json({
//                 code:200,
//                 msg:'查询成功！',
//                 data,
//             });
//         }else{
//             res.status(404).json({
//                 code:404,
//                 msg:'未找到相应内容！',
//             });
//         }
//     }catch(error){
//         console.error('查询失败！',error);
//         res.status(500).json({
//             code:500,
//             msg:'服务器内部错误！',
//         });
//     };
// })
// 获取场地信息（new）
.get('/getVenueInfo', async (req, res) => {
    // 1. 接收分页参数，并设置默认值
    const { scheduleDate, search, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        // 返回总数和当前页数据
        // 返回 { total, rows }
        const { total, rows: venueDataInfo } = await userModle.getVenueInfo(scheduleDate, search, parseInt(limit), offset);

        // 如果没有数据，直接返回
        if (!venueDataInfo || venueDataInfo.length === 0) {
            return res.status(200).json({ code: 404, msg: '未找到相应内容！', data: [], total: 0 });
        }

        // 3. 获取对应的预约时段信息
        const timeSlotsData = await userModle.getVenueReservationInfo(scheduleDate);

        const data = [];
        venueDataInfo.forEach((itemV) => {
            const timeSlotArr = [];
            timeSlotsData.forEach((itemT) => {
                const dbDate = new Date(itemT.schedule_date).toISOString().split('T')[0];
                if (itemV.venue_id === itemT.venue_id && dbDate === scheduleDate) {
                    timeSlotArr.push({
                        id: itemT.time_slots_id,
                        time: calculationPeriod(itemT.start_time, itemT.end_time),
                        waitlist: itemT.waitlist_count,
                        maxWaitlist: itemT.max_waitlist,
                    });
                }
            });

            // 填充边界
            timeSlotArr.push({ id: null, time: [840, 840], isBoundary: true });
            timeSlotArr.unshift({ id: null, time: [0, 0], isBoundary: true });
            timeSlotArr.sort((a, b) => a.time[0] - b.time[0]);

            data.push({
                venueId: itemV.venue_id,
                scheduleId: itemV.schedule_id,
                venueName: itemV.venue_name,
                venueImage: itemV.venue_image,
                venueAddress: itemV.venue_address,
                slotArr: timeSlotArr,
            });
        });

        // 4. 返回带 total 的数据
        res.status(200).json({
            code: 200,
            msg: '查询成功！',
            data,
            total
        });

    } catch (error) {
        console.error('查询失败！', error);
        res.status(500).json({ code: 500, msg: '服务器内部错误！' });
    }
})

// 用户预约：单人、多人（生成邀请码）
// .post('/insertVenueRecords',verifyToken,async(req,res)=>{
//     const {scheduleId,startTime,endTime,maxParticipants} = req.body;

//     //最终邀请码格式：时段id&发起人id&随机n位字符
//     const id = req.userId;//用户id
    
//     // console.log(startTime,endTime);
//     // return ;
//     try{
//         // 合法性校验
//         if(!id && isNaN(Number(id))){
//             return res.status(400).json({
//                 code:400,
//                 msg:'参数错误，操作非法！',
//             })
//         };
//         // 生成邀请码
//         let rawInfo = '';//明文邀请码
//         if(maxParticipants && Number(maxParticipants) >= 2){
//             // 1. 生成2位随机因子（由小写字母和数字组成）
//             // 优化后的拼接逻辑
//             const baseInfo = `${scheduleId}&${id}`;
//             // 如果基础信息已经很长了，就只加 1 位随机数，否则加 2 位
//             const nonceLen = baseInfo.length >= 13 ? 1 : 2; 
//             const nonce = Math.random().toString(36).slice(-nonceLen);
//             // 2. 时段ID&用户ID&随机因子
//             rawInfo = `${scheduleId}&${id}&${nonce}`;
//         }
//         const invitationCode = rawInfo ? encrypt(rawInfo) : '';//加密后的邀请码
//         // const decryptedCode = decrypt(invitationCode);//解密还原后的邀请码

//         const insertedId = await userModle.insertVenueRecords(invitationCode,scheduleId,computingTime(startTime),computingTime(endTime),Number(id),maxParticipants);
        
//         if(insertedId){
//             res.status(200).json({
//                 code:200,
//                 msg:'预约成功！',
//                 timeSlotId:insertedId,
//                 // 插入成功则直接返回邀请码：
//                 invitationCode,
//             });
//         }else{
//             // 400用来表示客户端请求失败，而404表示未找到资源
//             res.status(400).json({
//                 code:400,
//                 msg:'预约失败！',
//             });
//         };
//     }catch(error){
//         logError(error,'@user.js @/insertVenueRecords');
//         res.status(500).json({
//             code:500,
//             msg:'服务器内部错误！',
//         });
//     }
// })
// 预约逻辑（new）
.post('/insertVenueRecords', verifyToken, async (req, res) => {
    const { scheduleId, startTime, endTime, maxParticipants } = req.body;

    const userId = req.userId;

    try {
        // 直接转换为数字，防止前端传的是字符串类型的数字 "240"
        const startSlot = Number(startTime);
        const endSlot = Number(endTime);
        const finalMax = Number(maxParticipants) || 1;

        // 2. 调用 Model 层（直接传入处理好的分钟数）
        const { insertedId, invitationCode } = await userModle.insertVenueRecords(
            scheduleId,
            startSlot,
            endSlot,
            userId,
            finalMax
        );

        res.status(200).json({
            code: 200,
            msg: '预约成功！',
            data: {
                timeSlotId: insertedId,
                invitationCode: invitationCode
            }
        });

    } catch (error) {
        // --- 业务逻辑错误分类响应 ---
        const errorMap = {
            'APPOINTMENT_TIME_PAST': { status: 400, msg: '预约失败：该时段已过期，请选择未来的时间。' },
            'CREDIT_TOO_LOW': { status: 403, msg: '预约失败：您的信誉分过低或账号异常，请联系管理员。' },
            'INSUFFICIENT_CREDIT_FOR_GROUP': { status: 403, msg: '预约失败：发起团队预约需要信誉分 ≥ 7。' },
            'TIME_OVERLAP': { status: 409, msg: '预约失败：该时段已被他人占用。' },
            'SCHEDULE_NOT_FOUND': { status: 404, msg: '预约失败：该日期场地未开放。' }
        };

        const errorInfo = errorMap[error.message];
        if (errorInfo) {
            return res.status(errorInfo.status).json({ code: errorInfo.status, msg: errorInfo.msg });
        }

        // 兜底错误处理
        logError(error, '@insertVenueRecords');
        res.status(500).json({ code: 500, msg: '服务器繁忙，请稍后再试' });
    }
})



// 获取场地信息
.get('/getVenueReservationInfo',async(req,res)=>{
    const {venueId,scheduleDate} = req.query;
    try{
        const data = await userModle.getVenueReservationInfo(venueId,scheduleDate);
        if(data && data.length >0){
            res.status(200).json({
                code:200,
                msg:'获取成功！',
                data,
            });
        }else{
            res.status(404).json({
                code:404,
                msg:'没有找到相关信息！',
            })
        };
    }catch(error){
        console.error('查询失败！',error);
        res.status(500).json({
            code:500,
            msg:'服务器内部问题！',
        });
    }
})
// 获取邀请码
.get('/getBespeakCode',async(req,res)=>{
    const {id,userId} = req.query
    let results = null;
    try{
        if(!id || typeof id !== 'string'){
            return res.status(400).json({
                code:400,
                msg:'参数无效！',
            });
        }
        
        results = await userModle.getBespeakCode(id);
        if(Number(results[0]['creator_user_id']) !== Number(userId)){
            return res.status(200).json({
                code:200,
                msg:'当前用户无权限查看！',
            });
        }

        if(results && results.length > 0){
            return res.status(200).json({
                code:200,
                data:results,
            });
        }else{
            return res.status(404).json({
                code:404,
                msg:'未找到对应记录！',
            });
        }
        
    }catch(error){
        console.error('查询失败！',error);
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    }
})
// 取消预约
.patch('/cancelReservation', async (req, res) => {
    const { userId, timeSlotId } = req.body;
    const conn = await db.getConnection(); // 获取数据库连接
    
    try {
        await conn.beginTransaction();
        
        // 1. 获取并锁定时段记录
        const [slot] = await conn.query(`
            SELECT * FROM time_slots 
            WHERE id = ? 
            FOR UPDATE
        `, [timeSlotId]);
        
        if (!slot.length) throw new Error('预约记录不存在');
        
        const currentSlot = slot[0];
        
        // 2. 验证用户权限（必须是发起人）
        if (currentSlot.creator_user_id !== userId) {
            throw new Error('无权操作');
        }
        
        // 3. 检查状态是否允许取消
        const allowedStatuses = ['pending', 'in_progress'];
        if (!allowedStatuses.includes(currentSlot.status)) {
            throw new Error(`当前状态${currentSlot.status}不可取消`);
        }
        
        // 4. 更新状态为取消
        await conn.query(`
            UPDATE time_slots 
            SET status = 'cancelled'
            WHERE id = ?
        `, [timeSlotId]);
        
        await conn.commit();
        
        res.status(200).json({
            code: 200,
            msg: '取消成功！'
        });
    } catch (error) {
        await conn.rollback();
        
        if (error.message.includes('无权操作')) {
            res.status(403).json({ code: 403, msg: error.message });
        } else if (error.message.includes('不可取消')) {
            res.status(409).json({ code: 409, msg: error.message });
        } else if (error.message.includes('预约记录不存在')) {
            res.status(404).json({ code: 404, msg: error.message });
        } else {
            console.error('系统错误:', error);
            res.status(500).json({ code: 500, msg: '服务器内部错误' });
        }
    } finally {
        conn.release();
    }
})

// 邀请码预约
// 待完善：并发问题待解决！！！
// .patch('/addParticipants',verifyToken,async(req,res)=>{
//     const {bespeakCode} = req.body;//传入参与者（受邀者）的id以及邀请码（不需要传入受邀者的id了）
//     const inviteeId = req.userId;//获取使用邀请码的用户
//     // 获取邀请码中的有用信息：该邀请码对应的时段id
//     // 解密
//     const info =  decrypt(bespeakCode);

//     const codeInfo = bespeakCode.split('&')
//     const timeSlotId = codeInfo[0];
//     const codeStr = codeInfo[1];//为8位随机字符串（由前端nanoid生成）（无用了）
//     // 1：验证其是否为空(即使前端已经验证)
//     if(!bespeakCode || !inviteeId){
//         return res.status(400).json({
//             code:400,
//             msg:'邀请码或参与者id不能为空！',
//         }); 
//     };
//     // 2：验证邀请码格式
//     if(!bespeakCode.includes('&')){
//         return res.status(400).json({
//             code:'400',
//             msg:'邀请码格式错误！',
//         });
//     };
//     // 3：验证邀请码格式
//     if(codeInfo.length < 2){
//         return res.status(400).json({
//             code:400,
//             msg:'邀请码格式错误！',
//         });
//     };
//     // 4：验证邀请码各段内容不为空（仅论证主要信息）
//     if(!codeInfo[0] || !codeInfo[1]){
//         return res.status(400).json({
//             code:400,
//             msg:'邀请码格式错误！',
//         });
//     };

//     try{
//         // 查询发起人的id
//         const initiatorInfo = await userModle.getUserIDFromTimeSlot(timeSlotId);
//         const initiatorId = initiatorInfo[0]['creator_user_id'];
//         const maxPparticipants = initiatorInfo[0]['max_participants'];//最大人数
//         const currentPparticipants = initiatorInfo[0]['current_participants']// 当前人数
//         const now = new Date();
//         const createdTime = new Date(initiatorInfo[0]['created_at']);
//         const expirationTime = new Date(createdTime.getTime() + 30 * 60 * 1000);
//         // 检查邀请码的时效性
//         if(now > expirationTime){
//             return res.status(200).json({
//                 code:200,
//                 msg:'邀请码已过期！',
//             });
//         }
//         if(currentPparticipants > maxPparticipants){
//             return res.status(200).json({
//                 code:200,
//                 msg:'已满员！',
//             });
//         };
//         // 判断是否是发起人自身 
//         if(inviteeId == initiatorId){
//             return res.status(200).json({
//                 code:200,
//                 msg:'不能邀请自己！',
//             });
//         };
//         // 检查受邀用户是否已参与预约
//         const isAlreadyExist = await userModle.affirmParticipantId(timeSlotId,inviteeId);
//         if(isAlreadyExist){
//             return res.status(200).json({
//                 code:200,
//                 msg:'已预约！无需重复预约。',
//             });
//         }

//         const results = await userModle.updateSlotParticipants(timeSlotId,inviteeId);
//         if(results.affectedRows > 0 && results){
//             res.status(200).json({
//                 code:200,
//                 msg:'预约成功！',
//             });
//         }else{
//             res.status(200).json({
//                 code:200,
//                 msg:'预约失败！',
//             });
//         }
//     }catch(error){
//         res.status(500).json({
//             code:500,
//             msg:'服务器内部错误！',
//         });
//     };
// })
// 邀请码预约、新（通过）
.patch('/addParticipants', verifyToken, async (req, res) => {
    const { bespeakCode } = req.body;
    const inviteeId = req.userId;

    // 1. 基础非空校验
    if (!bespeakCode) {
        return res.status(400).json({ code: 400, msg: '邀请码不能为空！' });
    }

    if (scheduleId === undefined || startTime === undefined || endTime === undefined) {
        return res.status(400).json({ code: 400, msg: '请求参数不完整' });
    }
    try {
        // 2. 解密并解析邀请码
        const decryptedStr = decrypt(bespeakCode); 
        if (!decryptedStr || !decryptedStr.includes('&')) {
            return res.status(400).json({ code: 400, msg: '无效的邀请码格式！' });
        }

        const codeInfo = decryptedStr.split('&');
        const timeSlotId = codeInfo[0]; 

        // 3. 调用 Model 执行事务逻辑
        await userModle.joinSlotByInvitation(timeSlotId, inviteeId);

        // 4. 成功响应
        res.status(200).json({
            code: 200,
            msg: '恭喜，加入预约成功！'
        });

    } catch (error) {
        // 5. 错误分类处理
        let status = 200; 
        let message = '预约失败，请稍后再试';

        switch (error.message) {
            case 'CREDIT_TOO_LOW': 
                status = 403;
                message = '加入失败：您的信誉分过低，暂时无法参与任何预约活动！'; 
                break;
            case 'SLOT_NOT_FOUND': message = '该预约时段不存在！'; break;
            case 'SLOT_INVALID': message = '该预约已取消或已失效！'; break;
            case 'CODE_EXPIRED': message = '邀请码已过期（有效时间30分钟）！'; break;
            case 'SLOT_FULL': message = '加入失败：该时段名额已满！'; break;
            case 'IS_INITIATOR': message = '您是该预约的发起人，无需再次加入！'; break;
            case 'ALREADY_JOINED': message = '您已在参与者名单中，请勿重复操作！'; break;
            default:
                logError(error, '@user.js /addParticipants');
                status = 500;
                message = '服务器内部错误';
        }

        res.status(status).json({ code: status, msg: message });
    }
})


// 更新前端场地时段预约信息
.patch('/updateTimeSlot', async(req, res) => {
    const {venueId, scheduleDate} = req.body;
    try{
        const results = await userModle.getNewTimeSlot(venueId, scheduleDate);
        
        // 这里需要先检查results是否为空
        if (!results || results.length === 0) {
            return res.status(404).json({
                code: 404,
                msg: '当前场地预约信息异常！',
            });
        }
        
        // 只有在有结果的情况下才提取scheduleId
        let scheduleId = results[0].scheduleId;
        let processedSlots = [];
        
        // 处理每个时段
        results.forEach(item => {
            if (item.start_time && item.end_time) {
                processedSlots.push({
                    id: item.time_slots_id,
                    time: calculationPeriod(item.start_time, item.end_time),
                    waitlist: item.waitlist_count || 0, // 当前候补人数
                    maxWaitlist: item.max_waitlist || 0, // 最大候补人数
                });
            }
        });
        
        // 添加边界标记
        processedSlots.push({
            id: null,
            time: [840, 840],
            isBoundary: true
        });
        processedSlots.unshift({
            id: null,
            time: [0, 0],
            isBoundary: true
        });
        
        // 排序
        processedSlots.sort((a, b) => a.time[0] - b.time[0]);
        
        res.status(200).json({
            code: 200,
            msg: '切换成功！',
            scheduleId,
            data: processedSlots,
        });
        
    } catch(error) {
        console.error('更新时段信息失败:', error);
        res.status(500).json({
            code: 500,
            msg: '服务器内部错误！',
        });
    }
})
// 实时获取场地使用情况
.get('/getServiceCondition',async(req,res)=>{
    // const {} = req.query;
    try{
        const serviceData = await userModle.getServiceCondition();
        const totalSpaceNum = await userModle.getTotalSpaceNum();
        const data = [];
        
        totalSpaceNum.forEach((itemT)=>{
            serviceData.forEach((itemS)=>{
                if(itemS.category === itemT.category){
                    data.push({
                        category: itemS.category,
                        freeNum: itemT.venue_num - itemS.venue_num,//空闲状态
                        using: itemS.venue_num,//被占用
                    });
                    return; //找到直接返回
                }
            });
        });
        
        res.status(200).json({
            code:200,
            msg:'查找成功！',
            data,
        })

    }catch(error){
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    };

})
// 写入用户计划
.post('/insertUserPlan',verifyToken,async(req,res)=>{
    // 传入用户id、以及计划类型planType和计划日期planDate、计划完成状态completeStatus以及计划内容planDetail
    // 补充参数：planYear、planMonth
    const id = req.userId;
    const {planType,planDate,planDetail,planMonth,planYear} = req.body;
    
    try{
        const results = await userModle.insertUserPlan(id,planType,planDetail,planDate,planMonth,planYear);

        if(results && results.affectedRows > 0){
            // console.log(userId,planType,planDetail,planDate,planMonth,planYear,results);
            res.status(200).json({
                code:200,
                msg:'添加成功！',
            });
        }else{
            res.status(400).json({
                code:400,
                msg:'添加计划失败！',
            })
        };
    }catch(error){
        logError(error,'@user.js @/insertUserPlan');
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    };
})
// 获取用户计划
.get('/getUserPlan',verifyToken,async(req,res)=>{
    // 获取用户的计划记录，需要的查询参数如下：
    // 用户id、计划类型daily以及计划类型对应的日期信息。

    const id = req.userId;
    const {planType,planDate,planMonth,planYear} = req.query;

    try{
        // 返回数据格式为一个个子项包含预约信息的的对象的数组
        const results = await userModle.getUserPlan(id,planType,planDate,planMonth,planYear);
        
        res.status(200).json({
            code:200,
            msg:'响应成功！',
            data:results,
        })
    }catch(error){
        logError(error,'@user.js @/getUserPlan');
        res.status(500).json({
            code:500,
            msg:'服务器内部错误!',
        });
    }
})
// 删除用户计划
.delete('/deleteUserPlan',async(req,res)=>{
    const {planId} = req.query;
    
    try{
        const results = await userModle.deleteUserPlan(planId);
        if(results && results.affectedRows > 0){
            res.status(200).json({
                code:200,
                msg:'删除成功！',
            });
        }else{
            res.status(400).json({
                code:400,
                msg:'计划未找到！',
            });
        }

    }catch(error){
        logError(error,'@user.js @/deleteUserPlan');
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    }
})
.patch('/updatePlanStatus',async(req,res)=>{
    const {planId} = req.body;

    try{
        const results = await userModle.updatePlanStatus(planId);
        if(results && results.affectedRows > 0){
            res.status(200).json({
                code:200,
                msg:'更新成功！',
            });
        }else{
            res.status(400).json({
                code:400,
                msg:'计划不存在！',
            });
        }

    }catch(error){
        console.log('错误方法patch，错误位置updatePlanStatus：',error);
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    }
})


// 候补预约
/* .post('/alternateReservation',verifyToken,async(req,res)=>{
    const {slotId,bespeakNum,priority_score} = req.body;
    const userId = req.userId;

    console.log(userId,slotId,bespeakNum,priority_score);

    // return;
    try{
        const results1 = await userModle.getUserIDFromTimeSlot(slotId,true);
        if(results1[0].waitlist_count >= results1[0].max_waitlist){

            return res.status(200).json({
                code:200,
                msg:'当前候补队列已满！',
            });
        }
        // 还缺少对单人情况下的不生成邀请码的判断（后续实现）
        const results2 = await userModle.insertAlternateRecord(slotId,userId,bespeakNum,priority_score);
        const waitlist_code = `${results2.insertId}&${userId}&${slotId}&${nanoid(8)}`;//候补码生成逻辑
        await userModle.updateWaitlistTeams(results2.insertId,waitlist_code);
        // 执行成功时应该同步更新时段表中的当前候补队伍数量，已经通过触发器实现，现在要做的是三端都需要规范化当前候补队伍数量和最大候补队伍数量这两个这段的值（即确定当前候补预约是否允许）

        res.status(200).json({
            code:200,
            msg:'响应成功！',
        });
    }catch(error){
        console.error(error);
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    }

}) */
// （候补预约）（new）
.post('/alternateReservation', verifyToken, async (req, res) => {
    const { slotId, bespeakNum } = req.body; // priority_score 删掉，后端自动获取
    const userId = req.userId;

    // 参数防御
    const finalSize = Number(bespeakNum) || 1;
    if (finalSize < 1 || finalSize > 10) {
        return res.status(400).json({ code: 400, msg: '人数设置不合法' });
    }

    try {
        // 1. 执行 Model
        const result = await userModle.insertAlternateRecord(slotId, userId, finalSize);

        // 2. 候补码逻辑
        let waitlist_code = null;
        if (finalSize >= 2) {
            const rawInfo = `${result.insertId}&${userId}&${slotId}`;
            waitlist_code = encrypt(rawInfo); 
            await userModle.updateWaitlistTeams(result.insertId, waitlist_code);
        }

        res.status(200).json({
            code: 200,
            msg: '候补预约发起成功！',
            data: {
                waitlistId: result.insertId,
                waitlistCode: waitlist_code
            }
        });

    } catch (error) {
        // --- 错误分类捕获 ---
        if (error.message === 'CREDIT_TOO_LOW') {
            return res.status(403).json({ code: 403, msg: '候补失败：信誉分过低或账号异常' });
        }
        if (error.message === 'ALREADY_IN_WAITLIST') {
            return res.status(409).json({ code: 409, msg: '您已在该时段候补名单中' });
        }
        if (error.message === 'WAITLIST_FULL') {
            return res.status(409).json({ code: 409, msg: '当前候补队列已满' });
        }
        if (error.message === 'SLOT_NOT_FOUND') {
            return res.status(404).json({ code: 404, msg: '预约时段不存在' });
        }
        
        logError(error, '@alternateReservation');
        res.status(500).json({ code: 500, msg: '服务器内部错误' });
    }
})


// 候补码预约
/* .post('/bespeakByAlternateCode',verifyToken,async(req,res)=>{
    // 用户id、候补码（其中候补码应该包含候补id、时段id、团队负责人id等信息）
    const {alternateCode} = req.body;
    // 获取候补码中的相关信息，判断是否符合相应要求
    const codeArr = alternateCode.split('&');
    const waitlistId = codeArr[0];//候补id
    const initiator = codeArr[1];//候补发起人id
    const slotId = codeArr[2];//时段id
    
    const userId = req.userId;

    console.log(userId,alternateCode);
    return;
    try{
        // 判断使用候补码预约的合法性
        if(codeArr.length !== 4 || codeArr[3].length !== 8){//判断候补码的格式是否正确
            return res.status(422).json({
                code: 422,
                msg:'候补码错误！',
            });
        }

        if(Number(userId) === Number(waitlistId)){//使用候补码的不能是发起人
            return res.status(422).json({
                    code:422,
                    msg:'候补发起人不能使用候补码加入候补队伍',
                });
        }

        const results = await userModle.getWaitlistTeamInfo(waitlistId);
        if(results[0]['waitlist_code'] !== alternateCode){
            return res.status(422).json({
                code:422,
                msg:'候补码不匹配',
            });
        }

        if(results[0]['team_size'] <= results[0]['current_size']){
            return res.status(200).json({
                    code:200,
                    msg:'当前候队伍补人数已满！',
                  }); 
        }

        if(results[0]['status'] !== 'waiting'){
            return res.status(200).json({
                    code:200,
                    msg:'当前候补码已无法使用！',
                });
        };

        // 此处判断候补码是否过期
        let periodOfValidity = new Date(results['created_at']);// 有效期
        periodOfValidity = new Date(periodOfValidity.getMinutes() + 30);
        let currentTime = new Date(date);
        if(currentTime > periodOfValidity){
            return res.status(422).json({
                code:422,
                msg:'当前候补码已过期！',
            });
        };

        // 判断候补人是否已在候补队伍中
        const results1 = await userModle.getWaitlistMemberInfo(waitlistId);
        const isExist = results1.some((item)=>{
            return Number(item.user_id) === Number(userId);
        });
        if(isExist){
            return res.status(422).json({
                code:422,
                msg:'已在候补队伍中！无需重复候补预约！',
            });
        }

        // 通过上述要求后即可将该记录插入到候补成员表中
        await userModle.insertWaitlistMember(userId,waitlistId);

        res.status(200).json({
            code:200,
            msg:'候补成功！',
        });

    }catch(error){
        console.error({
            time: date.toLocaleString(),
            info: error.message,
            stack: error.stack,
        });
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    }

}) */
// 候补码预约（new）
.post('/bespeakByAlternateCode', verifyToken, async (req, res) => {
    const { alternateCode } = req.body;
    const userId = req.userId;

    // 参数初校验
    if (!alternateCode) return res.status(400).json({ code: 400, msg: '候补码不能为空' });

    try {
        // 1. 解密与格式拆解（路由层处理，因为这属于请求解析）
        const decryptedStr = decrypt(alternateCode); 
        const [waitlistId, initiatorId, slotId] = decryptedStr.split('&');

        if (!waitlistId || !initiatorId) throw new Error('INVALID_FORMAT');

        // 2. 身份前置校验
        if (Number(userId) === Number(initiatorId)) {
            return res.status(422).json({ code: 422, msg: '候补发起人无需再次加入' });
        }

        // 3. 调用 Model 层封装好的事务逻辑
        await userModle.joinWaitlistTransaction(waitlistId, userId, alternateCode);

        // 4. 成功响应
        res.status(200).json({ code: 200, msg: '成功加入候补队伍！' });

    } catch (error) {
        // 5. 错误分类映射（路由层的职责：决定给前端返回什么状态码）
        const errorConfig = {
            'INVALID_FORMAT': { status: 422, msg: '候补码格式无效' },
            'TEAM_NOT_FOUND': { status: 404, msg: '该候补队伍不存在' },
            'CODE_MISMATCH':  { status: 422, msg: '候补码不匹配或已失效' },
            'TEAM_NOT_WAITING': { status: 422, msg: '候补队伍已关闭' },
            'TEAM_FULL':      { status: 409, msg: '队伍名额已满' },
            'ALREADY_IN':     { status: 422, msg: '你已在候补队伍中' }
        };

        const config = errorConfig[error.message];
        if (config) {
            return res.status(config.status).json({ code: config.status, msg: config.msg });
        }

        logError(error,'@user.js @/bespeakByAlternateCode');
        res.status(500).json({ code: 500, msg: '服务器内部错误' });
    }
})



// 获取用户候补记录
.get('/getUserAlternateRecord',async(req,res)=>{
    const { userId } = req.query;

    try{
        const results = await userModle.getAlternateRecord(userId);
        const data = [];
        results.forEach((item)=>{
            data.push({
                waitlistDate: `${item.waitlist_date} ${item.start_time}`,
                duration: calculationDuration(item.start_time,item.end_time),
                waitlistTeamId: item.waitlist_team_id,
                waitlistParticipants: item.waitlist_participants,
                venueName: item.venue_name,
                venueAddress: item.venue_address,
                userRole: item.user_role,
                waitlistStatus: item.waitlist_status,
            });
        });

        res.status(200).json({
            code:200,
            data,
        })
    }catch(error){
        console.error({
            time: date.toLocaleString(),
            where: '@user.js @getUserAlternateRecord',
            stack: error.stack,
            message: error.message,
        });
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    }
})
// 获取候补码
.get('/getCandidateCode',async(req,res)=>{
    const {userId,waitlistTeamId} = req.query;

    try{
        const results = await userModle.getCandidateCode(waitlistTeamId);

        if(!results){
            return res.status(400).json({
                code:400,
                msg:'参数异常！',
            });
        };

        if(results.length == 0){
            return res.status(400).json({
                code:400,
                msg:'该记录不存在！',
            });
        }

        if(results[0]['team_leader_id'] != userId){
            return res.status(422).json({
                code:422,
                msg:'当前操作无权限！',
            });
        }
        
        res.status(200).json({
            code:200,
            data:results[0]['waitlist_code'],
        });

    }catch(error){
        console.error({
            time: date.toLocaleString(),
            where: '@user.js @getCandidateCode',
            stack: error.stack,
            message: error.message,
        });
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    };
})
// 取消候补预约
.patch('/cancelPendingReservation',async(req,res)=>{
    const {userId,waitlistTeamId} = req.query;

    try{
        // 需要判断当前用户是否有权限取消（仅候补发起人能够取消）
        const results = await userModle.getCandidateCode(waitlistTeamId);
        if(results[0]['team_leader_id'] != userId){
            return res.status(422).json({
                code:422,
                msg:'非候补发起人，当前操作无权限！',
            });
        }
        // 符合条件则允许取消候补预约
        await userModle.cancelPendingReservation(waitlistTeamId);
        
    }catch(error){
        console.error({
            time: date.toLocaleString(),
            where: '@user.js @cancelPendingReservation',
            stack: error.stack,
            message: error.message,
        });
        res.status(500).json({
            code:500,
            msg:'服务器内部错误！',
        });
    };
})
// 文件上传（图片上传功能）
// 该功能管理员部分也会用到，后续可以提取为公共方法（有时间的话。。。）
.post('/storagePicture',verifyToken,uploadAvatar.single('avatar'),async(req,res)=>{
    // const baseUrl = `${req.protocol}://${req.get('host')}/`;//动态构建基本URL
    // const filePath = path.join('uploads/avatar',req.file.filename);//文件在服务器中的路径
    // console.log(req.file.path,'-----',filePath);
    // const {userAccount} = req.body;
    // console.log(userAccount);
    const id = req.userId;
    const user_account = req.userAccount;
    if(!id && isNaN(Number(id)) && !user_account){
        return res.status(400).json({
            code:400,
            msg:'参数错误，操作非法！',
        })
    }
    if(req.file){
        // console.log('上传的文件信息：',req.file.filename);
        const avatarUrl = getImageAddress(req,'uploads/avatar');
        // 此处更新数据库中用户头像字段
        // await userModle.userInfoModify(req.body.userAccount,null,null,null,null,null,avatarUrl);
        await userModle.updateAvatarURL(id,avatarUrl);
        res.status(200).json({
            msg:'文件上传成功！',
            avatarUrl,
            // filename:req.file.filename
        });
    }else{
        res.status(400).json({
            msg:'文件上传失败！',
        });
    }
})

;

module.exports = router;