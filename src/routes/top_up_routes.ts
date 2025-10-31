
import express from 'express';
import { topUpController } from '../controllers/top_up_controller';

const router = express.Router();

// Top-up routes
router.post('/ip-client', topUpController.topUpForIpClient);
router.post('/pin-user', topUpController.topUpForPinUser);
router.get('/status/:rechargeID', topUpController.checkTopUpStatus);

export default router;