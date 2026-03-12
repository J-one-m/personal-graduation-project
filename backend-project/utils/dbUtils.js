/* 
    专门存放工具的函数：
    示例文件及其描述：
    dbUtils.js        # 数据库相关的工具函数 (例如 executeQuery)
    authUtils.js      # 认证/授权相关的工具函数 (例如 token 生成/验证)
    dataValidation.js # 数据验证工具
    commonHelpers.js  # 其他通用辅助函数
*/

const db = require('../db/connection');

//利用函数来统一处理数据库操作中的错误，其中sql为查询语句，params为查询参数
async function executeQuery(sql,params = []){
    try{
        // 通过db.query，连接的获取和释放是自动管理的，因此不需要手动释放连接。
        // 直接通过 poolPromise.getConnection() 获取连接，并在事务中手动管理连接的生命周期。
        // 这种情况下，您需要手动释放连接，以确保连接池能够重用这个连接。
        const [rows,fields] = await db.query(sql,params);
        return rows;
    }catch(error){
        console.error('Database query error:',error);
        throw error;
    }
}

// 获取一个底层的连接，用于手动控制事务
async function getTransactionConnection() {
    return await db.getConnection();
}

module.exports = {
    executeQuery,
    getTransactionConnection,
};