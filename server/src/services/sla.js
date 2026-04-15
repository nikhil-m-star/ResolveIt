import cron from "node-cron";
import { subDays } from "date-fns";
import prisma from "../lib/prisma.js";

// Run every 6 hours
export const initSLA_CronJob = () => {
  cron.schedule("0 */6 * * *", async () => {
    console.log("⏰ Running SLA breach routine check...");
    try {
      const seventyTwoHoursAgo = subDays(new Date(), 3);

      const breachedIssues = await prisma.issue.findMany({
        where: {
          status: { in: ["REPORTED", "IN_PROGRESS"] },
          createdAt: { lte: seventyTwoHoursAgo },
          slaBreached: false // only flag ones that haven't been flagged yet
        },
      });

      if (breachedIssues.length === 0) {
        console.log("✅ No new SLA breaches found.");
        return;
      }

      for (const issue of breachedIssues) {
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
              message: `SLA BREACH ALERT: Your assigned issue "${issue.title}" has exceeded 72 hours unresolved.`,
              type: "SLA_BREACH",
              issueId: issue.id
            }
          });
        }

        // Notify the area presidents/admins (if we assume region-wide alert needed, but this is simple version)
        const presidents = await prisma.user.findMany({
            where: { role: "PRESIDENT", city: issue.city },
            select: { id: true }
        });

        presidents.forEach(async (p) => {
            await prisma.notification.create({
               data: {
                 userId: p.id,
                 message: `SLA BREACH ALERT in your city: Issue "${issue.title}" breached 72h.`,
                 type: "SLA_BREACH",
                 issueId: issue.id
               }
            });
        });
      }

      console.log(`🚨 SLA Breach Check Complete: Flagged ${breachedIssues.length} issues.`);
    } catch (error) {
      console.error("SLA Cron Error:", error);
    }
  });

  console.log("🔔 SLA Cron Job Initialized (runs every 6h)");
};
