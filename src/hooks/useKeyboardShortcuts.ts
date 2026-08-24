import { useHotkeys } from 'react-hotkeys-hook';

interface KeyboardShortcutsProps {
    onSave?: () => void;
    onPdf?: () => void;
    onNew?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
}

const useKeyboardShortcuts = ({ onSave, onPdf, onNew, onUndo, onRedo }: KeyboardShortcutsProps) => {
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
        if (onNew) {
            e.preventDefault();
            onNew();
        }
    }, { enableOnFormTags: true }, [onNew]);

    // Undo: Ctrl+Z or Cmd+Z (Disabled inside input/textarea so native typing undo works)
    useHotkeys('ctrl+z, meta+z', (e) => {
        e.preventDefault();
        if (onUndo) onUndo();
    }, { enableOnFormTags: false }, [onUndo]);

    // Redo: Ctrl+Y, Cmd+Y, Ctrl+Shift+Z, Cmd+Shift+Z (Disabled inside input/textarea so native typing redo works)
    useHotkeys('ctrl+y, meta+y, ctrl+shift+z, meta+shift+z', (e) => {
        e.preventDefault();
        if (onRedo) onRedo();
    }, { enableOnFormTags: false }, [onRedo]);
};

export default useKeyboardShortcuts;
