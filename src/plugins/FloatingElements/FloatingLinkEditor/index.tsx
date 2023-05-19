import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    $getSelection,
    $isRangeSelection,
    COMMAND_PRIORITY_HIGH,
    COMMAND_PRIORITY_LOW,
    COMMAND_PRIORITY_CRITICAL,
    KEY_ESCAPE_COMMAND,
    SELECTION_CHANGE_COMMAND,
    LexicalEditor,
    RangeSelection,
    NodeSelection,
    GridSelection,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { setFloatingElemPositionForLinkEditor, sanitizeUrl } from "../utils";
import * as React from "react";

import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { isLinkAtSelection } from "../../EditorCommands";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

type FloatingLinkEditorProps = {
    editor: LexicalEditor;
    isLink: boolean;
    anchorElem: HTMLElement;
};

function FloatingLinkEditor({
    editor,
    isLink,
    anchorElem,
}: FloatingLinkEditorProps) {
    const editorRef = useRef(null); // reference the editor
    const inputRef = useRef<HTMLInputElement>(null); // reference the input element
    const [linkUrl, setLinkUrl] = useState("");
    const [editedLinkUrl, setEditedLinkUrl] = useState("");
    const [isEditMode, setEditMode] = useState(false);
    const [lastSelection, setLastSelection] = useState<
        RangeSelection | NodeSelection | GridSelection | null
    >(null);

    const updateLinkEditor = useCallback(() => {
        // update the floating link editor with the url of
        // the link node that is currently selected
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const node = selection.anchor.getNode();
            const parent = node.getParent();
            if ($isLinkNode(parent)) {
                setLinkUrl(parent.getURL());
            } else if ($isLinkNode(node)) {
                setLinkUrl(node.getURL());
            } else {
                setLinkUrl("");
            }
        }

        const editorElem = editorRef.current;
        const nativeSelection = window.getSelection();
        // returns the element that currently has focus
        const activeElement = document.activeElement;

        if (editorElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();

        if (
            selection != null &&
            nativeSelection != null &&
            rootElement != null &&
            rootElement.contains(nativeSelection.anchorNode) &&
            editor.isEditable()
        ) {
            setEditMode(false);
            const domRect =
                nativeSelection.focusNode?.parentElement?.getBoundingClientRect();
            if (domRect != null) {
                setFloatingElemPositionForLinkEditor(
                    domRect,
                    editorElem,
                    anchorElem
                );
            }

            // update the selection and re-render the component
            // if the selection is different from the last selection
            setLastSelection(selection);
        } else if (
            !activeElement ||
            !activeElement?.classList.contains("link-input")
        ) {
            if (rootElement !== null) {
                setFloatingElemPositionForLinkEditor(
                    null,
                    editorElem,
                    anchorElem
                );
            }
            setLastSelection(null);
            setEditMode(false);
            setLinkUrl("");
        }

        return true;
    }, [editor, anchorElem]);

    // getBoundingClientRect() returns the position of the element relative to the viewport.
    // so the position changes if the user scrolls or resizes the window.
    // hence we need to add a listener to the window resize event and the scroll event.
    useEffect(() => {
        const update = () => {
            editor.getEditorState().read(() => {
                updateLinkEditor();
            });
        };

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update);

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
        };
    }, [anchorElem, editor, updateLinkEditor]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateLinkEditor();
        });

        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateLinkEditor();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateLinkEditor();
                    return true;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                // hide the floating link editor when the user presses the escape key
                KEY_ESCAPE_COMMAND,
                () => {
                    if (isLink && editorRef.current) {
                        setFloatingElemPositionForLinkEditor(
                            null,
                            editorRef.current,
                            anchorElem
                        );
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_HIGH
            )
        );
    }, [editor, updateLinkEditor, isLink, anchorElem]);

    useEffect(() => {
        if (isEditMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditMode]);

    // handle key press events during editing
    const monitorInputInteraction = (
        event: React.KeyboardEvent<HTMLElement>
    ) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleLinkSubmission();
        } else if (event.key === "Escape") {
            event.preventDefault();
            setEditMode(false);
        }
    };

    // update the link when user press the enter key
    const handleLinkSubmission = () => {
        if (lastSelection !== null) {
            if (linkUrl !== "") {
                editor.dispatchCommand(
                    TOGGLE_LINK_COMMAND,
                    sanitizeUrl(editedLinkUrl)
                );
            }
            setEditMode(false);
        }
    };

    return (
        <div
            ref={editorRef}
            className="absolute z-10 top-0 left-0 max-w-sm w-full opacity-0 selection:bg-sky-800"
        >
            {!isLink ? null : isEditMode ? (
                // if the editor is in edit mode, show the input
                <div className="input flex flex-row items-center justify-between box-border">
                    <input
                        ref={inputRef}
                        value={editedLinkUrl}
                        className="link-input bg-transparent border-0 outline-0 w-full"
                        // update the link url whenever the input value changes
                        onChange={(event) => {
                            setEditedLinkUrl(event.target.value);
                        }}
                        onKeyDown={(event) => {
                            monitorInputInteraction(event);
                        }}
                    />
                    <div className="flex flex-row items-center justify-between">
                        <div
                            className="mx-1 hover:text-white"
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={handleLinkSubmission}
                        >
                            <DoneIcon fontSize="small" />
                        </div>
                        <div
                            className="ml-1 hover:text-white"
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                setEditMode(false);
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </div>
                    </div>
                </div>
            ) : (
                // if the editor is not in edit mode, show the link
                <>
                    <div className="input flex flex-row items-center justify-between box-border">
                        <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whitespace-nowrap overflow-hidden text-ellipsis hover:underline underline-offset-2 hover:text-white"
                        >
                            {linkUrl}
                        </a>
                        <div className="flex flex-row items-center justify-between;">
                            <div
                                className="mx-1 hover:text-white"
                                role="button"
                                tabIndex={0}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    setEditedLinkUrl(linkUrl);
                                    setEditMode(true);
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </div>
                            <div
                                className="ml-1 hover:text-white"
                                role="button"
                                tabIndex={0}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => {
                                    editor.dispatchCommand(
                                        TOGGLE_LINK_COMMAND,
                                        null
                                    );
                                }}
                            >
                                <DeleteIcon fontSize="small" />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function useFloatingLinkEditorToolbar(
    editor: LexicalEditor,
    anchorElem: HTMLElement
) {
    const [activeEditor, setActiveEditor] = useState(editor);
    const [isLink, setIsLink] = useState(false);

    const updateToolbar = useCallback(() => {
        setIsLink(isLinkAtSelection());
    }, []);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_payload, newEditor) => {
                    updateToolbar();
                    setActiveEditor(newEditor);
                    return false;
                },
                COMMAND_PRIORITY_CRITICAL
            )
        );
    }, [editor, updateToolbar]);

    return createPortal(
        <FloatingLinkEditor
            editor={activeEditor}
            isLink={isLink}
            anchorElem={anchorElem}
        />,
        anchorElem
    );
}

export default function FloatingLinkEditorPlugin({
    anchorElem = document.body,
}) {
    const [editor] = useLexicalComposerContext();
    return useFloatingLinkEditorToolbar(editor, anchorElem);
}
