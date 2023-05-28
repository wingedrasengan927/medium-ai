import {
    $isCodeNode,
    $isCodeHighlightNode,
    getLanguageFriendlyName,
    normalizeCodeLang,
    getDefaultCodeLanguage,
    getCodeLanguages,
} from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getSelection,
    $isRangeSelection,
    SELECTION_CHANGE_COMMAND,
    $getNodeByKey,
    COMMAND_PRIORITY_NORMAL,
    LexicalEditor,
    NodeKey,
} from "lexical";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
    getSelectedNode,
    setFloatingElemPositionForCodeActionMenu,
} from "../utils";
import { CopyButton } from "./components/CopyButton";
import { canBePrettier, PrettierButton } from "./components/PrettierButton";
import { mergeRegister } from "@lexical/utils";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

type CodingActionMenuProps = {
    editor: LexicalEditor;
    anchorElem: HTMLElement;
    nodeKey: NodeKey;
};

function CodingActionMenuContainer({
    editor,
    anchorElem,
    nodeKey,
}: CodingActionMenuProps) {
    const actionMenuRef = useRef<HTMLDivElement | null>(null);
    const [lang, setLang] = useState<string>("");
    const [showCodeLanguages, setShowCodeLanguages] = useState<boolean>(false);
    const [codeElement, setCodeElement] = useState<HTMLElement | null>(null);

    const codeLanguages = useMemo(() => getCodeLanguages(), []);

    const setSelectedLang = useCallback(
        (lang: string) => {
            editor.update(() => {
                const codeNode = $getNodeByKey(nodeKey);
                if ($isCodeNode(codeNode)) {
                    codeNode.setLanguage(lang);
                }
            });
        },
        [editor, nodeKey]
    );

    const getCodeDOMNode = useCallback(() => {
        if (codeElement === null) {
            return null;
        }

        return codeElement;
    }, [codeElement]);

    const updateMenu = useCallback(() => {
        const actionMenuElem = actionMenuRef.current;
        const rootElement = editor.getRootElement();

        if (actionMenuElem === null || rootElement === null) {
            return;
        }

        const codeNode = $getNodeByKey(nodeKey);

        if ($isCodeNode(codeNode)) {
            const lang = codeNode.getLanguage() || getDefaultCodeLanguage();
            setLang(lang);

            const codeDOMNode = editor.getElementByKey(nodeKey);
            if (codeDOMNode !== null) {
                setCodeElement(codeDOMNode);
                const codeDOMRect = codeDOMNode.getBoundingClientRect();

                setFloatingElemPositionForCodeActionMenu(
                    codeDOMRect,
                    actionMenuElem,
                    anchorElem
                );
            }
        }
    }, [editor, anchorElem, nodeKey]);

    useEffect(() => {
        if (codeElement !== null) {
            codeElement.addEventListener("click", () => {
                setShowCodeLanguages(false);
            });
        }

        return () => {
            if (codeElement !== null) {
                codeElement.removeEventListener("click", () => {
                    setShowCodeLanguages(false);
                });
            }
        };
    }, [codeElement]);

    useEffect(() => {
        const update = () => {
            editor.getEditorState().read(() => {
                updateMenu();
            });
        };

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update);

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
        };
    }, [anchorElem, editor, updateMenu]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateMenu();
        });

        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateMenu();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateMenu();
                    return false;
                },
                COMMAND_PRIORITY_NORMAL
            )
        );
    }, [editor, updateMenu]);

    const normalizedLang = normalizeCodeLang(lang);
    const codeFriendlyName = getLanguageFriendlyName(lang);

    return (
        <>
            <div
                className="absolute z-10 top-0 left-0 opacity-0 flex flex-row h-10 w-60 items-center select-none justify-end p-2"
                ref={actionMenuRef}
            >
                <div className="dropdown dropdown-open">
                    <button
                        tabIndex={0}
                        className="btn btn-xs btn-ghost text-xs w-32 text-gray-500 flex flex-row justify-end"
                        onClick={() => setShowCodeLanguages(!showCodeLanguages)}
                    >
                        {codeFriendlyName}
                        <ArrowDropDownIcon fontSize="small" />
                    </button>
                    {showCodeLanguages && (
                        <ul
                            tabIndex={0}
                            className="dropdown-content flex-nowrap menu menu-compact shadow-lg shadow-gray-200 font-poppins p-2 bg-white text-sm text-gray-700 rounded-box w-36 max-h-80 overflow-y-scroll"
                        >
                            {codeLanguages.map((lang) => (
                                <li key={lang}>
                                    <a
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedLang(lang);
                                            setShowCodeLanguages(false);
                                        }}
                                    >
                                        {lang}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <CopyButton editor={editor} getCodeDOMNode={getCodeDOMNode} />
                {canBePrettier(normalizedLang) && (
                    <PrettierButton
                        editor={editor}
                        getCodeDOMNode={getCodeDOMNode}
                        lang={normalizedLang}
                    />
                )}
            </div>
        </>
    );
}

function useCodeActionMenu(editor: LexicalEditor, anchorElem: HTMLElement) {
    const [isCode, setIsCode] = useState(false);
    const [nodeKey, setNodeKey] = useState<NodeKey | null>(null);

    const updateActionMenu = useCallback(() => {
        editor.getEditorState().read(() => {
            const selection = $getSelection();
            const nativeSelection = window.getSelection();
            const rootElement = editor.getRootElement();

            if (
                nativeSelection !== null &&
                (!$isRangeSelection(selection) ||
                    rootElement === null ||
                    !rootElement.contains(nativeSelection.anchorNode))
            ) {
                setIsCode(false);
                return;
            }

            if (!$isRangeSelection(selection)) {
                return;
            }

            const node = getSelectedNode(selection);

            if (selection.isCollapsed()) {
                if ($isCodeNode(node)) {
                    setIsCode(true);
                    setNodeKey(node.getKey());
                } else if ($isCodeHighlightNode(node)) {
                    setIsCode(true);
                    setNodeKey(node.getParent().getKey());
                } else {
                    setIsCode(false);
                }
            } else {
                setIsCode(false);
            }
        });
    }, [editor]);

    useEffect(() => {
        document.addEventListener("selectionchange", updateActionMenu);
        return () => {
            document.removeEventListener("selectionchange", updateActionMenu);
        };
    }, [updateActionMenu]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(updateActionMenu),
            editor.registerRootListener(() => {
                if (editor.getRootElement() === null) {
                    setIsCode(false);
                }
            })
        );
    }, [editor, updateActionMenu]);

    if (!isCode || nodeKey === null) {
        return null;
    }

    return createPortal(
        <CodingActionMenuContainer
            editor={editor}
            anchorElem={anchorElem}
            nodeKey={nodeKey}
        />,
        anchorElem
    );
}

export default function CodeActionMenuPlugin({ anchorElem = document.body }) {
    const [editor] = useLexicalComposerContext();
    return useCodeActionMenu(editor, anchorElem);
}
