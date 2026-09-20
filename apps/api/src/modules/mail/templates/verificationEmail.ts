interface VerificationEmailTemplateParams {
  firstName: string;
  verificationLink: string;
}

export const verificationEmailTemplate = (
  params: VerificationEmailTemplateParams,
) => {
  const { firstName, verificationLink } = params;
  return ` <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
          <h2>Verify your email address</h2>

          <p>Hi ${firstName},</p>

          <p>
            Thanks for creating your account.
            Please verify your email address using the link below.
          </p>

          <p>
           <a href="${verificationLink}">
            Verify email address
           </a>
          </p>

          <p>
            This verification link will expire in 30 minutes.
          </p>

         <p>
            This is an automated email. Please do not reply to this message.
         </p>

          <p>
           Loft Technologies
          </p>
        </div>`;
};
