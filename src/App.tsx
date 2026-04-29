/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toBrailleString, textToBrailleCodes, getBrailleLineLength, getUnsupportedCharacters } from './lib/braille';
import { Type, Info, Trash2, ArrowRight, Printer, Copy, Check, LayoutGrid, Type as TypeIcon, AlertCircle, Sparkles } from 'lucide-react';

type DisplayMode = 'grid' | 'unicode';

interface BrailleCellProps {
  code: number;
}

const BrailleCell: React.FC<BrailleCellProps> = ({ code }) => {
  if (code === -1) {
    return (
      <div className="w-7 h-11 bg-gray-800 rounded flex-shrink-0 shadow-inner" />
    );
  }

  // dots mapping to standard 2x3 grid
  // 1 4
  // 2 5
  // 3 6
  const dots = [0x01, 0x08, 0x02, 0x10, 0x04, 0x20];

  return (
    <div className="w-7 h-11 border border-gray-100 rounded-md bg-white p-1.5 grid grid-cols-2 gap-1 group-hover:border-blue-200 transition-colors shadow-sm flex-shrink-0">
      {dots.map((dot, index) => (
        <div
          key={index}
          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            code & dot ? 'bg-blue-600 scale-110 shadow-[0_0_4px_rgba(37,99,235,0.4)]' : 'bg-gray-100 opacity-40'
          }`}
        />
      ))}
    </div>
  );
};

export default function App() {
  const [input, setInput] = useState('BONJOUR;\nCA VA ?');
  const [copiedType, setCopiedType] = useState<'normal' | 'mirrored' | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [cursorPos, setCursorPos] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [unsupportedChars, setUnsupportedChars] = useState<string[]>([]);

  const normalCodes = useMemo(() => textToBrailleCodes(input, false), [input]);
  const mirroredCodes = useMemo(() => textToBrailleCodes(input, true), [input]);

  const normalBraille = useMemo(() => toBrailleString(input, false, ' '), [input]);
  const mirroredBraille = useMemo(() => toBrailleString(input, true, ' '), [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    setStatus('idle'); // Reset status on change
    setCursorPos(e.target.selectionStart);
  };

  const handleTranslate = () => {
    const chars = getUnsupportedCharacters(input);
    setUnsupportedChars(chars);
    if (chars.length === 0) {
      setStatus('success');
    } else {
      setStatus('error');
    }
  };

  const handleCursorUpdate = (e: React.MouseEvent | React.KeyboardEvent) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPos(target.selectionStart);
  };

  const currentLineLength = useMemo(() => {
    const linesBeforeCursor = input.substring(0, cursorPos).split('\n');
    const currentLineIdx = linesBeforeCursor.length - 1;
    const lines = input.split('\n');
    const currentLine = lines[currentLineIdx] || '';
    return getBrailleLineLength(currentLine);
  }, [input, cursorPos]);

  const isCurrentLineFull = useMemo(() => {
    return currentLineLength >= 28;
  }, [currentLineLength]);

  const copyToClipboard = async (text: string, type: 'normal' | 'mirrored') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-[1280px] mx-auto bg-white shadow-2xl border-x border-gray-200 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-8 py-5 bg-white border-b border-gray-100 flex-shrink-0 overflow-x-auto">
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0">
            <div className="grid grid-cols-2 gap-1.5 focus:outline-none">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white opacity-25 rounded-full shadow-inner"></div>
              <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white opacity-25 rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-none mb-1">L'ATELIER BRAILLE</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">Lab Edition • Hispanic Braille</p>
          </div>
        </div>
        <div className="flex gap-4 items-center flex-shrink-0 ml-4">
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                displayMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">GRID VIEW</span>
            </button>
            <button
              onClick={() => setDisplayMode('unicode')}
              className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                displayMode === 'unicode' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TypeIcon size={16} />
              <span className="hidden sm:inline">UNICODE</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-slate-bg p-4 md:p-8 space-y-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Input & Settings Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Input Section */}
            <section className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="text-input" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  Source Text
                  <span className="text-[10px] lowercase font-medium text-gray-300">(Limit: 28 Cells)</span>
                </label>
                <button 
                  onClick={() => setInput('')}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="relative group">
                <textarea
                  id="text-input"
                  value={input}
                  onChange={handleInputChange}
                  onKeyUp={handleCursorUpdate}
                  onClick={handleCursorUpdate}
                  placeholder="Type or paste here..."
                  className="w-full h-40 md:h-64 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none font-medium text-gray-700 leading-relaxed text-sm transition-all"
                />
                <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
                  <AnimatePresence>
                    {isCurrentLineFull && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 flex items-center gap-1.5 shadow-sm"
                      >
                        <AlertCircle size={12} />
                        LINE FULL • PRESS ENTER FOR NEXT LINE
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center gap-2 px-2 py-1 bg-white/80 rounded-md border border-gray-100 text-[10px] font-bold text-gray-400">
                    <span className={currentLineLength >= 28 ? 'text-red-500' : ''}>
                      {currentLineLength} / 28 CELLS
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={handleTranslate}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-100 group"
                >
                  <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                  TRANSLATE
                </button>

                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2 text-[11px] font-bold text-green-600 px-4 py-2 bg-green-50 border border-green-100 rounded-xl"
                    >
                      <Check size={14} />
                      CONTENT VERIFIED: EVERYTHING TRANSLATED
                    </motion.div>
                  )}
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2 text-[11px] font-bold text-amber-600 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl"
                    >
                      <AlertCircle size={14} />
                      UNSUPPORTED: {unsupportedChars.map(c => `'${c}'`).join(', ')}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Sidebar-style Controls */}
            <div className="space-y-6">
              <section className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                  Hispanic Braille Grade 1. Spaces are represented by empty tactile cells.
                </p>
              </section>
            </div>
          </div>

          {/* Translation Output Stage */}
          <div className="grid grid-cols-1 gap-8">
            {/* Standard Display */}
            <motion.div 
              layout
              className="char-card p-6 md:p-8 rounded-r-3xl shadow-sm border border-gray-100 group relative bg-white overflow-hidden"
            >
              <header className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-sm font-bold text-blue-600 tracking-widest uppercase">Standard View (Direct)</h2>
                  <p className="text-[10px] text-gray-400 font-medium tracking-tight">Left-to-Right • Tactile layout</p>
                </div>
                <button 
                  onClick={() => copyToClipboard(normalBraille, 'normal')}
                  className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
                >
                  {copiedType === 'normal' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedType === 'normal' ? 'COPIED' : 'COPY'}
                </button>
              </header>
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={displayMode + input}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200"
                >
                  {displayMode === 'unicode' ? (
                    <div className="space-y-4">
                      {normalBraille ? (
                        normalBraille.split('\n').map((line, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="text-[9px] font-bold text-gray-300 tracking-tight">
                              {input.split('\n')[idx] || '\u00A0'}
                            </div>
                            <div className="braille-display whitespace-nowrap">
                              {line}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="opacity-10 italic text-sm font-sans tracking-normal">Type above...</span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {normalCodes.map((line: number[], lIdx: number) => (
                        <div key={lIdx} className="space-y-2">
                          <div className="text-[9px] font-bold text-gray-400 opacity-60 tracking-tight">
                            {input.split('\n')[lIdx] || '\u00A0'}
                          </div>
                          <div className="flex flex-nowrap gap-1.5 items-start">
                            {line.map((code: number, cIdx: number) => (
                              <BrailleCell key={`${lIdx}-${cIdx}`} code={code} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Mirrored Display */}
            <motion.div 
              layout
              className="char-card p-6 md:p-8 rounded-r-3xl shadow-sm border border-gray-100 group relative !border-l-red-500 bg-white overflow-hidden"
            >
              <header className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-sm font-bold text-red-500 tracking-widest uppercase">Mirror Mode (Slate)</h2>
                  <p className="text-[10px] text-gray-400 font-medium tracking-tight">Reversed Order & Flipped Columns for Back-punching</p>
                </div>
                <button 
                  onClick={() => copyToClipboard(mirroredBraille, 'mirrored')}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
                >
                  {copiedType === 'mirrored' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedType === 'mirrored' ? 'COPIED' : 'COPY'}
                </button>
              </header>

              <AnimatePresence mode="wait">
                <motion.div 
                   key={displayMode + input + '-mirrored'}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200"
                >
                  {displayMode === 'unicode' ? (
                    <div className="space-y-4 flex flex-col items-end">
                      {mirroredBraille ? (
                        mirroredBraille.split('\n').map((line, idx) => (
                          <div key={idx} className="space-y-1 flex flex-col items-end">
                            <div className="text-[9px] font-bold text-gray-300 tracking-tight">
                              {input.split('\n')[idx] || '\u00A0'}
                            </div>
                            <div className="braille-display whitespace-nowrap text-right">
                              {line}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="opacity-10 italic text-sm font-sans tracking-normal text-right">Type to begin...</span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 flex flex-col items-end min-w-full">
                      {mirroredCodes.map((line: number[], lIdx: number) => (
                        <div key={lIdx} className="space-y-2 flex flex-col items-end">
                          <div className="text-[9px] font-bold text-gray-400 opacity-60 tracking-tight">
                            {input.split('\n')[lIdx] || '\u00A0'}
                          </div>
                          <div className="flex flex-nowrap gap-1.5 items-start justify-end">
                            {line.map((code: number, cIdx: number) => (
                              <BrailleCell key={`${lIdx}-${cIdx}-mirrored`} code={code} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Metrics Footer */}
          <footer className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-200 gap-4">
            <div className="flex gap-8 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              <div>CHARS: <span className="text-gray-900">{input.length}</span></div>
              <div>LINES: <span className="text-gray-900">{input.split('\n').length}</span></div>
              <div>SLATE CAP: <span className="text-gray-900">28/LINE</span></div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

