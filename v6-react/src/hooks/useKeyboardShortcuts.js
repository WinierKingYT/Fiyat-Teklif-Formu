import { useHotkeys } from 'react-hotkeys-hook';

const useKeyboardShortcuts = ({ onSave, onPdf, onNew, onUndo, onRedo }) => {
    // Save: Ctrl+S or Cmd+S
    useHotkeys('ctrl+s, meta+s', (e) => {
        e.preventDefault();
        if (onSave) onSave();
    }, { enableOnFormTags: true }, [onSave]);

    // PDF: Ctrl+P or Cmd+P
    useHotkeys('ctrl+p, meta+p', (e) => {
        e.preventDefault();
        if (onPdf) onPdf();
    }, { enableOnFormTags: true }, [onPdf]);

    // New: Ctrl+N or Cmd+N
    useHotkeys('ctrl+n, meta+n', (e) => {
        e.preventDefault();
        if (onNew) onNew();
    }, { enableOnFormTags: true }, [onNew]);

    // Undo: Ctrl+Z or Cmd+Z
    useHotkeys('ctrl+z, meta+z', (e) => {
        e.preventDefault();
        if (onUndo) onUndo();
    }, { enableOnFormTags: true }, [onUndo]);

    // Redo: Ctrl+Y, Cmd+Y, Ctrl+Shift+Z, Cmd+Shift+Z
    useHotkeys('ctrl+y, meta+y, ctrl+shift+z, meta+shift+z', (e) => {
        e.preventDefault();
        if (onRedo) onRedo();
    }, { enableOnFormTags: true }, [onRedo]);
};

export default useKeyboardShortcuts;
