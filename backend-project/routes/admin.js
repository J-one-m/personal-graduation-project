const express = require('express');
const adminModle = require('../models/adminModle');
const router = express.Router();
const logError = require('../utils/logError');
const { uploadSiteCategory, uploadSiteVenue, uploadAdminAvatar } = require('../middlewares/upload');
const getImageAddress = require('../utils/getImageAddress');
const {executeQuery} = require('../utils/dbUtils');
// const date = new Date();//放在此处不合理，时间是固定的，当服务器启动后

// 应该是model写成了modle（就这样吧）
router
// 保存分类图片
.post('/uploadCategory',uploadSiteCategory.single('siteCategory'),async(req,res)=>{
    const siteCategoryUrl = getImageAddress(req,'uploads/siteCategory');

    if(!siteCategoryUrl){
        return res.status(400).json({
            code:400,
            msg:'图片上传失败！',
        })
    };
    
    res.status(200).json({
        code:200,
        data:siteCategoryUrl,
    });
    console.log('/uploadUrl',siteCategoryUrl);
})
// 保存场地预览图片
.post('/uploadVenue',uploadSiteVenue.single('siteVenue'),async(req,res)=>{
    const siteVenueUrl = getImageAddress(req,'uploads/siteVenue');
    if(!siteVenueUrl){
        return res.status(400).json({
            code:400,
            msg:'图片上传失败！',
        });
    }
    res.status(200).json({
        code:200,
        data:siteVenueUrl,
    });
    console.log('/uploadUrl',siteVenueUrl);
})
.get('/checkAffiche',async(req,res)=>{
    // 获取公告信息
    const {start,end,offset,limit} = req.query;
    const date = new Date();
    // 基础校验：确保日期参数存在
    if (!start || !end) {
        return res.status(400).json({
            code: 400,
            msg: '请选择完整的日期范围',
        });
    }

    try{
        const results = await adminModle.getAffiche(start,end,offset,limit);
        if(!results){
            return res.status(400).json({
                code:400,
                msg:'参数异常',
            })
        }

        res.status(200).json({
            code:200,
            data:results || [],
            msg: '查询成功！',
            hasMore: results.length === parseInt(limit)
        });

    }catch(error){
        console.error({
            time: date.toLocaleString(),
            where: '@admin.js @/checkAffiche',
            stack: error.stack,
            message: error.message,
        });
        res.status(500).json({
            code:500,
            msg:'获取公告失败，请稍后再试！',
        });
    }
})
.post('/issueAffiche',async(req,res)=>{
    let {id,title,content} = req.body;
    

    if(!id){
        return res.status(400).json({
            code:400,
            msg:'用户数据异常！',
        });
    }

    if(!title || !content){
        return res.status(400).json({
            code:400,
            msg:'标题公告或内容为空，请填写完毕后再发布！',
        });
    }
    const date = new Date();
    // 获取时间并格式化，提取并补零
    const pad = (num) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    const pubdate = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    
    try{
        const result = await adminModle.issueAffiche(id,pubdate,title,content);

        res.status(200).json({
            code:200,
            msg:'成功发布！',
        });
    }catch(error){
        console.error({
            time: date.toLocaleString(),
            where: '@admin.js @/issueAffiche',
            stack: error.stack,
            message: error.message,
        });
        res.status(500).json({
            code:500,
            msg:'服务器问题，发布公告失败！',
        });
    };

})
// 获取待审核的失物信息
.get('/getPendingReviewInfo',async(req,res)=>{
    try{
        const results = await adminModle.getPendingReviewInfo();
        
        res.status(200).json({
            code:200,
            data:results || [],
            msg: results.length === 0 ? '当前暂无待审核信息' : '查询成功'
        });
    }catch(error){
        console.error({
            // time: date.toLocaleString(),换成下面更好：直接实例化
            time: new Date().toLocaleString(),
            where: '@admin.js @/getPendingReviewInfo',
            stack: error.stack,
            message: error.message,
        });
        res.status(500).json({
            code:500,
            msg:'服务器问题，获取待审核列表失败！',
        });
    };
})
// 驳回用户发布的审核信息
.patch('/rejectLostInfo',async(req,res)=>{
    const {id,rejectReason} = req.body;

    if (!id || isNaN(Number(id)) || !rejectReason?.trim()) {
        return res.status(400).json({
            code: 400,
            msg: '驳回失败：必须填写驳回理由！',
        });
    }

    try{
        const {affectedRows} = await adminModle.rejectLostInfo(id,rejectReason);

        if(!affectedRows){
            return res.status(400).json({
                code:400,
                msg:'驳回失败：未找到该条审核记录，可能已被处理！',
            });
        }

        res.status(200).json({
            code:200,
            msg:'成功驳回！',
        })
    }catch(error){
        console.error({
            // time: date.toLocaleString(),换成下面更好：直接实例化
            time: new Date().toLocaleString(),
            where: '@admin.js @/rejectLostInfo',
            stack: error.stack,
            message: error.message,
        });
        res.status(500).json({
            code:500,
            msg:'服务器繁忙，驳回操作失败！',
        });
    }
})
.patch('/approveLostInfo',async(req,res)=>{
    const {id} = req.body

    // 判断id是否存在且是否是数字
    if(!id || isNaN(Number(id))){
        return res.status(400).json({
            code:400,
            msg:'当前操作不合法！',
        });
    }

    try{
        const {affectedRows} = await adminModle.approveLostInfo(id);

        if (affectedRows === 0) {
            return res.status(404).json({ code: 404, msg: '审核失败：该记录不存在或已被处理。' });
        }

        res.status(200).json({
            code:200,
            msg:'审核已通过！',
        });
    }catch(error){
        console.error({
            time: new Date().toLocaleString(),
            where: '@admin.js @/approveLostInfo',
            stack: error.stack,
            message: error.message,
        });
        res.status(500).json({
            code:500,
            msg:'服务器问题，通过失败！',
        });
    }
})
// 获取失物信息（支持关键字、按是否找回查询）（软删除的除外）
.get('/getLostPropertyList',async(req,res)=>{
    // 查询索引、步长、关键字、是否归还（其中offset以及count是必有项）
    const {offset,count,keyWords,isRevert} = req.query;
    
    // 判断是否非法
    if(!offset || isNaN(Number(offset)) || !count || isNaN(Number(count))){
        return res.status(400).json({
            code:400,
            msg: '分页参数错误！',
        });
    }

    try{
        const {total,list} = await adminModle.getLostPropertyList(Number(offset),Number(count),keyWords,isRevert);

        res.status(200).json({
            code:200,
            msg:'查询成功！',
            data: list || [],
            total,
            hasMore:(Number(offset) + list.length) < total,
        })
    }catch(error){
        logError(error,'@admin.js @/getAllLostInfo');
        res.status(500).json({ code: 500, msg: '服务器问题，获取数据失败！' });
    }
})
// 更新找回状态
.patch('/updateLostStatus',async(req,res)=>{
    const {id,isRevert} = req.body;

    if (!id || isNaN(Number(id)) || ![0, 1].includes(Number(isRevert))) {
        return res.status(400).json({
            code: 400,
            msg: '非法操作：参数错误！'
        });
    }

    try{
        const { affectedRows } = await adminModle.updateLostStatus(id,isRevert);

        if (affectedRows === 0) {
            return res.status(404).json({
                code: 404,
                msg: '操作失败：未找到该条记录！'
            });
        }

        res.status(200).json({
            code:200,
            msg: Number(isRevert) === 1 ? '已标记为找回！' : '已撤销找回状态！',
        });
    }catch(error){
        logError(error,'@admin.js @/updateLostStatus');
        res.status(500).json({
            code:500,
            msg:'服务器问题，请稍后重试！',
        });
    }
})
// 失物软删除
.patch('/deleteLostProperty',async(req,res)=>{
    const {id} = req.body;

    if(!id || isNaN(Number(id))){
        return res.status(400).json({
            code:400,
            msg:'非法操作，参数错误！',
        })
    }

    try{
        const {affectedRows} = await adminModle.deleteLostProperty(Number(id));

        if(affectedRows === 0){
            return res.status(404).json({
                code:404,
                msg:'操作失败，未找到该条记录！',
            });
        }

        res.status(200).json({
            code:200,
            msg:'成功删除！',
        });
        
    }catch(error){
        logError(error,'@admin.js @/deleteLostProperty');
        res.status(500).json({ code: 500, msg: '服务器繁忙，请稍后重试！' });
    }
})
// 获取用户信息（目前管理员部分不显示）（后续数据库的密码应该为加密存储）
.get('/getAllUserInfo',async(req,res)=>{
    const {offset,limit,keyWords} = req.query;
    try{
        const { total, list} = await adminModle.getAllUserInfo(Number(offset), Number(limit), keyWords);

        res.status(200).json({
            code:200,
            msg:'成功获取用户数据！',
            data: list || [],
            total,
            hasMore: Number(offset) + Number(limit) < total,
        });
    }catch(error){
        logError(error,'@admin.js @/deleteLostProperty');
        res.status(500).json({ code: 500, msg: '服务器繁忙，请稍后重试！' });
    }
})
// 更新用户信息
.post('/updateUserInfo',async(req,res)=>{

    // 暂时不做对用户头像的修改（user_image）
    const {address, age, credit_score, gender, id, is_active, last_login, mailbox, phone_number, username} = req.body;

    if(!id || isNaN(Number(id))){
        return res.status(400).json({
            code:400,
            msg:'参数错误，操作非法！',
        });
    }
    try{
        const {affectedRows} = await adminModle.updateUserInfo(address, age, credit_score, gender, id, is_active, last_login, mailbox, phone_number, username);

        if(affectedRows === 0){
            return res.status(404).json({
                code:404,
                msg:'未找到该用户或数据无变化',
            });
        }

        res.status(200).json({
            code:200,
            msg:'更新成功！',
        });
        
    }catch(error){
        logError(error,'@admin.js @/updateUserInfo');
        res.status(500).json({
            code:500,
            msg:'服务器繁忙，请稍后重试！',
        });
    };
})
// 删除用户
.patch('/deleteUser',async(req,res)=>{
    const { id } = req.body;

    if(!id || isNaN(Number(id))){
        return res.status(404).json({
            code:404,
            msg:'参数错误，操作非法！',
        });
    }

    try{
        const {affectedRows} = await adminModle.deleteUser(Number(id));

        if(affectedRows === 0){
            return res.status(404).json({
                code:404,
                msg:'未找到该用户或数据无变化',
            });
        }
        
        res.status(200).json({
            code:200,
            msg:'删除成功！',
        })
    }catch(error){
        logError(error,'@admin.js @/deleteUser');
        res.status(500).json({
            code:500,
            msg:'服务器繁忙，请稍后重试！',
        });
    }
})
// 获取场地分类信息
.get('/getPlaceCategoryInfo',async(req,res)=>{
    try{
        const results = await adminModle.getPlaceCategoryInfo();

        res.status(200).json({
            code:200,
            data: results,
            msg:'获取成功！',
        });
    }catch(error){
        logError(error,'@admin.js @/getPlaceCategoryInfo');
        res.status(500).json({ code: 500, msg: '服务器繁忙，请稍后重试！' });
    }
})
// 新增场地分类
.post('/addNewCategory',async(req,res)=>{
    // 此处图片地址单独请求
    const { name, icon_mark} = req.body;

    if(!name){
        return res.status(400).json({
            code:400,
            msg:'场地名称缺失，请重新填写！',
        })
    }

    try{

        const result = await adminModle.addNewCategory(name, icon_mark);

        if(!result || result.affectedRows === 0){
            return res.status(400).json({
                code:400,
                msg:'数据库操作失败，分类未增加！',
            })
        }
        res.status(200).json({
            code:200,
            msg:'添加成功！',
        });
    }catch(error){
        logError(error,'@admin.js @/addNewCategory');
        res.status(500).json({ code: 500, msg: '服务器繁忙，请稍后重试！' });
    }
})
// 获取当前时间下场地的使用信息
.post('/getPlaceUseInfo',async(req,res)=>{
    const { id, keyWords } = req.body;
    // 明确排除0以外的空值
    if((id !== 0 && !id) || isNaN(Number(id))){
        return res.status(400).json({
            code:400,
            msg:'参数错误，操作非法！',
        });
    };

    try{
        const results = await adminModle.getPlaceUseInfo(Number(id),keyWords);
        // 在SQL查询中，即使没有数据，results通常返回的是一个空数组[]。
        // 无论有没有数据，只要查询没崩，就给200
        res.status(200).json({
        code: 200,
        data: results || [], // 确保即便没数据也返回空数组
        msg: results.length === 0 ? '该分类下暂无场地！' : '查询成功！'
    });
    }catch(error){
        logError(error,'@admin.js @/getPlaceUseInfo');
        res.status(500).json({
            code:500,
            msg:'服务器繁忙，请稍后重试！',
        });
    }
})
// 添加新的场地
.post('/insertNewPlace',async(req,res)=>{
    const {venue_name, venue_image, venue_address, category_id, max_num} = req.body;


    if(!category_id || isNaN(Number(category_id))){
        return res.status(400).json({
            code:400,
            msg:'参数错误，操作非法！',
        });
    };

    try{
        const categoryRows = await executeQuery('SELECT id FROM venue_categories WHERE id = ?', [Number(category_id)]);

        if (!categoryRows || categoryRows.length === 0) {
            return res.status(400).json({
                code: 400,
                msg: '添加失败：指定的场地分类不存在！'
            });
        };

        await adminModle.insertNewPlace(venue_name, venue_image, venue_address, Number(category_id), Number(max_num));

        res.status(200).json({
            code:200,
            msg:'新增场地成功！',
        });

    }catch(error){

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                code: 400,
                msg: `添加失败：场地名称 "${venue_name}" 已存在，请更换名称。`
            });
        }
        logError(error,'@admin.js @/insertNewPlace');
        res.status(500).json({
            code:500,
            msg:'服务器繁忙，请稍后重试！',
        });
    }
}) 
// 更新场地使用状态
.patch('/updatePlaceStatus',async(req,res)=>{
    const {id, status} = req.body;
    
    if(id === undefined || isNaN(Number(id)) || status === undefined || isNaN(Number(status))){
        return res.status(400).json({
            code:400,
            msg:'参数错误，操作非法！',
        });
    }

    try{
        const {affectedRows} = await adminModle.updatePlaceStatus(status,id);

        if(affectedRows === 0){
            return res.status(404).json({ code: 404, msg: '更新失败，未找到该场地' });
        }

        res.status(200).json({
            code:200,
            msg:'状态更新成功！',
        });
    }catch(error){
        logError(error,'@admin.js @/updatePlaceStatus');
        res.status(500).json({
            code:500,
            msg:'服务器繁忙，请稍后重试！',
        });
    };
})
// 保存场地信息更新
.patch('/savePlaceConfig',async(req,res)=>{
    const {id, venue_image, venue_name, venue_address, max_num} = req.body;
    if (!id || !venue_name || isNaN(Number(id))) {
        return res.status(400).json({ code: 400, msg:'参数错误，操作非法！', });
    }
    try{
        const {affectedRows} = await adminModle.savePlaceConfig(id, venue_name, venue_address, venue_image, max_num);
        if(affectedRows === 0){
            return res.status(404).json({ code: 404, msg: '更新失败，场地不存在' });
        }

        res.status(200).json({
            code:200,
            msg:'更新成功！',
        });
    }catch(error){
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ code: 400, msg: '场地名称已存在，请更换' });
        }
        logError(error,'@admin.js @/savePlaceConfig');
        res.status(500).json({
            code:500,
            msg:'服务器繁忙，请稍后重试！',
        });
    };
})
// 保存管理员头像
.post('/uploadAdminAvatar',uploadAdminAvatar.single('adminAvatar'),async(req,res)=>{
    const adminAvatarUrl = getImageAddress(req,'uploads/adminAvatar');
    if(!adminAvatarUrl){
        return res.status(400).json({
            code:400,
            msg:'图片上传失败！',
        });
    }
    res.status(200).json({
        code:200,
        data:adminAvatarUrl,
    });
    console.log('/uploadAdminAvatar',adminAvatarUrl);
})
// 管理员信息修改
.patch('/modifyAdminInfo',async(req,res)=>{
    const { adminName, mailbox, phone_number, id, user_image} = req.body;

    if(!id || isNaN(Number(id))){
        return res.status(400).json({
            code:400,
            msg:'错误错误，操作非法！',
        });
    };
    if(!adminName){
        return res.status(400).json({
            code:400,
            msg:'昵称不允许为空！',
        });
    }

    try{
        const { affectedRows } = await adminModle.modifyAdminInfo(adminName, mailbox, phone_number, Number(id), user_image);

        if(affectedRows === 0){
            return res.status(200).json({ code:200, msg:'资料未变动或更新成功！' });
        };

        res.status(200).json({
            code:200,
            msg:'信息更新成功！',
        });
    }catch(error){
        logError(error,'@admin.js @/modifyAdminInfo');
        res.status(500).json({
            code:500,
            msg:'服务器繁忙，请稍后重试！',
        });
    }
})
// 管理员密码修改
.patch('/modifyAdminPassword',async(req,res)=>{
    const { oldPassword, newPassword, id} = req.body;

    if(!id || isNaN(Number(id))){
        return res.status(400).json({
            code:400,
            msg:'错误错误，操作非法！',
        });
    };

    if(!oldPassword || !newPassword){
        return res.status(400).json({
            code:400,
            msg:'新旧密码不允许为空！',
        });
    };

    if(oldPassword === newPassword){
        return res.status(400).json({
            code:400,
            msg:'新旧密码一致，请重新修改！',
        })
    }

    try{

        const adminData = await adminModle.getAdminPassword(Number(id));

        if (!adminData) {
            return res.status(404).json({
                code: 404,
                msg: '该管理员账户不存在！',
            });
        }
        // 确认存在后再解构
        const { password, role } = adminData;

        if(oldPassword !== password){
            return res.status(400).json({
                code:400,
                msg:'原密码错误！',
            })
        };

        if(role !== 'admin'){
            return res.status(400).json({
                code:400,
                msg:'当前身份不符，无权限操作！',
            })
        };

        const { affectedRows } = await adminModle.modifyAdminPassword(Number(id), newPassword);

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
        logError(error,'@admin.js @/modifyAdminPassword');
        res.status(500).json({
            code:500,
            msg:'服务器繁忙，请稍后重试！',
        });
    }
})
;


module.exports = router;