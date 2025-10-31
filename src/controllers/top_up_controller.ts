// src/controllers/topUpController.ts
import { Request, Response } from 'express';
import ITelBillingService from '../services/itel_billing_service';
import User from '../models/user_model';
import crypto from 'crypto';

const itelBillingService = new ITelBillingService({
  baseUrl: process.env.ITELBILLING_BASE_URL || 'http://sip.myswitch.com',
});

export const topUpController = {
  // Top-up for IP clients
  topUpForIpClient: async (req: Request, res: Response) => {
    try {
      const {
        countryName,
        operatorName,
        serviceType,
        mobileNumber,
        rechargeAmount,
      } = req.body;

      // Validate required fields
      if (!countryName || !operatorName || serviceType === undefined || !mobileNumber || !rechargeAmount) {
        res.status(400).json({
          status: 'false',
          message: 'Missing required fields',
        });
        return;
      }

      // Validate service type
      if (![0, 1].includes(serviceType)) {
        res.status(400).json({
          status: 'false',
          message: 'Service type must be 0 (prepaid) or 1 (postpaid)',
        });
        return;
      }

      // Call iTelBilling top-up API
      const topUpResponse = await itelBillingService.topUpForIpClient({
        countryName,
        operatorName,
        serviceType,
        mobileNumber,
        rechargeAmount: parseFloat(rechargeAmount),
      });

      res.status(200).json({
        status: 'true',
        message: 'Top-up request successful',
        data: {
          rechargeID: topUpResponse.rechargeID,
        },
      });
    } catch (error: any) {
      console.error('Top-up error:', error);
      res.status(500).json({
        status: 'false',
        message: error.message || 'Internal Server Error',
      });
    }
  },

  // Top-up for PIN users
  topUpForPinUser: async (req: Request, res: Response) => {
    try {
      const {
        countryName,
        operatorName,
        serviceType,
        mobileNumber,
        rechargeAmount,
        user, // PIN number
        password, // User's actual password
      } = req.body;

      // Validate required fields
      if (!countryName || !operatorName || serviceType === undefined || 
          !mobileNumber || !rechargeAmount || !user || !password) {
        res.status(400).json({
          status: 'false',
          message: 'Missing required fields',
        });
        return;
      }

      // Validate service type
      if (![0, 1].includes(serviceType)) {
        res.status(400).json({
          status: 'false',
          message: 'Service type must be 0 (prepaid) or 1 (postpaid)',
        });
        return;
      }

      // Verify user exists and has the PIN
      const userDoc = await User.findOne({ itelBillingPIN: user });
      if (!userDoc) {
        res.status(404).json({
          status: 'false',
          message: 'User not found',
        });
        return;
      }

      // Generate nonce (random string)
      const nonce = crypto.randomBytes(3).toString('hex').toUpperCase();

      // Call iTelBilling top-up API
      const topUpResponse = await itelBillingService.topUpForPinUser({
        countryName,
        operatorName,
        serviceType,
        mobileNumber,
        rechargeAmount: parseFloat(rechargeAmount),
        user,
        nonce,
        pinPassword: password,
      });

      res.status(200).json({
        status: 'true',
        message: 'Top-up request successful',
        data: {
          rechargeID: topUpResponse.rechargeID,
        },
      });
    } catch (error: any) {
      console.error('Top-up error:', error);
      res.status(500).json({
        status: 'false',
        message: error.message || 'Internal Server Error',
      });
    }
  },

  // Check top-up status
  checkTopUpStatus: async (req: Request, res: Response) => {
    try {
      const { rechargeID } = req.params;

      if (!rechargeID) {
        res.status(400).json({
          status: 'false',
          message: 'Recharge ID is required',
        });
        return;
      }

      // Call iTelBilling status check API
      const statusResponse = await itelBillingService.checkTopUpStatus(parseInt(rechargeID));

      // Status codes (you may need to define these based on iTelBilling documentation)
      const statusMessages: Record<number, string> = {
        0: 'Pending',
        1: 'Completed',
        2: 'Failed',
        3: 'Processing',
        // Add more status codes as needed
      };

      res.status(200).json({
        status: 'true',
        message: 'Status retrieved successfully',
        data: {
          rechargeID: parseInt(rechargeID),
          status: statusResponse.status,
          statusMessage: statusMessages[statusResponse.status] || 'Unknown',
        },
      });
    } catch (error: any) {
      console.error('Status check error:', error);
      res.status(500).json({
        status: 'false',
        message: error.message || 'Internal Server Error',
      });
    }
  },
};

