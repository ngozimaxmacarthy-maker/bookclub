import { execSync } from "child_process";

try {
  const result = execSync("npx prisma generate", {
    cwd: "/vercel/share/v0-project",
    encoding: "utf-8",
    stdio: "pipe",
  });
  console.log(result);
  console.log("Prisma client generated successfully");
} catch (error) {
  console.error("Error generating Prisma client:", error.message);
  if (error.stdout) console.log("stdout:", error.stdout);
  if (error.stderr) console.log("stderr:", error.stderr);
  process.exit(1);
}
