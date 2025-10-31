import { Document } from "mongoose";

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    phoneNumber: string;
    country: string;
    role: "user" | "admin";
    createdAt: Date;

    itelBillingVerified?: boolean;
    itelBillingSignedUp?: boolean;
    itelBillingPIN?: string;
    itelBillingMobileNumber?: string;
    itelBillingClientType?: 1 | 2 | 3 | 4; // 1=Originating, 2=Terminating, 3=Both, 4=Reseller
}
