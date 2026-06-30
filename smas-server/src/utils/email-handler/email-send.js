const emailjs = require("@emailjs/nodejs");
const { generateOtpEmailTemplate, generateAnnouncementEmailTemplate } = require("./email-templates");

const sendOtpEmail = async({ name, email, otp, expiry_date, onSuccess=() => { }, onFailed= () => { } }) => {
    const html = generateOtpEmailTemplate({
        user_name: name,
        otp_code: otp,
        expiry_date,
    });

    const templateParams = {
        to_email: email,
        subject: "SMAS Verification Code",
        html, // 👈 FULL TEMPLATE SENT HERE
    };

    try {
        const response = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            templateParams,
            {
                publicKey: process.env.EMAILJS_PUBLIC_KEY,
                privateKey: process.env.EMAILJS_PRIVATE_KEY,
            }
        );

        console.log("✅ OTP Email Sent:", response.status);
        onSuccess()
        return true;

    } catch (error) {
        console.error("❌ OTP Email Failed:", error);
        onFailed(error)
        return false;
    }
};


const sendAnnouncementEmailToMany = async ({
    users,
    heading,
    message,
}) => {

    const results = {
        sent: 0,
        failed: 0,
        errors: [],
    };

    for (const user of users) {
        try {
            const html = generateAnnouncementEmailTemplate({
                user_name: user.name,
                heading,
                message,
            });

            const templateParams = {
                to_email: user.email,
                subject: heading || "SMAS Announcement",
                html,
            };

            await emailjs.send(
                process.env.EMAILJS_SERVICE_ID,
                process.env.EMAILJS_TEMPLATE_ID,
                templateParams,
                {
                    publicKey: process.env.EMAILJS_PUBLIC_KEY,
                    privateKey: process.env.EMAILJS_PRIVATE_KEY,
                }
            );

            results.sent++;

        } catch (error) {
            console.error(`❌ Failed for ${user.email}`, error);

            results.failed++;
            results.errors.push({
                email: user.email,
                error: error.message || "Unknown error",
            });
        }
    }

    return results;
};

module.exports = { sendOtpEmail, sendAnnouncementEmailToMany }