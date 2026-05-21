'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface Pass {
  id: string
  student: { name: string }
  teacher?: { name: string }
  fromRoom: string
  to: string
  notes: string
  status: string
  approvedAt?: string
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [passes, setPasses] = useState<Pass[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPasses()
  }, [])

  const fetchPasses = async () => {
    const res = await fetch('/api/passes')
    const data = await res.json()
    setPasses(data)
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

  const stats = {
    total: passes.length,
    pending: passes.filter((p: Pass) => p.status === 'pending').length,
    approved: passes.filter((p: Pass) => p.status === 'approved').length,
    denied: passes.filter((p: Pass) => p.status === 'denied').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {session?.user?.name}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-gray-600 text-sm">Total Passes</p>
            <p className="text-3xl font-bold text-indigo-600">{stats.total}</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-600 text-sm">⏳ Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-600 text-sm">✓ Approved</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-600 text-sm">✗ Denied</p>
            <p className="text-3xl font-bold text-red-600">{stats.denied}</p>
          </div>
        </div>

        {/* All Passes */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Hall Passes</h2>
          {passes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hall passes yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold text-gray-700">Student</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Route</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Reason</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Teacher</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {passes.map((pass: Pass) => (
                    <tr key={pass.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-800">{pass.student.name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        Room {pass.fromRoom} → {pass.to}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{pass.notes || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{pass.teacher?.name || '—'}</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(pass.status)}
                        {pass.status === 'approved' && pass.approvedAt && (
                          <p className="text-xs text-gray-500 mt-1">{getTimeSince(pass.approvedAt)} ago</p>
                        )}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        {pass.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(pass.id)}
                              disabled={loading}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDeny(pass.id)}
                              disabled={loading}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition disabled:opacity-50"
                            >
                              Deny
                            </button>
                          </>
                        )}
                        {pass.status === 'approved' && (
                          <button
                            onClick={() => handleReturn(pass.id)}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold transition disabled:opacity-50"
                          >
                            Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}