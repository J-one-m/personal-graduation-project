// 与用户相关的数据库操作代码
// 导入连接池
const poolPromise = require('../db/connection');
const db = require('../db/connection');
const {executeQuery,getTransactionConnection} = require('../utils/dbUtils');
const { encrypt, decrypt } = require('../utils/security.js');

const date = new Date;

const userModle = {
    // 用户登录
    userLogin: async(account)=>{
        const sql = `
            select
                id,
                password,
                username,
                phone_number,
                age,
                gender,
                mailbox,
                user_image,
                address,
                credit_score,
                user_account,
                role,
                is_active,
                last_login
            from
                users
            where
                user_account = ?;
        `;
        const params = [account];
        try{
            const result = await executeQuery(sql,params);
            return result;
        }catch(error){
            throw error;
        }
    },
    // 通过用户名在数据库中查找（改为用id查找）
    findByUser_account : async (id)=>{
        // const sql = 'select * from users where user_account = ?';
        const sql = `
            select
                username,
                phone_number,
                age,
                gender,
                mailbox,
                user_image,
                address,
                credit_score,
                user_account,
                role,
                is_active,
                last_login
            from
                users
            where
                id = ?;
        `;
        const params = [Number(id)];
        try{
            const result = await executeQuery(sql,params);
            return result;
        }catch(error){
            throw error;
        }
    },
    requestAfficheData: async (lastId,queryPageNum)=>{
        // let sql = 'select * from affiche';
        let sql = `
            select
                affiche_id,
                user_id,
                affiche_content,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                affiche_title
            from
                affiche
            where
                is_deleted = 0 and is_visible = 1
        `;
        const params = [];
        // 若存在最后一位id，则填入
        if(lastId){
            sql += ' and affiche_id < ?';
            params.push(lastId);
        }
        sql += ' order by affiche_id desc limit ?';
        params.push(queryPageNum+1);//多查一条，判断是否还有

        const result = await executeQuery(sql,params);
        const hasMore = result.length > queryPageNum;
        if(hasMore){
            result.pop()
        }
        // 计算下一页的游标（即当前页最后一条记录的id）
        const lastCursor = result.length > 0 ? result[result.length-1].affiche_id : null;
        return {
            data:result,
            hasMore,
            lastCursor,//用于下次请求，作为请求中的lastId参数
        };
    },
    // 用户信息更新
    userInfoModify:async(id,nickName,gender,age,mailbox,address,phoneNumber)=>{
        const connection = await poolPromise.getConnection();//获取连接
        await connection.beginTransaction();//开始事务
        let sql = ' update users set';
        const params = [];
        try{
            if(nickName){
                sql += ' username = ?,';
                params.push(nickName);
            }
            if(gender){
                sql += ' gender = ?,';
                params.push(gender);
            }
            if(age){
                sql += ' age = ?,';
                params.push(age);
            }
            if(mailbox){
                sql += ' mailbox = ?,';
                params.push(mailbox);
            }
            if(phoneNumber){
                sql += ' phone_number = ?,';
                params.push(phoneNumber);
            }
            if(address){
                sql += ' address = ?,';
                params.push(address);
            }
            // // 补充对用户头像字段的更新
            // if(user_image){
            //     sql += ' user_image = ?';
            //     params.push(user_image);
            // }
            // 去除以,结尾的,。
            const removeLastComma = (str)=>{
                return str.replace(/,$/,'');
            }
            sql = removeLastComma(sql);
            sql += ' where id = ?';
            params.push(Number(id));
            if (params.length === 0) {
                throw new Error('没有提供要修改的数据');
            };

            const [result] = await connection.execute(sql, params); // 执行查询
            if (result.affectedRows === 0) {
                throw new Error('更新失败');
            }
            await connection.commit();//提交事务
            return result;
        }catch(error){
            await connection.rollback();//如果出错，回滚事务
            throw error;
        }finally{
            connection.release();//释放连接
        }
        
    },
    // 获取用户密码
    getUserPassword:async(id,account)=>{
        const sql = `
            select
                password
            from
                users
            where
                id = ? and user_account = ?;
        `;

        try{
            const result = await executeQuery(sql,[Number(id),account]);
            return result.length > 0 ? result[0].password : null; // 显式返回null方便外部判断
        }catch(error){
            throw error;
        };
    },
    // 更新用户密码
    updateUserPassword:async(id,newPassword,userAccount)=>{
        const sql = `
            update 
                users
            set
                password = ?
            where
                id = ? and user_account = ?;
        `;
        const params = [newPassword,Number(id),userAccount];
        try{
            return await executeQuery(sql,params);
        }catch(error){
            throw error;
        }
    },
    // queryUserRecords:async(user_account)=>{
    //     let sql = `
    //         select 
    //             reservation_records.id,
    //             reservation_records.start_time, 
    //             reservation_records.end_time, 
    //             reservation_records.reservation_date, 
    //             reservation_records.reservation_address, 
    //             reservation_records.reservation_item, 
    //             reservation_records.reservation_number, 
    //             reservation_records.status 
    //         from
    //             users
    //         right join
    //             reservation_records on reservation_records.user_id = users.id
    //         where
    //             users.user_account = ?
    //     `;
    //     const params = [user_account];

    //     try{
    //         const result = await executeQuery(sql,params);
    //         return result;
    //     }catch(error){
    //         console.error('查询失败：',error);
    //         throw error;
    //     }
    // },
    getUserRecords:async(userId)=>{

        // const sql = `
        //     (
        //         SELECT
        //             ts.current_participants,
        //             ts.id as timeSlotId,
        //             v.venue_name,
        //             v.venue_address,
        //             s.schedule_date,
        //             ts.status,
        //             ts.start_time,
        //             ts.end_time,
        //             'creator' as role
        //         FROM
        //             time_slots ts
        //         JOIN schedules s ON ts.schedule_id = s.id
        //         JOIN venues v ON s.venue_id = v.id
        //         WHERE
        //             ts.creator_user_id = ?
        //     )
                
        //         UNION ALL
                
        //     (
        //         SELECT
        //             ts.current_participants,
        //             ts.id as timeSlotId,
        //             v.venue_name,
        //             v.venue_address,
        //             s.schedule_date,
        //             ts.status,
        //             ts.start_time,
        //             ts.end_time,
        //             'participant' as role
        //         FROM
        //             slot_participants sp
        //         JOIN time_slots ts ON sp.slot_id = ts.id
        //         JOIN schedules s ON ts.schedule_id = s.id
        //         JOIN venues v ON s.venue_id = v.id
        //         WHERE
        //             sp.user_id = ?
        //     )
        //         ORDER BY timeSlotId DESC
        // `;
        const sql = `
            SELECT 
                ts.id AS timeSlotId,
                v.venue_name,
                v.venue_address,
                s.schedule_date,
                ts.status,
                ts.start_time,
                ts.end_time,
                ts.reservation_type,
                ts.current_participants,
                ts.max_participants,
                ts.creator_user_id,
                CASE
                    WHEN ts.creator_user_id = ? THEN 'creator'
                    ELSE 'participant'
                END AS role
            FROM (
                -- 1. 我发起的预约 (包含直接预约和候补晋升成功的)
                SELECT ts.* FROM time_slots ts
                WHERE ts.creator_user_id = ?

                UNION
                
                -- 2. 我参与的他人发起的预约
                SELECT ts.* FROM slot_participants sp
                JOIN time_slots ts ON sp.slot_id = ts.id
                WHERE sp.user_id = ? AND ts.creator_user_id != ?
            ) AS ts
            JOIN schedules s ON ts.schedule_id = s.id
            JOIN venues v ON s.venue_id = v.id
            -- 建议过滤掉已失败或已取消的，或者根据业务需求展示
            WHERE ts.status NOT IN ('failed', 'cancelled')
            ORDER BY s.schedule_date DESC, ts.created_at DESC;
`;
        // 按时段id排序
        const params = [userId,userId,userId,userId];
        try{
            const results = await executeQuery(sql,params);
            return results;
        }catch(error){
            console.error('查询失败！',error);
            throw error;
        }
    },
    // 获取失物启事信息
    getLostPropertyData: async (pageSize, offset, keyword, type) => {
        // 1. 基础SQL和参数数组
        let whereClause = "WHERE audit_status = 1 AND is_deleted = 0";
        let queryParams = [];

        // 2. 动态拼接关键词搜索(匹配地点、名称或描述)
        if (keyword && keyword.trim() !== '') {
            whereClause += ` AND (property_name LIKE ? OR losePlace LIKE ? OR property_describe LIKE ?)`;
            const fuzzyKeyword = `%${keyword}%`;
            queryParams.push(fuzzyKeyword, fuzzyKeyword, fuzzyKeyword);
        }

        // 3. 动态拼接类型(假设前端传来的type对应数据库的is_revert)
        // 注意：这里的'0'可能被JS判定为 false，所以要判断undefined或空字符串
        if (type !== undefined && type !== null && type !== '') {
            whereClause += ` AND is_revert = ?`;
            queryParams.push(type);
        }

        // 4. 构建完整的查询SQL
        const sql = `
            SELECT
                u.username, 
                property_name, 
                losePlace, 
                property_id,
                pubdate, 
                contact_way, 
                property_describe, 
                property_image, 
                is_revert
            FROM 
                lost_property lp
            INNER JOIN
                users u ON lp.user_id = u.id
            ${whereClause}
            ORDER BY lp.property_id DESC
            LIMIT ? OFFSET ?;
        `;

        // 5. 构建总数查询SQL(用于判断hasMore)
        const countSql = `SELECT COUNT(*) as total FROM lost_property ${whereClause};`;

        try {
            // 合并查询参数：[...搜索参数, pageSize, offset]
            const result = await executeQuery(sql, [...queryParams, pageSize, offset]);
            
            // 总数查询也需要带上搜索参数
            const countResult = await executeQuery(countSql, queryParams);
            
            return {
                list: result,
                total: countResult[0].total
            };
        } catch (error) {
            throw error;
        }
    },
    // 失物表插入数据
    insertLostPropertyData:async(id,lostURL,losePlace,contactWay,describe,time,propertyName)=>{
        const sql = `
            insert into lost_property(user_id,pubdate,contact_way,property_describe,property_image,losePlace,property_name)
            values
            (?,?,?,?,?,?,?);
        `;
        const params = [id,(time && time.trim()) || new Date().toISOString().slice(0, 19).replace('T', ' '),contactWay,describe,lostURL,losePlace,propertyName];      
        try{
            const result = await executeQuery(sql,params);
            return result;
        }catch(error){
            throw error;
        }
    },
    // getVenueInfo:async(date,searchText)=>{
    //     let sql = `
    //         SELECT
    //             v.id AS venue_id,
    //             s.id AS schedule_id,
    //             venue_name,
    //             venue_image,
    //             venue_address
    //         FROM
    //             venues v
    //         JOIN 
    //             schedules s ON s.venue_id = v.id
    //         WHERE 
	// 	        Date(s.schedule_date) = Date(?)
    //     `;
    //     const params = [date];
    //     if(searchText && searchText.trim() !== ''){
    //         sql += ` AND (v.venue_name LIKE ? OR v.venue_address LIKE ?)`;
    //         const fuzzySearch = `%${searchText}%`; // 构造模糊查询字符串
    //         params.push(fuzzySearch, fuzzySearch);
    //     }
    //     try{
    //         const results = await executeQuery(sql,params);
    //         return results;
    //     }catch(error){
    //         // console.error('查询失败！',error);
    //         throw error;
    //     };
    // },
    // 获取场地使用信息（new）
    getVenueInfo: async (date, searchText, limit, offset) => {
        // 基础 SQL
        let baseSql = `
            FROM venues v
            JOIN schedules s ON s.venue_id = v.id
            WHERE Date(s.schedule_date) = Date(?)
        `;
        const params = [date];

        // 模糊搜索过滤
        if (searchText && searchText.trim() !== '') {
            baseSql += ` AND (v.venue_name LIKE ? OR v.venue_address LIKE ?)`;
            const fuzzy = `%${searchText}%`;
            params.push(fuzzy, fuzzy);
        }

        try {
            // 1. 查询总数
            const countSql = `SELECT COUNT(*) as total ${baseSql}`;
            const countRes = await executeQuery(countSql, params);
            const total = countRes[0].total;

            // 2. 查询分页数据
            const dataSql = `
                SELECT 
                    v.id AS venue_id, s.id AS schedule_id, 
                    venue_name, venue_image, venue_address 
                ${baseSql} 
                LIMIT ? OFFSET ?
            `;
            // 注意：limit 和 offset 必须是数字
            const rows = await executeQuery(dataSql, [...params, limit, offset]);

            return { total, rows };
        } catch (error) {
            throw error;
        }
    },
    //获取场地预约信息：相关信息如下：
    // 场馆id、场馆名字venue_name、场馆图片venue_image、场馆地址、

    // 以及与场馆对应的日程表：
    // 具体的日期schedule_date、日期id

    // 与日程表相关联的时段信息
    // 时段开始时间start_time、时段结束时间end_time、时段id
    getVenueReservationInfo:async(scheduleDate)=>{
        let sql = `
            select
                v.id as venue_id,
                DATE_FORMAT(s.schedule_date, '%Y-%m-%d') as schedule_date,
                ts.id as time_slots_id,
                ts.start_time,
                ts.end_time,
                ts.waitlist_count, -- '当前候补人数'
                ts.max_waitlist -- '最大候补人数'
            from
                venues v
            join 
                schedules s on v.id = s.venue_id
            join 
                time_slots ts on  s.id = ts.schedule_id
            where
                s.schedule_date = ? and ts.status NOT IN ('cancelled', 'failed')
        `;
        const params = [scheduleDate];

        try{
            const results = await executeQuery(sql,params);
            return results;
        }catch(error){
            console.error('查询失败！',error);
            throw error;
        };
    },
    getVenueId:async()=>{//获取数据库中已存在的场地id
        const sql = `
            select 
                id
            from
                venues;
        `;
        
        try{
            const results = await executeQuery(sql);
            return results;
        }catch(error){
            console.error('查询失败！',error);
            throw error;
        };

    },
    // 创建日程表，当服务器启动时，通过查询venues表中的场地id来自动创建各个场地（今明后三天）（仅执行一次）的日程记录，
    // 然后是比较日期信息，当每过一天时，各个场地的日程记录也随之更新一天。保证前端能够实时查询当天今明后三天的预约信息。
    createSchedule:async(venue_id,schedule_date)=>{
        const sql = `
            insert ignore into schedules(venue_id,schedule_date)
            values(?,?);
        `;
        const params = [venue_id,schedule_date];
        try{
            const results = await executeQuery(sql,params);
            return results;
        }catch(error){
            console.error('',error);
            throw error;
        };
    },
    // 对于场地的特定日期内插入记录
    // 需要的参数如下：
    // 场地id（venue_id）、具体的日期、起止时段信息、发起人id（必选）、邀请码invitation_code（视情况而定）、若邀请码存在，则将用户预约的人数max_participants也传入
    // insertVenueRecords:async(invitationCode,schedule_id,start_time,end_time,creator_user_id,max_participants)=>{
    //     let sql = `
    //         insert into time_slots(schedule_id,start_time,end_time,creator_user_id
    //     `;
    //     const params = [schedule_id,start_time,end_time,Number(creator_user_id)];
    //     // 若邀请码存在，则将其写入数据库（并将预约类型设置为group）
    //     if(invitationCode){
    //         sql += ',invitation_code,max_participants,reservation_type) values(?,?,?,?,?,?,?);';
    //         params.push(invitationCode);
    //         params.push(max_participants);
    //         params.push('group');
    //     }else{
    //         sql += ') values(?,?,?,?);';
    //     };
    //     try{
    //         await executeQuery(sql,params);
    //         /* 
    //             安全性：因 LAST_INSERT_ID() 是会话级别的，可以安全地在多个用户并发写入时获取插入的ID。
    //             并发管理：数据库的并发处理能力能够确保多个用户的操作不会导致数据混乱。 
    //         */
    //         // 获取插入的 ID
    //         const idResult = await executeQuery('SELECT LAST_INSERT_ID() AS id;');
    //         const insertedId = idResult[0].id;
    //         // if(invitation_code){
    //         //     const newInvitationCode = insertedId + '&' + invitation_code;
    //         //     const sqlCode = `
    //         //         update
    //         //             time_slots
    //         //         set 
    //         //             invitation_code = ?
    //         //         where
    //         //             id = ?;
    //         //     `;
    //         //     const newParams = [newInvitationCode,insertedId];
    //         //     await executeQuery(sqlCode,newParams);
    //         // }
    //         return insertedId; // 返回插入记录的 ID    
    //     }catch(error){
    //         // console.error('插入失败！',error);
    //         throw error;
    //     }
    // },
    // 预约部分
    insertVenueRecords: async (schedule_id, start_min, end_min, creator_user_id, max_participants) => {
        const conn = await getTransactionConnection();
        try {
            await conn.beginTransaction();

            // --- 1. 获取日程日期并校验时间有效性 ---
            const [schedules] = await conn.execute(
                `SELECT schedule_date FROM schedules WHERE id = ?`,
                [schedule_id]
            );
            if (schedules.length === 0) throw new Error('SCHEDULE_NOT_FOUND');

            // 还原真实时间：基准 07:00 (420分钟) + 偏移量
            const appointmentDate = new Date(schedules[0].schedule_date);
            appointmentDate.setMinutes(start_min + 420); 

            // 判定预约是否已过期（预留 1 分钟操作缓冲）
            if (appointmentDate.getTime() < Date.now() - 60000) {
                throw new Error('APPOINTMENT_TIME_PAST');
            }

            // --- 2. 信誉分与账号状态校验 ---
            const [userRows] = await conn.execute(
                `SELECT credit_score, is_active FROM users WHERE id = ? FOR UPDATE`,
                [creator_user_id]
            );
            const user = userRows[0];
            if (!user || user.is_active === 0 || user.credit_score <= 3) {
                throw new Error('CREDIT_TOO_LOW');
            }

            // 团队预约额外门槛 (8分及以上才稳，7分是底线)
            if (max_participants > 1 && user.credit_score < 7) {
                throw new Error('INSUFFICIENT_CREDIT_FOR_GROUP');
            }

            // --- 3. 悲观锁检查时段冲突 ---
            const checkSql = `
                SELECT id FROM time_slots 
                WHERE schedule_id = ? 
                AND STATUS NOT IN ('cancelled', 'failed')
                AND start_time < ? 
                AND end_time > ?
                FOR UPDATE
            `;
            // 注意：这里传入的是计算后的相对分钟数，与数据库 time 类型比较需注意格式，
            // 建议数据库存整数或在此处转为 HH:mm:ss。数据库存的是 TIME 类型：
            const formatTime = (min) => {
                const h = Math.floor((min + 420) / 60).toString().padStart(2, '0');
                const m = ((min + 420) % 60).toString().padStart(2, '0');
                return `${h}:${m}:00`;
            };
            
            const [overlap] = await conn.execute(checkSql, [
                schedule_id, formatTime(end_min), formatTime(start_min)
            ]);
            if (overlap.length > 0) throw new Error('TIME_OVERLAP');

            // --- 4. 执行插入主表 ---
            const type = (max_participants >= 2) ? 'group' : 'single';
            const insertSql = `
                INSERT INTO time_slots (
                    schedule_id, start_time, end_time, creator_user_id, 
                    max_participants, reservation_type, penalty_level, record_source
                ) 
                VALUES (?, ?, ?, ?, ?, ?, 0, 'direct_booking')
            `;
            const [result] = await conn.execute(insertSql, [
                schedule_id, formatTime(start_min), formatTime(end_min), 
                creator_user_id, max_participants, type
            ]);
            const insertedId = result.insertId;

            // --- 5. 生成团队邀请码 ---
            let invitationCode = '';
            if (type === 'group') {
                const rawInfo = `${insertedId}&${creator_user_id}&${Math.random().toString(36).slice(-2)}`;
                invitationCode = encrypt(rawInfo); 
                await conn.execute(`UPDATE time_slots SET invitation_code = ? WHERE id = ?`, [invitationCode, insertedId]);
            }

            // --- 6. 插入参与者表 (触发触发器同步 current_participants) ---
            await conn.execute(
                `INSERT INTO slot_participants (slot_id, user_id) VALUES (?, ?)`,
                [insertedId, creator_user_id]
            );

            await conn.commit();
            return { insertedId, invitationCode }; 

        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    },


    // 传入时段id
    // 确认当前用户是否已经预约（已无用）
    affirmParticipantId:async(slot_id,user_id)=>{//从slot_participants表中获取
        const sql = `
            SELECT 
                COUNT(*) AS participant_count
            FROM 
                slot_participants
            WHERE 
                slot_id = ? AND user_id = ?;
        `;
        const params = [slot_id,user_id]; 
        try{
            const results = await executeQuery(sql,params);
            return results[0]['participant_count'] > 0;//返回布尔值，表示用户是否参与
        }catch(error){
            console.error('查询失败！',error);
            throw error;
        };

    },
    // 更新用户组，当用户选择使用邀请码预约时（邀请码格式：用户id+8位随机生成的字符串
    // 更新时，需要判断用户填入的密文与数据中对应id时段的密文的一致性
    // 需重构（已无用）
    updateSlotParticipants:async(slot_id,user_id)=>{
        const sql = `
            insert into slot_participants(slot_id,user_id)
                values
                (?,?);
        `;
        const params = [slot_id,user_id];
        try{
            const results = await executeQuery(sql,params);
            return results;
        }catch(error){
            console.error('更新失败！',error);
            throw error;
        };
    },
    // 完善后的加入预约函数（邀请码加入预约）
    joinSlotByInvitation: async (timeSlotId, inviteeId) => {
        const conn = await getTransactionConnection();
        try {
            await conn.beginTransaction();

            // --- 【新增：加入者信誉分校验】 ---
            const [user] = await conn.execute(
                `SELECT credit_score, is_active FROM users WHERE id = ? FOR UPDATE`,
                [inviteeId]
            );

            // 如果用户被封禁，或者信誉分低于阈值，禁止加入任何预约
            if (!user[0].is_active || user[0].credit_score <= 3) {
                throw new Error('CREDIT_TOO_LOW');
            }

            // 1. 【核心】锁定该时段记录 (FOR UPDATE)
            const [slots] = await conn.execute(
                `SELECT creator_user_id, current_participants, max_participants, created_at, STATUS 
                FROM time_slots WHERE id = ? FOR UPDATE`,
                [timeSlotId]
            );

            if (slots.length === 0) throw new Error('SLOT_NOT_FOUND');
            const slot = slots[0];

            // 2. 状态校验：是否已取消或失效
            if (['cancelled', 'failed'].includes(slot.STATUS)) {
                throw new Error('SLOT_INVALID');
            }

            // 3. 时效性校验（30分钟）
            const now = new Date();
            const expirationTime = new Date(new Date(slot.created_at).getTime() + 30 * 60 * 1000);
            if (now > expirationTime) throw new Error('CODE_EXPIRED');

            // 4. 满员校验
            if (slot.current_participants >= slot.max_participants) {
                throw new Error('SLOT_FULL');
            }

            // 5. 身份校验：不能是发起人
            if (inviteeId == slot.creator_user_id) throw new Error('IS_INITIATOR');

            // 6. 重复加入校验
            const [existing] = await conn.execute(
                `SELECT 1 FROM slot_participants WHERE slot_id = ? AND user_id = ?`,
                [timeSlotId, inviteeId]
            );
            if (existing.length > 0) throw new Error('ALREADY_JOINED');

            // 7. 执行插入
            // 由于有触发器 sync_reservation_count_after_insert，
            // 插入这行后，time_slots 的 current_participants 会自动 +1
            const [result] = await conn.execute(
                `INSERT INTO slot_participants (slot_id, user_id) VALUES (?, ?)`,
                [timeSlotId, inviteeId]
            );

            await conn.commit();
            return result.affectedRows > 0;

        } catch (error) {
            await conn.rollback();
            throw error; // 将错误抛给 Controller 处理
        } finally {
            conn.release();
        }
    },


    // 获取邀请码（需传入时段表id）
    getBespeakCode:async(id)=>{
        //动态选择查询参数（多余）
        // const fields = needIdArr ? 'invitation_code,current_participants,created_at' : 'invitation_code';,needIdArr = true
        const sql = `
            select 
                invitation_code,
                creator_user_id
            from 
                time_slots
            where
                id = ?;
        `;
        const params = [id];

        try{
            const results = await executeQuery(sql,params);
            return results;
        }catch(error){
            console.error('查询失败！',error);
            throw error;
        };
    },

    // 传入时段id，用于查询用户id及其相关信息
    getUserIDFromTimeSlot:async(time_slots_id,changeSql)=>{
        const sql = `
            select
                creator_user_id,
                created_at,
                current_participants,
                max_participants
            from 
                time_slots
            where
                id = ?;
        `;
        const sql2 = `
            select
                waitlist_count,
                max_waitlist
            from 
                time_slots
            where
                id = ?;
        `;

        const params = [time_slots_id];
        let results = null;
        try{
            if(changeSql === true){
                results = await executeQuery(sql2,params);
            }else{
                results = await executeQuery(sql,params);
            }
 
            return results;
        }catch(error){
            console.error('查询失败！',error);
            throw error;
        }
    },


    // 取消预约，需要传入单个时段的id，
    cancelReservation:async(time_slots_id)=>{
        // const sql = `
        //     delete from
        //         time_slots
        //     where id = ?;
        // `;
        const sql = `
            update
                time_slots
            set 
                status = 'cancelled'
            where 
                id = ?;
        `;
        const params = [time_slots_id];
        try{
            const results = await executeQuery(sql,params);

            return results;
        }catch(error){
            console.error('查询失败！',error);
            throw error;
        }
    },
    // 判断用户是否在该时段的记录是否存在
    judgementUserIsExist:async(timeSlotId, userId)=>{
        const sql = `
            SELECT 
                creator_user_id,
                status  
            FROM 
                time_slots 
            WHERE 
                id = ? 
            AND 
                creator_user_id = ?;
        `;
        const params = [timeSlotId, userId];
        
        try{
            const results = await executeQuery(sql,params);
            return results;
        }catch(error){
            console.error('查询失败！',error);
            throw error;
        }
    },

    getNewTimeSlot:async(venueId,scheduleDate)=>{
        const sql = `
            select
                start_time,
                ts.id as time_slots_id,
                end_time,
                ts.waitlist_count,
                ts.max_waitlist,
                s.id as scheduleId
            from
                venues v
            join
                schedules s on s.venue_id = v.id
            left join 
                time_slots ts on ts.schedule_id = s.id
            where
                v.id = ? and s.schedule_date = ?;
        
        `;
        const params = [venueId,scheduleDate];
        try{
            const results = await executeQuery(sql,params);
            return results;
        }catch(error){
            console.error('数据库查询错误！',error);
            throw error;
        }
    },
    getServiceCondition:async()=>{
        const sql = `
            SELECT
                v.category,
                COUNT(ts.id) AS venue_num
            FROM 
                venues v
            LEFT JOIN
                schedules s ON s.venue_id = v.id AND s.schedule_date = CURDATE()
            LEFT JOIN
                time_slots ts ON ts.schedule_id = s.id 
                AND CURTIME() BETWEEN ts.start_time AND ts.end_time
            GROUP BY 
                v.category;
        `;
        const params = [];
        try{
            const results = await executeQuery(sql,params)
            return results;
        }catch(error){
            console.error('查询失败！',error);
            throw error;
        }

    },
    getTotalSpaceNum:async()=>{
        const sql = `
            SELECT
                COUNT(*) AS venue_num,
                v.category
            FROM 
                venues v
            LEFT JOIN
                schedules s ON s.venue_id = v.id
            WHERE
                s.schedule_date = CURDATE() AND v.is_open = TRUE
            GROUP BY 
                v.category;
        `;
        const params = [];
        try{
            const results = await executeQuery(sql,params);
            return results;
        }catch(error){
            console.error('获取当前空闲场地信息错误！',error);
            throw error;
        };
    },

    //向数据库中插入用户计划 
    insertUserPlan:async(user_id,plan_type,plan_detail,plan_date,plan_month,plan_year)=>{
        let sql = `
            insert into
                user_plans(user_id,plan_type,plan_detail,plan_date
        `;
        const params = [user_id,plan_type,plan_detail,plan_date];
        try{
            // 根据用户需求动态选择相应语句执行插入操作
            // 月计划
            if(plan_month && plan_year && plan_type === 'monthly'){
                sql += ',plan_month,plan_year)values(?,?,?,?,?,?);';
                params.push(plan_month);
                params.push(plan_year);
            }else if(!plan_month && plan_year && plan_type === 'yearly'){
                // 年计划
                sql += ',plan_year)values(?,?,?,?,?);';
                params.push(plan_year);
            }else{
                sql += ')values(?,?,?,?);';
            }

            const results = await executeQuery(sql,params);

            return results;
        }catch(error){
            console.error('插入用户计划失败！',error);
            throw error;
        };
    },
    // 获取用户计划
    getUserPlan:async(user_id,plan_type,plan_date,plan_month,plan_year)=>{
        let sql = `
            SELECT
                plan_id,
                plan_detail,
                complete_status,
                plan_type,
                DATE_ADD(plan_date, INTERVAL 8 HOUR) as plan_date,
                plan_month,
                plan_year
            FROM
                user_plans
            WHERE
                user_id = ? 
            AND 
                plan_type = ? 
        `;

        const params = [Number(user_id),plan_type];

        if(plan_month && plan_year && plan_type === 'monthly'){
            sql += `
                And
                    plan_month = ?
                And
                    plan_year = ?;
            `;

            params.push(plan_month);
            params.push(plan_year);
        }else if(!plan_month && plan_year && plan_type === 'yearly'){
            sql += `
                And
                    plan_year = ?;
            `;

            params.push(plan_year);
        }else{
            sql += `
                And
                    plan_date = ?;
            `;

            params.push(plan_date);
        }

        try{
            const results = await executeQuery(sql,params);
            return results;
        }catch(error){
            console.error(error)
            throw error;
        };
    },
    // 更新特定用户计划的状态（一定时间内可以修改，下面的删除也同理：比较其中的创建时间字段与当前系统的时间）
    updatePlanStatus:async(plan_id)=>{
        const sql = `
            update 
                user_plans
            set
               complete_status = true
            where
                plan_id = ?; 
        `;
        const params = [plan_id];

        const results = await executeQuery(sql,params);

        return results
    },
    // 删除特定用户计划
    deleteUserPlan:async(plan_id)=>{
        const sql = `
            delete from
                user_plans
            where
                plan_id = ?;
        `;
        const params = [plan_id];

        const results = await executeQuery(sql,params);
        
        return results;
    },


    // 获取候补表中的记录信息
    getWaitlistTeamInfo:async(waitlist_team_id)=>{
        const sql = `
            select
                team_size,
                waitlist_code,
                current_size,
                status,
                created_at
            from
                waitlist_teams
            where
                id = ?;
        `;
        const params = [waitlist_team_id];

        try{
            const results = await executeQuery(sql,params);

            return results;
        }catch(error){
                console.error({
                errorTime: date.toLocaleString(),
                addressOfError:'updateWaitlistTeams方法',
                error: error.message,
                errorStack: error.stack,
            });
            throw error;
        };
    },
    // 获取候补成员表的记录信息
    getWaitlistMemberInfo:async(waitlist_team_id)=>{
        const sql = `
            select
                user_id
            from
                waitlist_members
            where
                waitlist_team_id = ?;
        `;
        const params = [waitlist_team_id];
        try{
            const results = await executeQuery(sql,params);

            return results;
        }catch(error){
            console.error({
                errorTime: date.toLocaleString(),
                addressOfError:'getWaitlistMemberInfo方法',
                error: error.message,
                errorStack: error.stack,
            });
            throw error;
        }
    },


    // 候补部分

    // 更新候补队伍表、传入的参数（候补队伍id，参数二为候补码，参数三：用于区分当前更新语句的功能）
    updateWaitlistTeams:async(waitlist_teams_id,waitlist_code,isChange,)=>{
        let sql = `
            update waitlist_teams
        `;
        const params = [];

        if(isChange && isChange === true){
            sql += `
                set 
                    current_size += 1
            `;
        }else{
            sql += `
                set 
                    waitlist_code = ?
            `;
            params.push(waitlist_code);
        }
        sql += `
            where 
                id = ?;
        `;
        params.push(waitlist_teams_id);
        try{
            const results = await executeQuery(sql,params);

            return results;
        }catch(error){
            console.error({
                errorTime: date.toLocaleString(),
                addressOfError:'updateWaitlistTeams方法',
                error: error.message,
                errorStack: error.stack,
            });
            throw error;
        };
    },

    // 插入候补记录（候补预约）
    // insertAlternateRecord:async(slot_id,team_leader_id,team_size,priority_score)=>{

    //     const sql = `
    //         insert into 
    //             waitlist_teams(slot_id,team_leader_id,team_size,priority_score)
    //         values
    //             (?,?,?,?);
    //     `;
    //     const params = [slot_id,team_leader_id,team_size,priority_score];
    //     try{
    //         const results = await executeQuery(sql,params);
    //         return results;
    //     }catch(error){
    //         console.error({
    //             errorTime: date.toLocaleString(),
    //             addressOfError:'insertAlternateRecord方法',
    //             error: error.message,
    //             errorStack: error.stack,
    //         });
    //         throw error;
    //     }
    // },
    // 候补预约（new）
    insertAlternateRecord: async (slot_id, team_leader_id, team_size) => {
        const conn = await getTransactionConnection();
        try {
            await conn.beginTransaction();

            // --- 1. 信誉分与账号状态校验 ---
            const [user] = await conn.execute(
                `SELECT credit_score, is_active FROM users WHERE id = ? FOR UPDATE`,
                [team_leader_id]
            );
            
            // 校验：账号封禁 或 分数过低
            if (user[0].is_active === 0 || user[0].credit_score <= 3) {
                throw new Error('CREDIT_TOO_LOW');
            }

            // --- 2. 身份唯一性校验 ---
            const [existing] = await conn.execute(
                `SELECT id FROM waitlist_teams 
                WHERE slot_id = ? AND team_leader_id = ? AND STATUS = 'waiting'`,
                [slot_id, team_leader_id]
            );
            if (existing.length > 0) throw new Error('ALREADY_IN_WAITLIST');

            // --- 3. 悲观锁校验名额 ---
            const [slot] = await conn.execute(
                `SELECT waitlist_count, max_waitlist FROM time_slots WHERE id = ? FOR UPDATE`,
                [slot_id]
            );
            if (slot.length === 0) throw new Error('SLOT_NOT_FOUND');
            if (slot[0].waitlist_count >= slot[0].max_waitlist) throw new Error('WAITLIST_FULL');

            // --- 4. 执行插入（使用真实信用分作为权重） ---
            const [teamResult] = await conn.execute(
                `INSERT INTO waitlist_teams (slot_id, team_leader_id, team_size, priority_score) VALUES (?, ?, ?, ?)`,
                [slot_id, team_leader_id, team_size, user[0].credit_score] 
            );
            
            const teamId = teamResult.insertId;

            // --- 5. 【新增】将队长插入成员表 ---
            // 只有入了这个表，触发器才会把 team 的 current_size 从 0 变成 1
            await conn.execute(
                `INSERT INTO waitlist_members (waitlist_team_id, user_id) VALUES (?, ?)`,
                [teamId, team_leader_id]
            );
            await conn.commit();
            return { insertId: teamId };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    },
    // 候补码预约（new）（添加候补成员）
    joinWaitlistTransaction: async (waitlistId, userId, alternateCode) => {
        const conn = await getTransactionConnection();
        try {
            await conn.beginTransaction();

            // 1. 获取队伍信息并加锁 (悲观锁)
            const [teams] = await conn.execute(
                `SELECT team_size, current_size, status, waitlist_code 
                FROM waitlist_teams WHERE id = ? FOR UPDATE`,
                [waitlistId]
            );

            if (teams.length === 0) throw new Error('TEAM_NOT_FOUND');
            const team = teams[0];

            // 2. 核心业务校验
            if (team.waitlist_code !== alternateCode) throw new Error('CODE_MISMATCH');
            if (team.status !== 'waiting') throw new Error('TEAM_NOT_WAITING');
            if (team.current_size >= team.team_size) throw new Error('TEAM_FULL');

            // 3. 校验是否已在队伍中 (数据库唯一索引是最后防线，这里是逻辑拦截)
            const [members] = await conn.execute(
                `SELECT 1 FROM waitlist_members WHERE waitlist_team_id = ? AND user_id = ?`,
                [waitlistId, userId]
            );
            if (members.length > 0) throw new Error('ALREADY_IN');

            // 4. 执行写入操作
            await conn.execute(
                `INSERT INTO waitlist_members (waitlist_team_id, user_id, status) VALUES (?, ?, 'active')`,
                [waitlistId, userId]
            );

            // 5. 更新计数
            await conn.execute(
                `UPDATE waitlist_teams SET current_size = current_size + 1 WHERE id = ?`,
                [waitlistId]
            );

            await conn.commit();
            return { success: true };
        } catch (error) {
            await conn.rollback();
            throw error; // 抛出错误供上层路由捕获
        } finally {
            conn.release();
        }
    },



    // 添加候补成员
/*     insertWaitlistMember:async(userId,waitlistTeamId)=>{
        const sql = `
            insert into
                waitlist_members(user_id,waitlist_team_id)
            values
                (?,?);
        
        `;
        const params = [userId,waitlistTeamId];

        try{
            const results = await executeQuery(sql,params)

            return results;
        }catch(error){
            console.error({
                time: date.toLocaleString(),
                addressOfError: 'insertWaitlistMember方法',
                error: error.message,
                errorStack: error.stack,
            });
            throw error;
        }

    }, */
    // 获取用户的候补记录（传入用户id即可）
    getAlternateRecord:async(userId)=>{
        const sql = `
            SELECT 
                DATE_FORMAT(s.schedule_date, '%Y-%m-%d') AS waitlist_date,
                ts.start_time,
                ts.end_time,
                wt.id AS waitlist_team_id,
                wt.team_size AS waitlist_participants,
                v.venue_name,
                v.venue_address,
                CASE
                    WHEN wt.team_leader_id = ? THEN 'leader'
                    ELSE 'member'
                END AS user_role,
                CONVERT_TZ(wt.created_at, '+00:00', '+08:00') AS waitlist_created_time,
                wt.status AS waitlist_status
            FROM waitlist_teams wt
            JOIN time_slots ts ON wt.slot_id = ts.id
            JOIN schedules s ON ts.schedule_id = s.id
            JOIN venues v ON s.venue_id = v.id
            WHERE wt.team_leader_id = ? OR EXISTS (
                SELECT 1 FROM waitlist_members wm
                WHERE wm.waitlist_team_id = wt.id
                AND wm.user_id = ?
            )
            ORDER BY s.schedule_date DESC, ts.start_time DESC;
        `;
        
        const params = [userId,userId,userId];

        try{
            const results = await executeQuery(sql,params)

            return results;
        }catch(error){
            throw error;
        }
    },
    // 获取候补码
    getCandidateCode:async(waitlistTeamId)=>{
        const sql = `
            SELECT
                waitlist_code,
                team_leader_id
            FROM
                waitlist_teams
            WHERE
                id = ?;
        `;
        const params = [waitlistTeamId];

        try{
            const results = await executeQuery(sql,params);

            return results;
        }catch(error){
            throw error;
        }
    },
    // 取消候补预约
    cancelPendingReservation:async(waitlistTeamId)=>{
        const sql = `
            update  
                waitlist_teams
            set 
                status = 'cancelled'
            where
                id = ?;
            
        `;
        const params = [waitlistTeamId];

        try{
            const results = await executeQuery(sql,params);

            return results;
        }catch(error){
            throw error;
        }
    },



    // 更新数据中存储用户头像的字段
    updateAvatarURL:async(userId,avatarUrl)=>{
        const sql = `
            update  
                users
            set
                user_image = ?
            where id = ?;
        `;
        const params = [avatarUrl,Number(userId)];
        try{
            await executeQuery(sql,params);
        }catch(error){
            throw error;
        }
    },
}

module.exports = userModle;