const express = require('express');
const verifyToken = require('../utils/verifyToken');


const router = express.Router();

router.use('/user',require('../routes/user'));
router.use('/admin',require('../routes/admin'));

module.exports = router;