import React, { useRef, useState, useEffect } from 'react';
import { supabase } from "../../lib/supabase";
import { useClient } from '../../contexts/ClientContext';
import { saveCatalogProducts } from '../../lib/catalog';

export function CSVBulkUpload() {
  const { activeBusiness } = useClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [fileName, setFileName] = useState<string | null>(null);
  const [itemCount, setItemCount] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<Array<Record<string, string>>>([]);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [viewFormat, setViewFormat] = useState<'table' | 'raw'>('table');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Filter rows by search term
  const filteredRows = parsedRows.filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some((val) => String(val).toLowerCase().includes(term));
  });

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const displayedRows = pageSize === -1 
    ? filteredRows 
    : filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Load saved CSV on mount
  useEffect(() => {
    try {
      const clientId = activeBusiness?.slug || 'ofrank';
      const savedText = localStorage.getItem(`app_saved_csv_text_${clientId}`) || localStorage.getItem('app_saved_csv_text');
      const savedTime = localStorage.getItem(`app_saved_csv_timestamp_${clientId}`) || localStorage.getItem('app_saved_csv_timestamp');
      if (savedText) {
        setPastedText(savedText);
        parseCsvData(savedText, 'Saved CSV Catalog', false);
        setIsSaved(true);
        if (savedTime) {
          setLastSavedTime(savedTime);
        }
      }
    } catch (e) {
      console.error('Error loading saved CSV:', e);
    }
  }, [activeBusiness]);

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const parseCsvData = (text: string, sourceName: string, markUnsaved: boolean = true) => {
    if (!text.trim()) {
      setParsedRows([]);
      setItemCount(null);
      setUploadStatus(null);
      if (markUnsaved) setIsSaved(false);
      return;
    }
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      setItemCount(0);
      setUploadStatus('No data found in text.');
      if (markUnsaved) setIsSaved(false);
      return;
    }

    // Attempt CSV line parsing
    const delimiter = text.includes('\t') ? '\t' : ',';
    const headerLine = lines[0];
    const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    const dataLines = lines.slice(1);
    const parsedData: Array<Record<string, string>> = [];

    dataLines.forEach((line) => {
      const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h || `Column ${idx + 1}`] = values[idx] || '';
      });
      parsedData.push(rowObj);
    });

    setParsedRows(parsedData);
    setFileName(sourceName);
    setItemCount(parsedData.length || lines.length);
    setUploadStatus(`Parsed ${parsedData.length || lines.length} items from ${sourceName}`);
    if (markUnsaved) {
      setIsSaved(false);
    }
  };

  const handlePastedTextChange = (text: string) => {
    setPastedText(text);
    if (text.trim()) {
      parseCsvData(text, 'Pasted Data', true);
    } else {
      setParsedRows([]);
      setItemCount(null);
      setUploadStatus(null);
      setIsSaved(false);
    }
  };

  const handleSaveToCatalog = async () => {
    if (!pastedText.trim() || parsedRows.length === 0) {
      alert('Please paste or upload valid CSV data before saving.');
      return;
    }
    
    setIsSaving(true);
    const clientId = activeBusiness?.slug || 'ofrank';

    try {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem(`app_saved_csv_text_${clientId}`, pastedText);
      localStorage.setItem('app_saved_csv_text', pastedText);
      localStorage.setItem(`app_saved_csv_timestamp_${clientId}`, nowTime);
      localStorage.setItem('app_saved_csv_timestamp', nowTime);

      const result = await saveCatalogProducts(parsedRows, clientId);

      setIsSaved(true);
      setLastSavedTime(result.timestamp);
      
      setUploadStatus(`🎉 Saved ${result.count} items to catalog for client "${clientId}"! Showroom updated!`);
      alert(`🎉 CSV catalog saved successfully! ${result.count} items are now live in the Showroom for client "${clientId}".`);
    } catch (e: any) {
      alert(`Error saving to catalog: ${e.message || e}`);
      setUploadStatus(`❌ Error saving to catalog: ${e.message || e}`);
    } finally {
      setIsSaving(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      alert('Please upload a valid .csv or .txt file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setPastedText(text);
      parseCsvData(text, file.name, true);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClipboardPaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handlePastedTextChange(text);
        } else {
          alert('Clipboard is empty or does not contain text.');
        }
      } else {
        alert('Clipboard access restricted by browser. Please long-press or right-click inside the text box to paste directly.');
      }
    } catch (err) {
      alert('To paste, tap or click inside the textarea below and press Ctrl+V / Cmd+V or use your device paste option.');
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear current text and saved CSV data?')) {
      const clientId = activeBusiness?.slug || 'ofrank';
      setPastedText('');
      setParsedRows([]);
      setItemCount(null);
      setUploadStatus(null);
      setFileName(null);
      setIsSaved(false);
      setLastSavedTime(null);
      localStorage.removeItem(`app_saved_csv_text_${clientId}`);
      localStorage.removeItem(`app_saved_csv_products_${clientId}`);
      localStorage.removeItem(`app_saved_csv_timestamp_${clientId}`);
      localStorage.removeItem('app_saved_csv_text');
      localStorage.removeItem('app_saved_csv_products');
      localStorage.removeItem('app_saved_csv_rows');
      localStorage.removeItem('app_saved_csv_timestamp');
      window.dispatchEvent(new CustomEvent('catalog_updated', { detail: { clientId } }));
    }
  };

  const exportSavedCsv = () => {
    if (!pastedText.trim()) {
      alert('No CSV content available to export.');
      return;
    }
    const blob = new Blob([pastedText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `catalog_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Product Name,Brand,Category,Price,Stock,RoomTag\n"
      + "43-inch Smart UHD TV,Samsung,Televisions,250000,10,arcade\n"
      + "Double Door Fridge 200L,Bruhm,Refrigerators,310000,5,display_floor\n"
      + "Inverter Air Conditioner 1.5HP,Daikin,Air Conditioners,420000,8,hot_deal\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "catalog_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-[0.75rem] uppercase tracking-wider text-[#8892a8] font-medium">CSV Data Import</h4>
            {isSaved ? (
              <span className="text-[10px] bg-[#0f3822] text-[#60e098] border border-[#1a5a36] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#60e098] animate-pulse"></span>
                SAVED IN APP {lastSavedTime ? `(${lastSavedTime})` : ''}
              </span>
            ) : (
              pastedText.trim() && (
                <span className="text-[10px] bg-[#3a280f] text-[#f0b060] border border-[#5a401a] px-2 py-0.5 rounded-full font-semibold">
                  ⚠️ UNSAVED CHANGES
                </span>
              )
            )}
          </div>
          <p className="text-xs text-[#5a6a7a] mt-0.5">Paste CSV text directly or upload a spreadsheet file</p>
        </div>
        
        <div className="flex bg-[#0e1520] p-1 rounded-lg border border-[#1a2634]">
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste' 
                ? 'bg-[#0f2a3b] text-[#7db8df] border border-[#1a3a4b]' 
                : 'text-[#8892a8] hover:text-white'
            }`}
          >
            <span>📋</span> Paste CSV Text
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload' 
                ? 'bg-[#0f2a3b] text-[#7db8df] border border-[#1a3a4b]' 
                : 'text-[#8892a8] hover:text-white'
            }`}
          >
            <span>📁</span> File Upload
          </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        accept=".csv,.txt" 
        onChange={handleFileChange} 
        className="hidden" 
      />

      <div className="space-y-4">
        {activeTab === 'paste' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClipboardPaste}
                  className="bg-[#1a2a3a] hover:bg-[#253a4e] text-[#7db8df] border border-[#2a3d52] py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>📋</span> Paste Clipboard
                </button>
                {parsedRows.length > 0 && (
                  <div className="flex bg-[#0e1520] p-0.5 rounded-lg border border-[#1a2634]">
                    <button
                      type="button"
                      onClick={() => setViewFormat('table')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        viewFormat === 'table' ? 'bg-[#1a3a5c] text-[#7db8df]' : 'text-[#8892a8]'
                      }`}
                    >
                      📊 Table View
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewFormat('raw')}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        viewFormat === 'raw' ? 'bg-[#1a3a5c] text-[#7db8df]' : 'text-[#8892a8]'
                      }`}
                    >
                      📝 Raw Text
                    </button>
                  </div>
                )}
              </div>
              {pastedText && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-[#8892a8] hover:text-[#df7d7d] px-2 py-1 transition-colors"
                >
                  Clear CSV
                </button>
              )}
            </div>

            {viewFormat === 'raw' || parsedRows.length === 0 ? (
              <div>
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => handlePastedTextChange(e.target.value)}
                  placeholder={"Paste your CSV text or copied spreadsheet rows here...\n\nExample:\nProduct Name,Brand,Category,Price,Stock,RoomTag\n43-inch Smart TV,Samsung,Televisions,250000,10,arcade\nDouble Door Fridge,Bruhm,Refrigerators,310000,5,display_floor"}
                  className="w-full bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-xl p-3.5 text-xs outline-none focus:border-[#7db8df] font-mono leading-relaxed placeholder:text-[#3a4a5a]"
                />
              </div>
            ) : null}

            {uploadStatus && (
              <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center justify-between border ${
                isSaved 
                  ? 'bg-[#0f2a1a] border-[#1a3a2a] text-[#7ddfb0]' 
                  : 'bg-[#2a220f] border-[#4a3a1a] text-[#ebd59b]'
              }`}>
                <span>{uploadStatus}</span>
                <span className="text-[10px] bg-[#1a2634] px-2 py-0.5 rounded text-[#a0c0e0] font-mono">
                  {parsedRows.length} items
                </span>
              </div>
            )}

            {parsedRows.length > 0 && (
              <div className="space-y-3">
                {/* Search & Table Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-[#5a6a7a]">🔍</span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search table by name, brand, tag, price..."
                      className="w-full bg-[#0a1018] border border-[#1a2634] rounded-lg pl-8 pr-3 py-2 text-xs text-[#e6edf5] outline-none focus:border-[#7db8df] placeholder:text-[#3a4a5a]"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6a7a8a] whitespace-nowrap">Show:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-[#0a1018] border border-[#1a2634] text-[#e6edf5] text-xs rounded-lg px-2 py-2 outline-none"
                    >
                      <option value={10}>10 rows</option>
                      <option value={25}>25 rows</option>
                      <option value={50}>50 rows</option>
                      <option value={100}>100 rows</option>
                      <option value={-1}>All rows ({filteredRows.length})</option>
                    </select>
                  </div>
                </div>

                {/* Spreadsheet Table Grid */}
                <div className="overflow-x-auto border border-[#1a2634] rounded-xl bg-[#0a1018] shadow-inner max-h-[480px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-[#e6edf5]">
                    <thead className="bg-[#121c28] text-[#8892a8] uppercase text-[10px] tracking-wider border-b border-[#1a2634] sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold w-12 text-center text-[#5a6a7a] border-r border-[#1a2634]">#</th>
                        {Object.keys(parsedRows[0] || {}).map((col, idx) => (
                          <th key={idx} className="px-3 py-2.5 font-semibold whitespace-nowrap border-r border-[#1a2634] last:border-r-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#16202c]">
                      {displayedRows.length === 0 ? (
                        <tr>
                          <td colSpan={Object.keys(parsedRows[0] || {}).length + 1} className="text-center py-8 text-[#6a7a8a]">
                            No matching items found for "{searchTerm}"
                          </td>
                        </tr>
                      ) : (
                        displayedRows.map((row, rIdx) => {
                          const globalIdx = pageSize === -1 
                            ? rIdx + 1 
                            : (currentPage - 1) * pageSize + rIdx + 1;
                          return (
                            <tr key={rIdx} className="hover:bg-[#111c28] transition-colors odd:bg-[#0c141f]">
                              <td className="px-3 py-2 text-center text-[#5a6a7a] font-mono border-r border-[#1a2634] text-[10px]">
                                {globalIdx}
                              </td>
                              {Object.values(row).map((val, cIdx) => (
                                <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-[#c5d0de] border-r border-[#16202c] last:border-r-0">
                                  {val || <span className="text-[#3a4a5a] italic">—</span>}
                                </td>
                              ))}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {pageSize !== -1 && totalPages > 1 && (
                  <div className="flex items-center justify-between pt-1 text-xs text-[#8892a8]">
                    <span>
                      Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredRows.length)} of {filteredRows.length} items
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1 bg-[#1a2634] hover:bg-[#243446] disabled:opacity-40 disabled:cursor-not-allowed text-[#e6edf5] rounded text-xs transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 bg-[#0a1018] text-[#7db8df] rounded text-xs border border-[#1a2634]">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="px-3 py-1 bg-[#1a2634] hover:bg-[#243446] disabled:opacity-40 disabled:cursor-not-allowed text-[#e6edf5] rounded text-xs transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Save and Export Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveToCatalog}
                    className="flex-1 bg-[#25855a] hover:bg-[#2f9e6d] text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
                  >
                    <span>💾</span> Save CSV & Update Catalog ({parsedRows.length} items)
                  </button>
                  <button
                    type="button"
                    onClick={exportSavedCsv}
                    className="bg-[#1a2634] hover:bg-[#243446] text-[#7db8df] border border-[#2a3848] font-semibold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>📥</span> Export CSV File
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={handleBoxClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-[#2a3a4a] bg-[#0e1520] rounded-xl p-8 text-center hover:border-[#7db8df] hover:bg-[#0f2a3b] transition-all cursor-pointer group select-none"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📄</div>
            <div className="text-sm font-medium text-[#e6edf5]">
              {fileName ? fileName : "Click or Drag CSV File Here"}
            </div>
            <div className="text-xs text-[#5a6a7a] mt-1">
              {itemCount !== null ? `${itemCount} products ready to import` : "Updates price list, categories, and inventory"}
            </div>
            {uploadStatus && (
              <div className="mt-3 p-2 bg-[#0f2a1a] border border-[#1a3a2a] text-[#7ddfb0] text-xs rounded-lg font-medium">
                {uploadStatus}
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-[#1a2634] space-y-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-[11px] text-[#6a7a8a] text-center sm:text-left">
              💡 <strong className="text-[#8892a8]">What is "Download CSV Template"?</strong> It provides a sample file showing the exact columns (Name, Brand, Price, Stock) needed for seamless catalog mapping.
            </div>
            <button 
              type="button"
              onClick={downloadTemplate}
              className="whitespace-nowrap bg-[#0f2a3b] hover:bg-[#1a3a5c] text-[#7db8df] border border-[#1a3a4b] py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>📄</span> Download Sample Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ThemeLogoEditor() {
  return (
    <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <h4 className="text-[0.75rem] uppercase tracking-wider text-[#8892a8] mb-4 font-medium">Theme & Logo Editor</h4>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Primary Color</label>
          <div className="flex items-center gap-3">
            <input type="color" defaultValue="#7db8df" className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
            <input type="text" defaultValue="#7db8df" className="flex-1 bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none" />
          </div>
        </div>
        <div>
          <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Business Logo</label>
          <div className="border border-[#1a2634] bg-[#0e1520] rounded-lg p-4 flex items-center justify-between">
            <div className="text-2xl">🏢</div>
            <button className="bg-[#1a2634] hover:bg-[#2a3644] text-[#e6edf5] px-3 py-1.5 rounded text-xs transition-colors">
              Change Logo
            </button>
          </div>
        </div>
        <button className="w-full bg-[#7db8df] text-[#0f2a3b] font-semibold py-2 rounded-lg mt-2 hover:bg-[#8ec3e6] transition-colors">
          Save Theme Settings
        </button>
      </div>
    </div>
  );
}

export function BrandManager() {
  return (
    <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <h4 className="text-[0.75rem] uppercase tracking-wider text-[#8892a8] mb-4 font-medium">Brand Manager</h4>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input type="text" placeholder="Add new brand..." className="flex-1 bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none" />
          <button className="bg-[#0f2a3b] text-[#7db8df] border border-[#1a3a4b] px-4 py-2 rounded-lg text-sm font-medium">Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Samsung', 'LG', 'Sony', 'Hisense', 'Polystar'].map(brand => (
            <div key={brand} className="bg-[#1a2634] text-[#e6edf5] px-3 py-1 rounded-full text-xs flex items-center gap-2">
              {brand}
              <button className="text-[#8892a8] hover:text-[#df7d7d]">×</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InvoiceDesignEditor() {
  return (
    <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <h4 className="text-[0.75rem] uppercase tracking-wider text-[#8892a8] mb-4 font-medium">Invoice Design Editor</h4>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Business Address</label>
          <textarea rows={2} className="w-full bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none" placeholder="123 Electronics Hub..."></textarea>
        </div>
        <div>
          <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Tax / VAT ID (Optional)</label>
          <input type="text" className="w-full bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none" placeholder="VAT-123456" />
        </div>
        <div>
          <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Bank Name</label>
          <input type="text" className="w-full bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none" placeholder="e.g. First Bank" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Account Name</label>
            <input type="text" className="w-full bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none" placeholder="e.g. Adane House Ltd" />
          </div>
          <div>
            <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Account Number</label>
            <input type="text" className="w-full bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none" placeholder="1234567890" />
          </div>
        </div>
        <div>
          <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Footer Notes / Terms</label>
          <textarea rows={2} className="w-full bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none" placeholder="Thank you for your business. Items are non-refundable after 7 days."></textarea>
        </div>
        <div className="flex items-center justify-between border-t border-[#1a2634] pt-4">
          <span className="text-sm text-[#e6edf5]">Show Logo on Invoice</span>
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-[#1a2634] bg-[#0e1520]" />
        </div>
        <button className="w-full bg-[#0f2a3b] text-[#7db8df] border border-[#1a3a4b] py-2 rounded-lg text-sm font-medium">
          Save Invoice Settings
        </button>
      </div>
    </div>
  );
}

export function WatermarkEditor() {
  const { activeBusiness } = useClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [url, setUrl] = useState<string>('');
  const [placement, setPlacement] = useState<string>('Bottom Right');
  const [opacity, setOpacity] = useState<number>(0.5);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeBusiness?.theme?.watermark) {
      setUrl(activeBusiness.theme.watermark.url || '');
      setPlacement(activeBusiness.theme.watermark.placement || 'Bottom Right');
      setOpacity(activeBusiness.theme.watermark.opacity || 0.5);
    }
  }, [activeBusiness]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!activeBusiness) return;
    setIsSaving(true);
    try {
      const updatedTheme = {
        ...(activeBusiness.theme || {}),
        watermark: {
          url,
          placement,
          opacity
        }
      };
      
      const { error } = await supabase
        .from('manifest_clients')
        .update({ theme: updatedTheme })
        .eq('slug', activeBusiness.slug);
        
      if (error) throw error;
      alert('Watermark settings saved to business theme!');
    } catch (e) {
      alert('Failed to save watermark settings: ' + (e.message || e));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      <h4 className="text-[0.75rem] uppercase tracking-wider text-[#8892a8] mb-4 font-medium">Watermark Configuration</h4>
      
      <div className="space-y-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#2a3a4a] bg-[#0e1520] rounded-xl p-8 text-center hover:border-[#7db8df] hover:bg-[#0f2a3b] transition-colors cursor-pointer relative overflow-hidden"
        >
          {url ? (
            <img src={url} alt="Watermark Preview" className="h-20 object-contain mx-auto" style={{ opacity }} />
          ) : (
            <>
              <div className="text-2xl mb-2">📸</div>
              <div className="text-sm font-medium text-[#e6edf5]">Upload Watermark Image</div>
              <div className="text-xs text-[#5a6a7a] mt-1">PNG with transparency recommended</div>
            </>
          )}
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleUpload} />

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Placement</label>
            <select 
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="w-full bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none cursor-pointer"
            >
              <option>Bottom Right</option>
              <option>Center</option>
              <option>Diagonal</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Opacity ({Math.round(opacity * 100)}%)</label>
            <input 
              type="range" 
              min="0" max="1" step="0.1" 
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full mt-2" 
            />
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-[#7db8df] text-[#0f2a3b] font-semibold py-2 rounded-lg mt-2 hover:bg-[#8ec3e6] transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Watermark'}
        </button>
      </div>
    </div>
  );
}
