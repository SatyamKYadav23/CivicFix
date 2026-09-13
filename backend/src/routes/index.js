const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const complaintRoutes = require('./complaint.routes');
const authorityRoutes = require('./authority.routes');
const workerRoutes = require('./worker.routes');
const notificationRoutes = require('./notification.routes');
const adminRoutes = require('./admin.routes');
const analyticsRoutes = require('./analytics.routes');

const router = express.Router();

// Mount sub-routers
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/complaints', complaintRoutes);
router.use('/authority', authorityRoutes);
router.use('/worker', workerRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;


