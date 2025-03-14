'use client'

import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

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

type ChartHolding = {
  name: string
  value: number
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#F06292', '#4DB6AC', '#FF7043', '#9575CD'
]

function prepareChartData(holdings: Holding[]): ChartHolding[] {
  return holdings
    .slice(0, 10)
    .map(holding => ({
      name: holding.name,
      value: holding.valUSD
    }))
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
    <div className="min-h-screen bg-slate-50">
      <header className="mb-12 text-center pt-8">
        <h1 className="text-4xl font-bold text-slate-600 mb-3">N-Port Explorer</h1>
        <p className="text-slate-500 text-lg">Enter a CIK to view fund holdings</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 mb-16">
        <div className="flex gap-3">
          <input
            type="text"
            value={cik}
            onChange={(e) => setCik(e.target.value)}
            placeholder="Enter CIK (e.g. 0000884394)"
            className="flex-1 px-6 py-3 rounded-xl border-0 
              text-slate-600 placeholder:text-slate-400
              shadow-sm ring-1 ring-slate-200
              focus:outline-none focus:ring-2 focus:ring-blue-500
              transition-all text-lg"
          />
          <button
            onClick={fetchHoldings}
            disabled={loading || !cik}
            className="px-8 py-3 bg-blue-500 text-white rounded-xl 
              hover:bg-blue-600 disabled:opacity-50 
              disabled:hover:bg-blue-500 transition-all
              shadow-sm font-medium text-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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

      {data && (
        <div className="flex">
          <div className="w-64 px-8">
            <div className="sticky top-8">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Navigation
              </h4>
              <nav className="space-y-1">
                {['Overview', 'Portfolio Composition', 'All Holdings'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-600 
                      hover:text-blue-500 hover:bg-white rounded-lg transition-all"
                  >
                    {item}
                  </a>
                ))}
              </nav>
            </div>
          </div>

          <main className="flex-1 max-w-5xl px-8 pb-16 space-y-8">
            <div id="overview" className="bg-white rounded-2xl shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-slate-600">{data.regName}</h2>
              <p className="text-slate-500 mt-2 text-lg">
                {data.holdings.length.toLocaleString()} holdings found • Top 10 holdings shown below
              </p>
            </div>

            <div id="portfolio-composition" className="bg-white rounded-2xl shadow-sm p-8">
              <h3 className="text-xl font-semibold text-slate-600 mb-6">Portfolio Composition</h3>
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareChartData(data.holdings)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={250}
                      label={({ name, value }) => {
                        const percentage = (value / data.holdings.reduce((sum, h) => sum + h.valUSD, 0) * 100).toFixed(1)
                        return `${name.slice(0, 25)}${name.length > 25 ? '...' : ''} (${percentage}%)`
                      }}
                    >
                      {prepareChartData(data.holdings).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        padding: '8px 12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div id="all-holdings" className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <h3 className="text-xl font-semibold text-slate-600">All Holdings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {(['name', 'cusip', 'balance', 'valUSD'] as const).map((field) => (
                        <th
                          key={field}
                          onClick={() => handleSort(field)}
                          className="text-left text-sm font-medium text-slate-600 p-6 
                            cursor-pointer hover:bg-slate-50 transition-colors"
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
                        <td className="p-6 text-slate-600">{holding.name}</td>
                        <td className="p-6 font-mono text-sm text-slate-600">{holding.cusip}</td>
                        <td className="p-6 text-right text-slate-600">{holding.balance.toLocaleString()}</td>
                        <td className="p-6 text-right text-slate-600">
                          ${holding.valUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  )
}
