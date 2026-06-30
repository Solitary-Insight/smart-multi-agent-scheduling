const generateOtpEmailTemplate = ({ user_name, otp_code, expiry_date }) => {
    return `
    <div style="font-family: system-ui, Arial, sans-serif; background:#f6f8fb; padding:20px;">
  
      <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;padding:25px;border:1px solid #eee;">
  
        <!-- HEADER -->
        <h2 style="margin:0 0 10px 0;color:#2c3e50;">
          SMAS Verification Code
        </h2>
  
        <p style="font-size:14px;color:#555;">
          Hello <strong>${user_name}</strong>, use the OTP below to complete your login verification.
        </p>
  
        <!-- OTP BOX -->
        <div style="
          margin:25px 0;
          text-align:center;
          padding:20px;
          background:#f0f7ff;
          border:1px dashed #b3d4ff;
          border-radius:10px;
        ">
          <div style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#1d4ed8;">
            ${otp_code}
          </div>
          <div style="font-size:12px;color:#666;margin-top:8px;">
            This OTP is valid until <strong>${expiry_date}</strong>
          </div>
        </div>
  
        <!-- INFO -->
        <p style="font-size:13px;color:#777;line-height:1.6;">
          If you did not request this code, you can safely ignore this email.
          Do not share this OTP with anyone.
        </p>
  
        <!-- FOOTER -->
        <div style="margin-top:25px;font-size:12px;color:#aaa;text-align:center;">
          © ${new Date().getFullYear()} SMAS. All rights reserved.
        </div>
  
      </div>
    </div>
    `;
  };
  

  const generateAnnouncementEmailTemplate = ({ user_name, heading, message }) => {
    return `
    <div style="font-family: system-ui, Arial, sans-serif; background:#f6f8fb; padding:20px;">
  
      <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;padding:25px;border:1px solid #eee;">
  
        <!-- HEADER -->
        <h2 style="margin:0 0 10px 0;color:#2c3e50;">
          ${heading}
        </h2>
  
        <!-- GREETING -->
        <p style="font-size:14px;color:#555;">
          Hello <strong>${user_name || "User"}</strong>,
        </p>
  
        <!-- MESSAGE BOX -->
        <div style="
          margin:25px 0;
          padding:20px;
          background:#f0f7ff;
          border:1px solid #d6e9ff;
          border-radius:10px;
          color:#333;
          font-size:14px;
          line-height:1.6;
        ">
          ${message}
        </div>
  
        <!-- NOTE -->
        <p style="font-size:13px;color:#777;line-height:1.6;">
          This is an official announcement from SMAS. Please stay updated for further notifications.
        </p>
  
        <!-- FOOTER -->
        <div style="margin-top:25px;font-size:12px;color:#aaa;text-align:center;">
          © ${new Date().getFullYear()} SMAS. All rights reserved.
        </div>
  
      </div>
    </div>
    `;
  };
  
  module.exports = {generateAnnouncementEmailTemplate,generateOtpEmailTemplate};