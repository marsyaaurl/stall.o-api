import "dotenv/config";
import dns from "node:dns";
// Force Node.js DNS resolver to prefer IPv4 over IPv6 on hosting environments like Railway
dns.setDefaultResultOrder("ipv4first");
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
export const prisma = new PrismaClient({
    adapter,
});
