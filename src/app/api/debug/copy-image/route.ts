import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const brainDir = "C:\\Users\\mdj52\\.gemini\\antigravity-ide\\brain\\9596a223-3a52-4baa-8cde-8496e6fc84ca";
    const files = fs.readdirSync(brainDir);
    const imageFile = files.find(
      (f) => f.startsWith("closet_editorial") && f.endsWith(".png")
    );

    if (!imageFile) {
      return NextResponse.json({ error: "Image not found in brain folder" }, { status: 404 });
    }

    const srcPath = path.join(brainDir, imageFile);
    const destDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const destPath = path.join(destDir, "closet_editorial.png");

    fs.copyFileSync(srcPath, destPath);

    return NextResponse.json({
      success: true,
      message: "Copied image successfully to public/boutique_editorial.png",
      srcPath,
      destPath,
    });
  } catch (error: any) {
    console.error("Image copy error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
