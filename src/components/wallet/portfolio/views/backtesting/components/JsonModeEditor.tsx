interface JsonModeEditorProps {
  editorValue: string;
  onEditorValueChange: (value: string) => void;
  setEditorError: (error: string | null) => void;
  handleFormat: () => void;
  onReset: () => void;
}

export function JsonModeEditor({
  editorValue,
  onEditorValueChange,
  setEditorError,
  handleFormat,
  onReset,
}: JsonModeEditorProps) {
  return (
    <div className="flex flex-col min-h-[400px] animate-in fade-in duration-300 min-w-0">
      <div className="flex justify-end gap-2 mb-3 flex-wrap">
        <button
          type="button"
          onClick={handleFormat}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition-colors border border-gray-700"
        >
          Format
        </button>
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition-colors border border-gray-700"
        >
          Reset Default
        </button>
      </div>
      <textarea
        value={editorValue}
        onChange={e => {
          onEditorValueChange(e.target.value);
          setEditorError(null);
        }}
        spellCheck={false}
        className="w-full flex-1 min-h-[300px] font-mono text-xs leading-relaxed bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600/40 resize-none"
      />
    </div>
  );
}
