// src/controllers/authController.ts
import { Request, Response } from 'express';
import User from '../models/user_model';
import ITelBillingService from '../services/itel_billing_service';

// Initialize iTelBilling service
const itelBillingService = new ITelBillingService({
  baseUrl: process.env.ITELBILLING_BASE_URL || 'http://sip.myswitch.com',
});

export const authController = {
  // Original register method (keeping for backward compatibility)
  register: async (req: Request, res: Response) => {
    try {
      if (!req.body) {
        res.status(400).json({ message: 'No data provided' });
        return;
      }

      const { username, email, password, phoneNumber, country } = req.body;

      if (!username || !email || !password || !phoneNumber || !country) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });

      if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }

      const user = new User({
        username,
        email,
        password,
        phoneNumber,
        country,
      });

      await user.save();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },

  // PIN User Registration (2-step process)
  verifyPinUser: async (req: Request, res: Response) => {
    try {
      const {
        mobileNumber,
        password,
        callerIDs,
        firstName,
        lastName,
        email,
        countryID,
        ratePlanID,
        balance,
        topUpRatePlanID,
        address,
        companyName,
        state,
        fax,
        infoFrom,
        currency,
        language,
        parentID,
      } = req.body;

      // Validate required fields
      if (!mobileNumber || !password || !callerIDs) {
        res.status(400).json({
          status: 'false',
          message: 'Missing required fields: mobileNumber, password, callerIDs',
        });
        return;
      }

      // Check if user already exists in local DB
      const existingUser = await User.findOne({ phoneNumber: mobileNumber });
      if (existingUser && existingUser.itelBillingVerified) {
        res.status(400).json({
          status: 'false',
          message: 'User already verified',
        });
        return;
      }

      // Call iTelBilling verify API
      const verifyResponse = await itelBillingService.verifyPinUser({
        mobileNumber,
        password,
        callerIDs,
        firstName,
        lastName,
        emailAddress: email,
        countryID,
        ratePlanID,
        balance,
        topUpRatePlanID,
        address,
        companyName,
        state,
        fax,
        infoFrom,
        currency,
        language,
        parentID,
      });

      if (verifyResponse.status === 'true') {
        // Store or update user in local DB with verified status
        if (existingUser) {
          existingUser.itelBillingVerified = true;
          existingUser.itelBillingMobileNumber = mobileNumber;
          await existingUser.save();
        } else {
          const newUser = new User({
            username: mobileNumber, // Use mobile as username initially
            email: email || `${mobileNumber}@temp.com`,
            password, // Consider hashing this
            phoneNumber: mobileNumber,
            country: countryID || 'unknown',
            itelBillingVerified: true,
            itelBillingMobileNumber: mobileNumber,
          });
          await newUser.save();
        }

        res.status(200).json({
          status: 'true',
          message: 'Verification successful',
          data: { mobileNumber: verifyResponse.description },
        });
      } else {
        const errorInfo = ITelBillingService.parseErrorCode(verifyResponse.description);
        res.status(400).json({
          status: 'false',
          message: ITelBillingService.getErrorMessage(errorInfo.code),
          errorCode: errorInfo.code,
          detail: errorInfo.detail,
        });
      }
    } catch (error: any) {
      console.error('PIN verification error:', error);
      res.status(500).json({
        status: 'false',
        message: error.message || 'Internal Server Error',
      });
    }
  },

  signUpPinUser: async (req: Request, res: Response) => {
    try {
      const { mobileNumber, pinbatchID, dontSendMail } = req.body;

      if (!mobileNumber) {
        res.status(400).json({
          status: 'false',
          message: 'Mobile number is required',
        });
        return;
      }

      // Check if user is verified in local DB
      const user = await User.findOne({ phoneNumber: mobileNumber });
      if (!user || !user.itelBillingVerified) {
        res.status(400).json({
          status: 'false',
          message: 'User not verified. Please verify first.',
        });
        return;
      }

      // Call iTelBilling signup API
      const signupResponse = await itelBillingService.signUpPinUser(
        mobileNumber,
        pinbatchID,
        dontSendMail
      );

      if (signupResponse.status === 'true') {
        // Update user status in local DB
        user.itelBillingSignedUp = true;
        user.itelBillingPIN = signupResponse.description;
        await user.save();

        res.status(201).json({
          status: 'true',
          message: 'PIN user signup successful',
          data: {
            pin: signupResponse.description,
            mobileNumber,
          },
        });
      } else {
        const errorInfo = ITelBillingService.parseErrorCode(signupResponse.description);
        res.status(400).json({
          status: 'false',
          message: ITelBillingService.getErrorMessage(errorInfo.code),
          errorCode: errorInfo.code,
        });
      }
    } catch (error: any) {
      console.error('PIN signup error:', error);
      res.status(500).json({
        status: 'false',
        message: error.message || 'Internal Server Error',
      });
    }
  },

  // Client (Reseller/IP) Registration
  verifyClient: async (req: Request, res: Response) => {
    try {
      const {
        username,
        customerType,
        password,
        ip,
        balance,
        ratePlanID,
        topUpRatePlanID,
        orgPrefix,
        orgPrefixRateID,
        terPrefix,
        terPrefixRateID,
        callerIDs,
        firstName,
        lastName,
        address,
        companyName,
        state,
        countryID,
        email,
        fax,
        mobileNumber,
        infoFrom,
        currency,
        language,
      } = req.body;

      // Validate required fields
      if (!username || !customerType || !password) {
        res.status(400).json({
          status: 'false',
          message: 'Missing required fields: username, customerType, password',
        });
        return;
      }

      // Validate customer type
      if (![1, 2, 3, 4].includes(customerType)) {
        res.status(400).json({
          status: 'false',
          message: 'Invalid customer type. Must be 1, 2, 3, or 4',
        });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser.itelBillingVerified) {
        res.status(400).json({
          status: 'false',
          message: 'Client already verified',
        });
        return;
      }

      // Call iTelBilling verify API
      const verifyResponse = await itelBillingService.verifyClient({
        username,
        customerType,
        password,
        ip,
        balance,
        ratePlanID,
        topUpRatePlanID,
        orgPrefix,
        orgPrefixRateID,
        terPrefix,
        terPrefixRateID,
        callerIDs,
        firstName,
        lastName,
        address,
        companyName,
        state,
        countryID,
        emailAddress: email,
        fax,
        mobileNumber,
        infoFrom,
        currency,
        language,
      });

      if (verifyResponse.status === 'true') {
        // Store or update user in local DB
        if (existingUser) {
          existingUser.itelBillingVerified = true;
          existingUser.itelBillingClientType = customerType;
          await existingUser.save();
        } else {
          const newUser = new User({
            username,
            email: email || `${username}@temp.com`,
            password, // Consider hashing
            phoneNumber: mobileNumber || username,
            country: countryID || 'unknown',
            itelBillingVerified: true,
            itelBillingClientType: customerType,
          });
          await newUser.save();
        }

        res.status(200).json({
          status: 'true',
          message: 'Client verification successful',
          data: { clientType: verifyResponse.description },
        });
      } else {
        const errorInfo = ITelBillingService.parseErrorCode(verifyResponse.description);
        res.status(400).json({
          status: 'false',
          message: ITelBillingService.getErrorMessage(errorInfo.code),
          errorCode: errorInfo.code,
          detail: errorInfo.detail,
        });
      }
    } catch (error: any) {
      console.error('Client verification error:', error);
      res.status(500).json({
        status: 'false',
        message: error.message || 'Internal Server Error',
      });
    }
  },

  signUpClient: async (req: Request, res: Response) => {
    try {
      const { username, dontSendMail } = req.body;

      if (!username) {
        res.status(400).json({
          status: 'false',
          message: 'Username is required',
        });
        return;
      }

      // Check if user is verified
      const user = await User.findOne({ username });
      if (!user || !user.itelBillingVerified) {
        res.status(400).json({
          status: 'false',
          message: 'Client not verified. Please verify first.',
        });
        return;
      }

      // Call iTelBilling signup API
      const signupResponse = await itelBillingService.signUpClient(username, dontSendMail);

      if (signupResponse.status === 'true') {
        // Update user status
        user.itelBillingSignedUp = true;
        await user.save();

        res.status(201).json({
          status: 'true',
          message: 'Client signup successful',
          data: { username: signupResponse.description },
        });
      } else {
        const errorInfo = ITelBillingService.parseErrorCode(signupResponse.description);
        res.status(400).json({
          status: 'false',
          message: ITelBillingService.getErrorMessage(errorInfo.code),
          errorCode: errorInfo.code,
        });
      }
    } catch (error: any) {
      console.error('Client signup error:', error);
      res.status(500).json({
        status: 'false',
        message: error.message || 'Internal Server Error',
      });
    }
  },

  // Original login method
  login: async (req: Request, res: Response) => {
    try {
      if (!req.body) {
        res.status(400).json({ message: 'No data provided' });
        return;
      }

      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      const user = await User.findOne({ email });

      if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      const isPasswordValid = user.password === password;

      if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          itelBillingSignedUp: user.itelBillingSignedUp || false,
          itelBillingPIN: user.itelBillingPIN,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  },
};