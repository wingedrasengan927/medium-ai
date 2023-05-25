import {
    LexicalNode,
    LexicalEditor,
    $getSelection,
    $isRangeSelection,
} from "lexical";

import "katex/dist/katex.css";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $createEquationNode } from "../../nodes/Math/EquationNode";
import { TextNode, $insertNodes, $isTextNode, $createTextNode } from "lexical";

type match = {
    start: number;
    end: number;
};

const createEquationNode = (
    match: match,
    textNode: LexicalNode,
    isInline: boolean
) => {
    const { start, end } = match;
    const splitNodes = textNode.splitText(start, end);
    const node = start === 0 ? splitNodes[0] : splitNodes[1];
    if (node) {
        const textContent = node.getTextContent();
        const equation = isInline
            ? textContent.slice(1, textContent.length - 1)
            : textContent.slice(2, textContent.length - 2);
        const equationNode = $createEquationNode(equation, isInline);

        const prevSibling = node.getPreviousSibling();
        const nextSibling = node.getNextSibling();
        const spaceNode = $createTextNode(" ");

        if (prevSibling && $isTextNode(prevSibling)) {
            node.remove();
            prevSibling.insertAfter(equationNode);
        } else if (nextSibling && $isTextNode(nextSibling)) {
            node.remove();
            nextSibling.insertBefore(equationNode);
        } else {
            node.remove();
            $insertNodes([equationNode]);
        }

        const selection = $getSelection();
        if (
            $isRangeSelection(selection) &&
            selection.isCollapsed() &&
            selection.anchor.getNode() === equationNode.getPreviousSibling()
        ) {
            const nextSibling = equationNode.getNextSibling();
            if (nextSibling !== null && $isTextNode(nextSibling)) {
                nextSibling.select(0, 0);
            } else {
                equationNode.insertAfter(spaceNode);
                spaceNode.select();
            }
        }
    }
};

const getInlineEquationMatch = (text: string) => {
    const re = /\$[^$]+\$/g;
    const match = re.exec(text);
    if (!match) return null;

    let start = match.index;
    let end = match.index + match[0].length;

    // return none if '$' preceedes or succeeds the start and end of the match
    if (start > 0 && text[start - 1] === "$") return null;
    if (end < text.length && text[end] === "$") return null;

    return { start, end };
};

const getBlockEquationMatch = (text: string) => {
    const re = /\$\$[^$]+\$\$/g;
    const match = re.exec(text);
    if (!match) return null;
    return { start: match.index, end: match.index + match[0].length };
};

const equationTransform = (editor: LexicalEditor) => {
    editor.registerNodeTransform(TextNode, (textNode) => {
        const textContent = textNode.getTextContent();
        if (textContent.includes("$")) {
            let match = getInlineEquationMatch(textContent);
            if (match) {
                createEquationNode(match, textNode, true);
                return;
            }
            match = getBlockEquationMatch(textContent);
            if (match) {
                createEquationNode(match, textNode, false);
                return;
            }
        }
    });
};

export const EquationListenerPlugin = () => {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        return equationTransform(editor);
    }, [editor]);
    return null;
};
