
import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserPlus, Shield, Mail, Key, AlertTriangle, Trash2, Edit2,Loader2, AlertCircle, RefreshCw, X, Eye, EyeOff } from 'lucide-react';
import type { Employee } from '../../../prisma/generated/client';
import { AxiosHttpRequest } from '../../App';

function ErrorInterface({fetchEmployees} : {fetchEmployees: () => void}) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="p-4 bg-red-50 rounded-full text-red-500 mb-4">
        <AlertCircle size={48} />
      </div>
      <h2 className="text-xl font-bold text-slate-800">Connection Failed</h2>
      <p className="text-slate-500 max-w-xs mt-2 mb-6">
        We couldn't connect to the backend service
      </p>
      <button 
        onClick={fetchEmployees}
        className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition"
      >
        <RefreshCw size={18} /> Retry Connection
      </button>
    </div>
  )
}

function LoadingInterface() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      <p className="text-slate-500 font-medium animate-pulse">Retrieving staff records...</p>
    </div>
  );
}

function EmptyStaffInterface() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="p-4 bg-blue-50 rounded-full text-blue-500 mb-4">
        <UserPlus size={48} />
      </div>
      <h2 className="text-xl font-bold text-slate-800">No Employees Found</h2>
    </div>
  )
}

function ErrorModal({ error, closeModal } : {error: string, closeModal: ()=>void}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-center">
      <div className="bg-white p-8 rounded-xl w-96 shadow-xl">
        <div className="flex justify-end">
          <button onClick={closeModal} className="cursor-pointer hover:bg-slate-200 rounded-full p-2">
            <X size={18}/>
          </button>
        </div>
        <div className="p-4 rounded-full bg-red-50 text-red-600 my-4 mx-auto w-fit">
          <AlertTriangle size={50}/>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Error!</h2>
        <p className="text-slate-500 max-w-xs mt-2 mb-6">
          {error}
        </p>
      </div>
    </div>
  )
}


function EmployeeEditModal(
  {employee, closeModal, updateEmployeeDisplay, displayError} : 
  {employee: Employee, closeModal: () => void, updateEmployeeDisplay: (emp: Employee) => void, displayError: (arg: string)=>void}
) {
  const api = useContext(AxiosHttpRequest)!
  const [passwordVisible, setPasswordVisible] = useState(false)
  function sendEmployeEditRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget!);
    const payload = Object.fromEntries(formData);

    api.put(`/api/employees/${employee.id}`, payload)
    .then(() => {
      updateEmployeeDisplay({id: employee.id, ...payload} as any)
      closeModal();
      alert("Employee details updated successfully")
    })
    .catch(err => {
      console.log(err)
      displayError("Something went wrong while modifying Inventory")
    }) 

  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl w-120 shadow-xl">
        <h2 className="text-xl font-bold mb-4">Edit Employee Details</h2>
        <form onSubmit={sendEmployeEditRequest} className="space-y-4">
          <label className="font-sembold">Username</label>
          <input 
            name="username"
            placeholder="User Name" 
            className="w-full p-2 border rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            defaultValue={employee.username}
            required
          />
          <label className="font-sembold">Email</label>
          <input 
            name="email"
            placeholder="Email" type="email"
            className="w-full p-2 border rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            defaultValue={employee.email}
            required
          />
          {employee.role !== "ADMIN" && (<div className="relative">
            <label className="font-sembold">Password</label>
            <input 
              name="password"
              type={passwordVisible ? "text" : "password"}
              placeholder="Leave Blank if you don't want to change it"
              className="w-full p-2 border rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>)}
          <label className="font-sembold">Role</label>
          <select 
            name="role"
            className="w-full p-2 border rounded bg-white"
          >
            <option value="Cashier" selected={employee.role === "CASHIER"}>Cashier</option>
            <option value="Manager" selected={employee.role === "MANAGER"}>Manager</option>
            <option value="Admin" selected={employee.role === "ADMIN"}>Admin</option>
          </select>
          <div className="flex gap-2">
            <button type="button" onClick={closeModal} className="cursor-pointer flex-1 py-2 bg-slate-200 rounded-md">Cancel</button>
            <button type="submit" className="cursor-pointer flex-1 py-2 bg-blue-600 text-white rounded-md cursor-pointer">Update Details</button>
          </div>
        </form>
      </div>
    </div>
  )
}



