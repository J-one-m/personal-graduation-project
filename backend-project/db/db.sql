CREATE DATABASE graduationProject;
USE graduationProject;


CREATE TABLE users(
 id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户id',
 user_account VARCHAR(100) NOT NULL UNIQUE COMMENT '账号/学工号',
 `password` VARCHAR(255) NOT NULL COMMENT '账号密码',
 role ENUM('user','admin') COMMENT '用户身份',
 username VARCHAR(50) NOT NULL COMMENT '用户名/昵称',
 age SMALLINT NULL COMMENT '年龄',
 gender ENUM('男','女') NULL COMMENT '性别', 
 mailbox VARCHAR(100) NULL COMMENT '邮箱',
 user_image VARCHAR(300) NULL COMMENT '用户头像地址',
 address VARCHAR(150) NULL COMMENT '用户地址',
 credit_score INT NOT NULL DEFAULT 10 COMMENT '个人信誉分',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT INTO users(user_account,`password`,role,username,age,gender,mailbox)
VALUES	
('000000000','admin','admin','admin',99,'男','3501114830@qq.com'),
('220591021','fgj','user','南风',22,'男','3501114830@qq.com'),
('220500001','123qwe@fgj','user','张三',21,'男','3503501234@qq.com');



-- 场地基本信息表
CREATE TABLE venues(
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '场地id',
    venue_name VARCHAR(100) NOT NULL UNIQUE COMMENT '场地名称',
    venue_image VARCHAR(300) NULL COMMENT '场地预览图片地址',
    venue_address VARCHAR(100) NOT NULL COMMENT '场地具体地址',
    -- 补充：场地类别
    category VARCHAR(30) NOT NULL DEFAULT '其他' COMMENT '场地类别',
    -- 补充：
    is_open BOOLEAN DEFAULT TRUE COMMENT '场地是否开放',
    opening_time VARCHAR(100) DEFAULT '全周' COMMENT '场地开放时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- SELECT*FROM venues;

INSERT INTO venues(venue_name,venue_address,category)
VALUES
('羽毛球A场地','北区体育馆一楼','羽毛球'),
('羽毛球B场地','北区体育馆一楼','羽毛球'),
('乒乓球A场地','北区体育馆一楼','乒乓球'),
('乒乓球B场地','北区体育馆一楼','乒乓球'),
('棒球A场地','南区操场','棒球');


-- 日程表（记录哪一天对哪个场地有效）
CREATE TABLE schedules(
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日程表id',
    venue_id INT NOT NULL COMMENT '关联的场地id',
    schedule_date DATE NOT NULL COMMENT '具体的日期',
    FOREIGN KEY(venue_id) REFERENCES venues(id),
    UNIQUE KEY unique_venue_date (venue_id, schedule_date)
);

INSERT INTO schedules (venue_id, schedule_date)
VALUES
(1, '2025-10-20'),
(2, '2025-10-21'),
(3, '2025-10-22');



-- 时段表（记录每个日程下的具体可用时间段） 
CREATE TABLE time_slots(
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '时段id',
    schedule_id INT NOT NULL COMMENT '关联的日程id',
    start_time TIME NOT NULL COMMENT '时段开始时间',
    end_time TIME NOT NULL COMMENT '时段结束时间',
    creator_user_id INT NOT NULL COMMENT '发起人ID',
    -- 预约类型：单人(single)或团队(group)
    reservation_type ENUM('single', 'group') NOT NULL DEFAULT 'single' COMMENT '预约类型',
    -- 预约状态
    -- 待使用（预约成功）-- 使用中-- 已完成-- 已取消-- 未使用（未到场）-- 预约失败（团队未满员）
    `status` ENUM('pending','in_progress','completed','cancelled','no_show','failed') NOT NULL DEFAULT 'pending' COMMENT '预约状态',
    -- 人数缓存字段
    current_participants INT DEFAULT 1 COMMENT '当前人数',
    max_participants INT DEFAULT 1 COMMENT '最大人数',
    -- 邀请码（团队预约用）
    invitation_code VARCHAR(32) NULL UNIQUE COMMENT '邀请码',

    -- 补充：候补队伍数、最大候补队伍数
    waitlist_count INT NOT NULL DEFAULT 0 COMMENT '当前候补队伍数量',
    max_waitlist INT NOT NULL DEFAULT 2 COMMENT '最大候补队伍数量',
    
    -- 补充：添加来源字段以及关联字段
    record_source ENUM('direct_booking', 'waitlist_promotion'),
    promoted_from_waitlist BIGINT NULL COMMENT '从候补晋升的来源队伍ID',
    
    -- 虚拟列：用于实现条件唯一约束
    is_active TINYINT(1) GENERATED ALWAYS AS (
        CASE 
            WHEN STATUS IN ('cancelled', 'failed') THEN NULL
            ELSE 1
        END
    ) VIRTUAL COMMENT '活跃状态标记',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- 外键约束
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_user_id) REFERENCES users(id),
    -- 添加联合唯一约束
    UNIQUE KEY uk_active_slot (schedule_id, start_time, end_time, is_active),
    FOREIGN KEY (promoted_from_waitlist) REFERENCES waitlist_teams(id),
    -- 检查约束
    CHECK (end_time > start_time),
    CHECK (current_participants <= max_participants),
    CHECK (waitlist_count BETWEEN 0 AND max_waitlist)
);


-- 为时段表添加候补相关字段
-- ALTER TABLE time_slots 
-- ADD COLUMN waitlist_count INT NOT NULL DEFAULT 0 COMMENT '当前候补人数',
-- ADD COLUMN max_waitlist INT NOT NULL DEFAULT 2 COMMENT '最大候补人数',
-- ADD CHECK (waitlist_count BETWEEN 0 AND max_waitlist);
-- ALTER TABLE time_slots DROP COLUMN max_team_size;


INSERT INTO time_slots (schedule_id, start_time, end_time, creator_user_id, `status`)
VALUES
(1, '09:00:00', '10:00:00', 2, 'pending'),
(1, '10:00:00', '11:00:00', 2, 'pending'),
(2, '14:00:00', '15:00:00', 3, 'pending');



-- 邀请码格式：发起人的id以及预约时段id外加8为随机字符串。（建议加密）
-- 补充：鉴于时段表中有发起人id故而不需要在生成邀请码时加入发起人id
-- 其他用户使用邀请码时，后端从邀请码中解析需要的数据：发起人id以及时段id
-- 通过联表查询判断当前用户是否是发起人。
CREATE TABLE slot_participants (
    slot_id BIGINT NOT NULL COMMENT '时段ID',
    user_id INT NOT NULL COMMENT '用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 复合主键（确保不会重新加入）
    PRIMARY KEY (slot_id,user_id), 
    -- 外键约束
    FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_slot (user_id, slot_id),
    INDEX idx_credit_score (user_id)  -- 用于按信用分排序
) ENGINE=INNODB DEFAULT CHARSET=utf8mb4 COMMENT='预约参与关系表';


-- 创建候补队伍表
CREATE TABLE IF NOT EXISTS waitlist_teams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slot_id BIGINT NOT NULL COMMENT '时段ID',
    team_leader_id INT NOT NULL COMMENT '团队负责人ID',
    team_size INT NOT NULL DEFAULT 1 COMMENT '队伍人数',
    waitlist_code VARCHAR(32) NULL UNIQUE COMMENT '候补码',
    priority_score INT NOT NULL DEFAULT 0 COMMENT '优先级分数',
    STATUS ENUM('waiting', 'success', 'failed', 'cancelled') DEFAULT 'waiting' COMMENT '候补状态',
    current_size INT NOT NULL DEFAULT 1 COMMENT '当前队伍人数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (team_leader_id) REFERENCES users(id),
    INDEX idx_slot_status (slot_id, STATUS),
    INDEX idx_priority (slot_id, priority_score DESC, created_at ASC),
    INDEX idx_waitlist_code (waitlist_code)
) COMMENT='候补队伍表';




