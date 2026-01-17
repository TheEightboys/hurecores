// Brevo Email Service
// Using Brevo API for transactional emails

const BREVO_API_KEY = import.meta.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
}

async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: params.senderName || 'HURE Core',
          email: params.senderEmail || 'noreply@gethure.com'
        },
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Brevo API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Email Templates
const templates = {
  staffInvitation: (data: { orgName: string; inviteLink: string; recipientName: string }) => ({
    subject: `You've been invited to join ${data.orgName} on HURE Core`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🏥 HURE Core</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Healthcare Workforce Management</p>
          </div>
          <div class="content">
            <h2>Welcome to ${data.orgName}!</h2>
            <p>Hi ${data.recipientName},</p>
            <p>You've been invited to join <strong>${data.orgName}</strong> on HURE Core, the modern workforce management platform for healthcare organizations.</p>
            <p>Click the button below to set up your account and get started:</p>
            <center>
              <a href="${data.inviteLink}" class="button">Accept Invitation</a>
            </center>
            <p style="color: #64748b; font-size: 14px;">This invitation will expire in 7 days. If you didn't expect this invitation, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2026 HURE Core. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  passwordReset: (data: { resetLink: string; recipientName: string }) => ({
    subject: 'Reset Your HURE Core Password',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔐 Password Reset</h1>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p>We received a request to reset your HURE Core password. Click the button below to create a new password:</p>
            <center>
              <a href="${data.resetLink}" class="button">Reset Password</a>
            </center>
            <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour. If you didn't request this reset, please ignore this email - your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© 2026 HURE Core. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  verificationStatus: (data: { status: 'Verified' | 'Rejected'; entityType: string; entityName: string; reason?: string; recipientName: string }) => ({
    subject: `${data.entityType} Verification ${data.status}`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${data.status === 'Verified' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .status-badge { display: inline-block; background: ${data.status === 'Verified' ? '#dcfce7' : '#fee2e2'}; color: ${data.status === 'Verified' ? '#166534' : '#991b1b'}; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${data.status === 'Verified' ? '✅' : '❌'} Verification ${data.status}</h1>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p>Your ${data.entityType.toLowerCase()} <strong>${data.entityName}</strong> verification has been reviewed:</p>
            <center>
              <span class="status-badge">${data.status.toUpperCase()}</span>
            </center>
            ${data.status === 'Rejected' && data.reason ? `
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-top: 20px;">
                <strong style="color: #991b1b;">Reason:</strong>
                <p style="margin: 5px 0 0 0; color: #7f1d1d;">${data.reason}</p>
              </div>
              <p>Please update your documents and resubmit for verification.</p>
            ` : `
              <p style="margin-top: 20px;">You now have full access to all HURE Core features. Log in to your dashboard to get started!</p>
            `}
          </div>
          <div class="footer">
            <p>© 2026 HURE Core. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }),

  welcomeEmail: (data: { orgName: string; recipientName: string; recipientEmail: string }) => ({
    subject: `Welcome to HURE Core - Let's get started!`,
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .step { display: flex; align-items: flex-start; margin: 15px 0; }
          .step-number { background: #2563eb; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎉 Welcome to HURE Core!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your healthcare workforce management platform</p>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName},</p>
            <p>Thank you for registering <strong>${data.orgName}</strong> on HURE Core! Here's what you need to do next:</p>
            
            <div class="step">
              <div class="step-number">1</div>
              <div>
                <strong>Complete Organization Verification</strong>
                <p style="margin: 5px 0 0 0; color: #64748b;">Upload your business registration and KRA PIN to verify your organization.</p>
              </div>
            </div>
            
            <div class="step">
              <div class="step-number">2</div>
              <div>
                <strong>Add Your Locations</strong>
                <p style="margin: 5px 0 0 0; color: #64748b;">Set up your clinic/facility locations and submit their licenses for verification.</p>
              </div>
            </div>
            
            <div class="step">
              <div class="step-number">3</div>
              <div>
                <strong>Invite Your Team</strong>
                <p style="margin: 5px 0 0 0; color: #64748b;">Add staff members and assign them roles with appropriate permissions.</p>
              </div>
            </div>
            
            <center>
              <a href="https://hurecore.gethure.com/#/employer" class="button">Go to Dashboard</a>
            </center>
          </div>
          <div class="footer">
            <p>Need help? Contact us at support@gethure.com</p>
            <p>© 2026 HURE Core. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Export email service functions
export const emailService = {
  async sendStaffInvitation(email: string, name: string, orgName: string, inviteLink: string): Promise<boolean> {
    const template = templates.staffInvitation({ orgName, inviteLink, recipientName: name });
    return sendEmail({
      to: [{ email, name }],
      subject: template.subject,
      htmlContent: template.htmlContent
    });
  },

  async sendPasswordReset(email: string, name: string, resetLink: string): Promise<boolean> {
    const template = templates.passwordReset({ resetLink, recipientName: name });
    return sendEmail({
      to: [{ email, name }],
      subject: template.subject,
      htmlContent: template.htmlContent
    });
  },

  async sendVerificationNotification(
    email: string,
    name: string,
    status: 'Verified' | 'Rejected',
    entityType: string,
    entityName: string,
    reason?: string
  ): Promise<boolean> {
    const template = templates.verificationStatus({ status, entityType, entityName, reason, recipientName: name });
    return sendEmail({
      to: [{ email, name }],
      subject: template.subject,
      htmlContent: template.htmlContent
    });
  },

  async sendWelcomeEmail(email: string, name: string, orgName: string): Promise<boolean> {
    const template = templates.welcomeEmail({ orgName, recipientName: name, recipientEmail: email });
    return sendEmail({
      to: [{ email, name }],
      subject: template.subject,
      htmlContent: template.htmlContent
    });
  }
};
