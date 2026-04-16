import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function promote() {
    try {
        const user = await prisma.user.update({
            where: { email: 'nikhilm.cs24@bmsce.ac.in' },
            data: { role: 'PRESIDENT' }
        });
        console.log(`Successfully promoted ${user.email} to PRESIDENT`);
    } catch (error) {
        console.error("Promotion failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

promote();
