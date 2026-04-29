/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toBrailleString, textToBrailleCodes, textToBrailleCells, getBrailleLineLength, getUnsupportedCharacters, BrailleCellData } from './lib/braille';
import { Type, Info, Trash2, ArrowRight, Printer, Copy, Check, LayoutGrid, Type as TypeIcon, AlertCircle, Sparkles, ArrowUp, Loader2, SquareSlash, Terminal } from 'lucide-react';

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
  const [input, setInput] = useState('Braille\nWP Translator');
  const [copiedType, setCopiedType] = useState<'normal' | 'mirrored' | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [cursorPos, setCursorPos] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [plasticSlateEnabled, setPlasticSlateEnabled] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const unsupportedChars = useMemo(() => getUnsupportedCharacters(input), [input]);

  // Effect to simulate "charging" or processing when typing
  React.useEffect(() => {
    if (input) {
      setIsTranslating(true);
      const timer = setTimeout(() => {
        setIsTranslating(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [input]);

  const normalCells = useMemo(() => textToBrailleCells(input, false), [input]);
  const mirroredCells = useMemo(() => textToBrailleCells(input, true), [input]);

  const normalBraille = useMemo(() => toBrailleString(input, false, ' '), [input]);
  const mirroredBraille = useMemo(() => toBrailleString(input, true, ' '), [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const oldVal = input;
    const selection = e.target.selectionStart;

    // Plastic Slate Logic
    if (plasticSlateEnabled && newValue.length > oldVal.length) {
      const charAdded = newValue[selection - 1];
      
      // Don't limit if deleting or adding newline
      if (charAdded !== '\n') {
        const linesBeforeCursor = newValue.substring(0, selection).split('\n');
        const currentLineText = linesBeforeCursor[linesBeforeCursor.length - 1];
        const lineLen = getBrailleLineLength(currentLineText);

        if (lineLen > 28) {
          // If the last character added made it exceed 28, insert newline before it
          // Or if it reached exactly 28, the next character should be on a new line
          const head = newValue.substring(0, selection - 1);
          const tail = newValue.substring(selection);
          setInput(head + '\n' + charAdded + tail);
          
          // Move cursor after the newly added character on the new line
          setTimeout(() => {
            const textarea = document.getElementById('text-input') as HTMLTextAreaElement;
            if (textarea) {
              textarea.focus();
              textarea.setSelectionRange(selection + 1, selection + 1);
            }
          }, 0);
          return;
        }
      }
    }

    setInput(newValue);
    setStatus('idle');
    setCursorPos(selection || 0);
  };

  const handleCursorUpdate = (e: React.MouseEvent | React.KeyboardEvent) => {
    const target = e.target as HTMLTextAreaElement;
    setCursorPos(target.selectionStart || 0);
  };

  const currentLineLength = useMemo(() => {
    const linesBeforeCursor = input.substring(0, cursorPos).split('\n');
    const currentLineIdx = linesBeforeCursor.length - 1;
    const lines = input.split('\n');
    const currentLine = lines[currentLineIdx] || '';
    return getBrailleLineLength(currentLine);
  }, [input, cursorPos]);

  const isCurrentLineFull = useMemo(() => {
    return plasticSlateEnabled && currentLineLength >= 28;
  }, [currentLineLength, plasticSlateEnabled]);

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
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-none mb-1"> BRAILLE TRANSLATOR</h1>
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
                  <span className={`text-[10px] lowercase font-medium ${plasticSlateEnabled ? 'text-blue-500' : 'text-gray-300'}`}>
                    ({plasticSlateEnabled ? 'Limit: 28 Cells/Line' : 'Unlimited Mode'})
                  </span>
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
                    <span className={isCurrentLineFull ? 'text-red-500' : ''}>
                      {currentLineLength} {plasticSlateEnabled ? '/ 28 CELLS' : 'CELLS'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button 
                    onClick={() => setIsLogOpen(!isLogOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <Terminal size={14} />
                      Log de Procesamiento
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-medium text-gray-400">{input.length} chars</span>
                      <motion.div animate={{ rotate: isLogOpen ? 180 : 0 }}>
                        <ArrowUp size={14} className="text-gray-400 rotate-180" />
                      </motion.div>
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {isLogOpen && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-gray-50/30 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                          {input.split('').map((char, idx) => {
                            const isUnsupported = unsupportedChars.includes(char);
                            const isSpace = char === ' ';
                            const isNewline = char === '\n';
                            const brailleChar = !isUnsupported ? toBrailleString(char, false, ' ') : '';
                            
                            return (
                              <div key={idx} className="flex gap-4 border-b border-gray-100/50 py-1 last:border-0 text-gray-600">
                                <span className="text-gray-300 w-4 text-right select-none">{idx + 1}</span>
                                <span className="font-bold w-4 text-gray-800">
                                  {isNewline ? '↵' : isSpace ? ' ' : char}
                                </span>
                                <span className="w-12 text-gray-400">
                                  {isUnsupported ? '[ERROR]' : '[OK]'}
                                </span>
                                <span className="flex-1 truncate">
                                  {isUnsupported ? `Símbolo '${char}' omitido` : `${brailleChar} • ${isNewline ? 'Salto de línea' : isSpace ? 'Espacio' : `Traducido: ${char}`}`}
                                </span>
                              </div>
                            );
                          })}
                          {input.length === 0 && (
                            <div className="text-gray-400 italic py-2">Sin datos de entrada...</div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {unsupportedChars.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 text-[10px] font-bold text-gray-600">
                      <AlertCircle size={14} />
                      AVISO: {unsupportedChars.length} símbolos no traducibles: {unsupportedChars.map(c => `'${c}'`).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Sidebar-style Controls */}
            <div className="space-y-6">
              <button
                onClick={() => setPlasticSlateEnabled(!plasticSlateEnabled)}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                  plasticSlateEnabled 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <div className={`p-1.5 rounded-md ${plasticSlateEnabled ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                  <SquareSlash size={14} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-wider leading-none">Plastic Slate</div>
                  <div className="text-[8px] font-medium opacity-60 leading-none mt-1">
                    {plasticSlateEnabled ? '28 cap' : 'Limit off'}
                  </div>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${plasticSlateEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <motion.div 
                    animate={{ x: plasticSlateEnabled ? 16 : 2 }}
                    className="absolute top-0.5 left-0 w-3 h-3 bg-white rounded-full"
                  />
                </div>
              </button>

              <section className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-3">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                    Los espacios se representan mediante celdas táctiles vacías.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 text-[10px] font-bold text-amber-600 uppercase tracking-tight pl-7 border-t border-amber-100/50 pt-2">
                  <ArrowUp size={14} className="text-red-600" />
                  <span>Símbolo de mayúscula activo</span>
                </div>

                <div className="flex items-center gap-3 text-[10px] font-bold text-amber-600 uppercase tracking-tight pl-7 border-t border-amber-100/50 pt-2">
                  <span className="text-red-600 text-sm w-3.5 text-center font-black">#</span>
                  <span>Símbolo de número activo</span>
                </div>
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
              
              <div className="relative">
                <AnimatePresence mode="wait">
                  {(status === 'loading' || isTranslating) ? (
                    <motion.div
                      key="standard-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-3"
                    >
                      <div className="flex gap-1.5">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }} 
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-3 h-3 bg-blue-600 rounded-full" 
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }} 
                          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                          className="w-3 h-3 bg-blue-600 rounded-full" 
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }} 
                          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                          className="w-3 h-3 bg-blue-600 rounded-full" 
                        />
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Syncing Tactile Data...</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={displayMode + input}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200"
                  >
                  {displayMode === 'unicode' ? (
                    <div className="space-y-4 min-w-max">
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
                    <div className="space-y-6 min-w-max">
                      {normalCells.map((line: BrailleCellData[], lIdx: number) => (
                        <div key={lIdx} className="space-y-2">
                          <div className="flex flex-nowrap gap-1.5 items-end">
                            {line.map((cell: BrailleCellData, cIdx: number) => (
                              <div key={`${lIdx}-${cIdx}`} className="flex flex-col items-center gap-1">
                                <div className="h-4 flex items-center justify-center">
                                  {cell.isIndicator ? (
                                    cell.char === '#' ? (
                                      <span className="text-red-500 font-bold text-xs">#</span>
                                    ) : (
                                      <ArrowUp size={12} className="text-red-500" />
                                    )
                                  ) : (
                                    <span className="text-[10px] font-bold text-gray-400">
                                      {cell.code === -1 ? '\u00A0' : cell.char}
                                    </span>
                                  )}
                                </div>
                                <BrailleCell code={cell.code} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

            {/* Mirrored Display */}
            <motion.div 
              layout
              className="char-card p-6 md:p-8 rounded-r-3xl shadow-sm border border-gray-100 group relative !border-l-red-500 bg-white overflow-hidden"
            >
              <header className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-sm font-bold text-red-500 tracking-widest uppercase">Mirror Mode (Slate)</h2>
                  <p className="text-[10px] text-gray-400 font-medium tracking-tight">Phrases Left-to-Right • Flipped Columns for Back-punching</p>
                </div>
                <button 
                  onClick={() => copyToClipboard(mirroredBraille, 'mirrored')}
                  className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all flex items-center gap-2 text-xs font-bold"
                >
                  {copiedType === 'mirrored' ? <Check size={16} /> : <Copy size={16} />}
                  {copiedType === 'mirrored' ? 'COPIED' : 'COPY'}
                </button>
              </header>

              <div className="relative">
                <AnimatePresence mode="wait">
                  {(status === 'loading' || isTranslating) ? (
                    <motion.div
                      key="mirrored-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-3"
                    >
                      <div className="flex gap-1.5">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }} 
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-3 h-3 bg-red-500 rounded-full" 
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }} 
                          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                          className="w-3 h-3 bg-red-500 rounded-full" 
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }} 
                          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                          className="w-3 h-3 bg-red-500 rounded-full" 
                        />
                      </div>
                      <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase">Flipping Cells...</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <motion.div 
                    key={displayMode + input + '-mirrored'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-200"
                  >
                  {displayMode === 'unicode' ? (
                    <div className="space-y-4 min-w-max text-right">
                      {mirroredBraille ? (
                        mirroredBraille.split('\n').map((line, idx) => (
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
                        <span className="opacity-10 italic text-sm font-sans tracking-normal block">Type to begin...</span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 min-w-max">
                      {mirroredCells.map((line: BrailleCellData[], lIdx: number) => (
                        <div key={lIdx} className="space-y-2">
                          <div className="flex flex-nowrap gap-1.5 items-end justify-end">
                            {line.map((cell: BrailleCellData, cIdx: number) => (
                              <div key={`${lIdx}-${cIdx}-mirrored`} className="flex flex-col items-center gap-1">
                                <div className="h-4 flex items-center justify-center">
                                  {cell.isIndicator ? (
                                    cell.char === '#' ? (
                                      <span className="text-red-500 font-bold text-xs">#</span>
                                    ) : (
                                      <ArrowUp size={12} className="text-red-500" />
                                    )
                                  ) : (
                                    <span className="text-[10px] font-bold text-gray-400">
                                      {cell.code === -1 ? '\u00A0' : cell.char}
                                    </span>
                                  )}
                                </div>
                                <BrailleCell code={cell.code} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
          </div>

          {/* Metrics Footer */}
          <footer className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-gray-200 gap-4">
            <div className="flex gap-8 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              <div>CHARS: <span className="text-gray-900">{input.length}</span></div>
              <div>LINES: <span className="text-gray-900">{input.split('\n').length}</span></div>
              <div>SLATE CAP: <span className="text-gray-900">{plasticSlateEnabled ? '28/LINE' : 'UNLIMITED'}</span></div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

