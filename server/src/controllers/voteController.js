import prisma from "../lib/prisma.js";

// Toggle upvote on an issue
export const toggleVote = async (req, res) => {
  try {
    const { id: issueId } = req.params;
    const userId = req.user.id;

    const existingVote = await prisma.vote.findUnique({
      where: {
        issueId_userId: { issueId, userId }
      }
    });

    if (existingVote) {
      // Remove vote
      await prisma.$transaction([
        prisma.vote.delete({ where: { id: existingVote.id } }),
        prisma.issue.update({ where: { id: issueId }, data: { votes: { decrement: 1 } } })
      ]);
      return res.json({ message: "Vote removed", voted: false });
    } else {
      // Add vote
      await prisma.$transaction([
        prisma.vote.create({ data: { issueId, userId } }),
        prisma.issue.update({ where: { id: issueId }, data: { votes: { increment: 1 } } })
      ]);
      return res.json({ message: "Vote added", voted: true });
    }
  } catch (error) {
    console.error("Toggle Vote Error:", error);
    res.status(500).json({ error: "Failed to toggle vote" });
  }
};
