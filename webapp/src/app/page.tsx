'use client'

import { useState } from 'react'

type Holding = {
  name: string
  cusip: string
  balance: number
  valUSD: number
}

type SortField = keyof Holding
type SortDirection = 'asc' | 'desc'

type NPortResponse = {
  regName: string
  holdings: Holding[]
}

export default function Home() {
  const [cik, setCik] = useState('')
  const [data, setData] = useState<NPortResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sortField, setSortField] = useState<SortField>('valUSD')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  async function fetchHoldings() {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/nport/${cik}`)
      if (!res.ok) throw new Error('Failed to fetch holdings')
      const rawData = await res.json()

      // Initial sort by valUSD desc
      const sortedData = {
        ...rawData,
        holdings: [...rawData.holdings].sort((a, b) => b.valUSD - a.valUSD)
      }

      setData(sortedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holdings')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (!data) return

    const newDirection = field === sortField && sortDirection === 'desc' ? 'asc' : 'desc'
    setSortField(field)
    setSortDirection(newDirection)

    const sortedHoldings = [...data.holdings].sort((a, b) => {
      if (typeof a[field] === 'string') {
        return newDirection === 'asc'
          ? (a[field] as string).localeCompare(b[field] as string)
          : (b[field] as string).localeCompare(a[field] as string)
      }
      return newDirection === 'asc'
        ? (a[field] as number) - (b[field] as number)
        : (b[field] as number) - (a[field] as number)
    })

    setData({ ...data, holdings: sortedHoldings })
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) {
      return (
        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortDirection === 'desc' ? (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">N-PORT Explorer</h1>
          <p className="text-slate-600">Enter a CIK to view fund holdings</p>
        </header>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={cik}
              onChange={(e) => setCik(e.target.value)}
              placeholder="Enter CIK (e.g. 0000884394)"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 
                text-slate-800 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                transition-all"
            />
            <button
              onClick={fetchHoldings}
              disabled={loading || !cik}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Loading
                </span>
              ) : 'Search'}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-red-500 text-sm">{error}</p>
          )}
        </div>

        {/* Results Section */}
        {data && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800">{data.regName}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {data.holdings.length.toLocaleString()} holdings found
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    {(['name', 'cusip', 'balance', 'valUSD'] as const).map((field) => (
                      <th
                        key={field}
                        onClick={() => handleSort(field)}
                        className="text-left text-sm font-medium text-slate-600 p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                          <SortIcon field={field} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.holdings.map((holding, index) => (
                    <tr
                      key={`${holding.cusip}-${holding.name}-${index}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 text-slate-800">{holding.name}</td>
                      <td className="p-4 font-mono text-sm text-slate-600">{holding.cusip}</td>
                      <td className="p-4 text-right text-slate-800">{holding.balance.toLocaleString()}</td>
                      <td className="p-4 text-right text-slate-800">
                        ${holding.valUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
