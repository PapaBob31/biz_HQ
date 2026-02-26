import React, { useState, useEffect, useRef, useContext } from "react";
import * as XLSX from 'xlsx';
import { Info, X, Trash2, Save, AlertCircle, Plus } from "lucide-react";
import { AxiosHttpRequest } from '../../App';

function validate(data: any) {
  const validKeys = ["category", "costprice", "name", "price", "sku", "stockcount"]
  const dataAttributes = Object.keys(data);
  let missingKeysText = ""

  for (const key of validKeys) {
    if (!dataAttributes.includes(key)) {
      if (missingKeysText)
        missingKeysText += ', '
      missingKeysText += key
    }
  }
  if (missingKeysText)
    return `Invalid Excel Data. Header row missing the following columns: ${missingKeysText}`
  return "";
}


function addId(objs: any[]) {
  let startingId = 1;
  for (const obj of objs) {
    obj.id = startingId;
    startingId += 1;
  }
  return startingId;
}

type excelImportHookReturnType = [
  (file: File|null)=>void,
  null|{name: string, data: any, error: string, nextItemId: number}[],
  (sheetName: string) => void,
  (sheetName: string, newSheetData: any) => void
]

function useExcelData(): excelImportHookReturnType {
  const [data, setData] = useState<null|{name: string, data: any, error: string, nextItemId: number}[]>(null)
  const [selectedFile, setSelectedFile] = useState<File|null>(null);

  useEffect(() => {
    if (selectedFile) {
      setData(null)
      var reader = new FileReader();

      reader.onload = function(e) {
        var workbook = XLSX.read(e.target!.result);
        const sheetsData: {name: string, data: any, error: string, nextItemId: number}[] = []
        for (const sheetName of  workbook.SheetNames) {
          const sheetJSONData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
          const dataError = validate(sheetJSONData[0])
          if (dataError) {
            sheetsData.push({name: sheetName, data: null, error: dataError, nextItemId: 0});
            continue;
          }
          const nextItemId = addId(sheetJSONData);
          sheetsData.push({name: sheetName, data: sheetJSONData, error: "", nextItemId});
        }
        setData(sheetsData)
      };
      reader.readAsArrayBuffer(selectedFile) // -> ArrayBuffer
    }
  }, [selectedFile])


  function removeSheet(sheetName: string) {
    if (data)
      setData(data.filter(sheet => sheet.name !== sheetName))
  }

  function updateSheet(sheetName: string, newSheetData: any) {
    if (data) {
      const newData = [...data]
      for (const sheet of newData) {
        if (sheet.name  === sheetName) {
          sheet.data = newSheetData;
          break;
        }
      }
      setData(newData)
    }
  }

  return [setSelectedFile, data, removeSheet, updateSheet]
}


function SpinnerOverlay() {
  return (
    <div className="absolute w-full h-full top-0 left-0 flex items-center justify-center bg-white/60">
      <div className="border-4 border-gray-900 w-10 h-10 border-b-gray-400 rounded-full animate-spin"></div>
    </div>
  )
}


function InfoText({closePopup}:{closePopup: ()=>void}) {
  return (
    <p className="p-2 shadow-xl rounded-xl shadow-gray-200 w-120 z-80 absolute left-[20%] top-12 bg-white">
      <button className="cursor-pointer absolute top-2 right-2" onClick={()=>closePopup()}><X size={18}/></button>
      Selected file must be in a valid excel format. The first non empty row of a 
      valid excel file will be used as it's header. For each column in this header row,
      there must be one column each whose value is exactly one of the following: 
      <span className="text-green-800"> name</span>, <span className="text-green-800"> category</span>, 
      <span className="text-green-800"> costprice</span>, <span className="text-green-800"> price</span>, 
      <span className="text-green-800">sku</span>, <span className="text-green-800">stockcount</span>
    </p>
  )
}


