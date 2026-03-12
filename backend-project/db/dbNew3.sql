-- 1. 彻底初始化
DROP DATABASE IF EXISTS graduationProject;
CREATE DATABASE graduationProject;
USE graduationProject;

-- 2. 临时关闭外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 3. 按照依赖关系清理旧表
DROP TABLE IF EXISTS slot_participants;
DROP TABLE IF EXISTS waitlist_members;
DROP TABLE IF EXISTS waitlist_teams;
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS venue_categories;
DROP TABLE IF EXISTS user_plans;
DROP TABLE IF EXISTS affiche;
DROP TABLE IF EXISTS lost_property;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------
-- 4. 用户表 (Users)
-- ---------------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户id',
  user_account VARCHAR(100) NOT NULL UNIQUE COMMENT '账号/学工号',
  `password` VARCHAR(255) NOT NULL COMMENT '哈希加密后的密码',
  role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户身份',
  username VARCHAR(50) NOT NULL COMMENT '用户名/昵称',
  phone_number VARCHAR(20) NULL,
  age SMALLINT NULL,
  gender ENUM('男', '女', '保密') DEFAULT '保密',
  mailbox VARCHAR(100) NULL,
  user_image VARCHAR(300) NULL,
  address VARCHAR(150) NULL,
  credit_score INT NOT NULL DEFAULT 10,
  is_active TINYINT(1) DEFAULT 1,-- 是否封禁
  last_login DATETIME NULL,-- 最后登录时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL DEFAULT NULL,
  INDEX idx_username (username),
  INDEX idx_role (role)
);

-- 辅助字段：记录信誉变动时间
ALTER TABLE users ADD COLUMN credit_updated_at DATETIME NULL COMMENT '信誉分最后变动时间';
ALTER TABLE users 
ADD COLUMN last_fulfillment_at DATETIME NULL COMMENT '最后一次成功履约(完成预约)的时间';

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
INSERT IGNORE INTO users(user_account,`password`,role,username,age,gender,mailbox)
VALUES	
('000000000','admin','admin','admin',99,'男','3501114830@qq.com'),
('220591021','fgj','user','南风',22,'男','3501114830@qq.com'),
('220500001','123qwe@fgj','user','张三',21,'男','3503501234@qq.com');


-- ---------------------------------------------------------
-- 5. 场地与类别 (Venues & Categories)
-- ---------------------------------------------------------
CREATE TABLE venue_categories (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '类别ID',
    NAME VARCHAR(50) NOT NULL UNIQUE COMMENT '类别名称',
    icon_mark VARCHAR(400) NULL COMMENT '前端图标标识符(如IconBadminton)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) COMMENT='场地分类表';

SELECT * FROM venue_categories;

INSERT INTO venue_categories (NAME, icon_mark) VALUES 
('羽毛球', 'IconBadminton'), ('乒乓球', 'IconTableTennis'), ('棒球', 'IconBaseball');

CREATE TABLE venues (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '场地ID',
    venue_name VARCHAR(100) NOT NULL UNIQUE COMMENT '场地名称',
    venue_image VARCHAR(400) NULL COMMENT '场地图片地址',
    venue_address VARCHAR(100) NOT NULL COMMENT '场地位置',
    capacity INT NOT NULL DEFAULT 4 COMMENT '场地最大承载人数',
    category_id INT NOT NULL COMMENT '所属类别ID',
    is_open TINYINT DEFAULT 1 COMMENT '是否开放：1-开放，0-停用/维修',
    opening_time VARCHAR(100) DEFAULT '全周' COMMENT '开放时间描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES venue_categories(id)
) COMMENT='场地基本信息表';


INSERT INTO venues (venue_name, venue_address, category_id) VALUES
('羽毛球A场地','北区体育馆一楼', 1),
('乒乓球A场地','北区体育馆一楼', 2),
('棒球A场地','南区操场', 3);

-- ---------------------------------------------------------
-- 6. 预约业务核心表
-- ---------------------------------------------------------
-- 场地日程表
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '日程ID',
    venue_id INT NOT NULL COMMENT '关联场地ID',
    schedule_date DATE NOT NULL COMMENT '日期(yyyy-mm-dd)',
    FOREIGN KEY(venue_id) REFERENCES venues(id),
    UNIQUE KEY unique_venue_date (venue_id, schedule_date)
) COMMENT='场地开放日程表';

INSERT INTO schedules (venue_id, schedule_date) VALUES (1, '2025-10-20'), (2, '2025-10-21');

