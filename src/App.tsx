import Editor from "./Editor";
import MenuBar from "./components/MenuBar";
import { useState, useRef, useEffect } from "react";
import { EditorState } from "lexical";
import { SAVE_ENDPOINT } from "./constants";
import { useDebounce } from "./plugins/FloatingElements/CodeActionMenu/utils";

import { AutoCompleteModel } from "./components/MenuBar";

function App() {
    const [currentModel, setCurrentModel] =
        useState<AutoCompleteModel>("text-ada-001");
    const [isSaveFailed, setIsSaveFailed] = useState(false);
    const editorStateRef = useRef<EditorState | null>(null);

    const saveContent = async () => {
        if (editorStateRef.current === null) {
            return;
        }
        const content = editorStateRef.current;
        try {
            const response = await fetch(SAVE_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(content),
            });
            if (response.ok) {
                console.log("Saved!");
                setIsSaveFailed(false);
            } else {
                console.log("Error saving");
                setIsSaveFailed(true);
            }
        } catch (e) {
            console.log("Error saving: Backend not running?");
            setIsSaveFailed(true);
        }
    };

    const saveContentDebounced = useDebounce(saveContent, 1000);

    useEffect(() => {
        const saveOnKeyPress = (e: KeyboardEvent) => {
            if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                saveContentDebounced();
            }
        };
        document.addEventListener("keydown", saveOnKeyPress);

        return () => {
            document.removeEventListener("keydown", saveOnKeyPress);
        };
    }, []);

    return (
        <>
            <MenuBar
                currentModel={currentModel}
                setCurrentModel={setCurrentModel}
                saveState={saveContentDebounced}
                isSaveFailed={isSaveFailed}
            />
            <Editor
                autoCompleteModel={currentModel}
                editorStateRef={editorStateRef}
            />
        </>
    );
}

export default App;
