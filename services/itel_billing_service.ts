import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface ITelBillingConfig {
  baseUrl: string;
  allowedIp?: string;
}

interface PinVerifyParams {
  firstName?: string;
  lastName?: string;
  address?: string;
  companyName?: string;
  state?: string;
  countryID?: string;
  emailAddress?: string;
  fax?: string;
  mobileNumber: string;
  password: string;
  infoFrom?: string;
  ratePlanID?: string;
  balance?: string;
  topUpRatePlanID?: string;
  callerIDs: string;
  currency?: string;
  language?: string;
  parentID?: string;
}

interface ClientVerifyParams {
  username: string;
  customerType: 1 | 2 | 3 | 4; // 1=Originating, 2=Terminating, 3=Both, 4=Reseller
  password: string;
  ip?: string; // Format: IP:PORT (e.g., 165.32.23.23:5060)
  balance?: string;
  ratePlanID?: string;
  topUpRatePlanID?: string;
  orgPrefix?: string; // Comma-separated
  orgPrefixRateID?: string; // Comma-separated
  terPrefix?: string; // Comma-separated
  terPrefixRateID?: string; // Comma-separated
  callerIDs?: string; // Comma-separated
  firstName?: string;
  lastName?: string;
  address?: string;
  companyName?: string;
  state?: string;
  countryID?: string;
  emailAddress?: string;
  fax?: string;
  mobileNumber?: string;
  infoFrom?: string;
  currency?: string;
  language?: string;
}

interface TopUpParams {
  countryName: string;
  operatorName: string;
  serviceType: 0 | 1; // 0=prepaid, 1=postpaid
  mobileNumber: string;
  rechargeAmount: number;
  user?: string; // PIN number (for PIN users)
  nonce?: string;
  password?: string; // MD5 digest (for PIN users)
}

interface ApiResponse {
  status: string;
  description: string;
}

interface TopUpResponse {
  rechargeID: number;
}

interface TopUpStatusResponse {
  status: number;
}

class ITelBillingService {
  private client: AxiosInstance;
  private config: ITelBillingConfig;

  constructor(config: ITelBillingConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  }

  // PIN Sign Up Methods

  async verifyPinUser(params: PinVerifyParams): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/api/signupPin.jsp', null, {
        params: {
          type: 'verify',
          ...params,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async signUpPinUser(mobileNumber: string, pinbatchID?: string, dontSendMail?: boolean): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/api/signupPin.jsp', null, {
        params: {
          type: 'signUp',
          mobileNumber,
          ...(pinbatchID && { pinbatchID }),
          ...(dontSendMail !== undefined && { dontSendMail }),
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Client Sign Up Methods

  async verifyClient(params: ClientVerifyParams): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/api/signupClient.jsp', null, {
        params: {
          type: 'verify',
          ...params,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async signUpClient(username: string, dontSendMail?: boolean): Promise<ApiResponse> {
    try {
      const response = await this.client.post('/api/signupClient.jsp', null, {
        params: {
          type: 'signUp',
          username,
          ...(dontSendMail !== undefined && { dontSendMail }),
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Top Up Methods

  async topUpForIpClient(params: TopUpParams): Promise<TopUpResponse> {
    try {
      const response = await this.client.post('/api/mtuApi.jsp', null, {
        params: {
          type: 'recharge',
          countryName: params.countryName,
          operatorName: params.operatorName,
          serviceType: params.serviceType,
          mobileNumber: params.mobileNumber,
          rechargeAmount: params.rechargeAmount,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async topUpForPinUser(params: TopUpParams & { user: string; nonce: string; pinPassword: string }): Promise<TopUpResponse> {
    try {
      // Generate MD5 digest: MD5(nonce+user+password)
      const md5Password = crypto
        .createHash('md5')
        .update(params.nonce + params.user + params.pinPassword)
        .digest('hex');

      const response = await this.client.post('/api/mtuApi.jsp', null, {
        params: {
          type: 'recharge',
          countryName: params.countryName,
          operatorName: params.operatorName,
          serviceType: params.serviceType,
          mobileNumber: params.mobileNumber,
          rechargeAmount: params.rechargeAmount,
          user: params.user,
          nonce: params.nonce,
          password: md5Password,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async checkTopUpStatus(rechargeID: number): Promise<TopUpStatusResponse> {
    try {
      const response = await this.client.post('/api/mtuApi.jsp', null, {
        params: {
          type: 'status',
          verificationCode: rechargeID,
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Error Handling

  private handleError(error: any): Error {
    if (error.response) {
      const data = error.response.data;
      return new Error(`iTelBilling API Error: ${JSON.stringify(data)}`);
    } else if (error.request) {
      return new Error('No response from iTelBilling API');
    }
    return new Error(error.message || 'Unknown error');
  }

  // Helper method to parse error codes
  static parseErrorCode(description: string): { code: string; detail?: string } {
    if (description.includes('|')) {
      const [code, detail] = description.split('|');
      return { code, detail };
    }
    return { code: description };
  }

  // Error code mappings for better error messages
  static getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      '5400': 'IP not allowed',
      '5001': 'Mobile number not provided',
      '5005': 'Password not provided',
      '5003': 'Caller ID not provided',
      '5100': 'Client already exists',
      '5103': 'Mobile number is not in Caller ID',
      '5104': 'Client not verified',
      '5500': 'Invalid type value',
      '5006': 'Username not provided',
      '5007': 'Customer type not provided',
      '5105': 'IP already exists',
      '5803': 'IP format is invalid',
      '5804': 'Port is invalid or out of range',
      '5805': 'Balance amount is invalid',
      '5801': 'Duplicate prefix found',
      '5802': 'Duplicate IP found',
    };
    return errorMessages[errorCode] || 'Unknown error';
  }
}

export default ITelBillingService;