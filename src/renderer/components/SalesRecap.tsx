import { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { DollarSign, Hash, CreditCard, Ban } from 'lucide-react';
import { AxiosHttpRequest } from "../../App"
import type { Sale } from '../../../prisma/generated/client';


function LoadingScreen(){
  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8 animate-pulse">
      {/* 1. Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>

      {/* 2. Top Stats Row (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3  gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-32">
            <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
            <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* 3. Main Content Grid (Charts & Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend Skeleton (Larger) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-[400px]">
          <div className="h-6 w-40 bg-slate-100 rounded mb-8"></div>
          <div className="flex items-end gap-4 h-64 px-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-1 bg-slate-100 rounded-t-xl" style={{ height: `${20 * i}%` }}></div>
            ))}
          </div>
        </div>

        {/* Top Products/Recent Sales Skeleton */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-[400px]">
          <div className="h-6 w-40 bg-slate-100 rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full bg-slate-100 rounded"></div>
                  <div className="h-3 w-2/3 bg-slate-50 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function formatCurrentTimestamp(date: Date){
  const options = {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  } as const;

  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  } as const;

  const datePart = date.toLocaleDateString('en-US', options);
  const timePart = date.toLocaleTimeString('en-US', timeOptions);

  return `${datePart} : ${timePart}`;
};


function RecentSalesRow({ createdAt, id, customer, amount, status }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">{id}</td>
      <td className="px-6 py-4 text-left font-mono text-blue-600">
        {formatCurrentTimestamp(new Date(createdAt))}
      </td>
      <td className={`px-6 py-4 font-medium ${customer ? 'text-slate-700' : 'text-slate-500' }`}>
        {customer ? customer.firstName + ' ' + customer.lastName : <Ban size={20}/> }
      </td>
      <td className="px-6 py-4 font-bold text-slate-800">{amount}</td>
      <td className="px-6 py-4 text-center">
        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-tighter">
          {status}
        </span>
      </td>
    </tr>
  )
};

interface RevenueTrend {
  label: string;
  revenue: number 
}

export default function SalesRecapScreen() {
  const [timeframe, setTimeframe] = useState('today');
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [revenueTrendData, setRevenueTrendData] = useState<RevenueTrend[]>([])
  const [pageLoadStatus, setPageLoadStatus] = useState<"pending"|"failed"|"success">("pending");
  const [stats, setStats] = useState({
    revenue: 0,
    transactionCount: 0,
    avgSale: 0,
    topProducts: [],
  });
  const timeFrameToXAxisLabel: {[key: string]: string} = {"this_week": "Days of the week", "last_week": "Days of the week", "today": "Hours of the day", "month": "Days of the Month"}
  const api = useContext(AxiosHttpRequest)!

  useEffect(() => {
    setPageLoadStatus("pending")
    Promise.all([
      api.get('/api/business-analytics/sales-recap?filter=' + (timeframe)),
      api.get('/api/sales'),
      api.get('/api/business-analytics/revenue-trend?range=' + (timeframe))
    ])
    .then(async ([res1, res2, res3]) => {
      const recapStats = res1.data;
      const recentSales = res2.data;
      const revenueTrend = await res3.data;
      console.log(revenueTrend)
      setStats(recapStats); console.log(recapStats);
      setRecentSales(recentSales)
      setRevenueTrendData(revenueTrend)
      setPageLoadStatus("success")
    })
    .catch(() => {
      setPageLoadStatus("failed")
      setTimeframe("")
    });
  }, [timeframe])


  if (pageLoadStatus === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-800 p-8">
        <img src="/connection-lost.svg" className="w-120 "/>
        <h1 className="text-4xl text-center text-blue-800 font-bold my-4">Request Error</h1>
        <p className="text-gray-700 w-150 text-center">
          Something went wrong while trying to get Sales recap. Please try again
        </p>
        <button onClick={() => {setTimeframe('today'); setPageLoadStatus('pending')}} className="mt-4 px-5 py-1 text-lg bg-blue-600 text-white rounded-md cursor-pointer">Retry</button>
      </div>
    )
  }

  const metrics = [
    { label: 'Total Revenue', value: `$${parseFloat(stats.revenue.toFixed(2)).toLocaleString()}`, icon: <DollarSign className="text-emerald-500" />, color: 'bg-emerald-50' },
    { label: 'Transactions', value: stats.transactionCount, icon: <Hash className="text-blue-500" />, color: 'bg-blue-50' },
    { label: 'Avg. Sale Value', value: `$${parseFloat(stats.avgSale.toFixed(2)).toLocaleString()}`, icon: <CreditCard className="text-purple-500" />, color: 'bg-purple-50' },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8">
      {/* Header & Filter */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Sales Recap</h1>
          <p className="text-slate-500">Business performance overview for Biz HQ</p>
        </div>
        <div className="flex bg-white shadow-sm border rounded-xl p-1 gap-1">
          {['Today', 'This Week', 'Last Week', 'Month'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t.toLowerCase().replace(' ', '_'))}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                timeframe === t.toLowerCase().replace(' ', '_')
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {pageLoadStatus === "pending" && <LoadingScreen/>}
      {pageLoadStatus === "success" && (<>
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className={`p-4 rounded-xl ${m.color}`}>{m.icon}</div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{m.label}</p>
                <h2 className="text-2xl font-black text-slate-800">{m.value}</h2>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sales Trend Visual */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrendData} margin={{bottom: 15}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} label={{value: timeFrameToXAxisLabel[timeframe], offset: -10,  position: "insideBottom"}}/>
                  <YAxis tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dataKey="revenue" label={{value: "Revenue", angle: -90,  position: "insideLeft"}} />
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Visual */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Top 5 Products</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="horizontal" data={stats.topProducts} margin={{bottom: 15}}>
                  <XAxis dataKey="productName" label={{value: "Product", offset: -10,  position: "insideBottom"}}  type="category" tickLine={false} width={100} tick={{fill: '#475569', fontWeight: 600, fontSize: 12}} />
                  <YAxis type="number" dataKey="quantity" label={{value: "Amount Sold", angle: -90,  position: "insideLeft"}}/>
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="quantity" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <h2 className="text-xl font-semibold">All Sales</h2>
          <table className="w-full text-left bg-white shadow-lg shadow-slate-200">
            <thead className="bg-slate-200 text-slate-700 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 text-center">ID</th>
                <th className="px-6 py-4 text-left">Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {recentSales.map(sale => (
                <RecentSalesRow id={`#${sale.id.toString().padStart(4, '0')}`} createdAt={sale.createdAt} customer={sale.Customer} amount={sale.total} status="Success" />
              ))}
            </tbody>
          </table>
        </div>
      </>)}
    </div>
  );
};