export default function ExcelImportSection({ hideSection, updateUI } : { hideSection: ()=>void, updateUI: ()=>void }) {
  const [infoVisible, setInfoVisible] = useState(false)
  const fileInput = useRef<HTMLInputElement|null>(null);
  const [setSelectedFile, processedData, removeSheet, updateSheet] = useExcelData();
  const [fileProcessing, setFileProcessing] = useState(false);
  const [productsUploading, setProductsUploading]= useState(false);
  const api = useContext(AxiosHttpRequest)!
  const [errors, setErrors] = useState<string[]>([])

  function uploadBulkInventoryData() {
    if (!processedData) 
      return;

    let payload: any[] = []
    for (const sheet of processedData) {
      for (const rowData of sheet.data) {
        if (!rowData.name.trim()) {
          setErrors(["Error. Found at least one empty 'name' field. 'name' fields must not be empty"])
          return;
        }
        payload.push({
          sku: rowData.sku.trim() ? rowData.sku : null, 
          name: rowData.name, 
          category: rowData.category.trim() ? rowData.category : null, 
          price: rowData.price ? rowData.price : 0, 
          costPrice: rowData.costprice ? rowData.costprice : 0, 
          stockCount: rowData.stockcount ? rowData.stockcount : 0,
          deleted: false
        })
      }
    }
    setProductsUploading(true);
    api.post('/api/inventory/bulk', payload)
    .then(() => {
      updateUI()
    })
    .catch(err => {
      console.log(err)
      if (err.response.status === 400) {
        setErrors(err.response.data)
      }else {
        setErrors(["Something went wrong while creating Inventory data. Please make sure all neccessary fields are filled."])
        setProductsUploading(false);
      }
    })
    .then(() => setProductsUploading(false))
  }

  useEffect(()=>{
    if (processedData && fileProcessing)
      setFileProcessing(false)
  }, [processedData])

  function processFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      setFileProcessing(true)
      setSelectedFile(event.target.files[0])
    }
  }

  return (
    <section>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
        <div className={`bg-white rounded-2xl w-[60%] max-h-150 min-h-80 shadow-2xl overflow-hidden animate-in 
          zoom-in-95 duration-200 relative ${productsUploading ? "overflow-y-hidden" : "overflow-y-auto"}`}>
          <div className="sticky top-0 w-full pt-6 pb-1 bg-gray-100 px-12 border-b border-gray-300">
            <h1 className="mb-4 text-lg font-semibold text-gray-700">
              Import an excel File 
              <button className="cursor-pointer" onClick={()=>setInfoVisible(true)}><Info size={18}/></button>
            </h1>
            {infoVisible && <InfoText closePopup={()=>setInfoVisible(false)}/>}
            <button onClick={hideSection} className="p-2 hover:bg-slate-200 rounded-full cursor-pointer absolute top-2 right-2 text-gray-700"><X size={18}/></button>
          </div>
          {!processedData && (
            <div className="rounded-xl border-2 border-gray-200 border-dashed p-8 relative z-20 mx-12 mt-4">
              {fileProcessing && <SpinnerOverlay/>}
              <img src="/excel.svg" className="block mb-4 mx-auto w-20"/>
              <p className="text-center font-semibold"><button className="underline cursor-pointer" onClick={()=>fileInput.current?.click()}>Choose a File</button></p>
              <input ref={fileInput} 
                className="hidden"
                type="file" 
                onChange={processFile}
                accept=".xls, .xlsx, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"/>
            </div>
          )}
          {processedData && <>
            {productsUploading && <SpinnerOverlay/>}
            <div className="px-12">{processedData.map(sheet => <SpreadsheetDisplay key={sheet.name} sheet={sheet} removeSheet={removeSheet} updateSheet={updateSheet}/>)}</div>
            <div className="flex justify-end sticky left-0 bottom-0 z-10 w-full block px-12 py-2">
              {!processedData && <button onClick={()=>uploadBulkInventoryData()} disabled={productsUploading}
                className="p-2 bg-blue-600 disabled:bg-blue-200 rounded-lg text-white flex items-center justify-center gap-2 shadow-md shadow-gray-200 cursor-pointer">
                <Save size={18}/> Import Products
              </button>}
            </div>
          </>}
          {errors.length > 0 && <ul className="absolute top-20 h-20 w-200 left-10">
            {errors.map(error => (
              <li onClick={()=>setErrors([])} className="cursor-pointer flex border-1 border-red-300 bg-red-100 text-red-400 mb-2 py-2 px-4 rounded-lg items-center w-fit mx-auto">
                <span className="block mr-4">{error}</span>
                <AlertCircle size={18}/>
              </li>
            ))}
          </ul>}
        </div>
      </div>
    </section>
  )
}

interface SpreadsheetDisplayProp {
  sheet: {name: string, data: any[], error: string, nextItemId: number},
  removeSheet: (sheetName: string) => void,
  updateSheet: (sheetName: string, data: any[]) => void
}

