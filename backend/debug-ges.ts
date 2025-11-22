import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing GES query...');
        const gesList = await prisma.ges.findMany({
            include: {
                riskExposures: {
                    include: {
                        riskAgent: true,
                    },
                },
                area: {
                    include: {
                        workCenter: {
                            include: {
                                company: true,
                            },
                        },
                    },
                },
            },
        });
        console.log('GES List:', JSON.stringify(gesList, null, 2));
    } catch (error) {
        console.error('Error querying GES:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
