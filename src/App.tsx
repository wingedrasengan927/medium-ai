import Editor from "./Editor";
import MenuBar from "./components/MenuBar";
import { useState } from "react";

import { AutoCompleteModel } from "./components/MenuBar";

function App() {
    const [currentModel, setCurrentModel] =
        useState<AutoCompleteModel>("text-ada-001");

    return (
        <>
            <MenuBar
                currentModel={currentModel}
                setCurrentModel={setCurrentModel}
            />
            <Editor autoCompleteModel={currentModel} />
        </>
    );
}

export default App;
