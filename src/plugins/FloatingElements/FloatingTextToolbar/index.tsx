import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    $getSelection,
    COMMAND_PRIORITY_LOW,
    SELECTION_CHANGE_COMMAND,
    FORMAT_TEXT_COMMAND,
    $isRangeSelection,
    $isTextNode,
    LexicalEditor,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import {
    setFloatingElemPositionForTextFormatToolbar,
    getDOMRangeRect,
    getSelectedNode,
} from "../utils";
import {
    insertHeadingCommand,
    insertLinkCommand,
    isLinkAtSelection,
    isHeadingAtSelection,
    isBlockQuoteAtSelection,
    insertBlockQuoteCommand,
} from "../../EditorCommands";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isCodeHighlightNode } from "@lexical/code";

import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import CodeIcon from "@mui/icons-material/Code";
import InsertLinkIcon from "@mui/icons-material/InsertLink";
import TitleIcon from "@mui/icons-material/Title";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";

type FloatingTextFormatToolbarProps = {
    editor: LexicalEditor;
    anchorElem: HTMLElement;
    isBold: boolean;
    isItalic: boolean;
    isCode: boolean;
    isHeadingOne: boolean;
    isHeadingTwo: boolean;
    isHeadingThree: boolean;
    isQuote: boolean;
    isLink: boolean;
};

