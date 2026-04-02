const express = require('express');
const { createGroup, getGroups, getGroupById, joinByInvite } = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All group routes require authentication
router.use(protect);

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.post('/join/:inviteCode', joinByInvite);

module.exports = router;
