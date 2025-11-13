import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import connectDB from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, success } = body;

    if (!userId) {
      return NextResponse.json({ message: "userId is required" }, { status: 422 });
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Update verification
    user.verificationStatus = success ? 3 : 2;
    if (success) user.verificationId = `${Date.now().toString().slice(-8)}`;
    await user.save();

    // Nodemailer setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const fullName = `${user.firstName} ${user.middleName} ${user.lastName}`;
    const address = user.address?.raw || "Not provided";
    const verificationId = user.verificationId || "—";
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Success email template
    const successHTML = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>KYC Verification Complete</title>
  <style>
    body, table, td { background-color: #0b0b0b !important; }
    @media screen and (max-width:600px) {
      .container { width: 100% !important; padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0b0b0b;color:#ffffff;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:20px;">
        <table class="container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f1720;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:20px;">
              <table width="100%">
                <tr>
                  <td align="left">
                    <img src="https://res.cloudinary.com/dtgigdp2j/image/upload/v1763040989/tbd/zenith_zyclxv.png" alt="Zenith Bank Logo" width="60" style="display:block;border-radius:12px;background:#fff;padding:8px;">
                  </td>
                  <td align="right" style="color:#9ca3af;font-size:13px;">
                    KYC Verification — Address Confirmed
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;">
              <h1 style="color:#10b981;font-size:20px;margin:0 0 10px 0;">Address Verified Successfully</h1>
              <p style="color:#9ca3af;">Hi <strong style="color:#fff;">${fullName}</strong>,</p>
              <p style="color:#9ca3af;">We’ve confirmed the address you provided:</p>
              <p style="color:#ffffff;font-style:italic;">${address}</p>
              <p style="color:#9ca3af;">Your KYC verification is now complete for this address.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px;background-color:#0b0b0b;">
              <div style="color:#9ca3af;font-size:13px;margin-bottom:8px;">Your KYC Number</div>
              <div style="font-size:28px;font-weight:800;letter-spacing:2px;color:#10b981;background-color:rgba(16,185,129,0.1);padding:12px 24px;border-radius:10px;border:1px solid rgba(16,185,129,0.2);display:inline-block;">
                KYC-${verificationId}
              </div>
              <p style="color:#9ca3af;font-size:13px;margin-top:8px;">Verified on: ${date}</p>
              <a href="#" style="display:inline-block;margin-top:15px;padding:12px 20px;background-color:#10b981;color:#081010;text-decoration:none;font-weight:700;border-radius:8px;">View Verification</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;text-align:center;">
              <p style="color:#9ca3af;font-size:13px;">Please keep this KYC number for your records.</p>
              <p style="color:#9ca3af;font-size:13px;">Thanks,<br><strong style="color:#fff;">Zenith Bank KYC Team</strong></p>
              <p style="color:#9ca3af;font-size:12px;">Need help? <a href="mailto:support@kyc-tbd.com" style="color:#10b981;text-decoration:none;">support@kyc-tbd.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Failure email template
    const failureHTML = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>KYC Verification Failed</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0b0b;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:680px;margin:28px auto;padding:24px;background-color:#0f1720;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">
    <div style="display:flex;align-items:center;gap:14px;">
      <div style="background:#fff;padding:8px;border-radius:12px;">
        <img src="https://res.cloudinary.com/dtgigdp2j/image/upload/v1763040989/tbd/zenith_zyclxv.png" alt="Zenith Bank KYC Logo" style="width:70px;height:70px;border-radius:12px;display:block;">
      </div>
      <div>
        <div style="font-size:18px;font-weight:700;">KYC Verification — Address Check Failed</div>
        <div style="font-size:13px;color:#9ca3af;">Sent by Zenith Bank KYC Team</div>
      </div>
    </div>
    <div style="margin:24px 0;padding:18px;background:linear-gradient(90deg,rgba(239,68,68,0.08),transparent);border-left:4px solid #ef4444;border-radius:8px;">
      <h1 style="margin:0 0 8px;color:#ef4444;font-size:20px;">Address Verification Failed</h1>
      <p style="margin:6px 0;color:#9ca3af;">Hi <strong>${fullName}</strong>,</p>
      <p style="margin:6px 0;color:#9ca3af;">We were unable to verify the address you provided. Please ensure your proof of address is clear, recent, and matches your provided information.</p>
    </div>
    <div style="background-color:#121a23;padding:24px;border-radius:8px;margin:16px 0;text-align:center;">
      <p style="margin:0 0 10px;color:#9ca3af;">You can review your address details and try again.</p>
      <a href="#" target="_blank" rel="noopener" style="display:inline-block;padding:12px 18px;border-radius:8px;text-decoration:none;color:#081010;background-color:#ef4444;font-weight:700;margin-top:10px;">Retry Verification</a>
    </div>
    <div style="margin-top:18px;font-size:12px;color:#9ca3af;">
      <div>Thanks,<br/><strong>Zenith Bank KYC Team</strong></div>
      <div style="margin-top:8px;">Need help? <a href="mailto:support@kyc-tbd.com" style="color:#ef4444;text-decoration:none;">support@kyc-tbd.com</a></div>
    </div>
  </div>
</body>
</html>`;

    // Choose email body
    const html = success ? successHTML : failureHTML;
    const subject = success
      ? "✅ Address Verification Complete — Zenith Bank KYC"
      : "❌ Address Verification Failed — Zenith Bank KYC";

    // Send email
    await transporter.sendMail({
      from: `"Zenith Bank KYC" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html,
    });

    return NextResponse.json({
      message: `Verification ${success ? "success" : "failure"} email sent.`,
      user,
    });
  } catch (err: any) {
    console.error("Error:", err);
    return NextResponse.json(
      { message: "Internal server error", error: err.message },
      { status: 500 }
    );
  }
}
