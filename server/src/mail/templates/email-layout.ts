export function emailLayout(bodyContent: string): string {
  const year = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8" /></head>
    <body style="margin: 0; padding: 0; background-color: #f0f0f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f0f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; border-radius: 12px; overflow: hidden;">

              <!-- Purple Header -->
              <tr>
                <td align="center" style="background-color: #7c3aed; padding: 20px 0;">
                  <span style="color: #ffffff; font-size: 22px; font-weight: 700;"><span style="color: #facc15;">&#10022;</span> Galaxy Notes</span>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="background-color: #09090b; padding: 40px 80px; text-align: center;">
                  ${bodyContent}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #18181b; padding: 24px 32px;">
                  <p style="color: #a1a1ab; font-size: 14px; font-weight: 600; margin: 0 0 8px;"><span style="color: #facc15;">&#10022;</span> Galaxy Notes</p>
                  <p style="color: #3f3f46; font-size: 12px; margin: 0 0 6px;">
                    Galaxy Notes &bull; All rights reserved
                  </p>
                  <p style="color: #64646c; font-size: 12px; margin: 0;">
                    &copy; ${year} Galaxy Notes. All rights reserved.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