function FloatingTextFormatToolbar({
    editor,
    anchorElem,
    isBold,
    isItalic,
    isCode,
    isHeadingOne,
    isHeadingTwo,
    isHeadingThree,
    isQuote,
    isLink,
}: FloatingTextFormatToolbarProps) {
    const popUpToolbarRef = useRef(null);

    const isFormatDisabled = () => {
        return isHeadingOne || isHeadingTwo || isHeadingThree || isQuote;
    };

    const insertLink = useCallback(() => {
        insertLinkCommand(editor, isLink);
    }, [editor, isLink]);

    const insertBlockQuote = useCallback(() => {
        insertBlockQuoteCommand(editor, isQuote);
    }, [editor, isQuote]);

    const insertHeadingOne = useCallback(() => {
        insertHeadingCommand(editor, isHeadingOne, "h1");
    }, [editor, isHeadingOne]);

    const insertHeadingTwo = useCallback(() => {
        insertHeadingCommand(editor, isHeadingTwo, "h2");
    }, [editor, isHeadingTwo]);

    const insertHeadingThree = useCallback(() => {
        insertHeadingCommand(editor, isHeadingThree, "h3");
    }, [editor, isHeadingThree]);

    const insertSubHeading = useCallback(() => {
        if (isHeadingTwo || isHeadingThree) {
            if (isHeadingTwo) {
                insertHeadingThree();
            } else if (isHeadingThree) {
                insertHeadingCommand(editor, isHeadingThree, "h3");
            }
        } else {
            insertHeadingTwo();
        }
    }, [editor, isHeadingThree, isHeadingTwo]);

    const setClassForSubHeading = () => {
        if (isHeadingTwo || isHeadingThree) {
            if (isHeadingTwo) {
                return "btn-accent";
            } else if (isHeadingThree) {
                return "btn-active";
            }
        }
        return "";
    };

    const updateTextFormatFloatingToolbar = useCallback(() => {
        const selection = $getSelection();

        const popUpToolbarElem = popUpToolbarRef.current;
        const nativeSelection = window.getSelection();

        if (popUpToolbarElem === null) {
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

            setFloatingElemPositionForTextFormatToolbar(
                rangeRect,
                popUpToolbarElem,
                anchorElem
            );
        }
    }, [editor, anchorElem]);

    useEffect(() => {
        const update = () => {
            editor.getEditorState().read(() => {
                updateTextFormatFloatingToolbar();
            });
        };

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update);

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
        };
    }, [anchorElem, editor, updateTextFormatFloatingToolbar]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateTextFormatFloatingToolbar();
        });

        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateTextFormatFloatingToolbar();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateTextFormatFloatingToolbar();
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, updateTextFormatFloatingToolbar]);

    return (
        <div
            ref={popUpToolbarRef}
            className="absolute z-10 top-0 left-0 opacity-0"
        >
            {editor.isEditable() && (
                <>
                    <div className="btn-group btn-group-horizontal">
                        <button
                            onClick={() => {
                                editor.dispatchCommand(
                                    FORMAT_TEXT_COMMAND,
                                    "bold"
                                );
                            }}
                            className={"btn" + (isBold ? " btn-active" : "")}
                            type="button"
                            disabled={isFormatDisabled()}
                        >
                            <FormatBoldIcon />
                        </button>
                        <button
                            onClick={() => {
                                editor.dispatchCommand(
                                    FORMAT_TEXT_COMMAND,
                                    "italic"
                                );
                            }}
                            className={"btn" + (isItalic ? " btn-active" : "")}
                            type="button"
                            disabled={isFormatDisabled()}
                        >
                            <FormatItalicIcon />
                        </button>
                        <button
                            onClick={() => {
                                editor.dispatchCommand(
                                    FORMAT_TEXT_COMMAND,
                                    "code"
                                );
                            }}
                            className={"btn" + (isCode ? " btn-active" : "")}
                            type="button"
                            disabled={isFormatDisabled()}
                        >
                            <CodeIcon />
                        </button>
                        <button
                            onClick={insertHeadingOne}
                            className={
                                "btn" + (isHeadingOne ? " btn-active" : "")
                            }
                            type="button"
                        >
                            <TitleIcon />
                        </button>
                        <button
                            onClick={insertSubHeading}
                            className={"btn " + setClassForSubHeading()}
                            type="button"
                        >
                            <FormatSizeIcon />
                        </button>
                        <button
                            onClick={insertBlockQuote}
                            className={"btn " + (isQuote ? " btn-active" : "")}
                            type="button"
                        >
                            <FormatQuoteIcon />
                        </button>
                        <button
                            onClick={insertLink}
                            className={"btn" + (isLink ? " btn-active" : "")}
                            type="button"
                            disabled={isFormatDisabled()}
                        >
                            <InsertLinkIcon />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function useFloatingTextFormatToolbar(
    editor: LexicalEditor,
    anchorElem: HTMLElement
) {
    const [isText, setIsText] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isLink, setIsLink] = useState(false);
    const [isCode, setIsCode] = useState(false);
    const [isH1, setIsH1] = useState(false);
    const [isH2, setIsH2] = useState(false);
    const [isH3, setIsH3] = useState(false);
    const [isQuote, setIsQuote] = useState(false);
    const [isCodeHighlight, setIsCodeHighlight] = useState(false);
    const [isMouseUp, setIsMouseUp] = useState(false);
    const [isAutoCompleteText, setIsAutoCompleteText] = useState(false);

    const updateToolbar = useCallback(() => {
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
                setIsText(false);
                return;
            }

            if (!$isRangeSelection(selection)) {
                return;
            }

            setIsBold(selection.hasFormat("bold"));
            setIsItalic(selection.hasFormat("italic"));
            setIsCode(selection.hasFormat("code"));
            setIsH1(isHeadingAtSelection("h1"));
            setIsH2(isHeadingAtSelection("h2"));
            setIsH3(isHeadingAtSelection("h3"));
            setIsQuote(isBlockQuoteAtSelection());
            setIsLink(isLinkAtSelection());

            const node = getSelectedNode(selection);

            if (selection.getTextContent() !== "") {
                setIsCodeHighlight($isCodeHighlightNode(node));
                setIsText($isTextNode(node));
                setIsAutoCompleteText(node.getType() === "autocomplete");
            } else {
                setIsText(false);
            }

            const rawTextContent = selection
                .getTextContent()
                .replace(/\n/g, "");
            if (!selection.isCollapsed() && rawTextContent === "") {
                setIsText(false);
                return;
            }
        });
    }, [editor]);

    useEffect(() => {
        document.addEventListener("selectionchange", updateToolbar);

        // toolbar should not be shown when selecting text
        const editorInnerElement = document.querySelector(
            ".editor-inner"
        ) as HTMLElement;
        editorInnerElement.addEventListener("mouseup", () => {
            setIsMouseUp(true);
        });
        editorInnerElement.addEventListener("mousedown", () => {
            setIsMouseUp(false);
        });
        return () => {
            document.removeEventListener("selectionchange", updateToolbar);
            editorInnerElement.removeEventListener("mouseup", () => {
                setIsMouseUp(true);
            });
            editorInnerElement.removeEventListener("mousedown", () => {
                setIsMouseUp(false);
            });
        };
    }, [updateToolbar]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(updateToolbar),
            editor.registerRootListener(() => {
                if (editor.getRootElement() === null) {
                    setIsText(false);
                }
            })
        );
    }, [editor, updateToolbar]);

    if (
        !isText ||
        isLink ||
        isCodeHighlight ||
        !isMouseUp ||
        isAutoCompleteText
    ) {
        return null;
    }

    return createPortal(
        <FloatingTextFormatToolbar
            editor={editor}
            anchorElem={anchorElem}
            isBold={isBold}
            isItalic={isItalic}
            isCode={isCode}
            isHeadingOne={isH1}
            isHeadingTwo={isH2}
            isHeadingThree={isH3}
            isQuote={isQuote}
            isLink={isLink}
        />,
        anchorElem
    );
}

export default function FloatingTextFormatToolbarPlugin({
    anchorElem = document.body,
}) {
    const [editor] = useLexicalComposerContext();
    return useFloatingTextFormatToolbar(editor, anchorElem);
}
