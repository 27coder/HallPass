'use client'

import { useSession, signOut } from 'next-auth/react'
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

export default function StudentDashboard() {
  const { data: session } = useSession()
  const [passes, setPasses] = useState<Pass[]>([])
  const [fromRoom, setFromRoom] = useState('')
  const [to, setTo] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPasses()
  }, [])

  const fetchPasses = async () => {
    const res = await fetch('/api/passes')
    const data = await res.json()
    setPasses(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'badge'
    switch (status) {
      case 'pending':
        return <span className={`${baseClasses} badge-pending`}>⏳ Pending</span>
      case 'approved':
        return <span className={`${baseClasses} badge-approved`}>✓ Approved</span>
      case 'denied':
        return <span className={`${baseClasses} badge-denied`}>✗ Denied</span>
      case 'returned':
        return <span className={`${baseClasses} badge-returned`}>↩ Returned</span>
      default:
        return <span className={baseClasses}>{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {session?.user?.name}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Request Form Card */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Request Hall Pass</h2>
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
                      <p className="text-sm text-gray-600">Room {pass.fromRoom} → {pass.to}</p>
                      <p className="font-semibold text-gray-800 text-lg mt-1">{pass.to}</p>
                    </div>
                    {getStatusBadge(pass.status)}
                  </div>
                  {pass.notes && (
                    <p className="text-gray-600 text-sm mb-2">Reason: {pass.notes}</p>
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