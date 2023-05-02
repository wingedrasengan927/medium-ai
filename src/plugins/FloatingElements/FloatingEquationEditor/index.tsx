import {
    $getNodeByKey,
    $getNearestNodeFromDOMNode,
    LexicalEditor,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { useCallback, useRef, useState, useEffect } from "react";
import { setFloatingElemPositionForEquationEditor } from "../utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createPortal } from "react-dom";
import { ErrorBoundary } from "react-error-boundary";
import KatexRenderer from "../../../nodes/Math/EquationNode/KatexRenderer";
import CloseIcon from "@mui/icons-material/Close";

type FloatingEquationEditorProps = {
    editor: LexicalEditor;
    anchorElem: HTMLElement;
    nodeKey: string;
    setShowEditor: (show: boolean) => void;
};

function FloatingMathEditorComponent({
    editor,
    anchorElem,
    nodeKey,
    setShowEditor,
}: FloatingEquationEditorProps) {
    const [equation, setEquation] = useState("");
    const editorRef = useRef(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const insertInline = useCallback(() => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (node !== null) {
                node.setEquation(equation);
                node.setInline(true);
                setShowEditor(false);
            }
        });
    }, [editor, equation, nodeKey, setShowEditor]);

    const insertBlock = useCallback(() => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (node !== null) {
                node.setEquation(equation);
                node.setInline(false);
                setShowEditor(false);
            }
        });
    }, [editor, equation, nodeKey, setShowEditor]);

    const updateToolbar = useCallback(() => {
        const targetNode = $getNodeByKey(nodeKey);
        const targetElem = editor.getElementByKey(nodeKey);
        const editorElem = editorRef.current;
        const rootElement = editor.getRootElement();

        if (
            targetNode === null ||
            targetElem === null ||
            editorElem === null ||
            rootElement === null ||
            !rootElement.contains(targetElem)
        ) {
            return;
        }

        const isInline = targetNode.__inline;
        const equation = targetNode.getEquation();
        setEquation(equation);

        const targetRect = targetElem.getBoundingClientRect();

        setFloatingElemPositionForEquationEditor(
            targetRect,
            editorElem,
            anchorElem,
            isInline
        );
    }, [editor, anchorElem, nodeKey]);

    useEffect(() => {
        const update = () => {
            editor.getEditorState().read(() => {
                updateToolbar();
            });
        };

        const close = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setShowEditor(false);
            }
        };

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update);
        window.addEventListener("keydown", close);

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
            window.removeEventListener("keydown", close);
        };
    }, [anchorElem, editor, updateToolbar, setShowEditor]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateToolbar();
            if (inputRef.current !== null) {
                inputRef.current.focus();
            }
        });

        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            })
        );
    }, [editor, updateToolbar]);

    return (
        <div
            ref={editorRef}
            className="absolute z-10 top-0 left-0 max-w-sm w-full opacity-0 bg-white shadow-md rounded-lg transition-opacity flex flex-col p-2 selection:bg-lime-400"
        >
            <div className="modal-content py-2 px-4">
                <div className="flex justify-between items-center pb-3">
                    <p className="text-2xl font-lato font-bold text-black">
                        Equation Editor
                    </p>
                    <div
                        className="modal-close cursor-pointer z-50 hover:text-black"
                        onClick={() => setShowEditor(false)}
                    >
                        <CloseIcon />
                    </div>
                </div>

                <div className="border-b border-gray-300"></div>

                <div
                    className="flex flex-col pt-4 font-robotomono text-lg text-gray-700"
                    spellCheck={false}
                >
                    <textarea
                        ref={inputRef}
                        className="w-full h-32 px-3 py-2 rounded-lg focus:outline-none bg-gray-100"
                        value={equation}
                        onChange={(e) => {
                            setEquation(e.target.value);
                        }}
                    />
                </div>

                <div className="flex flex-col">
                    <p className="text-xl font-bold py-3 text-black">
                        Visualization
                    </p>
                    <div className="border-b border-gray-300"></div>
                    <div className="katex-vis py-2 h-20 text-black">
                        <ErrorBoundary
                            onError={(e) => editor._onError(e)}
                            fallback={null}
                        >
                            <KatexRenderer equation={equation} inline={false} />
                        </ErrorBoundary>
                    </div>
                </div>

                <div className="flex justify-end pt-3">
                    <button
                        className="px-4 bg-indigo-500 p-2 rounded-lg text-white hover:bg-indigo-400 mr-2"
                        onClick={insertInline}
                    >
                        Inline
                    </button>
                    <button
                        className="px-4 bg-indigo-500 p-2 rounded-lg text-white hover:bg-indigo-400 mr-2"
                        onClick={insertBlock}
                    >
                        Block
                    </button>
                    <button
                        className="px-4 bg-transparent p-2 rounded-lg text-indigo-500 hover:bg-gray-100 hover:text-indigo-400"
                        onClick={() => setShowEditor(false)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function useFloatingMathEditorPlugin(
    editor: LexicalEditor,
    anchorElem: HTMLElement
) {
    const [nodeKey, setNodeKey] = useState("");
    const [showEditor, setShowEditor] = useState(false);

    const eqnDblClickListener = useCallback(
        (event: MouseEvent) => {
            editor.update(() => {
                const targetNode = $getNearestNodeFromDOMNode(
                    event.target as HTMLElement
                );
                if (
                    targetNode !== null &&
                    targetNode.getType() === "equation"
                ) {
                    setNodeKey(targetNode.getKey());
                    setShowEditor(true);
                }
            });
        },
        [editor]
    );

    useEffect(() => {
        return mergeRegister(
            editor.registerRootListener((rootElement, prevRootElement) => {
                if (rootElement) {
                    rootElement.addEventListener(
                        "dblclick",
                        eqnDblClickListener
                    );
                }

                if (prevRootElement) {
                    prevRootElement.removeEventListener(
                        "dblclick",
                        eqnDblClickListener
                    );
                }
            })
        );
    }, [editor, eqnDblClickListener]);

    if (!nodeKey || !showEditor) {
        return null;
    }

    return createPortal(
        <FloatingMathEditorComponent
            editor={editor}
            anchorElem={anchorElem}
            nodeKey={nodeKey}
            setShowEditor={setShowEditor}
        />,
        anchorElem
    );
}

export default function FloatingEquationEditorPlugin({
    anchorElem = document.body,
}) {
    const [editor] = useLexicalComposerContext();
    return useFloatingMathEditorPlugin(editor, anchorElem);
}
