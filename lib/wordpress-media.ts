/**
 * WordPress Media Upload Service
 * Handles uploading images to WordPress site via REST API
 */

interface WordPressConfig {
  siteUrl: string
  username: string
  password: string
}

interface UploadResponse {
  success: boolean
  url?: string
  error?: string
}

export class WordPressMediaService {
  private config: WordPressConfig

  constructor() {
    this.config = {
      siteUrl: 'https://kuddusholdings.com',
      username: 'websiteaccess',
      password: 'HQSq R1OR Netm XfXw AEYx dBrb'
    }
  }

  /**
   * Upload image to WordPress media library
   */
  async uploadImage(file: File, filename?: string): Promise<UploadResponse> {
    try {
      // Create basic auth header
      const auth = btoa(`${this.config.username}:${this.config.password}`)
      
      // Prepare form data
      const formData = new FormData()
      formData.append('file', file)
      
      // Set filename if provided
      if (filename) {
        const extension = file.name.split('.').pop()
        formData.append('title', filename)
        formData.append('slug', `${filename}-${Date.now()}`)
      }

      // Upload to WordPress
      const response = await fetch(`${this.config.siteUrl}/wp-json/wp/v2/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('WordPress upload failed:', response.status, errorText)
        
        return {
          success: false,
          error: `Upload failed: ${response.status} - ${errorText}`
        }
      }

      const result = await response.json()
      
      return {
        success: true,
        url: result.source_url || result.guid?.rendered
      }

    } catch (error) {
      console.error('WordPress upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Upload base64 image to WordPress
   */
  async uploadBase64Image(base64Data: string, filename: string): Promise<UploadResponse> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Data)
      const blob = await response.blob()
      
      // Create file from blob
      const file = new File([blob], filename, { type: blob.type })
      
      // Upload using regular upload method
      return await this.uploadImage(file, filename)
      
    } catch (error) {
      console.error('Base64 upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Base64 conversion error'
      }
    }
  }

  /**
   * Delete image from WordPress (optional cleanup)
   */
  async deleteImage(mediaId: number): Promise<boolean> {
    try {
      const auth = btoa(`${this.config.username}:${this.config.password}`)
      
      const response = await fetch(`${this.config.siteUrl}/wp-json/wp/v2/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${auth}`,
        }
      })

      return response.ok
    } catch (error) {
      console.error('WordPress delete error:', error)
      return false
    }
  }

  /**
   * Compress and resize image before upload
   */
  compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = (height * maxWidth) / width
            width = maxWidth
          } else {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }

        canvas.width = width
        canvas.height = height
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file) // Return original if compression fails
            }
          }, 'image/jpeg', quality)
        }
      }

      img.onerror = () => {
        resolve(file) // Return original if processing fails
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }
}

// Export singleton instance
export const wordPressMedia = new WordPressMediaService()