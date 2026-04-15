import prisma from "../lib/prisma.js";

// Rate an officer for a resolved issue
export const createRating = async (req, res) => {
  try {
    const { issueId, officerId, score, feedback } = req.body;
    const givenById = req.user.id;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: "Score must be between 1 and 5" });
    }

    // Verify issue is actually resolved by this officer
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue || issue.status !== "RESOLVED" || issue.resolvedById !== officerId) {
      return res.status(400).json({ error: "Invalid issue or officer for rating" });
    }

    const rating = await prisma.$transaction(async (tx) => {
      // 1. Create the rating
      const newRating = await tx.rating.create({
        data: {
          score,
          feedback,
          issueId,
          givenById,
          officerId,
        }
      });

      // 2. Fetch all ratings for the officer to compute new average
      const allRatings = await tx.rating.findMany({
        where: { officerId },
        select: { score: true }
      });

      const totalScore = allRatings.reduce((acc, curr) => acc + curr.score, 0);
      const avgRating = totalScore / allRatings.length;

      // 3. Update the officer's average rating and points
      await tx.user.update({
        where: { id: officerId },
        data: {
          avgRating,
          points: { increment: score * 10 } // Award points based on rating
        }
      });

      return newRating;
    });

    res.status(201).json(rating);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "You have already rated this officer for this issue" });
    }
    console.error("Create Rating Error:", error);
    res.status(500).json({ error: "Failed to create rating" });
  }
};
