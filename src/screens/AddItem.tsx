import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router'
import { X, Camera } from 'lucide-react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Tag } from '../components/Tag'
import { DesktopNav } from '../components/DesktopNav'
import { useAuthStore } from '../store/auth'
import { getProfile, getR2UploadUrls, insertItem } from '../lib/api'

const CATEGORIES = ['Electronics', 'Books', 'Music', 'Fashion', 'Home', 'Sports', 'Art', 'Collectibles']
const CONDITIONS: { label: string; value: number }[] = [
  { label: 'Like new', value: 5 },
  { label: 'Good', value: 3 },
  { label: 'Well-loved', value: 1 },
]

export function AddItem() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id

  const [title, setTitle] = useState('')
  const [story, setStory] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState<number | null>(null)
  const [wants, setWants] = useState<string[]>([])
  const [wantInput, setWantInput] = useState('')
  const [showWantInput, setShowWantInput] = useState(false)
  type PendingPhoto = { file: File; uploadId: string; previewUrl: string }
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const MAX_PHOTOS = 3
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const addWant = () => {
    if (wantInput.trim()) {
      setWants((prev) => [...prev, wantInput.trim()])
      setWantInput('')
      setShowWantInput(false)
    } else {
      setShowWantInput(false)
    }
  }

  const removeWant = (i: number) => setWants((prev) => prev.filter((_, idx) => idx !== i))

  async function compressImage(file: File, maxDim = 1200, quality = 0.82): Promise<Blob> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height)
          width = Math.round(width * scale)
          height = Math.round(height * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => resolve(blob ?? file),
          'image/webp',
          quality,
        )
      }
      img.onerror = () => resolve(file)
      img.src = URL.createObjectURL(file)
    })
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    setPhotos((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        uploadId: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
      })),
    ].slice(0, MAX_PHOTOS))
  }

  async function handleSave() {
    if (!title) { setSaveError('Give your item a name first'); return }
    if (!userId || saving) return
    setSaveError('')
    setSaving(true)
    try {
      let cdnUrls: string[] = []

      if (photos.length > 0) {
        const { data, error } = await getR2UploadUrls(photos.map((p) => p.uploadId))
        if (error) { setSaveError('Could not prepare photo upload — try again'); return }
        const urls = (data as { urls: Array<{ uploadId: string; uploadUrl: string; publicUrl: string }> }).urls
        for (const p of photos) {
          const u = urls.find((x) => x.uploadId === p.uploadId)!
          const compressed = await compressImage(p.file)
          const res = await fetch(u.uploadUrl, { method: 'PUT', body: compressed, headers: { 'Content-Type': 'image/webp' } })
          if (!res.ok) { setSaveError('A photo failed to upload — try again'); return }
        }
        cdnUrls = photos.map((p) => urls.find((x) => x.uploadId === p.uploadId)!.publicUrl)
      }

      // Get user's home city
      const { data: prof } = await getProfile(userId)
      const locationCity = prof?.home_city ?? ''

      const { error } = await insertItem({
        user_id: userId,
        title,
        description: story,
        category,
        condition: condition ?? 3,
        wants_in_return: wants,
        images: cdnUrls,
        location_city: locationCity,
        status: 'active',
      })

      if (error) {
        setSaveError('Failed to save: ' + error.message)
        return
      }

      navigate('/hunt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column' }}>
      <DesktopNav />

      {/* Header */}
      <header
        className="mobile-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 20px',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '1.5px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, padding: 0,
          }}
        >
          <X size={17} color="var(--ink)" />
        </button>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px', color: 'var(--ink)', margin: 0 }}>Add a treasure</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: 'none', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15px', color: 'var(--bartefy-green)', opacity: saving ? 0.5 : 1, minWidth: '40px', textAlign: 'right' }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      {/* Desktop header */}
      <header
        className="desktop-nav"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={22} />
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>Add a treasure</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: 'none', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: 'var(--bartefy-green)', opacity: saving ? 0.5 : 1 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      {/* Body: two-column on desktop, single column on mobile */}
      <div className="add-item-layout" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Left / mobile: photo upload */}
        <div className="add-item-photos" style={{ padding: '6px 24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>Photos</div>

          {/* Photo row — primary add button + empty slots */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {photos.length === 0 ? (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '12px',
                    background: 'var(--surface-card)',
                    border: '1.5px dashed rgba(51,50,43,0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    padding: 0,
                  }}
                >
                  <Camera size={24} color="var(--bartefy-green)" />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Add photo</span>
                </button>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '12px',
                      border: '1.5px dashed var(--border-subtle)',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </>
            ) : (
              <>
                {photos.map((p, i) => (
                  <div
                    key={p.uploadId}
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img src={p.previewUrl} alt={`photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '12px',
                      background: 'var(--surface-card)',
                      border: '1.5px dashed rgba(51,50,43,0.3)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      flexShrink: 0,
                      padding: 0,
                    }}
                  >
                    <Camera size={24} color="var(--bartefy-green)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Add photo</span>
                  </button>
                )}
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </div>

        {/* Right / mobile: form fields */}
        <div className="add-item-fields" style={{ flex: 1, padding: '6px 24px 32px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px', width: '100%', margin: '0 auto', overflowY: 'auto' }}>
          <Input
            label="Title"
            placeholder="Give it a name"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          />

          <Input
            label="Its story"
            multiline
            placeholder="Where did you get it? Why are you trading it?"
            value={story}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStory(e.target.value)}
          />

          {/* Category chips */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {CATEGORIES.map((cat) => (
                <Tag key={cat} selected={category === cat} onSelect={() => setCategory(cat)}>
                  {cat}
                </Tag>
              ))}
            </div>
          </div>

          {/* Condition chips */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>Condition</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {CONDITIONS.map((cond) => (
                <Tag key={cond.value} selected={condition === cond.value} onSelect={() => setCondition(cond.value)}>
                  {cond.label}
                </Tag>
              ))}
            </div>
          </div>

          {/* What do you want for it */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', marginBottom: '10px' }}>What do you want for it?</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {wants.map((w, i) => (
                <Tag key={i} selected onRemove={() => removeWant(i)}>
                  {w}
                </Tag>
              ))}
              {showWantInput ? (
                <input
                  value={wantInput}
                  onChange={(e) => setWantInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addWant(); if (e.key === 'Escape') { setWantInput(''); setShowWantInput(false) } }}
                  onBlur={addWant}
                  placeholder="e.g. vinyl records"
                  autoFocus
                  style={{
                    padding: '7px 14px',
                    background: '#fff',
                    border: '1.5px solid var(--bartefy-green)',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    fontSize: '14px',
                    outline: 'none',
                    minHeight: '36px',
                    width: '140px',
                  }}
                />
              ) : (
                <button
                  onClick={() => setShowWantInput(true)}
                  style={{
                    padding: '7px 16px',
                    minHeight: '36px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1.5px dashed var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  + add a want
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {saveError && (
            <p style={{ color: 'var(--terracotta)', fontFamily: 'var(--font-body)', fontSize: '14px', margin: 0 }}>
              {saveError}
            </p>
          )}

          <Button variant="primary" size="lg" fullWidth disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Put it on the table'}
          </Button>
        </div>
      </div>
    </main>
  )
}
