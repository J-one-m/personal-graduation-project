CREATE DATABASE graduationProject;
USE graduationProject;


DROP TABLE IF EXISTS users;
-- 创建用户表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户id',
  user_account VARCHAR(100) NOT NULL UNIQUE COMMENT '账号/学工号',
  `password` VARCHAR(255) NOT NULL COMMENT '哈希加密后的密码',
  role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户身份',
  username VARCHAR(50) NOT NULL COMMENT '用户名/昵称',
  -- 新增手机号
  phone_number VARCHAR(20) NULL COMMENT '手机号',
  age SMALLINT NULL COMMENT '年龄',
  gender ENUM('男', '女', '保密') DEFAULT '保密' COMMENT '性别',
  mailbox VARCHAR(100) NULL COMMENT '邮箱',
  user_image VARCHAR(300) NULL COMMENT '用户头像地址',
  address VARCHAR(150) NULL COMMENT '用户地址',
  credit_score INT NOT NULL DEFAULT 10 COMMENT '个人信誉分',
  is_active TINYINT(1) DEFAULT 1 COMMENT '账号状态: 1-正常, 0-封禁',
  last_login DATETIME NULL COMMENT '最后登录时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- 新增字段用于软删除操作
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '删除时间, NULL表示未删除' AFTER updated_at,
  
  -- 为常用查询字段建立索引，提高搜索速度
  INDEX idx_username (username),
  INDEX idx_deleted_at (deleted_at),
  INDEX idx_role (role)
);

INSERT INTO users 
(user_account, `password`, role, username, phone_number, age, gender, mailbox, address, credit_score, is_active, last_login)
VALUES 
-- 1. 管理员账号
('admin01', '123456', 'admin', '超级管理员', '13800138000', 30, '保密', 'admin@example.com', '上海市浦东新区', 10, 1, NOW()),

-- 2. 普通活跃用户 (信誉分满分)
('STU2024001','123456', 'user', '张三', '13911112222', 20, '男', 'zhangsan@univ.edu.cn', '北京市海淀区学院路', 10, 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- 3. 女性用户 (信誉分略低)
('STU2024002', '123456', 'user', '李思思', '13733334444', 19, '女', 'lisi@qq.com', '杭州市西湖区', 8, 1, DATE_SUB(NOW(), INTERVAL 5 HOUR)),

-- 4. 被封禁用户 (is_active = 0)
('STU2023999', '123456', 'user', '王五', '15066667777', 22, '男', 'wangwu@163.com', '广州市天河区', 2, 0, DATE_SUB(NOW(), INTERVAL 1 MONTH)),

-- 5. 已被“软删除”的用户 (deleted_at 不为 NULL)
('STU2022050','123456', 'user', '赵六', '18899990000', 21, '保密', 'zhaoliu@outlook.com', '深圳市南山区', 10, 1, NULL);


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



DROP TABLE IF EXISTS lost_property;
-- 失物招领表
CREATE TABLE lost_property(
    property_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '物品id',
    user_id INT NOT NULL COMMENT '关联的用户id',
    property_name VARCHAR(100) NOT NULL COMMENT '失物名称',
    property_describe VARCHAR(1000) NOT NULL COMMENT '失物描述',
    property_image VARCHAR(300) NULL COMMENT '失物图片地址信息', 
    losePlace VARCHAR(120) NULL COMMENT '遗失地址',
    contact_way VARCHAR(255) NOT NULL COMMENT '联系方式',
 
    -- 状态控制
    -- is_revert BOOLEAN DEFAULT FALSE COMMENT '是否归还', -- 对于状态流转，建议采用数字，便于后续扩展
    is_revert TINYINT(1) DEFAULT 0 COMMENT '是否归还：0-未归还，1-已归还',
    audit_status TINYINT(1) DEFAULT 0 COMMENT '审核状态：0-待审核，1-通过，2-驳回',
    reject_reason VARCHAR(255) NULL COMMENT '驳回理由',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '软删除：0-正常，1-已删除',
	  
    -- 时间审计
    -- 此处发布日期与创建时间冲突，实际上可以保留一个
    pubdate DATETIME NOT NULL COMMENT '发布日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
INSERT INTO lost_property 
(user_id, property_name, pubdate, contact_way, property_describe, property_image, losePlace, audit_status, reject_reason, is_revert) 
VALUES 
-- 1. 待审核数据 (前端审核页面应显示)
(2, '黑色小狗钱包', '2026-02-28 14:30:00', '13800138000', '里面有少量现金和一张学生证，钱包表面有明显磨损。', 'https://picsum.photos/200/200?random=1', '图书馆二楼自习室', 0, NULL, 0),
(3, '白色机械键盘', '2026-02-28 10:15:00', 'li_teacher@example.com', '新款机械键盘，白色背光，青轴。', 'https://picsum.photos/200/200?random=2', '教学楼302教室', 0, NULL, 0),
-- 2. 已通过且未找回 (前端管理页面显示为“寻找中”)
(2, '蓝色遮阳伞', '2026-02-10 09:00:00', '159****1234', '天堂伞品牌，手柄处贴有蓝色胶带。', 'https://picsum.photos/200/200?random=3', '二号食堂', 1, NULL, 0),
(3, 'iPhone 15 Pro', '2026-02-14 16:20:00', '站内私信', '原野色，带透明手机壳，锁屏壁纸是只猫。', 'https://picsum.photos/200/200?random=4', '东操场看台', 1, NULL, 0),
-- 3. 已通过且已找回 (前端管理页面显示为“已找回”)
(2, '学生证 - 王小明', '2026-02-12 11:30:00', '13312345678', '学号20230101，封面有划痕。', 'https://picsum.photos/200/200?random=5', '综合楼一楼大厅', 1, NULL, 1),
-- 4. 审核驳回数据 (前端用户中心应显示驳回理由)
(3, '违禁物品测试', '2026-02-27 22:00:00', '110', '这是一个用来测试驳回流程的非法描述。', 'https://picsum.photos/200/200?random=6', '校外', 2, '包含不当言论或虚假信息，请重新编辑。', 0),
(2, '模糊的照片', '2026-02-26 15:45:00', '123456', '捡到一个水杯。', 'https://picsum.photos/200/200?random=7', '不详', 2, '图片内容模糊无法辨认，且遗失地点描述不清晰。', 0);



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
    lp.pubdate,
    u.username AS publisher_name,
    u.user_account AS publisher_account
FROM 
    lost_property lp
JOIN 
    users u ON lp.user_id = u.id
WHERE 
    lp.is_deleted = 0 AND lp.audit_status = 0
ORDER BY 
    lp.pubdate DESC;

-- 更新失物信息
UPDATE lost_property 
SET audit_status = 0,           -- 2 代表驳回
    reject_reason = '图片模糊'   -- 具体的驳回理由
WHERE property_id = 1;        -- 指定 ID

UPDATE 
                lost_property
            SET
                audit_status = 0
            WHERE
                property_id = 2;


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
    lp.pubdate,
    u.username AS publisher_name,
    u.user_account AS publisher_account
FROM 
    lost_property lp
JOIN 
    users u ON lp.user_id = u.id
WHERE 
    lp.is_deleted = 0 AND lp.audit_status = 1
ORDER BY 
    lp.pubdate DESC
LIMIT
    0,21;

UPDATE
                lost_property
            SET
                is_deleted = 0
            WHERE
                property_id = 3;


 
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


