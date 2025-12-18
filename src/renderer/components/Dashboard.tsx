import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// Mock Data for the visuals
const topProducts = [
  { name: 'Product A', sales: 400 },
  { name: 'Product B', sales: 300 },
  { name: 'Product C', sales: 200 },
  { name: 'Product D', sales: 150 },
  { name: 'Product E', sales: 100 },
];

const revenueHistory = [
  { month: 'Jan', income: 4000 },
  { month: 'Feb', income: 3000 },
  { month: 'Mar', income: 5000 },
  { month: 'Apr', income: 4500 },
];

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Admin Dashboard</h1>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Registered Customers" value="1,284" color="bg-blue-500" />
        <StatCard title="Inventory Items" value="452" color="bg-purple-500" />
        <StatCard title="Today's Revenue" value="$4,250" subtext="Monthly: $82k" color="bg-green-500" />
        <StatCard title="Low Stock Items" value="12" color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Top 5 Selling Products (Bar Graph) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold mb-4">Top 5 Selling Products</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Income History (Line Graph) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-semibold mb-4">Revenue Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Sales Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 font-semibold">Recent Sales</div>
        <table className="w-full text-left">
          <thead className="text-xs uppercase text-slate-500 bg-slate-50">
            <tr>
              <th className="px-6 py-3">Order ID</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50 transition">
              <td className="px-6 py-4 font-mono text-sm">#CLV-8942</td>
              <td className="px-6 py-4">John Doe</td>
              <td className="px-6 py-4">$120.00</td>
              <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Paid</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Small Reusable Component for KPI Cards
const StatCard = ({ title, value, subtext, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
    <span className="text-slate-500 text-sm font-medium">{title}</span>
    <span className="text-3xl font-bold text-slate-800 my-1">{value}</span>
    {subtext && <span className="text-xs text-slate-400 font-semibold">{subtext}</span>}
    <div className={`h-1 w-12 mt-4 rounded-full ${color}`}></div>
  </div>
);

export default Dashboard;