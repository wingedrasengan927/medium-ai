import {
    LexicalEditor,
    SELECTION_CHANGE_COMMAND,
    COMMAND_PRIORITY_LOW,
    $getSelection,
    $isRangeSelection,
    RangeSelection,
    $setSelection,
    $isTextNode,
} from "lexical";
import { useRef, useCallback, useEffect, useState } from "react";
import { mergeRegister } from "@lexical/utils";
import { getDOMRangeRect, setFloatingElemPositionForAIEditor } from "../utils";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CancelIcon from "@mui/icons-material/Cancel";
import ErrorIcon from "@mui/icons-material/Error";
import { AI_EDIT_ENDPOINT } from "../../../constants";

type FloatingAIEditorProps = {
    editor: LexicalEditor;
    anchorElem: HTMLElement;
    setShowAIEditToolbar: (show: boolean) => void;
};

export default function FloatingAIEditor({
    editor,
    anchorElem,
    setShowAIEditToolbar,
}: FloatingAIEditorProps) {
    const editorToolbarRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [instruction, setInstruction] = useState<string>("");
    const [temperature, setTemperature] = useState<number>(20);
    const [selectedText, setSelectedText] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isFailed, setIsFailed] = useState<boolean>(false);
    const [currentSelection, setCurrentSelection] = useState<
        RangeSelection | null | undefined
    >(null);
    const isMounted = useRef<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [tipsVisible, setTipsVisible] = useState<boolean>(false);
    const tipElemRef = useRef<HTMLPreElement>(null);

    const onInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInstruction(e.target.value);
        const textAreaElem = textAreaRef.current;
        if (textAreaElem) {
            textAreaElem.style.height = "auto";
            textAreaElem.style.height = `${textAreaElem.scrollHeight}px`;
        }
    };

    const getEditedText = async () => {
        setIsFailed(false);
        setTipsVisible(false);
        if (selectedText === "" || instruction === "") {
            return;
        }
        try {
            setIsLoading(true);
            const response = await fetch(AI_EDIT_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    instruction,
                    temperature,
                    selectedText,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setIsLoading(false);
                setIsFailed(false);
                setTipsVisible(false);
                if (!isMounted.current) {
                    return;
                }
                editor.update(() => {
                    if ($isRangeSelection(currentSelection)) {
                        $setSelection(currentSelection.clone());
                        const selection = $getSelection();
                        selection?.insertText(data["edited_text"]);
                        setShowAIEditToolbar(false);
                    }
                });
            } else {
                setIsLoading(false);
                setIsFailed(true);
                setErrorMessage(
                    "statusCode: " +
                        response.status +
                        ", " +
                        response.statusText +
                        "." +
                        "\n" +
                        data["detail"]
                );
                setTipsVisible(true);
            }
        } catch (e) {
            if (e instanceof Error) {
                setErrorMessage(e.message);
                setTipsVisible(true);
            }
            setIsLoading(false);
            setIsFailed(true);
        }
    };

    function handleMouseEnter() {
        if (errorMessage !== "") {
            setTipsVisible(true);
        }
    }

    function handleMouseLeave() {
        if (errorMessage !== "") {
            setTipsVisible(false);
        }
    }

    const updateFloatingAIEditor = useCallback(() => {
        const selection = $getSelection();

        const editorToolbarElem = editorToolbarRef.current;
        const nativeSelection = window.getSelection();

        if (editorToolbarElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();
        if (
            selection != null &&
            nativeSelection != null &&
            !nativeSelection.isCollapsed &&
            rootElement != null &&
            rootElement.contains(nativeSelection.anchorNode)
        ) {
            const rangeRect = getDOMRangeRect(nativeSelection, rootElement);

            setFloatingElemPositionForAIEditor(
                rangeRect,
                editorToolbarElem,
                anchorElem
            );
        }
    }, [editor, anchorElem]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateFloatingAIEditor();
        });

        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateFloatingAIEditor();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateFloatingAIEditor();
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, updateFloatingAIEditor]);

    useEffect(() => {
        const update = () => {
            editor.getEditorState().read(() => {
                updateFloatingAIEditor();
            });
        };

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update);

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
        };
    }, [anchorElem, editor, updateFloatingAIEditor]);

    useEffect(() => {
        isMounted.current = true;
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                if (!selection.hasFormat("highlight")) {
                    selection.formatText("highlight");
                }
                const text = selection.getTextContent();
                setSelectedText(text);
                setCurrentSelection(selection);
            }
        });

        return () => {
            isMounted.current = false;
            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    const nodes = selection.getNodes();
                    const textNodes = nodes.filter((node) => {
                        return $isTextNode(node);
                    });
                    for (const node of textNodes) {
                        if (node.hasFormat("highlight")) {
                            node.toggleFormat("highlight");
                        }
                    }

                    if (selection.hasFormat("highlight")) {
                        selection.toggleFormat("highlight");
                    }
                }
            });
        };
    }, [editor]);

    return (
        <div
            ref={editorToolbarRef}
            className="floating-ai-editor absolute z-10 top-0 left-0 max-w-sm w-full opacity-0 selection:bg-zinc-300"
        >
            <div className="flex flex-col items-center p-2 pb-1 bg-zinc-50 shadow-lg">
                <textarea
                    rows={1}
                    value={instruction}
                    onChange={onInput}
                    ref={textAreaRef}
                    className="textarea text-lg font-poppins w-full resize-none border-0 bg-zinc-200 focus:outline-0 text-black"
                    placeholder="Enter edit instruction"
                ></textarea>
                <div className="flex flex-row items-center justify-end w-full mt-1 relative">
                    <div className="flex flex-row items-center justify-between mr-2">
                        <span className="text-base text-gray-500 mr-2">
                            {"T: " + temperature / 100}
                        </span>

                        <input
                            type="range"
                            min="0"
                            max="200"
                            onChange={(e) =>
                                setTemperature(Number(e.target.value))
                            }
                            value={temperature}
                            className="range range-xs w-28"
                        />
                    </div>

                    <button
                        className={
                            "btn btn-ghost btn-sm btn-square mr-1 text-lime-600 disabled:text-gray-400 disabled:bg-transparent" +
                            (isLoading ? " loading" : "") +
                            (isFailed ? " text-rose-400" : "")
                        }
                        disabled={instruction.length === 0}
                        onClick={getEditedText}
                    >
                        {isFailed ? (
                            <ErrorIcon
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            />
                        ) : isLoading ? (
                            ""
                        ) : (
                            <TaskAltIcon />
                        )}
                    </button>
                    <button
                        className="btn btn-ghost btn-sm btn-square text-rose-400"
                        onClick={() => setShowAIEditToolbar(false)}
                    >
                        <CancelIcon />
                    </button>
                    {tipsVisible ? (
                        <pre
                            ref={tipElemRef}
                            className="textarea absolute top-12 z-10 w-80 whitespace-pre-wrap max-h-96 overflow-clip"
                            // 316 = width of the parent div - width of button 1 - ( width of button 2 / 2 ) where the width also includes margin
                            // 144 = width of the pre element / 2
                            style={{ left: 316 - 160 }}
                        >
                            {errorMessage}
                        </pre>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
