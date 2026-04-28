import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileSpreadsheet, 
  Upload, 
  Settings2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ArrowRight,
  RefreshCw,
  Banknote,
  FileText
} from 'lucide-react';
import { TARGET_FORMATS } from './constants';
import { TargetFormat, Mapping, BatchConfig, FormatId } from './types';
import { parseExcel, autoMapFields, generateCSV } from './utils/converter';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<{ [sheetName: string]: any[][] } | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [targetFormatId, setTargetFormatId] = useState<FormatId>('fnb_standard');
  const [mapping, setMapping] = useState<Mapping>({});
  const [batchConfig, setBatchConfig] = useState<BatchConfig>({
    fromAccountNumber: '',
    batchReference: '',
    executionDate: new Date().toLocaleDateString('en-GB')
  });
  const [preview, setPreview] = useState<string>('');
  const [dragging, setDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentFormat = TARGET_FORMATS.find(f => f.id === targetFormatId) as TargetFormat;

  // Handle file drop/upload
  const handleFileUpload = async (uploadedFile: File) => {
    if (!uploadedFile.name.match(/\.(xlsx|xls)$/i)) {
      alert("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }
    setFile(uploadedFile);
    try {
      const parsed = await parseExcel(uploadedFile);
      setData(parsed);
      const firstSheet = Object.keys(parsed)[0];
      setSelectedSheet(firstSheet);
    } catch (err) {
      console.error(err);
      alert("Failed to parse Excel file");
    }
  };

  // Auto-map when sheet or format changes
  useEffect(() => {
    if (data && selectedSheet && currentFormat) {
      const headers = data[selectedSheet][0] || [];
      const newMapping = autoMapFields(headers.map(h => String(h)), currentFormat.fields);
      setMapping(newMapping);
    }
  }, [selectedSheet, targetFormatId, data]);

  // Update preview
  useEffect(() => {
    if (data && selectedSheet && mapping) {
      const csv = generateCSV(currentFormat, data[selectedSheet], mapping, batchConfig);
      setPreview(csv);
    }
  }, [data, selectedSheet, mapping, batchConfig, targetFormatId]);

  const handleDownload = () => {
    const blob = new Blob([preview], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `converted_${targetFormatId}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setData(null);
    setPreview('');
    setMapping({});
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="text-blue-600" size={32} />
              Payroll Converter
            </h1>
            <p className="text-zinc-500 mt-1">Convert your bank payments and BCCEI spreadsheets in seconds.</p>
          </div>
          {file && (
            <button 
              onClick={reset}
              className="text-sm font-medium text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition-colors"
            >
              <RefreshCw size={14} />
              Start Over
            </button>
          )}
        </header>

        <main className="space-y-6">
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                  dragging 
                  ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
                  : 'border-zinc-200 bg-white hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".xlsx,.xls" 
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <div className={`p-4 rounded-full transition-transform duration-300 group-hover:scale-110 ${dragging ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100 text-zinc-400 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                  <Upload size={32} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-zinc-900 leading-none">Drop your spreadsheet here</h3>
                <p className="mt-2 text-zinc-400">or click to browse from your computer (.xlsx, .xls)</p>
                <div className="mt-8 flex gap-4 text-xs font-medium text-zinc-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Bank Ready</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} /> BCCEI Compliant</span>
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Fully Secure</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Left Panel: Settings */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-bottom border-zinc-100 bg-zinc-50 flex items-center gap-2">
                      <Settings2 size={18} className="text-zinc-600" />
                      <span className="font-semibold text-sm uppercase tracking-wider text-zinc-600">Export Settings</span>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* Sheet Selector */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Source Sheet</label>
                        <select 
                          value={selectedSheet}
                          onChange={(e) => setSelectedSheet(e.target.value)}
                          className="w-full bg-zinc-100 border border-zinc-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        >
                          {Object.keys(data || {}).map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Format Selector */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Target Format</label>
                        <div className="space-y-2">
                          {TARGET_FORMATS.map(f => (
                            <button
                              key={f.id}
                              onClick={() => setTargetFormatId(f.id)}
                              className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 group flex items-start gap-3 ${
                                targetFormatId === f.id 
                                ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500' 
                                : 'border-zinc-200 hover:border-zinc-300'
                              }`}
                            >
                              <div className={`p-2 rounded-lg mt-0.5 ${targetFormatId === f.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200 transition-colors'}`}>
                                {f.id === 'bccei' ? <FileText size={18} /> : <Banknote size={18} />}
                              </div>
                              <div>
                                <div className="font-bold text-sm text-zinc-900 leading-tight">{f.name}</div>
                                <div className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wide">{f.delimiter === '|' ? 'Pipe Delimited' : 'Standard CSV'}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Batch Config (Conditional) */}
                      {(currentFormat.hasCustomHeader || targetFormatId === 'fnb_standard') && (
                        <div className="pt-4 border-t border-zinc-100 space-y-4">
                          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Batch Details</h4>
                          {targetFormatId === 'bidvest' && (
                            <div>
                              <label className="block text-[11px] text-zinc-500 mb-1 ml-1">From Account</label>
                              <input 
                                type="text"
                                value={batchConfig.fromAccountNumber}
                                onChange={e => setBatchConfig({ ...batchConfig, fromAccountNumber: e.target.value })}
                                placeholder="e.g. 1234567890"
                                className="w-full bg-white border border-zinc-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          )}
                          <div>
                            <label className="block text-[11px] text-zinc-500 mb-1 ml-1">Reference</label>
                            <input 
                              type="text"
                              value={batchConfig.batchReference}
                              onChange={e => setBatchConfig({ ...batchConfig, batchReference: e.target.value })}
                              placeholder="e.g. SALARIES APR 2026"
                              className="w-full bg-white border border-zinc-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-zinc-500 mb-1 ml-1">Execution Date</label>
                            <input 
                              type="text"
                              value={batchConfig.executionDate}
                              onChange={e => setBatchConfig({ ...batchConfig, executionDate: e.target.value })}
                              placeholder="DD/MM/YYYY"
                              className="w-full bg-white border border-zinc-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={handleDownload}
                    className="w-full bg-zinc-900 text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 group active:scale-[0.98]"
                  >
                    <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                    Download CSV
                  </button>
                </div>

                {/* Right Panel: Mapping & Preview */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Field Mapping */}
                  <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-bottom border-zinc-100 bg-zinc-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowRight size={18} className="text-zinc-600" />
                        <span className="font-semibold text-sm uppercase tracking-wider text-zinc-600">Field Mapping</span>
                      </div>
                      <span className="text-[10px] text-blue-600 font-bold px-2 py-0.5 bg-blue-50 rounded-full">AUTOMAPPED</span>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50/50 border-b border-zinc-100">
                            <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Required Field</th>
                            <th className="px-6 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Excel Column</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                          {currentFormat.fields.map(field => (
                            <tr key={field.key} className="hover:bg-zinc-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {mapping[field.key] ? (
                                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                  ) : field.required ? (
                                    <AlertCircle size={14} className="text-amber-500 shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-200" />
                                  )}
                                  <span className={`text-sm font-medium ${mapping[field.key] ? 'text-zinc-900' : 'text-zinc-400 italic'}`}>
                                    {field.label}
                                    {field.required && <span className="text-amber-500 ml-0.5">*</span>}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <select 
                                  value={mapping[field.key] || ''}
                                  onChange={e => setMapping({ ...mapping, [field.key]: e.target.value })}
                                  className={`w-full text-xs font-mono py-1.5 px-2 rounded-md border transition-all ${
                                    mapping[field.key] 
                                    ? 'bg-emerald-50/30 border-emerald-100 text-emerald-900' 
                                    : 'bg-zinc-100 border-zinc-200 text-zinc-500'
                                  }`}
                                >
                                  <option value="">-- No Mapping --</option>
                                  {data && data[selectedSheet][0]?.map(h => (
                                    <option key={String(h)} value={String(h)}>{String(h)}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CSV Preview */}
                  <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden min-h-[200px] flex flex-col">
                    <div className="p-4 border-bottom border-zinc-100 bg-zinc-50 flex items-center gap-2 shrink-0">
                      <ChevronRight size={18} className="text-zinc-600" />
                      <span className="font-semibold text-sm uppercase tracking-wider text-zinc-600">CSV Preview</span>
                      <span className="text-[10px] text-zinc-400 ml-auto">Showing first few lines</span>
                    </div>
                    <div className="p-4 flex-1 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre bg-zinc-900 text-zinc-400 select-all">
                      {preview.split('\n').slice(0, 15).join('\n') || (
                        <div className="h-full flex items-center justify-center italic opacity-50">
                          Mapping required to generate preview...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
}

