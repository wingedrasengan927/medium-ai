import { $isParagraphNode, LexicalEditor, LexicalNode, Point } from "lexical";

import {
    TextNode,
    $createTextNode,
    $getSelection,
    $isTextNode,
    $isRangeSelection,
    $isNodeSelection,
    $isDecoratorNode,
    $getRoot,
    $createParagraphNode,
    RootNode,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { HeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $isHorizontalDividerNode } from "../../nodes/HorizontalDividerNode";
import { $isCodeNode, $createCodeNode } from "@lexical/code";

const insertParagraphAtEnd = () => {
    // If the last child of the root is Decorator node,
    // we insert a paragraph node below it
    const rootNode = $getRoot();
    const lastNode = rootNode.getLastChild();
    if ($isDecoratorNode(lastNode) || $isCodeNode(lastNode)) {
        const paragraphNode = $createParagraphNode();
        rootNode.append(paragraphNode);
        return;
    }
};

const reduceParagraphMargin = (editor: LexicalEditor) => {
    // if a paragraph node is just below a heading node,
    // we reduce it's top margin
    const rootNode = $getRoot();
    const children = rootNode.getChildren();
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if ($isParagraphNode(child)) {
            const prevNode = child.getPreviousSibling();
            const nodeKey = child.getKey();
            const paragraphElement = editor.getElementByKey(nodeKey);
            if (prevNode !== null && paragraphElement !== null) {
                const currentMarginTop =
                    window.getComputedStyle(paragraphElement).marginTop;
                if ($isHeadingNode(prevNode)) {
                    if (currentMarginTop === "28px") {
                        paragraphElement.style.marginTop = "8px";
                    }
                } else {
                    if (currentMarginTop === "8px") {
                        paragraphElement.style.marginTop = "28px";
                    }
                }
            }
        }
    }
};

const insertCodeBlock = (textNode: LexicalNode) => {
    // insert a code block on '```'
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return;
    }

    const textContent = textNode.getTextContent();
    if (textContent === "```") {
        $setBlocksType(selection, () => $createCodeNode());
        textNode.remove();
    }
};

const deleteHorizontalDividerNode = () => {
    // delete the horizontal divider node if it's selected
    const selection = $getSelection();
    if (!$isNodeSelection(selection)) {
        return;
    }
    const nodes = selection.getNodes();
    if (nodes.length === 1 && $isHorizontalDividerNode(nodes[0])) {
        const node = nodes[0];

        const prevNode = node.getPreviousSibling();
        const nextNode = node.getNextSibling();

        if (prevNode !== null && !$isDecoratorNode(prevNode)) {
            prevNode.select();
        } else if (nextNode !== null && !$isDecoratorNode(nextNode)) {
            if ($isTextNode(nextNode)) {
                nextNode.select(0, 0);
            } else {
                nextNode.select();
            }
        } else {
            node.getParent().select();
        }

        node.remove();
    }
};

const removeExtraSpaces = (node: LexicalNode) => {
    // remove consecutive spaces
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return;
    }

    if (!$isTextNode(node)) {
        return;
    }

    const textContent = node.getTextContent();

    const getPointProperties = (point: Point) => {
        return {
            key: point.key,
            offset: point.offset,
            type: point.type,
        };
    };

    const re = new RegExp("  +", "g");
    if (re.test(textContent)) {
        const newTextContent = textContent.replace(re, " ");
        const { key, offset, type } = getPointProperties(selection.anchor);
        node.setTextContent(newTextContent);

        selection.anchor.set(key, offset - 1, type);
        selection.focus.set(key, offset - 1, type);

        // if the caret is immediately followed by a space,
        // shift the offset by 1
        if (newTextContent.charAt(offset - 1) === " ") {
            selection.anchor.set(key, offset, type);
            selection.focus.set(key, offset, type);
        }
    }
};

const insertSpaceAtCodeEnd = (textNode: LexicalNode) => {
    // insert space after an inline code node
    if (textNode.hasFormat("code")) {
        if (textNode.getNextSibling() === null) {
            const emptySpaceNode = $createTextNode(" ");
            textNode.insertAfter(emptySpaceNode);
        }
    }
};

const removeSpaceAtCharacterEnd = () => {
    // if a text ends with a space, we remove the space
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return;
    }
    if (selection.isCollapsed() && selection.anchor.type === "text") {
        const textNode = selection.anchor.getNode();
        const textContent = textNode.getTextContent();
        const textSize = textContent.length;
        if (textNode.getNextSibling() === null && textContent.endsWith(" ")) {
            const selectionOffset = selection.anchor.offset;
            if (selectionOffset === textSize - 1) {
                textNode.spliceText(textSize - 1, 1, "", false);
            }
        }
    }
};

const cleanHeadingNode = (headingNode: LexicalNode) => {
    // remove styles, formats, and linebreaks from a heading node
    const children = headingNode.getChildren();
    children.forEach((child: LexicalNode) => {
        if ($isTextNode(child)) {
            child.setFormat(0);
        } else {
            child.remove();
        }
    });
};

const removeExtraSpacesTransform = (editor: LexicalEditor) => {
    return editor.registerNodeTransform(TextNode, removeExtraSpaces);
};

const insertSpaceAtCodeEndTransform = (editor: LexicalEditor) => {
    return editor.registerNodeTransform(TextNode, insertSpaceAtCodeEnd);
};

const insertCodeBlockTransform = (editor: LexicalEditor) => {
    return editor.registerNodeTransform(TextNode, insertCodeBlock);
};

const removeSpaceAtCharacterEndListener = (editor: LexicalEditor) => {
    return editor.registerNodeTransform(RootNode, removeSpaceAtCharacterEnd);
};

const deleteHorizontalDividerNodeListener = (editor: LexicalEditor) => {
    return editor.registerNodeTransform(RootNode, deleteHorizontalDividerNode);
};

const insertParagraphAtEndListener = (editor: LexicalEditor) => {
    return editor.registerNodeTransform(RootNode, insertParagraphAtEnd);
};

const cleanHeadingNodeTransform = (editor: LexicalEditor) => {
    return editor.registerNodeTransform(HeadingNode, cleanHeadingNode);
};

const reduceParagraphMarginTransform = (editor: LexicalEditor) => {
    return editor.registerNodeTransform(RootNode, () =>
        reduceParagraphMargin(editor)
    );
};

export default function EditorBehaviourPlugin() {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        return mergeRegister(
            insertSpaceAtCodeEndTransform(editor),
            removeSpaceAtCharacterEndListener(editor),
            removeExtraSpacesTransform(editor),
            cleanHeadingNodeTransform(editor),
            deleteHorizontalDividerNodeListener(editor),
            insertParagraphAtEndListener(editor),
            insertCodeBlockTransform(editor),
            reduceParagraphMarginTransform(editor)
        );
    }, [editor]);
    return null;
}
