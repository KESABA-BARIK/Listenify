const BASE = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

export async function uploadPDF(file: File, opts: {
  length: string; language: string; difficulty: string; debate: boolean
}) {
  const form = new FormData()
  form.append('file', file)
  form.append('length', opts.length)
  form.append('language', opts.language)
  form.append('difficulty', opts.difficulty)
  form.append('debate', String(opts.debate))
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getStatus(jobId: string) {
  const res = await fetch(`${BASE}/status/${jobId}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getChapters(jobId: string) {
  const res = await fetch(`${BASE}/audiobook/${jobId}/chapters`)
  if (!res.ok) return []
  return res.json()
}

export async function getShowNotes(jobId: string) {
  const res = await fetch(`${BASE}/audiobook/${jobId}/shownotes`)
  if (!res.ok) return null
  return res.json()
}

export async function getTranscript(jobId: string) {
  const res = await fetch(`${BASE}/audiobook/${jobId}/transcript`)
  if (!res.ok) return null
  return res.text()
}

export const streamUrl    = (id: string) => `${BASE}/audiobook/${id}/stream`
export const downloadUrl  = (id: string) => `${BASE}/audiobook/${id}/download`
export const transcriptDlUrl = (id: string) => `${BASE}/audiobook/${id}/transcript/download`

export async function getLanguages() {
  try {
    const res = await fetch(`${BASE}/languages`)
    if (!res.ok) return { supported_languages: ['english'] }
    return res.json()
  } catch { return { supported_languages: ['english'] } }
}
