const mysql = require('mysql2');
const {db} = require('../config/config');



// 创建连接池
const pool = mysql.createPool({
    host:db.host,
    user:db.user,
    password:db.password,
    database:db.database,
    waitForConnections:true,
    connectionLimit:10,
    queueLimit:0,
});

// 对连接池promise化
const poolPromise = pool.promise();

module.exports = poolPromise;