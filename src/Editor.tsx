import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import basicTheme from "./themes/BasicTheme";
import { HorizontalDividerNode } from "./nodes/HorizontalDividerNode";
import { ImageNode } from "./nodes/Image/ImageNode";
import { EquationNode } from "./nodes/Math/EquationNode";
import { ImagePlugin } from "./plugins/ImagePlugin";
import { HorizontalDividerPlugin } from "./plugins/HorizontalDividerPlugin";
import CodeBlockPlugin from "./plugins/CodeBlockPlugin";
import { EquationListenerPlugin } from "./plugins/EquationListenerPlugin";
import EditorBehaviourPlugin from "./plugins/EditorBehaviourPlugin";
import { EditorCommandsPlugin } from "./plugins/EditorCommands";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingElements/FloatingTextToolbar";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import FloatingLinkEditorPlugin from "./plugins/FloatingElements/FloatingLinkEditor";
import FloatingEquationEditorPlugin from "./plugins/FloatingElements/FloatingEquationEditor";
import FloatingBlockToolbarPlugin from "./plugins/FloatingElements/FloatingBlockToolbar";
import CodeActionMenuPlugin from "./plugins/FloatingElements/CodeActionMenu";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { ListItemNode, ListNode } from "@lexical/list";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { EditorState } from "lexical";
import { useRef } from "react";
import AIAutoCompletePlugin from "./plugins/AIAutoCompletePlugin";
import { AutoCompleteNode } from "./nodes/AIAutoCompleteNode";

// load initial state from a json file
import data from "./assets/initialState.json";

function Placeholder() {
    return <></>;
}

export default function Editor() {
    const editorStateRef = useRef<EditorState | null>(null);

    const initialConfig = {
        editorState: JSON.stringify(data),
        namespace: "MyEditor",
        onError(error: Error) {
            throw error;
        },
        nodes: [
            HorizontalDividerNode,
            ImageNode,
            EquationNode,
            CodeHighlightNode,
            CodeNode,
            HeadingNode,
            LinkNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            AutoCompleteNode,
        ],
        theme: basicTheme,
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="editor-container">
                <div className="editor-inner">
                    <RichTextPlugin
                        placeholder={<Placeholder />}
                        contentEditable={
                            <ContentEditable
                                className="editor-input"
                                spellCheck={false}
                            />
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <OnChangePlugin
                        onChange={(editorState) => {
                            if (editorStateRef !== null) {
                                editorStateRef.current = editorState;
                            }
                        }}
                    />
                    <LinkPlugin />
                    <HistoryPlugin />
                    <FloatingLinkEditorPlugin />
                    <ImagePlugin />
                    <HorizontalDividerPlugin />
                    <CodeBlockPlugin />
                    <EquationListenerPlugin />
                    <FloatingEquationEditorPlugin />
                    <EditorBehaviourPlugin />
                    <EditorCommandsPlugin />
                    <FloatingTextFormatToolbarPlugin />
                    <FloatingBlockToolbarPlugin />
                    <CodeActionMenuPlugin />
                    <ListPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <AIAutoCompletePlugin />
                </div>
            </div>
        </LexicalComposer>
    );
}
