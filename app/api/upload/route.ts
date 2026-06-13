import { put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

const MAX_BYTES = 8 * 1024 * 1024 // 8MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']

export async function POST(request: NextRequest) {
  // Only signed-in makers may upload artwork.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: 'Please upload a PNG, JPG, WEBP, GIF or SVG image.' },
        { status: 400 },
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Image is too large (max 8MB).' },
        { status: 400 },
      )
    }

    const ext = file.name.split('.').pop() || 'png'
    const blob = await put(`uploads/${session.user.id}/${crypto.randomUUID()}.${ext}`, file, {
      access: 'public',
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('[v0] Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
