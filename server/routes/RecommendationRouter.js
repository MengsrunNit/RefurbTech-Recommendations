import express from 'express';
import { getRecommendations, getAllPhones } from '../controllers/RecommendationController.js';

const router = express.Router();

router.post('/recommendations', getRecommendations);
router.get('/recommendations/all', getAllPhones);

export default router;
