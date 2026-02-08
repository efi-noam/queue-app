import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPass = process.env.SMTP_APP_PASSWORD;

    if (!smtpEmail || !smtpPass) {
      console.error('Missing SMTP credentials. SMTP_EMAIL:', !!smtpEmail, 'SMTP_APP_PASSWORD:', !!smtpPass);
      return { success: false, error: 'Missing SMTP credentials' };
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: smtpEmail,
        pass: smtpPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    await transporter.sendMail({
      from: `QueueApp <${smtpEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error?.message || error, 'Code:', error?.code, 'Response:', error?.response);
    return { success: false, error: error?.message || String(error) };
  }
}
