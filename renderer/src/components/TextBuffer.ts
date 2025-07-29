export interface Position {
    line: number;
    column: number;
}

export interface Range {
    start: Position;
    end: Position;
}

export interface TextChange {
    range: Range;
    text: string;
    timestamp: number;
}

export class TextBuffer {
    private lines: string[] = [''];
    private cursor: Position = { line: 0, column: 0 };
    private selection: Range | null = null;
    private changeListeners: ((change: TextChange) => void)[] = [];
    private undoStack: TextChange[] = [];
    //@ts-expect-error
    private redoStack: TextChange[] = [];

    constructor(initialContent: string = '') {
        this.setContent(initialContent);
    }

    // Content management
    setContent(content: string): void {
        this.lines = content.split('\n');
        if (this.lines.length === 0) {
            this.lines = [''];
        }
        this.cursor = { line: 0, column: 0 };
        this.selection = null;
    }

    getContent(): string {
        return this.lines.join('\n');
    }

    getLines(): string[] {
        return [...this.lines];
    }

    getLine(lineNumber: number): string {
        return this.lines[lineNumber] || '';
    }

    getLineCount(): number {
        return this.lines.length;
    }

    // Cursor management
    getCursor(): Position {
        return { ...this.cursor };
    }

    setCursor(position: Position): void {
        this.cursor = this.clampPosition(position);
        this.selection = null;
    }

    // Selection management
    getSelection(): Range | null {
        return this.selection ? {
            start: { ...this.selection.start },
            end: { ...this.selection.end }
        } : null;
    }

    setSelection(range: Range | null): void {
        this.selection = range;
        if (range) {
            this.cursor = { ...range.end };
        }
    }

    // Text editing operations
    insertText(text: string, position?: Position): void {
        const pos = position || this.cursor;
        const change: TextChange = {
            range: { start: pos, end: pos },
            text,
            timestamp: Date.now()
        };

        this.applyChange(change);
        this.addToUndoStack(change);
        this.notifyChange(change);
    }

    deleteRange(range: Range): void {
        const change: TextChange = {
            range,
            text: '',
            timestamp: Date.now()
        };

        this.applyChange(change);
        this.addToUndoStack(change);
        this.notifyChange(change);
    }

    replaceRange(range: Range, text: string): void {
        const change: TextChange = {
            range,
            text,
            timestamp: Date.now()
        };

        this.applyChange(change);
        this.addToUndoStack(change);
        this.notifyChange(change);
    }

    // Private helper methods
    private applyChange(change: TextChange): void {
        const { start, end } = change.range;
        const { text } = change;

        if (start.line === end.line) {
            // Single line change
            const line = this.lines[start.line] || '';
            this.lines[start.line] =
                line.substring(0, start.column) +
                text +
                line.substring(end.column);
        } else {
            // Multi-line change
            const startLine = this.lines[start.line] || '';
            const endLine = this.lines[end.line] || '';
            const newLines = text.split('\n');

            const firstLine = startLine.substring(0, start.column) + (newLines[0] || '');
            const lastLine = (newLines[newLines.length - 1] || '') + endLine.substring(end.column);

            const linesToReplace = end.line - start.line + 1;
            this.lines.splice(start.line, linesToReplace, firstLine, ...newLines.slice(1, -1), lastLine);
        }

        // Update cursor position
        if (text) {
            const textLines = text.split('\n');
            if (textLines.length === 1) {
                this.cursor = { line: start.line, column: start.column + text.length };
            } else {
                this.cursor = {
                    line: start.line + textLines.length - 1,
                    column: textLines[textLines.length - 1]?.length || 0
                };
            }
        } else {
            this.cursor = { ...start };
        }

        this.cursor = this.clampPosition(this.cursor);
    }

    private clampPosition(position: Position): Position {
        const line = Math.max(0, Math.min(position.line, this.lines.length - 1));
        const column = Math.max(0, Math.min(position.column, (this.lines[line] || '').length));
        return { line, column };
    }

    private addToUndoStack(change: TextChange): void {
        this.undoStack.push(change);
        this.redoStack = []; // Clear redo stack

        // Limit undo stack size
        if (this.undoStack.length > 1000) {
            this.undoStack.shift();
        }
    }

    private notifyChange(change: TextChange): void {
        this.changeListeners.forEach(listener => listener(change));
    }

    // Event handling
    onChange(listener: (change: TextChange) => void): () => void {
        this.changeListeners.push(listener);
        return () => {
            const index = this.changeListeners.indexOf(listener);
            if (index > -1) {
                this.changeListeners.splice(index, 1);
            }
        };
    }

    // Utility methods
    positionToOffset(position: Position): number {
        let offset = 0;
        for (let i = 0; i < position.line && i < this.lines.length; i++) {
            offset += (this.lines[i]?.length || 0) + 1; // +1 for newline
        }
        return offset + Math.min(position.column, (this.lines[position.line] || '').length);
    }

    offsetToPosition(offset: number): Position {
        let currentOffset = 0;
        for (let line = 0; line < this.lines.length; line++) {
            const lineLength = (this.lines[line] || '').length;
            if (currentOffset + lineLength >= offset) {
                return { line, column: offset - currentOffset };
            }
            currentOffset += lineLength + 1; // +1 for newline
        }
        return { line: this.lines.length - 1, column: (this.lines[this.lines.length - 1] || '').length };
    }
}