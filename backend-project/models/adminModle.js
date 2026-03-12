const poolPromise = require('../db/connection');
const {executeQuery} = require('../utils/dbUtils');

const adminModle = {
    // 获取公告
    getAffiche: async(start,end,offset = 0,limit = 10)=>{
        // 通过时间来查，其中offset为起始索引，limit为索取长度（等于前端传回来的页容量）
        // 1.数据处理
        const startOffset = parseInt(offset) || 0;
        const pageLimit = parseInt(limit) || 10;
        const startTime = start + ' 00:00:00';
        const endTime = end + ' 23:59:59';
        // 2.定义查询语句
        const sql = `
            select 
                affiche_content,affiche_id,pubdate,is_visible,affiche_title
            from 
                affiche
            where
                pubdate >= ? and pubdate <= ? AND is_deleted = 0
            order by 
                pubdate desc
            limit
                ?,?;
        `;
        const params = [startTime, endTime, startOffset, pageLimit];
        let results = null;
        try{
            results = await executeQuery(sql,params);

            return results;
        }catch(error){
            throw error;
        }

    },
    // 发布公告
    issueAffiche:async(id,pubdate,title,content)=>{
        const sql = `
            insert into affiche
                (user_id,pubdate,affiche_title,affiche_content)
            values
                (?,?,?,?);        
        `;
        const params = [id,pubdate,title,content];

        try{
            const results = await executeQuery(sql,params);
            return results;
        }catch(error){
            throw error;
        };
    },
    // 获取失物信息（与用户部分重合了）
    getPendingReviewInfo:async()=>{
        const sql = `
            select 
                lp.property_id,
                lp.property_name,
                lp.property_describe,
                lp.property_image,
                lp.losePlace,
                lp.contact_way,
                lp.is_revert,
                lp.audit_status,
                lp.reject_reason,
                lp.pubdate,
                u.username AS publisher_name,
                u.user_account AS publisher_account
            from 
                lost_property lp
            join
                users u on lp.user_id = u.id
            where
                lp.is_deleted = 0 and lp.audit_status = 0
            order by 
                lp.pubdate desc;
        `
        const params = [];

        try{
            const results = await executeQuery(sql,params);

            return results;
        }catch(error){
            throw error;
        };
    },
    // 驳回用户发布的寻物信息（还是拆分成两个接口。。。）
    rejectLostInfo:async(id,rejectReason)=>{
        const sql = `
            update
                lost_property
            set
                audit_status = 2,
                reject_reason = ?
            where
                property_id = ?;
        `;
        
        const params = [rejectReason,id];

        try{
            const result = await executeQuery(sql,params);

            return result;
        }catch(error){
            throw error;
        };
    },
    // 通过用户发布的寻物启事
    approveLostInfo: async(id)=>{
        const sql = `
            update 
                lost_property
            set
                audit_status = 1
            where
                property_id = ?;
        
        `;

        const params = [id];

        try{
            const result = await executeQuery(sql,params);

            return result;
        }catch(error){
            throw error;
        };  

    },
    // 获取失物信息（支持关键字、按是否找回查询）（软删除的除外）
    // 旧的
    // getLostPropertyList: async(offset = 0, count = 21, keyWords, isRevert)=>{
    //     let sql = `
    //         SELECT 
    //             lp.property_id,
    //             lp.property_name,
    //             lp.property_describe,
    //             lp.property_image,
    //             lp.losePlace,
    //             lp.contact_way,
    //             lp.is_revert,
    //             lp.audit_status,
    //             lp.reject_reason,
    //             lp.pubdate,
    //             u.username,
    //             u.user_account
    //         FROM 
    //             lost_property lp
    //         JOIN 
    //             users u ON lp.user_id = u.id
    //         WHERE 
    //             lp.is_deleted = 0 AND lp.audit_status = 1
    //     `;
    //     const params = [];
    //     // 使用!= null可以同时排除null和undefined，但允许0和1进来,且不等于'all'时，才拼接SQL过滤条件
    //     if(isRevert !== undefined && isRevert !== null && isRevert !== '' && isRevert !== 'all'){
    //         sql += ' and lp.is_revert = ?';
    //         params.push(Number(isRevert));
    //     }

    //     if(keyWords){
    //         sql += ' and (lp.property_name LIKE ? OR u.username LIKE ? OR lp.losePlace LIKE ?)';
    //         params.push(`%${keyWords}%`, `%${keyWords}%`, `%${keyWords}%`)//模糊匹配
    //     }
        
    //     sql += `
    //         ORDER BY 
    //             lp.pubdate DESC
    //         LIMIT
    //             ?,?;
    //     `;
    //     params.push(offset,count);
    //     try{
    //         const results = await executeQuery(sql,params)

    //         return results;
    //     }catch(error){
    //         throw error;
    //     };
    // },
    getLostPropertyList: async (offset = 0, count = 21, keyWords, isRevert) => {
    // --- 1. 构建基础的 WHERE 条件和参数 ---
        let whereClauses = ['lp.is_deleted = 0', 'lp.audit_status = 1'];
        const params = [];

        // 过滤：是否归还（排除 'all'）
        if (isRevert !== 'all' && isRevert != null && isRevert !== '') {
            whereClauses.push('lp.is_revert = ?');
            params.push(Number(isRevert));
        }

        // 过滤：关键字
        if (keyWords) {
            whereClauses.push('(lp.property_name LIKE ? OR u.username LIKE ? OR lp.losePlace LIKE ?)');
            const p = `%${keyWords}%`;
            params.push(p, p, p);
        }

        const whereSql = ` WHERE ${whereClauses.join(' AND ')} `;

        try {
            // 2. 查询总记录数 (Total) 
            const countSql = `
                SELECT COUNT(*) AS total 
                FROM lost_property lp 
                JOIN users u ON lp.user_id = u.id 
                ${whereSql}
            `;
            // 注意：count 查询需要使用当前的过滤参数
            const countResult = await executeQuery(countSql, params);
            const total = countResult[0].total;

            // 3. 查询当前页列表 (List) 
            const listSql = `
                SELECT 
                    lp.property_id,
                    lp.property_name,
                    lp.property_describe,
                    lp.property_image,
                    lp.losePlace,
                    lp.contact_way,
                    lp.is_revert,
                    lp.audit_status,
                    lp.reject_reason,
                    DATE_FORMAT(lp.pubdate, '%Y-%m-%d %H:%i:%s') AS pubdate,
                    u.username AS publisher_name, 
                    u.user_account AS publisher_account
                FROM lost_property lp
                JOIN users u ON lp.user_id = u.id
                ${whereSql}
                ORDER BY lp.pubdate DESC
                LIMIT ?, ?
            `;
            // 分页参数需要追加到 params 数组末尾
            const listParams = [...params, Number(offset), Number(count)];
            const list = await executeQuery(listSql, listParams);

            // 4. 返回结果
            return {
                total,
                list
            };
        } catch (error) {
            throw error;
        }
    },
    updateLostStatus: async(id,isRevert)=>{
        const sql = `
            UPDATE lost_property 
            SET is_revert = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE property_id = ? AND is_deleted = 0 AND audit_status = 1
        `;
        const params = [isRevert,id];

        try{
            const result = await executeQuery(sql,params)

            return result;
        }catch(error){
            throw error;
        }
    },
    // 失物软删除
    deleteLostProperty: async(id)=>{
        const sql = `
            update
                lost_property
            set
                is_deleted = 1
            where
                property_id = ?;
        `;
        const params = [id];

        try{
            return await executeQuery(sql,params);
        }catch(error){
            throw error;
        }
    },
    // 获取用户信息（目前管理员部分不显示）
    getAllUserInfo: async(offset = 0, limit = 48, keyWords)=>{
        // const sql = `
        //     select 
        //         id,
        //         user_account,
        //         username,
        //         age,
        //         gender,
        //         mailbox,
        //         user_image,
        //         address,
        //         credit_score,
        //         phone_number,
        //         last_login,
        //         is_active
        //     from
        //         users
        //     where
        //         role != 'admin'
        //     limit
        //         ?,?;
        // `;

        // const params = [offset,limit];

        // try{
        //     return await executeQuery(sql,params)
        // }catch(error){
        //     throw error;
        // }

        let whereClause = ' where role != "admin" and deleted_at IS NULL';//基础的过滤条件
        const params = [];
        const searchKey = (keyWords || '').trim();
        if(searchKey){
            // 后续可能会加入对电话或者邮箱的匹配
            whereClause += " and (user_account like ? or username like ?)";
            const p = `%${keyWords}%`;
            params.push(p,p);
        };

        try{
            const countSql = `select count(*) as total from users ${whereClause}`;//查询用户总数
            const countRes = await executeQuery(countSql,params);
            const total = countRes[0].total;

            const listSql = `
                select
                    id,
                    user_account,
                    username,
                    age,
                    gender,
                    mailbox,
                    user_image,
                    address,
                    credit_score,
                    phone_number,
                    DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as last_login,
                    is_active
                from
                    users
                ${whereClause}
                order by
                    created_at desc
                limit
                    ?,?;
            `;

            const listParams = [...params,Number(offset),Number(limit)];
            const list = await executeQuery(listSql,listParams);

            return { total, list};
        }catch(error){
            throw error;
        };
    },
    updateUserInfo:async(address, age, credit_score, gender, id, is_active, last_login, mailbox, phone_number, username)=>{

        const sql = `
            update
                users
            set 
                username = ?, 
                phone_number = ?, 
                age = ?, 
                gender = ?, 
                mailbox = ?, 
                address = ?,
                credit_score = ?,
                is_active = ?,
                last_login = ?
            where
                id = ?;
        `;
        const params = [username, phone_number, age, gender, mailbox, address, credit_score, is_active, last_login, id];

        try{

            return await executeQuery(sql,params);

        }catch(error){
            throw error;
        }
    },
    // 删除用户
    deleteUser:async(id)=>{
        const sql = `UPDATE users SET deleted_at = NOW() WHERE id = ?`;
        try {
            return await executeQuery(sql, [id]);
        } catch (error) {
            throw error;
        }
    },
    // 获取场地分类信息
    getPlaceCategoryInfo: async()=>{
        const sql = `
            select
                id,
                name,
                icon_mark
            from
                venue_categories;
        `;
        try{
            return await executeQuery(sql,[]);
        }catch(error){
            throw error;
        }
    },
    // 添加新分类
    addNewCategory: async(name, icon_mark)=>{
        const sql = `
            insert into venue_categories(name,icon_mark)
            values
                (?,?);        
        `;
        try{

            return await executeQuery(sql,[name, icon_mark]);

        }catch(error){
            throw error;
        }
    },
    // 获取场地信息（全部或者根据id来选）
    getPlaceUseInfo: async(id, keyWords)=>{
        let sql = "";
        const params = [];
        const isSearch = keyWords && keyWords.trim() !== '';
        // 根据id值来决定执行语句
        if(Number(id) === 0){
            sql = `
                SELECT 
                    vc.id AS category_id,
                    vc.name AS category_name,
                    vc.icon_mark,
                    -- 该类别下所有场地的总容量之和
                    SUM(v.capacity) AS total_capacity,
                    -- 该类别下所有场地当前正在使用的总人数之和
                    IFNULL(SUM(ts.current_participants), 0) AS current_load,
                    -- 该类别下一共有多少个碎片化场地（桌子/半场）
                    COUNT(DISTINCT v.id) AS total_venues
                FROM venue_categories vc
                LEFT JOIN venues v ON vc.id = v.category_id
                LEFT JOIN schedules s ON v.id = s.venue_id AND s.schedule_date = CURDATE()
                LEFT JOIN time_slots ts ON s.id = ts.schedule_id 
                    AND ts.start_time <= CURTIME() 
                    AND ts.end_time > CURTIME() 
                    AND ts.status IN ('pending', 'in_progress')

                WHERE 1=1
            `;
            // GROUP BY vc.id, vc.name, vc.icon_mark;
            // 如果在总览页搜索，过滤分类名称
            if (isSearch) {
                sql += ` AND vc.name LIKE ? `;
                params.push(`%${keyWords}%`);
            }
            sql += ` GROUP BY vc.id, vc.name, vc.icon_mark;`;
        }else{
            sql = `
                SELECT 
                    v.id, 
                    v.venue_name, 
                    v.venue_address,
                    v.capacity,
                    v.venue_image,
                    v.is_open,
                    v.opening_time,
                    vc.name AS category_name,
                    IFNULL(SUM(ts.current_participants), 0) AS current_load
                FROM venues v
                JOIN venue_categories vc ON v.category_id = vc.id
                LEFT JOIN schedules s ON v.id = s.venue_id AND s.schedule_date = CURDATE()
                LEFT JOIN time_slots ts ON s.id = ts.schedule_id 
                    AND ts.start_time <= CURTIME() 
                    AND ts.end_time > CURTIME() 
                    AND ts.status IN ('pending', 'in_progress')
                WHERE v.category_id = ? 
            `;
            // GROUP BY v.id, vc.name;
            params.push(Number(id));
            // 如果在场地页搜索，过滤场地名称或地址
            if (isSearch) {
                sql += ` AND (v.venue_name LIKE ? OR v.venue_address LIKE ?) `;
                params.push(`%${keyWords}%`, `%${keyWords}%`);
            }
            
            sql += ` GROUP BY v.id, vc.name;`;
        }
        try{
            return await executeQuery(sql,params)
        }catch(error){
            throw error;
        };
    },
    // 添加新的场地信息
    insertNewPlace: async(venue_name, venue_image, venue_address, category_id, max_num)=>{
        const sql = `
            insert into 
                venues(venue_name, venue_image, venue_address, capacity,category_id)
            values
                (?, ?, ?, ?, ?);
        `;
        const params = [venue_name, venue_image, venue_address, Number(max_num), Number(category_id)];

        try{
            return await executeQuery(sql,params);
        }catch(error){
            throw error;
        }
    },
    // 更新场地使用状态
    updatePlaceStatus: async(status,id)=>{
        const sql = `
            update
                venues
            set
                is_open = ?
            where
                id = ?;
        `;
        
        const params = [Number(status),Number(id)];
        try{
            return await executeQuery(sql,params);
        }catch(error){
            throw error;
        }
    },
    // 保存场地信息更新
    savePlaceConfig: async(id, venue_name, venue_address, venue_image, max_num)=>{
        const sql = `
            update
                venues
            set
                venue_name = ?,
                venue_image = ?,
                venue_address = ?,
                capacity = ?
            where
                id = ?;
        `;
        const params = [venue_name, venue_image, venue_address, Number(max_num), Number(id)];
        try{
            return await executeQuery(sql, params);
        }catch(error){
            throw error;
        }
    },
    modifyAdminInfo: async(adminName, mailbox, phone_number, id, user_image)=>{
        let sql = `
            update
                users
            set
                username = ?,
                mailbox = ?,
                phone_number = ?
        `;
        const params = [adminName,mailbox,phone_number];

        if(user_image){
            sql += `
                , user_image = ?
            `;
            params.push(user_image);
        }

        sql += `
            where id = ?;
        `;

        params.push(Number(id))

        try{
            return await executeQuery(sql,params);
        }catch(error){
            throw error;
        }
    },
    // 查询用户密码，以及当前角色身份
    getAdminPassword: async(id)=>{
        const sql = `
            select 
                password,
                role
            from    
                users
            where
             id = ?;
        `;
        try{
            const res = await executeQuery(sql,[Number(id)]);
            return res.length > 0 ? res[0] : null; // 显式返回 null 方便外部判断
        }catch(error){
            throw error;
        }
    },

    modifyAdminPassword: async(id, newPassword)=>{
        const sql = `
            update 
                users
            set
                password = ?
            where
                id = ?;
        `;
        const params = [newPassword,Number(id)];

        try{
            return await executeQuery(sql,params);
        }catch(error){
            throw error;
        }
    }
};


module.exports = adminModle;