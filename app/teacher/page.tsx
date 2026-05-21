'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Pass {
  id: string
  student: { name: string }
  fromRoom: string
  to: string
  notes: string
  status: string
  approvedAt?: string
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

export default function TeacherDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [pendingPasses, setPendingPasses] = useState<Pass[]>([])
  const [activePasses, setActivePasses] = useState<Pass[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPasses()
  }, [])

  const fetchPasses = async () => {
    const res = await fetch('/api/passes?status=pending')
    const data = await res.json()
    setPendingPasses(data)

    const res2 = await fetch('/api/passes?status=approved')
    const data2 = await res2.json()
    setActivePasses(data2)
  }

  const handleApprove = async (id: string) => {
    setLoading(true)
    await fetch(`/api/passes/${id}/approve`, { method: 'PUT' })
    setLoading(false)
    fetchPasses()
  }

  const handleDeny = async (id: string) => {
    setLoading(true)
    await fetch(`/api/passes/${id}/deny`, { method: 'PUT' })
    setLoading(false)
    fetchPasses()
  }

  const handleReturn = async (id: string) => {
    setLoading(true)
    await fetch(`/api/passes/${id}/return`, { method: 'PUT' })
    setLoading(false)
    fetchPasses()
  }

  const getTimeSince = (approvedAt: string) => {
    const now = new Date()
    const approved = new Date(approvedAt)
    const diff = now.getTime() - approved.getTime()
    const minutes = Math.floor(diff / 60000)
    return `${minutes} min`
  }

  const handleLogout = async () => {
    await signOut({ redirect: false, callbackUrl: '/login' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {escapeHtml(session?.user?.name || '')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Requests */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="text-yellow-500 mr-2">⏳</span> Pending Requests
            </h2>
            {pendingPasses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pendingPasses.map(pass => (
                  <div
                    key={pass.id}
                    className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4"
                  >
                    <p className="font-semibold text-gray-800">{escapeHtml(pass.student.name)}</p>
                    <p className="text-sm text-gray-600">
                      From <strong>Room {escapeHtml(pass.fromRoom)}</strong> → <strong>{escapeHtml(pass.to)}</strong>
                    </p>
                    {pass.notes && (
                      <p className="text-sm text-gray-600 mt-2">Reason: {escapeHtml(pass.notes)}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleApprove(pass.id)}
                        disabled={loading}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded font-semibold transition disabled:opacity-50"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleDeny(pass.id)}
                        disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded font-semibold transition disabled:opacity-50"
                      >
                        ✗ Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Passes */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="text-green-500 mr-2">✓</span> Active Passes
            </h2>
            {activePasses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active passes</p>
            ) : (
              <div className="space-y-4">
                {activePasses.map(pass => (
                  <div
                    key={pass.id}
                    className="border-2 border-green-200 bg-green-50 rounded-lg p-4"
                  >
                    <p className="font-semibold text-gray-800">{escapeHtml(pass.student.name)}</p>
                    <p className="text-sm text-gray-600">
                      From <strong>Room {escapeHtml(pass.fromRoom)}</strong> → <strong>{escapeHtml(pass.to)}</strong>
                    </p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="badge badge-approved text-sm">
                        ⏱ {pass.approvedAt ? getTimeSince(pass.approvedAt) : 'Active'}
                      </span>
                      <button
                        onClick={() => handleReturn(pass.id)}
                        disabled={loading}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold transition disabled:opacity-50"
                      >
                        ↩ Confirm Return
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}