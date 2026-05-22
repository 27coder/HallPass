'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Pass {
  id: string
  fromRoom: string
  to: string
  notes: string
  status: string
  approvedAt?: string
  returnedAt?: string
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [passes, setPasses] = useState<Pass[]>([])
  const [fromRoom, setFromRoom] = useState('')
  const [to, setTo] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPasses()
    const interval = setInterval(fetchPasses, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchPasses = async () => {
    const res = await fetch('/api/passes', { cache: 'no-store' })
    const data = await res.json()
    setPasses(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/passes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromRoom, to, notes })
    })
    setLoading(false)
    if (res.ok) {
      setFromRoom('')
      setTo('')
      setNotes('')
      fetchPasses()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to create pass')
    }
  }

  const getStatusBadge = (status: string) => {
    // Only allow known statuses
    const statusMap: { [key: string]: JSX.Element } = {
      'pending': <span className="badge badge-pending">⏳ Pending</span>,
      'approved': <span className="badge badge-approved">✓ Approved</span>,
      'denied': <span className="badge badge-denied">✗ Denied</span>,
      'returned': <span className="badge badge-returned">↩ Returned</span>,
    }
    return statusMap[status] || <span className="badge">{status}</span>
  }

  const handleLogout = async () => {
    await signOut({ redirect: false, callbackUrl: '/login' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {escapeHtml(session?.user?.name || '')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Request Form Card */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Request Hall Pass</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {escapeHtml(error)}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text">From Room #</label>
              <input
                type="text"
                placeholder="e.g., 101"
                value={fromRoom}
                onChange={(e) => setFromRoom(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label-text">Destination</label>
              <input
                type="text"
                placeholder="e.g., Nurse, Library, Room 205"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label-text">Reason/Notes</label>
              <textarea
                placeholder="Why do you need to leave class?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field resize-none"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Request Pass'}
            </button>
          </form>
        </div>

        {/* Passes List */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">My Hall Passes</h2>
          {passes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hall passes yet</p>
          ) : (
            <div className="space-y-4">
              {passes.map(pass => (
                <div
                  key={pass.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Room {escapeHtml(pass.fromRoom)} → {escapeHtml(pass.to)}</p>
                      <p className="font-semibold text-gray-800 text-lg mt-1">{escapeHtml(pass.to)}</p>
                    </div>
                    {getStatusBadge(pass.status)}
                  </div>
                  {pass.notes && (
                    <p className="text-gray-600 text-sm mb-2">Reason: {escapeHtml(pass.notes)}</p>
                  )}
                  <div className="text-xs text-gray-500 space-y-1">
                    {pass.approvedAt && (
                      <p>✓ Approved: {new Date(pass.approvedAt).toLocaleString()}</p>
                    )}
                    {pass.returnedAt && (
                      <p>↩ Returned: {new Date(pass.returnedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}