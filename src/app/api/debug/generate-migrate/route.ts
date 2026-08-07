import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";

const execPromise = util.promisify(exec);

export async function GET() {
  const outputs: string[] = [];
  try {
    // 1. Generate migrations
    outputs.push("=== Generating Migrations ===");
    try {
      const { stdout, stderr } = await execPromise("npx drizzle-kit generate", {
        env: { ...process.env },
      });
      outputs.push(`Stdout:\n${stdout}`);
      if (stderr) outputs.push(`Stderr:\n${stderr}`);
    } catch (err: any) {
      outputs.push(`Error generating:\n${err.message}`);
      if (err.stdout) outputs.push(`Stdout:\n${err.stdout}`);
      if (err.stderr) outputs.push(`Stderr:\n${err.stderr}`);
    }

    // 2. Run migrations
    outputs.push("=== Running Migrations ===");
    try {
      const { stdout, stderr } = await execPromise("npx drizzle-kit migrate", {
        env: { ...process.env },
      });
      outputs.push(`Stdout:\n${stdout}`);
      if (stderr) outputs.push(`Stderr:\n${stderr}`);
    } catch (err: any) {
      outputs.push(`Error migrating:\n${err.message}`);
      if (err.stdout) outputs.push(`Stdout:\n${err.stdout}`);
      if (err.stderr) outputs.push(`Stderr:\n${err.stderr}`);
    }

    return NextResponse.json({
      success: true,
      log: outputs.join("\n\n"),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      log: outputs.join("\n\n"),
    });
  }
}
