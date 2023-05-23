import { useEffect, useState } from "react";
import { LOAD_ENDPOINT } from "../../constants";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $nodesOfType, EditorState, LexicalEditor, TextNode } from "lexical";

export default function LoadInitialStatePlugin() {
    const [initialState, setInitialState] = useState<EditorState | null>(null);
    const [editor] = useLexicalComposerContext();

    const loadState = async () => {
        try {
            const response = await fetch(LOAD_ENDPOINT);
            if (response.ok) {
                const data = await response.json();
                return data;
            } else if (response.status === 404) {
                console.log("No saved state");
                return null;
            } else {
                console.log("Error loading");
            }
        } catch (e) {
            console.log("Error loading: Backend not running?");
        }
    };

    const removeHighlight = (editor: LexicalEditor) => {
        editor.update(() => {
            const textNodes = $nodesOfType(TextNode);
            textNodes.forEach((node) => {
                if (node.hasFormat("highlight")) {
                    node.toggleFormat("highlight");
                }
            });
        });
    };

    useEffect(() => {
        if (initialState === null) {
            loadState().then((data) => {
                if (data) {
                    setInitialState(data);
                    const initialEditorState = editor.parseEditorState(data);
                    editor.setEditorState(initialEditorState);
                    removeHighlight(editor);
                }
            });
        }
    }, [initialState, editor]);

    return null;
}
