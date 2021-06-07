import AppController from '../controllers/AppController';

const express = require('express');

const router = express.Router();

// the Routes
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

export default router;
