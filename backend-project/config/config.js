const config = {
    port:3000,
    corsOptions:{
        // origin:'http://localhost:5173',//允许单个源
        origin:[
            'http://localhost:5173', 
            'http://10.160.114.118:5173',
            'http://169.254.102.150:5173',
            'http://169.254.153.98:5173',
        ],//允许多个源
    },
    db:{
        host:'localhost',
        user:'root',
        password:'123456',
        database:'graduationProject',
        timezone: '+08:00',
        dateStrings: true,
    },
    secretKey:'^_^',//定义密钥
}


module.exports = config;