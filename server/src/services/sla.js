import cron from "node-cron";
import prisma from "../lib/prisma.js";
import { sendEmailNotification } from "../lib/email.js";

// Run every 6 hours
export const initSLA_CronJob = () => {
  cron.schedule("0 */6 * * *", async () => {
    console.log("⏰ Running SLA breach routine check...");
    try {
      const activeIssues = await prisma.issue.findMany({
        where: {
          status: { in: ["REPORTED", "IN_PROGRESS"] },
          slaBreached: false // only flag ones that haven't been flagged yet
        },
        include: { assignedTo: true, createdBy: true }
      });

      const now = new Date();
      const breachedIssues = activeIssues.filter(issue => {
        const thresholdDays = issue.etaDays || 3;
        const breachDate = new Date(issue.createdAt);
        breachDate.setDate(breachDate.getDate() + thresholdDays);
        return now > breachDate;
      });

      if (breachedIssues.length === 0) {
        console.log("✅ No new SLA breaches found.");
        return;
      }

      await Promise.all(breachedIssues.map(async (issue) => {
        // Mark the issue as breached
        await prisma.issue.update({
          where: { id: issue.id },
          data: { slaBreached: true }
        });

        // If assigned, warn the officer directly
        if (issue.assignedToId) {
          await prisma.notification.create({
            data: {
              userId: issue.assignedToId,
              message: `SLA BREACH ALERT: Your assigned issue "${issue.title}" has exceeded its ${issue.etaDays || 3}-day SLA.`,
              type: "SLA_BREACH",
              issueId: issue.id
            }
          });

          if (issue.assignedTo.email) {
             await sendEmailNotification({
                to: issue.assignedTo.email,
                subject: `URGENT: SLA Breach for ${issue.title}`,
                html: `<h2>SLA Breach Warning</h2><p>The issue <strong>${issue.title}</strong> assigned to you has breached its Service Level Agreement and requires immediate resolution.</p>`
             })
          }
        }

        // Notify the area presidents/admins
        const presidents = await prisma.user.findMany({
            where: { role: "PRESIDENT", city: issue.city },
            select: { id: true }
        });

        await Promise.all(presidents.map(p => prisma.notification.create({
           data: {
             userId: p.id,
             message: `SLA BREACH ALERT in your city: Issue "${issue.title}" breached its ETA.`,
             type: "SLA_BREACH",
             issueId: issue.id
           }
        })));
      }));

      console.log(`🚨 SLA Breach Check Complete: Flagged ${breachedIssues.length} issues.`);
    } catch (error) {
      console.error("SLA Cron Error:", error);
    }
  });

  console.log("🔔 SLA Cron Job Initialized (runs every 6h)");
};