-- 预约候补队伍表
CREATE TABLE waitlist_teams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slot_id BIGINT NOT NULL COMMENT '关联的时段ID',
    team_leader_id INT NOT NULL COMMENT '队长用户ID',
    team_size INT NOT NULL DEFAULT 1 COMMENT '队伍总人数',
    -- 候补码以及邀请码建议改为255，用于业务拓展
    waitlist_code VARCHAR(32) NULL UNIQUE COMMENT '候补加入码',
    priority_score INT NOT NULL DEFAULT 0 COMMENT '优先级评分(信誉分等综合计算)',
    STATUS ENUM('waiting', 'success', 'failed', 'cancelled') DEFAULT 'waiting' COMMENT '状态:等待中/成功/失败/已取消',
    current_size INT NOT NULL DEFAULT 1 COMMENT '当前已加入队伍的人数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='预约候补队伍表';

-- 候补队员成员表
CREATE TABLE waitlist_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    waitlist_team_id BIGINT NOT NULL COMMENT '候补队伍ID',
    user_id INT NOT NULL COMMENT '用户ID',
    -- 建议增加一个状态，方便处理队员主动退出候补的情况
    STATUS ENUM('active', 'withdrawn', 'promoted') DEFAULT 'active' COMMENT '成员状态:活跃/已退出/已晋升',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (waitlist_team_id) REFERENCES waitlist_teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_member_per_team (waitlist_team_id, user_id)
) COMMENT='候补队伍成员明细表';



-- 时段表
CREATE TABLE time_slots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL COMMENT '关联日程ID',
    start_time TIME NOT NULL COMMENT '开始时间',
    end_time TIME NOT NULL COMMENT '结束时间',
    creator_user_id INT NOT NULL COMMENT '创建者/发起人ID',
    reservation_type ENUM('single', 'group') NOT NULL DEFAULT 'single' COMMENT '预约类型:个人/团队',
    STATUS ENUM('pending','in_progress','completed','cancelled','no_show','failed') NOT NULL DEFAULT 'pending' COMMENT '状态:待开始/进行中/完成/取消/缺席/失败',
    current_participants INT DEFAULT 0 COMMENT '当前已预约人数',
    max_participants INT DEFAULT 1 COMMENT '该时段最大容纳人数',
    invitation_code VARCHAR(32) NULL UNIQUE COMMENT '团队邀请码',
    waitlist_count INT NOT NULL DEFAULT 0 COMMENT '当前候补队伍数',
    max_waitlist INT NOT NULL DEFAULT 2 COMMENT '最大候补队列长度',
    record_source ENUM('direct_booking', 'waitlist_promotion') COMMENT '记录来源:直接预约/候补晋升',
    promoted_from_waitlist BIGINT NULL COMMENT '如果是晋升，记录原候补队伍ID',
    is_active TINYINT(1) GENERATED ALWAYS AS (CASE WHEN STATUS IN ('cancelled', 'failed') THEN NULL ELSE 1 END) VIRTUAL COMMENT '虚拟列:用于过滤无效预约',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_user_id) REFERENCES users(id),
    FOREIGN KEY (promoted_from_waitlist) REFERENCES waitlist_teams(id)
) COMMENT='具体预约时段表';

-- 交叉补齐外键
ALTER TABLE waitlist_teams ADD FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE;
ALTER TABLE waitlist_teams ADD FOREIGN KEY (team_leader_id) REFERENCES users(id);

-- 补充字段
ALTER TABLE time_slots 
    ADD COLUMN penalty_level TINYINT DEFAULT 0 COMMENT '惩罚等级: 0-未扣, 1-迟到3min, 2-迟到6min, 3-缺席/踢出',
    ADD COLUMN last_penalty_at DATETIME NULL COMMENT '最后一次扣分记录时间';

ALTER TABLE time_slots 
ADD COLUMN checked_in_at DATETIME NULL COMMENT '用户实际签到时间';


-- 预约参与关系表
CREATE TABLE slot_participants (
    slot_id BIGINT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (slot_id, user_id),
    FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


-- 补充：
-- 防止一个人在同一个候补队里出现两次（这个一定要加！）
ALTER TABLE waitlist_members ADD UNIQUE INDEX idx_team_user (waitlist_team_id, user_id);

-- 防止一个人重复加入同一个正式预约
ALTER TABLE slot_participants ADD UNIQUE INDEX idx_slot_user (slot_id, user_id);
-- ---------------------------------------------------------
-- 7. 补充业务表 (计划、公告、失物)
-- ---------------------------------------------------------

-- 用户计划表
CREATE TABLE user_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '计划ID',
    user_id INT NOT NULL COMMENT '用户ID',
    plan_type ENUM('daily','monthly','yearly') NOT NULL COMMENT '计划周期',
    plan_detail VARCHAR(1500) NOT NULL COMMENT '计划具体文字内容',
    plan_date DATE NOT NULL COMMENT '计划所属日期',
    complete_status BOOLEAN DEFAULT FALSE COMMENT '是否完成',
    plan_year INT NULL COMMENT '所属年份',
    plan_month INT NULL COMMENT '所属月份',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
) COMMENT='用户计划表';

