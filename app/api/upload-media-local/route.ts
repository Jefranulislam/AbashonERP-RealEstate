import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const imageType = formData.get('imageType') as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!imageType || !['company_logo', 'footer_image', 'background_image'].includes(imageType)) {
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload an image file." 
      }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: "File too large. Please upload an image smaller than 10MB." 
      }, { status: 413 })
    }

    console.log(`[v0] Uploading ${imageType}:`, file.name, `(${Math.round(file.size/1024)}KB)`)

    // Generate filename with timestamp
    const timestamp = Date.now()
    const extension = path.extname(file.name) || '.jpg'
    const filename = `${imageType}-${timestamp}${extension}`

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    // Save file to local storage
    const filePath = path.join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const fileData = new Uint8Array(bytes)

    await writeFile(filePath, fileData)
    console.log(`[v0] File saved locally:`, filePath)

    // Return public URL
    const publicUrl = `/uploads/${filename}`

    console.log(`[v0] Successfully saved locally:`, publicUrl)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      imageType: imageType,
      filename: filename,
      storageType: 'local'
    })

  } catch (error) {
    console.error("[v0] Local upload error:", error)
    return NextResponse.json({ 
      error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 })
  }
}