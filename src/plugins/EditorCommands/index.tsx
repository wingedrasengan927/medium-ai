import {
    $getSelection,
    $isRangeSelection,
    $createParagraphNode,
    createCommand,
    COMMAND_PRIORITY_EDITOR,
    LexicalCommand,
    $isTextNode,
    KEY_BACKSPACE_COMMAND,
    LexicalEditor,
    COMMAND_PRIORITY_HIGH,
    $isDecoratorNode,
} from "lexical";
import { mergeRegister, $findMatchingParent } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import {
    $createHeadingNode,
    HeadingTagType,
    $createQuoteNode,
    $isQuoteNode,
    $isHeadingNode,
} from "@lexical/rich-text";
import { $isCodeNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";
import { getSelectedNode } from "../FloatingElements/utils";
import { $isLinkNode } from "@lexical/link";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $isImageNode } from "../../nodes/Image/ImageNode";
import { $isEquationNode } from "../../nodes/Math/EquationNode";

export const FORMAT_HEADING_COMMAND: LexicalCommand<void> = createCommand(
    "FORMAT_HEADING_COMMAND"
);

export const FORMAT_QUOTE_COMMAND: LexicalCommand<void> = createCommand(
    "FORMAT_QUOTE_COMMAND"
);

export const FORMAT_PARAGRAPH_COMMAND: LexicalCommand<void> = createCommand(
    "FORMAT_PARAGRAPH_COMMAND"
);

const setParagraphNode = () => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
        $setBlocksType(selection, $createParagraphNode);
    }
};

const setQuoteNode = () => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
        $setBlocksType(selection, $createQuoteNode);
    }
};

const setHeadingNode = (tag: HeadingTagType) => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
    }
};

export function isLinkAtSelection() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return false;
    }
    const node = getSelectedNode(selection);
    const linkParent = $findMatchingParent(node, $isLinkNode);
    return linkParent != null;
}

export function isBlockQuoteAtSelection() {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return false;
    }
    const node = getSelectedNode(selection);
    const quoteParent = $findMatchingParent(node, $isQuoteNode);
    return quoteParent != null;
}

export function isHeadingAtSelection(tag: HeadingTagType) {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        let isHeadingTag = false;
        if (nodes.length > 1) {
            // check if all nodes are heading nodes
            for (let i = 0; i < nodes.length; i++) {
                let node = nodes[i];
                if ($isTextNode(node)) {
                    node = node.getParentOrThrow();
                }
                if (node.getType() !== "heading") {
                    return false;
                }
                if (node.getTag() === tag) {
                    isHeadingTag = true;
                }
            }

            return isHeadingTag;
        }
        if (nodes.length === 1) {
            let node = nodes[0];
            if ($isTextNode(node)) {
                node = node.getParentOrThrow();
            }
            if (node.getType() === "heading") {
                return node.getTag() === tag;
            }
        }
    }
    return false;
}

export const insertHeadingCommand = (
    editor: LexicalEditor,
    isHeading: boolean,
    tag: HeadingTagType
) => {
    if (isHeading) {
        editor.dispatchCommand(FORMAT_PARAGRAPH_COMMAND, undefined);
    } else {
        // @ts-ignore
        editor.dispatchCommand(FORMAT_HEADING_COMMAND, tag);
    }
};

export const insertLinkCommand = (editor: LexicalEditor, isLink: boolean) => {
    if (!isLink) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
    } else {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
};

export const insertBlockQuoteCommand = (
    editor: LexicalEditor,
    isQuote: boolean
) => {
    if (isQuote) {
        editor.dispatchCommand(FORMAT_PARAGRAPH_COMMAND, undefined);
    } else {
        editor.dispatchCommand(FORMAT_QUOTE_COMMAND, undefined);
    }
};

export function isChatDisabled(editor: LexicalEditor) {
    let isDisabled = false;
    editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            isDisabled = true;
            return true;
        }
        const nodes = selection.getNodes();
        if (nodes.length > 1) {
            for (let i = 0; i < nodes.length; i++) {
                let node = nodes[i];
                if ($isDecoratorNode(node)) {
                    isDisabled = true;
                    return true;
                }
                if ($isTextNode(node)) {
                    node = node.getParentOrThrow();
                }
                // only allow one heading or quote node
                if (
                    $isQuoteNode(node) ||
                    $isHeadingNode(node) ||
                    $isCodeNode(node)
                ) {
                    isDisabled = true;
                    return true;
                }
            }
        }
    });
    return isDisabled;
}

export function EditorCommandsPlugin() {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                FORMAT_HEADING_COMMAND,
                (tag: HeadingTagType) => {
                    editor.update(() => {
                        setHeadingNode(tag);
                    });
                    return true;
                },
                COMMAND_PRIORITY_EDITOR
            ),
            editor.registerCommand(
                FORMAT_PARAGRAPH_COMMAND,
                () => {
                    editor.update(() => {
                        setParagraphNode();
                    });
                    return true;
                },
                COMMAND_PRIORITY_EDITOR
            ),
            editor.registerCommand(
                FORMAT_QUOTE_COMMAND,
                () => {
                    editor.update(() => {
                        setQuoteNode();
                    });
                    return true;
                },
                COMMAND_PRIORITY_EDITOR
            ),
            editor.registerCommand<KeyboardEvent>(
                KEY_BACKSPACE_COMMAND,
                (event) => {
                    const selection = $getSelection();
                    if (!$isRangeSelection(selection)) {
                        return false;
                    }
                    event.preventDefault();
                    const { anchor } = selection;
                    const anchorNode = anchor.getNode();

                    if (selection.isCollapsed() && $isTextNode(anchorNode)) {
                        let previousSibling = anchorNode.getPreviousSibling();
                        if (previousSibling === null && anchor.offset === 0) {
                            previousSibling = anchorNode
                                .getParentOrThrow()
                                .getPreviousSibling();
                        }
                        if (
                            previousSibling != null &&
                            anchor.offset === 0 &&
                            ($isEquationNode(previousSibling) ||
                                $isImageNode(previousSibling))
                        ) {
                            const nodeElement = editor.getElementByKey(
                                previousSibling.getKey()
                            );
                            if (nodeElement) {
                                nodeElement.click();
                                return true;
                            }
                        }
                    }

                    return false;
                },
                COMMAND_PRIORITY_HIGH
            )
        );
    }, [editor]);
    return null;
}