-- 公告表
CREATE TABLE affiche (
    affiche_id INT AUTO_INCREMENT PRIMARY KEY COMMENT '公告ID',
    user_id INT NOT NULL COMMENT '发布管理员ID',
    pubdate DATETIME NOT NULL COMMENT '发布展示时间',
    affiche_title VARCHAR(255) NOT NULL COMMENT '公告标题',
    affiche_content TEXT NOT NULL COMMENT '公告正文',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '逻辑删除标记',
    is_visible TINYINT(1) DEFAULT 1 COMMENT '是否前端可见',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='系统公告表';


INSERT INTO affiche (user_id, pubdate, affiche_title, affiche_content)
VALUES
(1, '2025-10-15 20:57:10', '系统维护通知', '我们将于今晚进行前后端数据通信测试，请知悉。'),
(1, '2025-10-15 21:05:10', '新功能上线', '公告模块已支持标题显示和内容截断功能。'),
(1, '2025-11-06 11:49:21', '安全提醒', '请各位管理员定期修改登录密码，确保系统安全。'),
(1, '2026-02-28 10:00:00', '二月工作总结', '二月份前后端对接测试顺利完成，数据统计如下...'),
(1, '2026-02-28 16:30:00', '紧急公告测试', CONCAT('这是一条用于测试的长文本数据：', REPEAT('测试文本', 150)));




-- 失物招领表
CREATE TABLE lost_property (
    property_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '物品ID',
    user_id INT NOT NULL COMMENT '发布者ID',
    property_name VARCHAR(100) NOT NULL COMMENT '物品名称',
    property_describe VARCHAR(1000) NOT NULL COMMENT '物品描述',
    property_image VARCHAR(300) NULL COMMENT '物品照片URL',
    losePlace VARCHAR(120) NULL COMMENT '拾获/遗失地点',
    contact_way VARCHAR(255) NOT NULL COMMENT '失主联系方式',
    is_revert TINYINT(1) DEFAULT 0 COMMENT '是否已归还:0-否, 1-是',
    audit_status TINYINT(1) DEFAULT 0 COMMENT '审核状态:0-待审, 1-通过, 2-驳回',
    reject_reason VARCHAR(255) NULL COMMENT '审核驳回理由',
    is_deleted TINYINT(1) DEFAULT 0 COMMENT '逻辑删除',
    pubdate DATETIME NOT NULL COMMENT '发布日期',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) COMMENT='失物招领数据表';


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





-- 补充表
-- 信誉分审计追踪表
CREATE TABLE credit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    slot_id BIGINT NULL COMMENT '关联的预约时段',
    change_amount INT NOT NULL COMMENT '变动分数(如 -1)',
    reason VARCHAR(255) NOT NULL COMMENT '扣分原因(如: 迟到3分钟内)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE SET NULL
) COMMENT='信誉分变动明细表';

-- 修改现有 credit_logs 的字段注释并增加索引，方便统计
ALTER TABLE credit_logs 
MODIFY COLUMN change_amount INT NOT NULL COMMENT '变动分数: 正数为奖励, 负数为惩罚',
ADD INDEX idx_user_created (user_id, created_at);


-- ---------------------------------------------------------
-- 8. 触发器
-- ---------------------------------------------------------
DELIMITER //

DROP TRIGGER IF EXISTS sync_reservation_count_after_insert//
CREATE TRIGGER sync_reservation_count_after_insert
AFTER INSERT ON slot_participants
FOR EACH ROW
BEGIN
    UPDATE time_slots SET current_participants = current_participants + 1 WHERE id = NEW.slot_id;
END//

DROP TRIGGER IF EXISTS sync_reservation_count_after_delete//
CREATE TRIGGER sync_reservation_count_after_delete
AFTER DELETE ON slot_participants
FOR EACH ROW
BEGIN
    UPDATE time_slots SET current_participants = GREATEST(0, current_participants - 1) WHERE id = OLD.slot_id;
END//

DROP TRIGGER IF EXISTS update_waitlist_count_after_insert//
CREATE TRIGGER update_waitlist_count_after_insert
AFTER INSERT ON waitlist_teams
FOR EACH ROW
BEGIN
    UPDATE time_slots SET waitlist_count = waitlist_count + 1 WHERE id = NEW.slot_id;
END//

DELIMITER ;

-- 9. 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;


-- show tables;

SELECT * FROM users;
SELECT * FROM venues;
SELECT *FROM venue_categories;
SELECT*FROM schedules;
SELECT*FROM waitlist_teams;
SELECT*FROM time_slots;
SELECT*FROM slot_participants;
SELECT*FROM user_plans;
SELECT*FROM affiche;
SELECT*FROM lost_property;