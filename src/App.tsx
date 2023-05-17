import Editor from "./Editor";
import MenuBar from "./components/MenuBar";
import { useState, useRef } from "react";
import { EditorState } from "lexical";
import { SAVE_ENDPOINT } from "./constants";
import { useDebounce } from "./plugins/FloatingElements/CodeActionMenu/utils";

import { AutoCompleteModel } from "./components/MenuBar";

function App() {
    const [currentModel, setCurrentModel] =
        useState<AutoCompleteModel>("text-ada-001");
    const editorStateRef = useRef<EditorState | null>(null);

    const saveContent = async () => {
        if (editorStateRef.current === null) {
            return;
        }
        const content = editorStateRef.current;
        const response = await fetch(SAVE_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(content),
        });
        if (response.ok) {
            console.log("Saved!");
        } else {
            console.log("Error saving");
        }
    };

    const saveContentDebounced = useDebounce(saveContent, 1000);

    return (
        <>
            <MenuBar
                currentModel={currentModel}
                setCurrentModel={setCurrentModel}
                saveState={saveContentDebounced}
            />
            <Editor
                autoCompleteModel={currentModel}
                editorStateRef={editorStateRef}
            />
        </>
    );
}

export default App;
