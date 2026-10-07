#!/usr/bin/env node
/**
 * Run this whenever you move to a different WiFi network (new location).
 *
 * It finds this computer's current LAN IP address, rewrites
 * EXPO_PUBLIC_API_BASE_URL in .env to match, and regenerates the Expo Go
 * QR code (expo-qr-code.png) so it points at the right address.
 *
 * Usage:  node scripts/update-lan-ip.mjs
 * Or:     pnpm lan
 *
 * After running this, restart the dev servers (pnpm dev, and the admin
 * dashboard if you use it) so they pick up the new address.
 */
import { networkInterfaces } from "os";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

function findLanIp() {
  const nets = networkInterfaces();
  const candidates = [];
  for (const [name, addrs] of Object.entries(nets)) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4" && !addr.internal) {
        candidates.push({ name, address: addr.address });
      }
    }
  }
  if (candidates.length === 0) {
    throw new Error("No active network interface found. Are you connected to WiFi/LAN?");
  }
  // Prefer an interface that looks like WiFi/Ethernet over virtual adapters.
  const preferred = candidates.find((c) => /wi-?fi|wlan|ethernet/i.test(c.name));
  return (preferred ?? candidates[0]).address;
}

function updateEnvFile(envPath, ip, port) {
  const url = `http://${ip}:${port}`;
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const line = `EXPO_PUBLIC_API_BASE_URL=${url}`;

  if (/^EXPO_PUBLIC_API_BASE_URL=.*$/m.test(content)) {
    content = content.replace(/^EXPO_PUBLIC_API_BASE_URL=.*$/m, line);
  } else {
    content += (content.endsWith("\n") || content === "" ? "" : "\n") + line + "\n";
  }
  fs.writeFileSync(envPath, content);
  return url;
}

async function main() {
  const projectRoot = path.resolve(import.meta.dirname, "..");
  const envPath = path.join(projectRoot, ".env");
  const apiPort = process.env.PORT || "3000";
  const expoPort = process.env.EXPO_PORT || "8081";

  const ip = findLanIp();
  const apiUrl = updateEnvFile(envPath, ip, apiPort);
  const expUrl = `exp://${ip}:${expoPort}`;

  const qrPath = path.join(projectRoot, "expo-qr-code.png");
  await QRCode.toFile(qrPath, expUrl, { width: 512 });

  console.log("✅ Updated for this network:");
  console.log(`   API base URL : ${apiUrl}`);
  console.log(`   Expo Go link : ${expUrl}`);
  console.log(`   QR code      : ${qrPath}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Restart the dev servers: pnpm dev  (and `cd admin && npm run dev -- --host` if using the admin dashboard)");
  console.log("  2. Scan the updated expo-qr-code.png with Expo Go on your phone");
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
