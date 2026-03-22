import { emailLayout } from './email-layout';

interface ShareInviteTemplateData {
  sharerName: string;
  noteTitle: string;
  lastEditedAgo: string;
  registerUrl: string;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function shareInviteTemplate({
  sharerName,
  noteTitle,
  lastEditedAgo,
  registerUrl,
}: ShareInviteTemplateData): string {
  const bodyContent = `
    <h1 style="color: #fafafa; font-size: 24px; font-weight: 700; margin: 0 0 12px;">Hi there &#128075;</h1>

    <p style="color: #a1a1ab; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
      <strong style="color: #fafafa;">${sharerName}</strong> has shared a note with you and invited you to collaborate.
    </p>

    <!-- Note Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 28px;">
      <tr>
        <td style="background-color: #18181b; border: 1px solid #27272a; border-radius: 8px; padding: 16px 20px; text-align: left;">
          <p style="color: #fafafa; font-size: 16px; font-weight: 600; margin: 0 0 4px;">${noteTitle}</p>
          <p style="color: #64646c; font-size: 12px; margin: 0;">Last edited ${lastEditedAgo}</p>
        </td>
      </tr>
    </table>

    <p style="color: #a1a1ab; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
      Create a free account to accept this invite.
    </p>

    <!-- CTA Button -->
    <a href="${registerUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 0; border-radius: 8px; width: 100%; text-align: center;">
      Accept Invite &amp; Create Account
    </a>

    <p style="color: #64646c; font-size: 12px; margin: 20px 0 0;">
      &#9203; This invite expires in 7 days
    </p>
  `;

  return emailLayout(bodyContent);
}

export { formatTimeAgo };
