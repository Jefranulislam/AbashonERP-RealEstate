import { NextRequest, NextResponse } from "next/server"

const wpConfig = {
  siteUrl: 'https://kuddusholdings.com',
  username: 'websiteaccess',
  password: 'xiVH cVxe bZIj QMDC aEMZ Pvtw'
}

export async function GET() {
  try {
    const auth = btoa(`${wpConfig.username}:${wpConfig.password}`)
    
    console.log('[DEBUG] Testing WordPress connection...')
    
    // Test 1: Check if we can authenticate at all
    const authTest = await fetch(`${wpConfig.siteUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    })

    console.log('[DEBUG] Auth test status:', authTest.status)
    const authResult = await authTest.json()
    console.log('[DEBUG] Auth result:', authResult)

    // Test 2: Check user capabilities
    if (authTest.ok) {
      const userCaps = authResult.capabilities || {}
      console.log('[DEBUG] User capabilities:', Object.keys(userCaps))
      
      return NextResponse.json({
        success: true,
        authStatus: authTest.status,
        userInfo: {
          id: authResult.id,
          name: authResult.name,
          roles: authResult.roles,
          capabilities: Object.keys(userCaps).filter(cap => userCaps[cap])
        },
        hasUploadFiles: !!userCaps.upload_files,
        hasEditPosts: !!userCaps.edit_posts,
        recommendation: !userCaps.upload_files 
          ? "User needs 'upload_files' capability. Try using an Administrator account or add the capability."
          : "User has upload permissions - there might be a plugin blocking REST API."
      })
    } else {
      return NextResponse.json({
        success: false,
        authStatus: authTest.status,
        error: authResult,
        recommendation: "Authentication failed. Check username/password or try using an Administrator account."
      })
    }

  } catch (error) {
    console.error('[DEBUG] WordPress test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendation: "Network or server error. Check if WordPress site is accessible."
    })
  }
}