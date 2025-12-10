#!/usr/bin/env node

/**
 * React2Shell Auto Checker
 * Cek versi React, Next.js, dan paket RSC yg rentan (CVE-2025-55182)
 */

import fs from "fs";
import { execSync } from "child_process";

const vulnerableReactVersions = ["19.0.0", "19.1.0", "19.1.1", "19.2.0"];
const safeReactMinVersion = "19.2.1";

function getPackageVersion(pkg) {
  try {
    const output = execSync(`npm ls ${pkg} --json`, { stdio: "pipe" }).toString();
    const json = JSON.parse(output);
    return json.dependencies?.[pkg]?.version || null;
  } catch {
    return null;
  }
}

function checkFolderExists(path) {
  return fs.existsSync(path);
}

function runAudit() {
  try {
    const output = execSync("npm audit --json", { stdio: "pipe" }).toString();
    return JSON.parse(output);
  } catch {
    return null;
  }
}

console.log("=========================================");
console.log(" 🔍 React2Shell (CVE-2025-55182) Checker ");
console.log("=========================================\n");

console.log("1️⃣  Mengecek versi paket...\n");

const react = getPackageVersion("react");
const reactDom = getPackageVersion("react-dom");
const rscWebpack = getPackageVersion("react-server-dom-webpack");
const next = getPackageVersion("next");

console.log("React:", react || "❌ Tidak ditemukan");
console.log("React DOM:", reactDom || "❌ Tidak ditemukan");
console.log("react-server-dom-webpack:", rscWebpack || "❌ Tidak ditemukan");
console.log("Next.js:", next || "❌ Tidak ditemukan");

let vulnerable = false;

if (react && vulnerableReactVersions.includes(react)) {
  vulnerable = true;
  console.log(`\n⚠️  React versi ${react} rentan terhadap CVE-2025-55182!`);
}

if (rscWebpack && vulnerableReactVersions.includes(rscWebpack)) {
  vulnerable = true;
  console.log(`⚠️  react-server-dom-webpack versi ${rscWebpack} rentan!`);
}

if (next) {
  const nextVersion = next.split('.');
  const nextMajor = parseInt(nextVersion[0]);
  const nextMinor = parseInt(nextVersion[1]);
  const nextPatch = parseInt(nextVersion[2] || 0);
  
  if (nextMajor < 15 || (nextMajor === 15 && (nextMinor < 0 || (nextMinor === 0 && nextPatch < 5)))) {
    vulnerable = true;
    console.log(`⚠️  Next.js versi ${next} kemungkinan rentan!`);
  }
}

if (!vulnerable) {
  console.log("\n✅ Tidak ditemukan versi paket yang diketahui rentan.");
}

console.log("\n2️⃣  Mengecek apakah kamu menggunakan React Server Components...\n");

const usesRSC =
  checkFolderExists("./app") ||
  checkFolderExists("./src/app") ||
  checkFolderExists("./rsc") ||
  checkFolderExists("./server") ||
  checkFolderExists("./src/server");

if (usesRSC) {
  console.log("⚠️  Struktur folder menunjukkan kemungkinan penggunaan RSC.");
} else {
  console.log("✅ Tidak ada indikasi folder RSC standar.");
}

console.log("\n3️⃣  Menjalankan npm audit...\n");

const audit = runAudit();

if (audit && audit.vulnerabilities) {
  const count = Object.keys(audit.vulnerabilities).length;
  if (count > 0) {
    console.log(`⚠️  Ada ${count} kerentanan terdeteksi oleh npm audit.`);
  } else {
    console.log("✅ npm audit tidak menemukan kerentanan.");
  }
} else {
  console.log("⚠️  Gagal menjalankan npm audit.");
}

console.log("\n=========================================");
console.log(" 📌 Rekomendasi Tindakan");
console.log("=========================================\n");

if (vulnerable) {
  console.log("🔴 Sistem kamu rentan terhadap CVE-2025-55182.");
  console.log("👉 Segera jalankan perintah berikut:\n");
  console.log("   npm install react@latest react-dom@latest react-server-dom-webpack@latest\n");
  
  if (next) {
    console.log("   npm install next@latest\n");
  }
} else {
  console.log("🟢 Paket utama aman dari versi yang diketahui rentan.");
}

if (usesRSC) {
  console.log("⚠️ Karena project memakai RSC, pastikan update ke versi patched.");
}

console.log("\nSelesai! 🚀");