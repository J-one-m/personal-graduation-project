const cron = require('node-cron');
const db = require('../db/connection');
const logError = require('./logError');

// 1. 工具函数：计算分钟差（支持字符串和 Date 对象）
const calculateMinutes = (startTime, currentTime) => {
    let start;
    if (typeof startTime === 'string') {
        const [h, m] = startTime.split(':').map(Number);
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    } else {
        start = new Date(startTime);
    }
    const current = new Date(currentTime);
    return Math.floor((current - start) / (1000 * 60));
};

// 2. 核心惩罚逻辑
const applyPenalty = async (conn, userId, slotId, penaltyPoints, reason, newLevel) => {
    await conn.execute(
        `UPDATE users SET credit_score = GREATEST(0, credit_score - ?), credit_updated_at = NOW() WHERE id = ?`,
        [penaltyPoints, userId]
    );
    await conn.execute(
        `INSERT INTO credit_logs (user_id, slot_id, change_amount, reason) VALUES (?, ?, ?, ?)`,
        [userId, slotId, -penaltyPoints, reason]
    );
    await conn.execute(
        `UPDATE time_slots SET penalty_level = ?, last_penalty_at = NOW() WHERE id = ?`,
        [newLevel, slotId]
    );
};

// 3. 自动候补转正逻辑
const autoPromoteWaitlist = async (slotId, conn) => {
    console.log(`[Waitlist] 尝试为时段 ID: ${slotId} 匹配新候补...`);

    const [teams] = await conn.execute(
        `SELECT id, team_leader_id, team_size FROM waitlist_teams 
         WHERE slot_id = ? AND status = 'waiting' 
         ORDER BY priority_score DESC, created_at ASC LIMIT 1`,
        [slotId]
    );

    if (teams.length === 0) return;

    const topTeam = teams[0];

    // 更新候补状态
    await conn.execute(`UPDATE waitlist_teams SET status = 'success' WHERE id = ?`, [topTeam.id]);

    // 移交所有权：重置 penalty_level 为 0，并记录转正标记
    await conn.execute(
        `UPDATE time_slots SET 
            creator_user_id = ?, 
            status = 'pending', 
            penalty_level = 0,
            record_source = 'waitlist_promotion',
            updated_at = NOW(), -- 记录转正时刻
            current_participants = 0,
            max_participants = ?
         WHERE id = ?`,
        [topTeam.team_leader_id, topTeam.team_size, slotId]
    );

    // 成员变更
    await conn.execute(`DELETE FROM slot_participants WHERE slot_id = ?`, [slotId]);
    await conn.execute(
        `INSERT INTO slot_participants (slot_id, user_id)
         SELECT ?, user_id FROM waitlist_members WHERE waitlist_team_id = ? AND status = 'active'`,
        [slotId, topTeam.id]
    );
    await conn.execute(`UPDATE waitlist_members SET status = 'promoted' WHERE waitlist_team_id = ?`, [topTeam.id]);

    console.log(`[Waitlist] 成功！新队长 ID: ${topTeam.team_leader_id}`);
};

// 4. 定时任务
const initStatusTask = () => {
    cron.schedule('*/1 * * * *', async () => {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0];

        let conn;
        try {
            conn = await db.getConnection();
            await conn.beginTransaction();

            const [slots] = await conn.execute(`
                SELECT ts.*, s.schedule_date 
                FROM time_slots ts
                JOIN schedules s ON ts.schedule_id = s.id
                WHERE ts.status IN ('pending', 'in_progress') 
                AND s.schedule_date = ? AND ts.start_time <= ?
                FOR UPDATE
            `, [currentDate, currentTime]);

            for (const slot of slots) {
                const isPromoted = slot.record_source === 'waitlist_promotion';
                const baseTime = isPromoted ? slot.updated_at : slot.start_time;
                const delay = calculateMinutes(baseTime, now);

                if (isPromoted) {
                    // --- 候补用户：15分钟宽限期 ---
                    if (delay > 15 && slot.status === 'pending') {
                        // 候补违约：直接扣 3 分（与原主人违约总成本对等）
                        await applyPenalty(conn, slot.creator_user_id, slot.id, 3, '候补转正后15分钟未到场违约', 3);
                        await conn.execute(`UPDATE time_slots SET status = 'failed' WHERE id = ?`, [slot.id]);

                        // 检查剩余时间是否够再候补一轮
                        const [endH, endM] = slot.end_time.split(':').map(Number);
                        const endTimeObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
                        const remaining = Math.floor((endTimeObj - now) / (1000 * 60));

                        if (remaining >= 30) {
                            await autoPromoteWaitlist(slot.id, conn);
                        }
                    }
                } else {
                    // --- 普通用户：1+1+1 阶梯扣分 ---
                    if (delay >= 0 && delay <= 3 && slot.penalty_level === 0) {
                        // 1-3分钟扣1分，状态转为in_progress防止被别的逻辑误伤
                        await applyPenalty(conn, slot.creator_user_id, slot.id, 1, '轻微迟到', 1);
                        await conn.execute(`UPDATE time_slots SET status = 'in_progress' WHERE id = ?`, [slot.id]);
                    } 
                    else if (delay > 3 && delay <= 6 && slot.penalty_level === 1) {
                        // 4-6分钟再扣1分
                        await applyPenalty(conn, slot.creator_user_id, slot.id, 1, '中度迟到', 2);
                    } 
                    else if (delay > 6 && (slot.penalty_level === 2 || slot.status === 'pending')) {
                        // 超过6分钟再扣1分，并释放资源
                        await applyPenalty(conn, slot.creator_user_id, slot.id, 1, '严重迟到，系统回收资源', 3);
                        await conn.execute(`UPDATE time_slots SET status = 'failed' WHERE id = ?`, [slot.id]);
                        await autoPromoteWaitlist(slot.id, conn);
                    }
                }
            }
            await conn.commit();
        } catch (error) {
            if (conn) await conn.rollback();
            logError(error, 'StatusUpdater');
        } finally {
            if (conn) conn.release();
        }
    });
};

module.exports = initStatusTask;