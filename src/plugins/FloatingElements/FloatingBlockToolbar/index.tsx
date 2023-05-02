import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $getRoot,
    $getSelection,
    $isNodeSelection,
    $isParagraphNode,
    $isRangeSelection,
    COMMAND_PRIORITY_NORMAL,
    SELECTION_CHANGE_COMMAND,
    LexicalEditor,
    ParagraphNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { setFloatingElemPositionForBlockToolbar } from "../utils";
import { mergeRegister } from "@lexical/utils";
import * as React from "react";

import { INSERT_HORIZONTAL_DIVIDER_COMMAND } from "../../../nodes/HorizontalDividerNode";
import { INSERT_IMAGE_COMMAND } from "../../ImagePlugin";
import { $createCodeNode } from "@lexical/code";

import AddIcon from "@mui/icons-material/Add";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ImageIcon from "@mui/icons-material/Image";
import DataObjectIcon from "@mui/icons-material/DataObject";
import SaveAltIcon from "@mui/icons-material/SaveAlt";

type FloatingBlockToolbarProps = {
    editor: LexicalEditor;
    anchorElem: HTMLElement;
};

function FloatingBlockToolbarComponent({
    editor,
    anchorElem,
}: FloatingBlockToolbarProps) {
    const toolbarRef = useRef(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [currentParagraph, setCurrentParagraph] =
        useState<ParagraphNode | null>(null);

    const removeCurrentParagraph = useCallback(() => {
        if (currentParagraph) {
            editor.update(() => {
                const root = $getRoot();
                const firstChild = root.getFirstChild();
                if (firstChild !== null && !firstChild.is(currentParagraph)) {
                    currentParagraph.remove();
                }
            });
        }
    }, [currentParagraph, editor]);

    const insertHorizontalDivider = useCallback(() => {
        editor.dispatchCommand(INSERT_HORIZONTAL_DIVIDER_COMMAND, undefined);
        setShowOptions(false);
        removeCurrentParagraph();
    }, [editor, setShowOptions, removeCurrentParagraph]);

    const insertImage = useCallback(
        (payload: string) => {
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                payload: payload,
            });
            setShowOptions(false);
            removeCurrentParagraph();
        },
        [editor, setShowOptions, removeCurrentParagraph]
    );

    const insertCodeBlock = useCallback(() => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createCodeNode());
                setShowOptions(false);
                removeCurrentParagraph();
            }
        });
    }, [editor, setShowOptions, removeCurrentParagraph]);

    const closeOptions = useCallback(
        (e: MouseEvent) => {
            if (
                toolbarRef.current &&
                showOptions &&
                !(toolbarRef.current as Node).contains(e.target as Node)
            ) {
                setShowOptions(false);
            }
        },
        [setShowOptions, showOptions]
    );

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        const reader = new FileReader();
        reader.onload = function () {
            if (typeof reader.result === "string") {
                insertImage(reader.result);
            }
            return "";
        };
        if (files !== null) {
            reader.readAsDataURL(files[0]);
        }
    };

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();

        const toolbarElem = toolbarRef.current;
        const nativeSelection = window.getSelection();

        if (toolbarElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();
        if (
            selection != null &&
            nativeSelection != null &&
            nativeSelection.isCollapsed &&
            rootElement != null &&
            rootElement.contains(nativeSelection.anchorNode)
        ) {
            const paragraphNode = selection.getNodes()[0];
            if (!$isParagraphNode(paragraphNode)) {
                return;
            }
            const paragraphElem = editor.getElementByKey(
                paragraphNode.getKey()
            );
            if (paragraphElem !== null) {
                const rangeRect = paragraphElem.getBoundingClientRect();
                setFloatingElemPositionForBlockToolbar(
                    rangeRect,
                    toolbarElem,
                    anchorElem
                );

                setCurrentParagraph(paragraphNode);
            }
        }
    }, [editor, anchorElem]);

    useEffect(() => {
        const update = () => {
            editor.getEditorState().read(() => {
                updateToolbar();
            });
        };

        window.addEventListener("resize", update);
        window.addEventListener("scroll", update);
        document.addEventListener("mousedown", closeOptions);

        return () => {
            window.removeEventListener("resize", update);
            window.removeEventListener("scroll", update);
            document.removeEventListener("mousedown", closeOptions);
        };
    }, [anchorElem, editor, updateToolbar, closeOptions]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateToolbar();
        });

        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateToolbar();
                    return false;
                },
                COMMAND_PRIORITY_NORMAL
            )
        );
    }, [editor, updateToolbar]);

    return (
        <div
            className="absolute z-10 top-0 left-0 opacity-0 transition-opacity flex flex-row items-center justify-between"
            ref={toolbarRef}
        >
            <button
                className={
                    "btn btn-circle btn-outline btn-sm btn-accent no-animation transiton ease-in-out" +
                    (showOptions ? " rotate-45" : "")
                }
            >
                <AddIcon onClick={() => setShowOptions(!showOptions)} />
            </button>
            {showOptions && (
                // left margin of the below div should be equal to the left offset of the toolbar
                <div className="flex flex-row items-center justify-between ml-5">
                    <input
                        type="file"
                        accept="image/png, image/jpg"
                        ref={imageInputRef}
                        onChange={onFileChange}
                        className="hidden"
                    />

                    <button className="btn btn-circle btn-outline btn-accent btn-sm mr-2">
                        <MoreHorizIcon onClick={insertHorizontalDivider} />
                    </button>
                    <button className="btn btn-circle btn-outline btn-sm btn-accent mx-2">
                        <ImageIcon
                            className="mx-3"
                            onClick={() => {
                                if (imageInputRef.current !== null) {
                                    imageInputRef.current.click();
                                }
                            }}
                        />
                    </button>
                    <button className="btn btn-circle btn-outline btn-sm btn-accent mx-2">
                        <DataObjectIcon
                            className="mx-3"
                            onClick={insertCodeBlock}
                        />
                    </button>
                </div>
            )}
        </div>
    );
}

function useFloatingBlockToolbarPlugin(
    editor: LexicalEditor,
    anchorElem: HTMLElement
) {
    const [showToolbar, setShowToolbar] = useState(false);

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const selection = $getSelection();
                if ($isNodeSelection(selection)) {
                    setShowToolbar(false);
                }
                if ($isRangeSelection(selection)) {
                    const nodes = selection.getNodes();
                    const anchorOffset = selection.anchor.offset;
                    if (
                        selection.isCollapsed() &&
                        anchorOffset === 0 &&
                        nodes.length === 1 &&
                        $isParagraphNode(nodes[0])
                    ) {
                        setShowToolbar(true);
                    } else {
                        setShowToolbar(false);
                    }
                }
            });
        });
    }, [editor, anchorElem]);

    if (!showToolbar) {
        return null;
    }

    return createPortal(
        <FloatingBlockToolbarComponent
            editor={editor}
            anchorElem={anchorElem}
        />,
        anchorElem
    );
}

export default function FloatingBlockToolbarPlugin({
    anchorElem = document.body,
}) {
    const [editor] = useLexicalComposerContext();
    return useFloatingBlockToolbarPlugin(editor, anchorElem);
}
