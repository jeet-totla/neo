import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  return transporter;
}

/** Sends a Neo briefing through Gmail SMTP. Never throws for config problems. */
export async function sendBriefingEmail(to: string | null | undefined, content: string): Promise<{ sent: boolean; error?: string }> {
  if (!to) return { sent: false, error: "No delivery email on this profile." };
  const t = getTransporter();
  if (!t) return { sent: false, error: "Email is not configured (GMAIL_USER / GMAIL_APP_PASSWORD)." };

  const now     = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });
  const date    = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

  await t.sendMail({
    from:    `Neo <${process.env.GMAIL_USER}>`,
    to,
    subject: `Neo — ${weekday}, ${date}`,
    text:    content,
    html:    buildEmailHtml(content, weekday, date),
  });
  return { sent: true };
}

function buildEmailHtml(raw: string, weekday: string, date: string) {
  const parts    = raw.split(/\n(?=## )/);
  const introRaw = parts[0].replace(/^## \S.*\n?/, "").trim();
  const takeawayRx = /\*\*Today'?s signal[^*]*\*\*[:\s]*([\s\S]+)/i;
  const sections: { header: string; body: string }[] = [];
  let takeaway = "";

  for (const part of parts.slice(1)) {
    const nl     = part.indexOf("\n");
    const header = part.slice(3, nl).trim();
    let   body   = part.slice(nl + 1).trim();
    const m      = body.match(takeawayRx);
    if (m) { takeaway = m[1].trim().replace(/\*\*/g, ""); body = body.replace(takeawayRx, "").trim(); }
    sections.push({ header, body });
  }
  if (!takeaway) {
    const m = introRaw.match(takeawayRx);
    if (m) takeaway = m[1].trim().replace(/\*\*/g, "");
  }
  const intro = introRaw.replace(takeawayRx, "").trim();

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const boldHtml = (s: string) =>
    esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  const PALETTE = [
    { bg: "rgba(99,102,241,0.12)",  color: "#6366f1" },
    { bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
    { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
    { bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
    { bg: "rgba(139,92,246,0.12)",  color: "#8b5cf6" },
    { bg: "rgba(59,130,246,0.12)",  color: "#3b82f6" },
  ];

  function splitAction(text: string): { body: string; action: string } {
    const sentences = text.trim().split(/\. (?=[A-Z])/);
    if (sentences.length < 2) return { body: text.trim(), action: "" };
    const last = sentences[sentences.length - 1].trim();
    if (last.length >= 15 && last.length <= 280)
      return { body: sentences.slice(0, -1).join(". ") + ".", action: last };
    return { body: text.trim(), action: "" };
  }

  let storyCounter = 0;
  const sectionsHtml = sections.map(({ header, body }, si) => {
    const p = PALETTE[si % PALETTE.length];
    const storiesHtml = body.split(/\n\n+/).filter(para => para.trim().length > 20).map(para => {
      storyCounter++;
      const { body: sb, action } = splitAction(para.replace(/^\n+/, "").trim());
      return [
        `<div style="background:#ffffff;border-radius:12px;padding:16px 20px;margin-bottom:8px">`,
        `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>`,
        `<td style="width:20px;vertical-align:top;padding-right:12px">`,
        `<div style="width:20px;height:20px;border-radius:50%;background:#0f0f0f;color:#ffffff;font-size:9px;font-weight:700;text-align:center;line-height:20px">${storyCounter}</div>`,
        `</td><td style="vertical-align:top">`,
        `<p style="font-size:13px;color:#555555;line-height:1.7;margin:0">${boldHtml(sb)}</p>`,
        action ? `<p style="font-size:11px;color:#999999;margin:10px 0 0;padding-top:10px;border-top:1px solid rgba(0,0,0,0.06);line-height:1.5">&rarr; ${boldHtml(action)}</p>` : "",
        `</td></tr></table></div>`,
      ].join("");
    }).join("\n");

    return [
      `<div style="margin:12px 0">`,
      `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px"><tr>`,
      `<td style="white-space:nowrap;padding-right:12px">`,
      `<span style="background:${p.bg};color:${p.color};font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:5px 12px;border-radius:100px">${esc(header)}</span>`,
      `</td><td width="100%"><div style="height:1px;background:${p.color}30"></div></td>`,
      `</tr></table>`,
      storiesHtml,
      `</div>`,
    ].join("");
  }).join("\n");

  const takeawayClean = takeaway.replace(/^Today'?s signal[:\s]*/i, "").replace(/\*\*/g, "");
  const takeawayHtml  = takeawayClean
    ? [
        `<div style="background:#0f0f0f;border-radius:12px;padding:20px 24px;margin-top:8px">`,
        `<p style="color:rgba(255,255,255,0.3);font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin:0 0 12px">TODAY&#8217;S TAKEAWAY</p>`,
        `<p style="color:#ffffff;font-size:17px;line-height:1.5;margin:0;font-style:italic;font-family:Georgia,'Times New Roman',serif">${boldHtml(takeawayClean)}</p>`,
        `</div>`,
      ].join("")
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">
  <div style="background:#0f0f0f;border-radius:16px;padding:20px 24px;margin-bottom:8px">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td>
        <div style="color:#ffffff;font-size:16px;font-weight:900;letter-spacing:-0.02em">&#9889; Neo</div>
        <div style="color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:0.12em;text-transform:uppercase;margin-top:4px">${esc(weekday)} &middot; ${esc(date)}</div>
      </td>
      <td style="text-align:right;color:rgba(255,255,255,0.25);font-size:11px;font-style:italic;white-space:nowrap">Morning Briefing</td>
    </tr></table>
  </div>
  ${intro ? `<div style="background:#ffffff;border-radius:12px;padding:16px 20px;border-left:3px solid #0f0f0f;margin-bottom:8px"><p style="font-size:14px;color:#555555;line-height:1.7;margin:0;font-style:italic">${boldHtml(intro)}</p></div>` : ""}
  ${sectionsHtml}
  ${takeawayHtml}
  <div style="margin-top:32px;text-align:center;padding-bottom:24px">
    <p style="color:#bbbbbb;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin:0">Neo &middot; Personal Market Intelligence</p>
  </div>
</div>
</body>
</html>`;
}
