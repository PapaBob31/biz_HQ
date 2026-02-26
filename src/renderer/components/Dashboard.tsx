import { useState, useEffect, useRef, useContext } from 'react';
import type { Sale } from '../../../prisma/generated/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line
} from 'recharts';
import { Users, Package, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight, Ban } from 'lucide-react';
import { AxiosHttpRequest } from "../../App"

const DashboardLoading = () => {
  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8 animate-pulse">
      {/* 1. Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>

      {/* 2. Top Stats Row (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
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

interface RevenueTrend {
  label: string;
  revenue: number 
}

interface TopSellingProduct {
  name: string,
  sales: number
}

function CurrentTimeStamp() {
  const [currTimeStamp, setCurrTimeStamp] = useState(formatCurrentTimestamp())
  const clockStarted = useRef(false)
  useEffect(() => {
    if (!clockStarted.current)
      setInterval(()=>setCurrTimeStamp(formatCurrentTimestamp()), 1000)
    clockStarted.current = true
  }, [])
  return (
    <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
      {currTimeStamp}
    </div>
  )
}

function formatCurrentTimestamp(){
  const date = new Date();
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

  return `${datePart} • ${timePart}`;
};


function getPercentChange(val1: number, val2: number) {
  if (val1 === 0) {
    if (val2 > 0)
      return "+100%"
    else 
      return "+0%"
  }else {
    const change = (val2 - val1)/val1
    return change >= 0 ? ('+' + change.toFixed(2) + "%") : change.toFixed(2) + "%"
  }
}

function formatTime(date: Date) {
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return formattedTime
}


export default function Dashboard () {
  const [revenueTrendData, setRevenueTrendData] = useState<RevenueTrend[]>([])
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [topSellingData, setTopSellingData] = useState<TopSellingProduct[]>([])
  const [stats, setStats] = useState({todayRevenue:  0, totalInventoryCount: 0, lowStockCount: 0, customerCount: 0, yesterdayRevenue: 0, monthRevenue: 0})
  const [loading, setLoading] = useState(true);
  const api = useContext(AxiosHttpRequest)!
  const [networkErrorOccurred, setNetworkErrorOccurred] = useState(false)

  useEffect(() => {
    if (!loading)
      return;
    Promise.all([
      api.get('/api/business-analytics/top-products'),
      api.get('/api/business-analytics/revenue-trend?range=this_week'),
      api.get('/api/business-analytics/quick-stats'),
      api.get('/api/sales?limit=5&today=true'),
    ])
    .then(async ([res1, res2, res3, res4]) => {
      const topProducts = await res1.data;
      const revenueTrend = await res2.data;
      const bizStats = await res3.data;
      const recentSales = await res4.data;
      setRevenueTrendData(revenueTrend)
      setTopSellingData(topProducts)
      setStats(bizStats)
      setRecentSales(recentSales)
      setLoading(false)
    })
    .catch(() => {
      setNetworkErrorOccurred(true)
    });
  }, [loading]);

  if (loading) return <DashboardLoading />;


  if (networkErrorOccurred) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-800 p-8">
        <img src="/connection-lost.svg" className="w-120 "/>
        <h1 className="text-4xl text-center text-blue-800 font-bold my-4">Request Error</h1>
        <p className="text-gray-700 w-150 text-center">
          Something went wrong while trying to get dashboard data. Please retry, or contact the application developer if the problem persists
        </p>
        <button onClick={() => {setLoading(true); setNetworkErrorOccurred(false)}} className="mt-4 px-5 py-1 text-lg bg-blue-600 text-white rounded-md cursor-pointer">Retry</button>
      </div>
    )
  }

  
  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-8 overflow-y-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Business Overview</h1>
          <p className="text-slate-500">Welcome back! Here is what's happening today.</p>
        </div>
        <CurrentTimeStamp/>
      </header>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Registered Customers" 
          value={stats.customerCount} 
          icon={<Users size={20} />} 
          trend=""
          trendUp={true}
        />
        <StatCard 
          title="Inventory Items" 
          value={stats.totalInventoryCount} 
          icon={<Package size={20} />} 
          trend="" 
          trendUp={true}
        />
        <StatCard 
          title="Today's Revenue" 
          value={`$${parseFloat(stats.todayRevenue.toFixed(2)).toLocaleString()}`} 
          icon={<DollarSign size={20} />} 
          subtext={`Month: $${parseFloat(stats.monthRevenue.toFixed(2)).toLocaleString()}`}
          isWarning={getPercentChange(stats.yesterdayRevenue, stats.todayRevenue)[0] === '-'}
          trend={getPercentChange(stats.yesterdayRevenue, stats.todayRevenue)}
          trendUp={true}
        />
        <StatCard 
          title="Low Stock Items" 
          value={stats.lowStockCount} 
          icon={stats.lowStockCount > 0 ? <AlertTriangle size={20} /> : <Ban size={20}/>} 
          trend={stats.lowStockCount > 0 ? "Action required" : ""}
          trendUp={false}
          isWarning={stats.lowStockCount > 0}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Card 1: Top 5 Selling Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 5 Selling Products (Current Week)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSellingData} layout="vertical" margin={{bottom: 15}}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" dataKey={"sold"} label={{value: "Amount Sold", offset: -10,  position: "insideBottom"}} />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} label={{value: "Product", angle: -90,  position: "insideLeft"}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="sold" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Revenue History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue Performance (Current Week)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData} margin={{bottom: 15}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{fontSize: 12}} label={{value: "Day", offset: -10,  position: "insideBottom"}} />
                <YAxis tick={{fontSize: 12}} dataKey="revenue" label={{value: "Revenue", angle: -90,  position: "insideLeft"}} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">Recent Sales Today</h3>
        </div>
        {recentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4 text-center">ID</th>
                  <th className="px-6 py-4 text-center">Time</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {recentSales.map(sale => <RecentSalesRow key={sale.id} id={sale.id} customer={sale.Customer} amount={sale.total} status="Success" createdAt={sale.createdAt} />)}
              </tbody>
            </table>
          </div>
        ) : <p className="text-center font-italic bg-slate-100 p-4">No Sales have been made today!</p>}
      </div>
    </div>
  );
};

// --- Sub-components for clarity ---

const StatCard = ({ title, value, icon, trend, trendUp, isWarning, subtext }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${isWarning ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
        {icon}
      </div>
      {trendUp !== undefined && (
        <div className={`flex items-center text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1 font-medium">{subtext}</p>}
    </div>
    <p className={`text-xs mt-4 font-medium ${isWarning ? 'text-red-500' : 'text-slate-500'}`}>
      {trend}
    </p>
  </div>
);

const RecentSalesRow = ({ id, customer, amount, status, createdAt }: any) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">{`#${id.toString().padStart(4, '0')}`}</td>
    <td className="px-6 py-4 text-center font-mono text-blue-600">
        {formatTime(new Date(createdAt))}
    </td>
    <td className={`px-6 py-4 font-medium ${customer ? 'text-slate-700' : 'text-slate-500' }`}>
      {customer ? customer.firstName + ' ' + customer.lastName : <Ban size={20}/> }
    </td>
    <td className="px-6 py-4 font-bold text-slate-800">${amount}</td>
    <td className="px-6 py-4 text-center">
      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-tighter">
        {status}
      </span>
    </td>
  </tr>
);
 