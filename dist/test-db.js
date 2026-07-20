import { prisma } from "./config/prisma.js";
async function main() {
    const users = await prisma.user.findMany();
    console.log("Database connection successful!");
    console.log(users);
}
main()
    .catch((error) => {
    console.error("Database connection failed:", error);
})
    .finally(async () => {
    await prisma.$disconnect();
});
