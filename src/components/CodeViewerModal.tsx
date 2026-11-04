import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  FileCode,
  Download,
  Copy,
  Check,
  X,
  FolderGit2,
  Terminal,
  Settings,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { PYTHON_PROJECT_FILES, ProjectFile } from '../data/projectFiles';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(PYTHON_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all project files to zip
      PYTHON_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'daily-playwright-qa-scraper.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error creating zip:', e);
    } finally {
      setIsZipping(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.py')) return <FileCode className="w-4 h-4 text-emerald-400" />;
    if (fileName.endsWith('.yml')) return <FolderGit2 className="w-4 h-4 text-cyan-400" />;
    if (fileName.endsWith('.json') || fileName.includes('env'))
      return <Settings className="w-4 h-4 text-amber-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Python Project Source Hub
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                  11 Production Files
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Ready to run locally in VS Code or deploy to GitHub Actions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition"
              title="Download entire project packaged as .zip"
            >
              <Download className={`w-3.5 h-3.5 ${isZipping ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">
                {isZipping ? 'Generating Zip...' : 'Download Project (.zip)'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left File Explorer */}
          <div className="w-full md:w-72 bg-slate-950/60 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
            <div className="p-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
              Project Explorer
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {PYTHON_PROJECT_FILES.map((file) => {
                const isSelected = selectedFile.path === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition ${
                      isSelected
                        ? 'bg-slate-800 text-white font-medium shadow-sm border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {getFileIcon(file.name)}
                    <div className="truncate flex-1">
                      <div className="truncate font-mono">{file.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{file.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Code Display */}
          <div className="flex-1 flex flex-col bg-slate-950/90 overflow-hidden">
            <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-semibold">{selectedFile.path}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 text-[11px]">{selectedFile.description}</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed select-text">
              <pre className="whitespace-pre">{selectedFile.content}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
