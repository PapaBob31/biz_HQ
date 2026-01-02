import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Store, Factory, BanknoteArrowUp, Users } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: any) => void;
  user: any;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, user }) => {
  const menuItems = [
    { id: 'Dashboard', icon: <LayoutDashboard size={20}/>, label: 'Dashboard', roles: ['ADMIN'] },
    { id: 'Inventory', icon: <Package size={20}/>, label: 'Inventory', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'Sales', icon: <ShoppingCart size={20}/>, label: 'Sales Terminal', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'Settings', icon: <Settings size={20}/>, label: 'Settings', roles: ['ADMIN'] },
    { id: 'Employees', icon: <Factory size={20}/>, label: 'Employees', roles: ['ADMIN'] },
    { id: 'Expenses', icon: <BanknoteArrowUp size={20}/>, label: 'Expenses', roles: ['MANAGER', 'ADMIN'] },
    { id: 'Customers', icon: <Users size={20}/>, label: 'Customers', roles: ['MANAGER', 'ADMIN', 'CASHIER'] },
  ];

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col text-slate-300">
      <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg"><Store size={24} /></div>
        <span className="font-bold text-xl tracking-tight">Biz HQ</span>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {menuItems.filter(item => item.roles.includes(user?.role)).map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
              activePage === item.id 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
              : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase">
            {user?.username?.[0] || 'U'}
          </div>
          <div className="overflow-hidden text-sm">
            <p className="font-bold text-white truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-red-900/20 hover:text-red-400 transition-colors">
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;