export function SpreadsheetDisplay({sheet, removeSheet, updateSheet} : SpreadsheetDisplayProp) {
  const mextItemId = useRef(sheet.nextItemId);
  function updateField(fieldName: string, id: number, newValue: string) {
    const rowToUpdate = sheet.data.find((row: any) => row.id == id)
    if (!rowToUpdate)
      return;
    if (rowToUpdate && ["price", "costprice", "stockcount"].includes(fieldName)) {
      rowToUpdate[fieldName] = parseInt(newValue);
    }else if (rowToUpdate) {
      rowToUpdate[fieldName] = newValue
    }
    updateSheet(sheet.name, sheet.data);
  }

  function removeRow(id: number) {
    const newData = sheet.data.filter((row) => id !== row.id)
    updateSheet(sheet.name, newData);
  }

  function addRow() {
    sheet.data.push({sku: "", name: "", category: "", price: 0, costprice: 0, stockcount: 0, id: mextItemId.current});
    mextItemId.current++;
    updateSheet(sheet.name, sheet.data);
  }

  if (sheet.error) {
    return (
      <section>
        <div className="flex justify-between border-b border-gray-400 mb-4 pb-1">
          <h2 className="font-semibold text-lg"><span>{sheet.name}</span></h2>
          <button className="cursor-pointer"><X size={20}/></button>
        </div>
        <p className="p-2 bg-red-200 text-red-500">{sheet.error}</p>
      </section>
    )
  }
  return (
    <section className="mt-4 mb-2 p-1">
      <div className="flex justify-between border-b border-gray-400 mb-4 pb-1">
        <h2 className="font-semibold text-lg"><span>{sheet.name}</span></h2>
        <button className="cursor-pointer" onClick={() => removeSheet(sheet.name)}><X size={20}/></button>
      </div>
      <table className="text-left rounded-lg border border-gray-500 border-collapse table-fixed">
        <thead className="bg-gray-200 border border-gray-500">
          <tr>
            <th className="border border-gray-500 px-4 py-2 font-semibold text-slate-800">SKU</th>
            <th className="border border-gray-500 px-4 py-2 font-semibold text-slate-800">Product</th>
            <th className="border border-gray-500 px-4 py-2 font-semibold text-slate-800">Category</th>
            <th className="border border-gray-500 px-4 py-2 font-semibold text-slate-800">Price</th>
            <th className="border border-gray-500 px-4 py-2 font-semibold text-slate-800">Cost Price</th>
            <th className="border border-gray-500 px-4 py-2 font-semibold text-slate-800">Stock Count</th>
            <th className="border border-gray-500 px-4 py-2 font-semibold text-slate-800 w-2"></th>
          </tr>
        </thead>
        <tbody className="bg-white border border-gray-500">
          {sheet.data.map((rowData: any) => (
            <tr key={rowData.id}>
              <td className="has-[:focus]:outline-blue-600 outline-2 outline-transparent border border-gray-300">
                <input className="w-full focus:outline-none px-2" onChange={(e)=>updateField("sku", rowData.id, e.target.value)}
                 value={rowData.sku} type="text"/>
              </td>
              <td className="has-[:focus]:outline-blue-600 outline-2 outline-transparent border border-gray-300">
                <input className="w-full focus:outline-none px-2" onChange={(e)=>updateField("name", rowData.id, e.target.value)}
                 value={rowData.name} type="text"/>
              </td>
              <td className="has-[:focus]:outline-blue-600 outline-2 outline-transparent border border-gray-300">
                <input className="w-full focus:outline-none px-2" onChange={(e)=>updateField("category", rowData.id, e.target.value)}
                 value={rowData.category} type="text"/>
              </td>
              <td className="has-[:focus]:outline-blue-600 outline-2 outline-transparent border border-gray-300">
                <input className="w-full focus:outline-none px-2" onChange={(e)=>updateField("price", rowData.id, e.target.value)}
                 value={rowData.price} type="number"/>
              </td>
              <td className="has-[:focus]:outline-blue-600 outline-2 outline-transparent border border-gray-300">
                <input className="w-full focus:outline-none px-2" onChange={(e)=>updateField("costprice", rowData.id, e.target.value)}
                 value={rowData.costprice} type="number"/>
              </td>
              <td className="has-[:focus]:outline-blue-600 outline-2 outline-transparent border border-gray-300">
                <input className="w-full focus:outline-none px-2" onChange={(e)=>updateField("stockcount", rowData.id, e.target.value)}
                 value={rowData.stockcount} type="number"/>
              </td>
              <td className="border border-gray-300">
                <button className="p-2 text-slate-400 hover:text-red-600 cursor-pointer" onClick={() => removeRow(rowData.id)}><Trash2 size={18} /></button>
              </td>
            </tr>
          ))}
        </tbody>
    </table>
    <button onClick={()=>addRow()} 
      className="p-2 hover:bg-blue-200 bg-blue-50 rounded-lg text-blue-700 flex items-center justify-center gap-2 mt-2 border border-blue-100 cursor-pointer">
      <Plus size={18}/> Add Product
    </button>
  </section>
  )
}