-- 重新创建正确的 waitlist_members 表
CREATE TABLE waitlist_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    waitlist_team_id BIGINT NOT NULL COMMENT '候补队伍ID',
    user_id INT NOT NULL COMMENT '用户ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (waitlist_team_id) REFERENCES waitlist_teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_team_user (waitlist_team_id, user_id),
    INDEX idx_user_id (user_id)  -- 修正后的索引
) COMMENT='候补队员表';




-- 通过触发器自动同步人数
DELIMITER //
CREATE TRIGGER sync_reservation_count_after_insert
AFTER INSERT ON slot_participants
FOR EACH ROW
BEGIN
    UPDATE time_slots 
    SET current_participants = current_participants + 1
    WHERE id = NEW.slot_id;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER sync_reservation_count_after_delete
AFTER DELETE ON slot_participants
FOR EACH ROW
BEGIN
    UPDATE time_slots 
    SET current_participants = GREATEST(0, current_participants - 1)
    WHERE id = OLD.slot_id;
END//
DELIMITER ;


SHOW TRIGGERS;

-- 触发器二：当用户候补预约操作时，自动更新当前时段表中该时段的当前候补队伍数量
DELIMITER //

CREATE TRIGGER update_waitlist_count_after_insert
AFTER INSERT ON waitlist_teams
FOR EACH ROW
BEGIN
    UPDATE time_slots
    SET waitlist_count = waitlist_count + 1
    WHERE id = NEW.slot_id;
END//

DELIMITER ;

-- DROP TABLE IF EXISTS user_plans;
-- 用户计划表
CREATE  TABLE user_plans(
    user_id INT NOT NULL COMMENT '与用户关联的id',
    plan_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '计划唯一id',
    plan_type ENUM('daily','monthly','yearly') NOT NULL COMMENT '日月年计划',
    plan_detail VARCHAR(1500) NOT NULL COMMENT '计划内容',
    plan_date DATE NOT NULL COMMENT '计划添加的日期',
    complete_status BOOLEAN DEFAULT FALSE COMMENT '完成状态',
    -- 补充：新增年份以及月份字段
    plan_year INT NULL COMMENT '年份',
    plan_month INT NULL COMMENT '月份(1~12)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    
    INDEX idx_user_type_year_month (user_id, plan_type, plan_year, plan_month),
    INDEX idx_user_date (user_id, plan_date),
    INDEX idx_complete_status (complete_status)
);



