import prisma from "../lib/prisma.js";

// Toggle vote (Up/Down) on an issue
export const toggleVote = async (req, res) => {
  try {
    const { id: issueId } = req.params;
    const { type: voteType } = req.body; // 'UP' or 'DOWN'
    const userId = req.user.id;

    if (!['UP', 'DOWN'].includes(voteType)) {
      return res.status(400).json({ error: "Invalid vote type" });
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        issueId_userId: { issueId, userId }
      }
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Remove vote (same type toggle)
        const adjustment = voteType === 'UP' ? -1 : 1;
        await prisma.$transaction([
          prisma.vote.delete({ where: { id: existingVote.id } }),
          prisma.issue.update({ where: { id: issueId }, data: { votes: { increment: adjustment } } })
        ]);
        return res.json({ message: "Vote removed", voted: false });
      } else {
        // Switch vote type (different type toggle)
        const adjustment = voteType === 'UP' ? 2 : -2;
        await prisma.$transaction([
          prisma.vote.update({ 
            where: { id: existingVote.id },
            data: { type: voteType }
          }),
          prisma.issue.update({ where: { id: issueId }, data: { votes: { increment: adjustment } } })
        ]);
        return res.json({ message: `Switched to ${voteType}`, voted: true, type: voteType });
      }
    } else {
      // Add new vote
      const adjustment = voteType === 'UP' ? 1 : -1;
      await prisma.$transaction([
        prisma.vote.create({ data: { issueId, userId, type: voteType } }),
        prisma.issue.update({ where: { id: issueId }, data: { votes: { increment: adjustment } } })
      ]);
      return res.json({ message: "Vote added", voted: true, type: voteType });
    }
  } catch (error) {
    console.error("Toggle Vote Error:", error);
    res.status(500).json({ error: "Failed to toggle vote" });
  }
};
