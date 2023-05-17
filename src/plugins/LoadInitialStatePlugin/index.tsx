import { useEffect, useState } from "react";
import { LOAD_ENDPOINT } from "../../constants";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { EditorState } from "lexical";

export default function LoadInitialStatePlugin() {
    const [initialState, setInitialState] = useState<EditorState | null>(null);
    const [editor] = useLexicalComposerContext();

    const loadState = async () => {
        const response = await fetch(LOAD_ENDPOINT);
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            console.log("Error loading");
        }
    };

    useEffect(() => {
        if (initialState === null) {
            loadState().then((data) => {
                if (data) {
                    setInitialState(data);
                    const initialEditorState = editor.parseEditorState(data);
                    editor.setEditorState(initialEditorState);
                }
            });
        }
    }, [initialState, editor]);

    return null;
}
