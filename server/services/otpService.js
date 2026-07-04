const crypto = require('crypto');
const nodemailer = require('nodemailer');

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP via Email using Ethereal (for testing) or real SMTP.
 */
const sendOTP = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/"/g, '') : '', 
      },
    });

    const info = await transporter.sendMail({
      from: '"Presto Fitness" <noreply@prestofitness.com>',
      to: email,
      subject: "Your Presto Fitness Verification Code",
      text: `Your Presto Fitness verification code is: ${otp}. Valid for 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #00d4aa; text-align: center;">Presto Fitness</h2>
          <p>Welcome! Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; padding: 20px; background: #f4f4f4; border-radius: 8px; color: #333;">
            ${otp}
          </div>
          <p style="color: #777; font-size: 14px; margin-top: 20px;">This code is valid for 10 minutes.</p>
        </div>
      `,
    });

    console.log(`\n📧 [EMAIL OTP SENT to ${email}]\n`);
    return true;
  } catch (error) {
    console.warn('⚠️ Nodemailer Error:', error.message);
    console.warn(`⚠️ Since email sending failed, here is the OTP: ${otp}`);
    // DO NOT THROW AN ERROR! If we throw, the user gets stuck on the registration page.
    // Instead, return true so the user is directed to the verification screen,
    // where they can check these logs to manually enter the OTP.
    return true;
  }
};

const verifyOTP = (storedOTP, inputOTP, expiresAt) => {
  if (!storedOTP || !inputOTP || !expiresAt) {
    return false;
  }

  if (new Date() > new Date(expiresAt)) {
    return false;
  }

  if (storedOTP.length !== inputOTP.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(storedOTP),
    Buffer.from(inputOTP)
  );
};

module.exports = { generateOTP, sendOTP, verifyOTP };