export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newStaff, setNewStaff] = useState({ username: '', role: 'Cashier', password: '', email: '' });
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee|null>(null)
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false)
  const [errorModal, setErrorModal] = useState({opened: false, content: ''})
  const api = useContext(AxiosHttpRequest)!

  async function fetchEmployees(){
    setLoading(true);
    try {
      const response = await api.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error("Error loading employees:", error);
      setError(true)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  function displayEmployeeEditForm(employee: Employee) {
    setEmployeeToEdit(employee)
    setModalOpen(true)
  }
  function updateEmployeeCard(updatedData: Employee) {
    const employeesList = [...employees]
    const targetEmployeeIndex = employeesList.findIndex(employee => employee.id === updatedData.id)
    if (targetEmployeeIndex > -1) {
      employeesList[targetEmployeeIndex] = updatedData;
      setEmployees(employeesList)
    }else {
      setErrorModal({opened: true, content: 'Employee to be update could not be found!'})
    }
  }

  async function handleEmployeeCreation(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const response = await api.post('/api/employees',{employeeData: newStaff});

      if (response.status === 201) {
        console.log("da fuck?")
        const savedEmployee = await response.data;
        setEmployees([...employees, savedEmployee]); // Update local state
        setModalOpen(false); // Close modal
        setNewStaff({ username: '', role: 'Cashier', password: '', email: '' }); // Reset
      }
    } catch (error) {
      console.error("Failed to save employee", error);
    }
  };

  async function deleteEmployee(employeeId: number) {
    console.log(employeeId)
    // also make sure currently logged in user can't delete himself
    const employeeToDelete = employees.find(employee => employee.id === employeeId)
    if (employeeToDelete!.role === 'ADMIN' && employees.length === 1 ){
      setErrorModal({content: "The only admin account can't be deleted!", opened: true})
      console.log("Why?")
      return
    }else {
      api.delete(`/api/employees/${employeeId}`)
      .then(response => {
        if (response.status === 200) {
          setEmployees(employees.filter(employee => employee.id !== employeeToDelete!.id))
        }else {
          setErrorModal({content: "An Error Occured while trying to delete User! Plese try again.", opened: true})
        }
      })
      .catch((error) => {
        setErrorModal({content: "An Error Occured while trying to delete User! Plese try again.", opened: true})
        console.error("Failed to save employee", error);
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'MANAGER': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (error)
    return <ErrorInterface fetchEmployees={fetchEmployees}/>
  else if (loading)
    return <LoadingInterface/>
  else if (employees.length === 0)
    return <EmptyStaffInterface/>

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Staff Management</h1>
          <p className="text-slate-500 text-sm">Control access levels and system permissions</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="cursor-pointer flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-md shadow-gray-200">
          <UserPlus size={18} /> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <div key={emp.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Shield size={24} />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(emp.role)}`}>
                {emp.role}
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-800">{emp.username}</h3>
            
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                {emp.email ? emp.email : <span className="rounded-lg p-1 bg-slate-100 text-xs">No Email Available</span>}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end gap-3 transition-opacity">
              <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                onClick={() => displayEmployeeEditForm(emp)}>
                <Edit2 size={16} />
              </button>
              <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer" onClick={()=>deleteEmployee(emp.id)}>
                <Trash2 size={16}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Basic Modal Placeholder */}
      {modalOpen && !employeeToEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl w-120 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create New Staff</h2>
            <form onSubmit={handleEmployeeCreation} className="space-y-4">
              <input 
                placeholder="Username" 
                className="w-full p-2 border rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={e => setNewStaff({...newStaff, username: e.target.value})}
                required
              />
              <input 
                placeholder="Email" type="email"
                className="w-full p-2 border rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                required
              />
              <select 
                className="w-full p-2 border rounded bg-white"
                onChange={e => setNewStaff({...newStaff, role: e.target.value})}
              >
                <option value="Cashier">Cashier</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
              <input 
                placeholder="Initial Password" type="password"
                className="w-full p-2 border rounded border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={e => setNewStaff({...newStaff, password: e.target.value})}
                required
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="cursor-pointer flex-1 py-2 bg-slate-200 rounded-md">Cancel</button>
                <button type="submit" className="cursor-pointer flex-1 py-2 bg-blue-600 text-white rounded-md cursor-pointer">Save Staff</button>
              </div>
            </form>
          </div>
        </div>       
      )}
      {modalOpen && employeeToEdit && (
        <EmployeeEditModal employee={employeeToEdit} closeModal={()=>{setModalOpen(false), setEmployeeToEdit(null)}} 
        updateEmployeeDisplay={updateEmployeeCard} displayError={(arg: string) => setErrorModal({opened: true, content: arg})}/>
        )}
      {errorModal.opened && <ErrorModal error={errorModal.content} closeModal={()=>setErrorModal({content: '', opened: false})}/>}
    </div>
  );
};