DROP TABLE IF EXISTS affiche;
-- 公告表
CREATE TABLE affiche (
    affiche_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '公告唯一ID',
    user_id INT NOT NULL COMMENT '发布人用户ID',
    pubdate DATETIME NOT NULL COMMENT '发布时间',
    affiche_title VARCHAR(255) NOT NULL COMMENT '公告标题',
    -- 使用 TEXT 类型，完美支持长文本和未来的富文本编辑器
    affiche_content TEXT NOT NULL COMMENT '公告内容',
    -- 状态控制字段
    is_deleted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已删除：0-否，1-是',
    is_visible TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否展示：0-否，1-是',
    -- 审计字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. 插入新的示例数据（包含标题）
INSERT INTO affiche (user_id, pubdate, affiche_title, affiche_content)
VALUES
(1, '2025-10-15 20:57:10', '系统维护通知', '我们将于今晚进行前后端数据通信测试，请知悉。'),
(1, '2025-10-15 21:05:10', '新功能上线', '公告模块已支持标题显示和内容截断功能。'),
(1, '2025-11-06 11:49:21', '安全提醒', '请各位管理员定期修改登录密码，确保系统安全。'),
(1, '2026-02-28 10:00:00', '二月工作总结', '二月份前后端对接测试顺利完成，数据统计如下...'),
(1, '2026-02-28 16:30:00', '紧急公告测试', CONCAT('这是一条用于测试的长文本数据：', REPEAT('测试文本', 150)));



-- 失物招领表
CREATE TABLE lost_property(
    property_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '物品id',
    user_id INT NOT NULL COMMENT '关联的用户id',
    -- 此处发布日期与创建时间冲突，实际上可以保留一个
    pubdate DATE NOT NULL COMMENT '发布日期',
    contact_way VARCHAR(255) NOT NULL COMMENT '联系方式',
    property_describe VARCHAR(1000) NOT NULL COMMENT '失物描述',
    property_image VARCHAR(300) NULL COMMENT '失物图片地址信息', 
    is_revert BOOLEAN DEFAULT FALSE COMMENT '是否归还',
    losePlace VARCHAR(120) NULL COMMENT '遗失地址',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

INSERT INTO lost_property (user_id, pubdate, contact_way, property_describe, property_image, losePlace, is_revert) 
VALUES 
(2, '2025-10-06', '987-654-3210', '银色手表，带有皮革表带', 'http://example.com/images/lost_watch.jpg', '咖啡店', FALSE),
(3, '2025-10-08', '333-777-8888', '白色耳机，品牌 Apple', 'http://example.com/images/lost_earphones.jpg', '地铁站', FALSE),
(2, '2025-10-09', '444-555-6666', '黑色笔记本电脑，型号 Dell XPS', 'http://example.com/images/lost_laptop.jpg', '办公室', FALSE),
(3, '2025-10-10', '222-333-4444', '红色运动鞋，品牌 Adidas', 'http://example.com/images/lost_red_shoes.jpg', '健身房', TRUE);
 
SHOW TABLES;
SELECT*FROM users;
SELECT*FROM venues;
SELECT*FROM schedules;
SELECT*FROM time_slots;				
SELECT*FROM slot_participants;
SELECT*FROM user_plans;
SELECT*FROM lost_property;
SELECT*FROM affiche;
SELECT*FROM waitlist_teams;
SELECT*FROM waitlist_members;


SELECT VERSION();

SELECT 
    DATE_FORMAT(s.schedule_date, '%Y-%m-%d') AS waitlist_date,
    ts.start_time,
    ts.end_time,
    -- waitlist_code,
    wt.id AS waitlist_team_id,
    wt.team_size AS waitlist_participants,
    v.venue_name,
    v.category AS venue_category,
    v.venue_address,
    CASE
        WHEN wt.team_leader_id = 2 THEN 'leader'
        ELSE 'member'
    END AS user_role,
    -- 在数据库中直接查询数据库自动创建的时间字段时无需使用CONVERT_TZ函数统一时区，但是在后端调用时应该使用该函数统一时区。
    wt.created_at AS waitlist_created_time,
    wt.status AS waitlist_status
FROM waitlist_teams wt
JOIN time_slots ts ON wt.slot_id = ts.id
JOIN schedules s ON ts.schedule_id = s.id
JOIN venues v ON s.venue_id = v.id
WHERE wt.team_leader_id = 2 OR EXISTS (
    SELECT 1 FROM waitlist_members wm
    WHERE wm.waitlist_team_id = wt.id
    AND wm.user_id = 2
)
ORDER BY s.schedule_date DESC, ts.start_time DESC;

-- 获取候补码
SELECT
  waitlist_code,
  team_leader_id
FROM
  waitlist_teams
WHERE
  id = 20;


