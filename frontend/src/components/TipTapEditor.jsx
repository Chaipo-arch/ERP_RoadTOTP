import { useEffect, useCallback } from 'react'; // Ajout de useEffect et useCallback
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';


import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

import {
    Bold, Italic, UnderlineIcon, Strikethrough, AlignLeft, AlignCenter,
    AlignRight, AlignJustify, List, ListOrdered, Quote, Undo, Redo,
    Link as LinkIcon, Heading1, Heading2, Heading3, Minus, Code,
    Highlighter, Palette, RotateCcw
} from 'lucide-react';
import './TipTapEditor.css';

/* ── Bouton barre d'outils ── */
function ToolbarButton({ onClick, active, title, children, disabled }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            disabled={disabled}
            className={`tiptap-toolbar-btn ${active ? 'tiptap-toolbar-btn--active' : ''} ${disabled ? 'tiptap-toolbar-btn--disabled' : ''}`}
        >
            {children}
        </button>
    );
}

/* ── Séparateur ── */
function Divider() {
    return <div className="tiptap-toolbar-divider" />;
}

/* ── Composant éditeur TipTap ── */
export default function TipTapEditor({ content, onChange, placeholder = '...', readOnly = false, minHeight = 300 }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({ 
                allowBase64: true, 
                inline: true 
            }),
            Table.configure({ resizable: true }),
            TableRow,
            TableCell,
            TableHeader,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Placeholder.configure({ placeholder }),
            Link.configure({ openOnClick: false }),
        ],
        content: content || '',
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            if (onChange) onChange(editor.getJSON());
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getJSON()) {
            editor.commands.setContent(content || '', false);
        }
    }, [content, editor]);

    // AJOUT DE LA FONCTION MANQUANTE POUR LE LIEN
    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return; // Annulé
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="tiptap-wrapper" style={{ minHeight }}>
            {!readOnly && (
                <div className="tiptap-toolbar">
                    {/* Annuler / Refaire */}
                    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Annuler" disabled={!editor.can().undo()}>
                        <Undo size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refaire" disabled={!editor.can().redo()}>
                        <Redo size={15} />
                    </ToolbarButton>

                    <Divider />

                    {/* Titres */}
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Titre 1">
                        <Heading1 size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Titre 2">
                        <Heading2 size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Titre 3">
                        <Heading3 size={15} />
                    </ToolbarButton>

                    <Divider />

                    {/* Format texte */}
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras (Ctrl+B)">
                        <Bold size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique (Ctrl+I)">
                        <Italic size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligner (Ctrl+U)">
                        <UnderlineIcon size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré">
                        <Strikethrough size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code">
                        <Code size={15} />
                    </ToolbarButton>

                    <Divider />

                    {/* Couleurs */}
                    <div className="tiptap-color-picker" title="Couleur du texte">
                        <Palette size={15} />
                        <input
                            type="color"
                            onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
                            value={editor.getAttributes('textStyle').color || '#f8fafc'}
                        />
                    </div>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight({ color: '#fde68a' }).run()} active={editor.isActive('highlight')} title="Surligner">
                        <Highlighter size={15} />
                    </ToolbarButton>

                    <Divider />

                    {/* Alignement */}
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Aligner à gauche">
                        <AlignLeft size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrer">
                        <AlignCenter size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Aligner à droite">
                        <AlignRight size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justifier">
                        <AlignJustify size={15} />
                    </ToolbarButton>

                    <Divider />

                    {/* Listes */}
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces">
                        <List size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">
                        <ListOrdered size={15} />
                    </ToolbarButton>

                    <Divider />

                    {/* Blocs */}
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">
                        <Quote size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur horizontal">
                        <Minus size={15} />
                    </ToolbarButton>
                    <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Lien">
                        <LinkIcon size={15} />
                    </ToolbarButton>

                    <Divider />

                    {/* Reset */}
                    <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Supprimer le formatage">
                        <RotateCcw size={15} />
                    </ToolbarButton>
                </div>
            )}

            <EditorContent
                editor={editor}
                className={`tiptap-content ${readOnly ? 'tiptap-content--readonly' : ''}`}
                style={{ minHeight: minHeight - (readOnly ? 0 : 48) }}
            />
        </div>
    );
}