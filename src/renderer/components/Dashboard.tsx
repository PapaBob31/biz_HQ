import { useState, useEffect, useRef, useContext } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line 
} from 'recharts';
import { Users, Package, DollarSign, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AxiosHttpRequest } from "../../App"
/*export type Sale = {
  id: number;
  total: number;
  tax: number;
  totalAfterTax: number;
  method        String
  employeeName  String
  createdAt     DateTime      @default(now())
  customerId    Int?
  ProductSold   ProductSold[]
  Customer      Customer?     @relation(fields: [customerId], references: [id])
}
*/

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
  month: string;
  income: number 
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
    return ((val2 - val1)/val1).toFixed(2)
  }
}

export default function Dashboard () {
  const [revenueTrendData, setRevenueTrendData] = useState<RevenueTrend[]>([])
  const [topSellingData, setTopSellingData] = useState<TopSellingProduct[]>([])
  const [stats, setStats] = useState({todayRevenue:  0, totalInventory: 0, lowStockCount: 0, customerCount: 0, yesterdayRevenue: 0, monthRevenue: 0})
  const [loading, setLoading] = useState(true);
  const api = useContext(AxiosHttpRequest)!

  useEffect(() => {
    // Fetch all 3 endpoints in parallel
    Promise.all([
      api.get('/api/business-analytics/top-products'),
      api.get('/api/business-analytics/revenue-trend'),
      api.get('/api/business-analytics/quick-stats'),
      // api.get('/api/sales?limit=5'),
    ])
    .then(async ([res1, res2, res3]) => {
      const topProducts = await res1.data;
      const revenueTrend = await res2.data;
      const bizStats = await res3.data;
      // const recentSales = await res4.data;
      setRevenueTrendData(revenueTrend)
      setTopSellingData(topProducts)
      setStats(bizStats)
      setLoading(false)
    });
  }, []);

  if (loading) return <DashboardLoading />;

  
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
        /> {/*+12% from last month*/}
        <StatCard 
          title="Inventory Items" 
          value={stats.totalInventory} 
          icon={<Package size={20} />} 
          trend="" 
          trendUp={true}
        />{/*8 new added today*/}
        <StatCard 
          title="Today's Revenue" 
          value={stats.todayRevenue} 
          icon={<DollarSign size={20} />} 
          subtext={`Month: $${stats.monthRevenue}`}
          trend={getPercentChange(stats.yesterdayRevenue, stats.todayRevenue)}
          trendUp={true}
        />{/* +5.4% vs yesterday Month: $82,400"*/}
        <StatCard 
          title="Low Stock Alert" 
          value={stats.lowStockCount} 
          icon={<AlertTriangle size={20} />} 
          trend="Action required"
          trendUp={false}
          isWarning={true}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Card 1: Top 5 Selling Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 5 Selling Products (Weekly)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topSellingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Income History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Revenue Performance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{fontSize: 12}} />
                <YAxis tick={{fontSize: 12}} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="income" 
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
          <button className="text-blue-600 text-sm font-medium hover:underline">View All Sales</button>
        </div>
        {/*<div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 text-center">ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              <RecentSalesRow id="#9921" name="Sarah Jenkins" amount="$42.50" status="Success" />
              <RecentSalesRow id="#9920" name="Walk-in Customer" amount="$15.00" status="Success" />
              <RecentSalesRow id="#9919" name="Mark Thompson" amount="$112.99" status="Success" />
            </tbody>
          </table>
        </div>*/}
        <p className="text-center font-italic bg-slate-100 p-4">No Sales have been made today!</p>
      </div>
    </div>
  );
};

// --- Sub-components for clarity ---

const StatCard = ({ title, value, icon, trend, trendUp, isWarning, subtext }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg ${isWarning ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
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
    <p className={`text-xs mt-4 font-medium ${isWarning ? 'text-red-500' : 'text-slate-400'}`}>
      {trend}
    </p>
  </div>
);

const RecentSalesRow = ({ id, name, amount, status }: any) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">{id}</td>
    <td className="px-6 py-4 font-medium text-slate-700">{name}</td>
    <td className="px-6 py-4 font-bold text-slate-800">{amount}</td>
    <td className="px-6 py-4 text-center">
      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-tighter">
        {status}
      </span>
    </td>
  </tr>
);
