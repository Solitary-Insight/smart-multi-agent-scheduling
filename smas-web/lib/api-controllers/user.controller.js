import { HttpStatusCode } from "axios";
import { UserService } from "../api-services/user.service";

export class UserController {
    constructor() {
        this.userService = new UserService();
    }

    // ===============================
    // Login User
    // ===============================
    async loginUser({ payload, onSuccess, onFailed }) {
        try {
            const result = await this.userService.loginUser({ payload });
            onSuccess(result);
        } catch (error) {
            console.error("[LOGIN-USER-ERROR]", error);
            switch (error.status) {
                case HttpStatusCode.Unauthorized:
                    onFailed(`Invalid Credentials. Please provide correct credentials for ${payload.role} account.`);
                    break;
                default:
                    onFailed(`Something went wrong while signing in ${payload.role}. Please try again.`);
            }
        }
    }

    async checkAuth({ session_token, onSuccess, onFailed }) {
        try {
            const result = await this.userService.checkAuth({ session_token });
            onSuccess(result);

        } catch (error) {
            console.error("[AUTH-USER-ERROR]", error);

            const status = error?.status || error?.response?.status;

            switch (status) {

                case 400:
                    onFailed("Session token is missing or invalid request.");
                    break;

                case 401:
                    onFailed("Session is invalid or expired. Please login again.");
                    break;

                case 403:
                    onFailed("Access denied. OTP verification required.");
                    break;

                case 500:
                    onFailed("Server error. Please try again later.");
                    break;

                default:
                    onFailed("Something went wrong. Please try again.");
            }
        }
    }

    async logout({ session_token, onSuccess, onFailed }) {
        try {
            const result = await this.userService.logout({ session_token });



            onSuccess(result);

        } catch (error) {
            console.error("[LOGOUT-ERROR]", error);

            const status = error?.response?.status || error?.status;

            switch (status) {

                case 400:
                    onFailed("Invalid logout request.");
                    break;

                case 401:


                    onSuccess({
                        message: "Session already expired. Logged out.",
                        logged_out: true
                    });
                    break;

                case 403:
                    onFailed("Access denied.");
                    break;

                case 500:
                    onFailed("Server error. Please try again later.");
                    break;

                default:
                    onFailed("Something went wrong. Please try again.");
            }
        }
    }


    async handleVerifyOtp({ session_token, otp_code, onSuccess, onFailed }) {
        try {
            const result = await this.userService.verifyOtp({ session_token, otp_code });

            onSuccess(result);

        } catch (error) {
            console.error("[OTP-VERIFY-ERROR]", error);

            const status = error?.response?.status;

            switch (status) {

                case 400:
                    onFailed( "OTP and session token are required.");
                    break;

                case 401:
                    onFailed( "Invalid or expired OTP. Please try again.");
                    break;

                case 403:
                    onFailed("Access denied.");
                    break;

                case 500:
                    onFailed("Server error. Please try again later.");
                    break;

                default:
                    onFailed( "Something went wrong. Please try again.");
            }
        }
    }


    async handleResendOtp({ session_token, onSuccess, onFailed }) {
        try {
          const result = await this.userService.resendOtp({ session_token });
       console.log('result', result)
          onSuccess(result);
      
        } catch (error) {
          console.error("[OTP-RESEND-ERROR]", error);
      
          const status = error?.response?.status;
          const message = error?.response?.data?.message;
      
          switch (status) {
      
            case 400:
              onFailed(message || "Session token is required.");
              break;
      
            case 401:
              onFailed(message || "Session expired or invalid. Please login again.");
              break;
      
            case 429:
              onFailed(message || "Too many requests. Please wait before requesting another OTP.");
              break;
      
            case 500:
              onFailed("Server error. Please try again later.");
              break;
      
            default:
              onFailed(message || "Something went wrong. Please try again.");
          }
        }
      }


    async getAdmins({ onSuccess, onFailed }) {
        try {
            const result = await this.userService.getAdmins();
            onSuccess(result);
        } catch (error) {
            console.error("[GET ADMINS ERROR]", error);
            onFailed("Failed to fetch admin! Please try again...");
        }
    }


    async createAdmins({ payload, onSuccess, onFailed }) {
        try {
            const result = await this.userService.createAdmins({ payload });
            onSuccess(result);
        } catch (error) {
            console.error("[CREATE ADMINS ERROR]", error);
            onFailed("Failed to create admin! Please try again...");
        }
    }

    async updateUser({ id, payload, onSuccess, onFailed }) {
        try {
            const result = await this.userService.updateUser({ id, payload });
            onSuccess(result);
        } catch (error) {
            console.error("[UPDATE USER ERROR]", error);
            onFailed("Failed to update user");
        }
    }
    async deleteUser({ id, onSuccess, onFailed }) {
        try {
            const result = await this.userService.deleteUser({ id });
            onSuccess(result);
        } catch (error) {
            console.error("[DELETE USER ERROR]", error);
            onFailed("Failed to delete user!");
        }
    }
}