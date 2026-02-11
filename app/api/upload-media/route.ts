import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

interface WordPressConfig {
  siteUrl: string
  username: string
  password: string
}

const wpConfig: WordPressConfig = {
  siteUrl: 'https://kuddusholdings.com',
  username: 'websiteaccess',
  password: 'xiVH cVxe bZIj QMDC aEMZ Pvtw'
}

async function uploadToWordPress(file: File, filename: string): Promise<{success: boolean, url?: string, error?: string}> {
  try {
    // Create basic auth header
    const auth = btoa(`${wpConfig.username}:${wpConfig.password}`)
    
    // Prepare form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', filename)
    formData.append('slug', `${filename}-${Date.now()}`)

    console.log(`[v0] Attempting upload to ${wpConfig.siteUrl}/wp-json/wp/v2/media`)
    console.log(`[v0] Auth header created for user: ${wpConfig.username}`)

    // Upload to WordPress
    const response = await fetch(`${wpConfig.siteUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: formData
    })

    console.log(`[v0] WordPress response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] WordPress upload failed:', response.status, errorText)
      
      return {
        success: false,
        error: `WordPress error ${response.status}: ${errorText}`
      }
    }

    const result = await response.json()
    console.log('[v0] WordPress upload success:', result.source_url)
    
    return {
      success: true,
      url: result.source_url || result.guid?.rendered
    }

  } catch (error) {
    console.error('[v0] WordPress upload exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    }
  }
}

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
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `erp-${imageType}-${timestamp}.${extension}`

    // Upload to WordPress
    const uploadResult = await uploadToWordPress(file, filename)

    if (!uploadResult.success) {
      console.error('[v0] WordPress upload failed:', uploadResult.error)
      return NextResponse.json({ 
        error: `Upload failed: ${uploadResult.error}` 
      }, { status: 500 })
    }

    console.log(`[v0] Successfully uploaded to WordPress:`, uploadResult.url)

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      imageType: imageType,
      filename: filename
    })

  } catch (error) {
    console.error("[v0] Media upload error:", error)
    return NextResponse.json({ 
      error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error")
    }, { status: 500 })
  }
}