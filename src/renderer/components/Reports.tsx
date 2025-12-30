import { useState, useEffect } from 'react';
import {  Download, TrendingUp, Package } from 'lucide-react';


const ReportLine = ({ label, value, color = "text-slate-900" }: any) => (
  <div className="flex justify-between items-center border-b border-slate-50 pb-2">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className={`font-black ${color}`}>{value}</span>
  </div>
);

const CategoryRow = ({ name, sold, rev }: any) => (
  <tr className="hover:bg-slate-50">
    <td className="px-6 py-4 font-bold">{name}</td>
    <td className="px-6 py-4 text-slate-500">{sold} units</td>
    <td className="px-6 py-4 text-right font-bold text-emerald-600">{rev}</td>
  </tr>
);

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/business-summary')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center">Calculating Report...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen space-y-8">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Business Reports</h1>
          <p className="text-slate-500">Real-time data as of {new Date().toLocaleDateString()}</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2">
           <Download size={20}/> Download PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Live Sales Summary */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2"><TrendingUp/> Sales</h2>
          <div className="space-y-4">
            <ReportLine label="Total Revenue" value={`$${data.sales.totalRevenue.toLocaleString()}`} />
            <ReportLine label="Avg Transaction" value={`$${data.sales.averageOrder.toFixed(2)}`} />
            <ReportLine label="Total Sales" value={data.sales.transactions} />
          </div>
        </section>

        {/* Live Inventory Status */}
        <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-orange-600 flex items-center gap-2"><Package/> Inventory</h2>
          <div className="space-y-4">
            <ReportLine label="Total SKUs" value={data.inventory.skuCount} />
            <ReportLine label="Items in Stock" value={data.inventory.totalItems} />
            <ReportLine label="Low Stock Alerts" value={data.inventory.lowStock} color="text-red-500" />
          </div>
        </section>
      </div>

      {/* Live Category Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs font-bold text-slate-400 uppercase">
            <tr>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Units Sold</th>
              <th className="px-6 py-4 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.categories.map((cat: any) => (
              <CategoryRow key={cat.name} name={cat.name} sold={cat.sold} rev={`$${cat.revenue.toLocaleString()}`} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};