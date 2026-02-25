interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "ROSHA 입시평가회 <noreply@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`이메일 발송 실패: ${error}`);
  }

  return res.json();
}

export function buildCredentialEmail(params: {
  name: string;
  sessionTitle: string;
  uniqueCode: string;
  password: string;
}) {
  return {
    subject: `[ROSHA] ${params.sessionTitle} - 로그인 정보 안내`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1a1a1a;">ROSHA 입시평가회</h2>
        <p>${params.name}님, <strong>${params.sessionTitle}</strong> 신청이 완료되었습니다.</p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; margin: 24px 0;">
          <p style="margin: 0 0 12px;"><strong>고유번호 (아이디):</strong> ${params.uniqueCode}</p>
          <p style="margin: 0;"><strong>비밀번호:</strong> ${params.password}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          위 정보로 로그인하시면 평가 결과와 연주 영상을 확인하실 수 있습니다.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          본 메일은 자동 발송된 메일입니다.
        </p>
      </div>
    `,
  };
}
