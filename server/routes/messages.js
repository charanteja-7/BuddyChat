const express = require('express');
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All message routes require authentication
router.use(protect);

router.get('/:groupId', getMessages);
router.post('/:groupId', sendMessage);

module.exports = router;
