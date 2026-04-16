import prisma from "../lib/prisma.js";
import { sendEmailNotification } from "../lib/email.js";

export const addComment = async (req, res) => {
  const { id } = req.params; // issueId
  const { text } = req.body;
  const userId = req.user.id;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Comment text is required" });
  }

  if (text.length > 1000) {
    return res.status(400).json({ error: "Comment cannot exceed 1000 characters" });
  }

  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        createdBy: true,
        assignedTo: true,
      }
    });

    if (!issue) return res.status(404).json({ error: "Issue not found" });

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        comment: text,
        issueId: id,
        userId: userId
      },
      include: {
        user: { select: { name: true, role: true } }
      }
    });

    // Notify the creator if someone else commented on their issue
    if (issue.createdById !== userId) {
      await prisma.notification.create({
        data: {
          userId: issue.createdById,
          issueId: id,
          type: "INFO",
          message: `${comment.user.name} commented on your issue: "${issue.title}"`
        }
      });
      // Optionally email them
      if (issue.createdBy && issue.createdBy.email) {
        await sendEmailNotification({
           to: issue.createdBy.email,
           subject: `New Comment on your issue: ${issue.title}`,
           html: `<p><strong>${comment.user.name}</strong> left a comment on your issue <strong>${issue.title}</strong>:</p>
                  <blockquote>"${text}"</blockquote>
                  <p>Login to ResolveIt to reply!</p>`
        });
      }
    }

    // Notify the assigned officer if a citizen comments
    if (issue.assignedToId && issue.assignedToId !== userId) {
        await prisma.notification.create({
            data: {
              userId: issue.assignedToId,
              issueId: id,
              type: "INFO",
              message: `New comment on assigned issue: "${issue.title}"`
            }
        });
    }

    // Reward points for engagement (Gamification)
    await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: 2 } } // 2 points per comment
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};
