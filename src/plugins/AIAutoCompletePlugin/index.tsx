import {
    $createTextNode,
    $nodesOfType,
    COMMAND_PRIORITY_LOW,
    COMMAND_PRIORITY_NORMAL,
    KEY_TAB_COMMAND,
    LexicalEditor,
    NodeKey,
    SELECTION_CHANGE_COMMAND,
} from "lexical";

import {
    $getSelection,
    $isTextNode,
    $isRangeSelection,
    RootNode,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $isAtNodeEnd } from "@lexical/selection";
import {
    $createAutoCompleteNode,
    AutoCompleteNode,
} from "../../nodes/AIAutoCompleteNode";

function acceptSuggestion(editor: LexicalEditor) {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return;
    }

    if (!selection.isCollapsed()) {
        return;
    }

    const currentAutoCompleteNodes =
        $nodesOfType<AutoCompleteNode>(AutoCompleteNode);

    if (currentAutoCompleteNodes.length > 0) {
        const currentAutoCompleteNode = currentAutoCompleteNodes[0];
        // check if the node has been committed to the DOM
        const nodeKey: NodeKey = currentAutoCompleteNode.getKey();
        const nodeElement = editor.getElementByKey(nodeKey);
        if (nodeElement !== null) {
            // if the autocomplete node and the selection node aren't
            // in the same paragraph, don't accept the suggestion
            const selectedNode = selection.getNodes()[0];
            if (
                selectedNode.getParent() !== currentAutoCompleteNode.getParent()
            ) {
                return false;
            }

            // replace the autocomplete node with a text node
            const nodeText = currentAutoCompleteNode.getTextContent();
            const textNode = $createTextNode(nodeText);
            currentAutoCompleteNode.replace(textNode);
            textNode.select();
            return true;
        }
    }

    return false;
}

function deleteAutoCompleteNodes(editor: LexicalEditor) {
    const currentAutoCompleteNodes =
        $nodesOfType<AutoCompleteNode>(AutoCompleteNode);

    // delete the nodes that have been committed to the DOM
    currentAutoCompleteNodes.forEach((node) => {
        const nodeKey: NodeKey = node.getKey();
        const nodeElement = editor.getElementByKey(nodeKey);
        if (nodeElement !== null) {
            node.remove();
        }
    });
}

const handleSelectionChange = (editor: LexicalEditor) => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return;
    }

    if (!selection.isCollapsed()) {
        const selectedNodes = selection.getNodes();
        if (selectedNodes.length > 1) {
            deleteAutoCompleteNodes(editor);
            return;
        } else if (selectedNodes.length === 1) {
            const selectedNode = selectedNodes[0];
            if (selectedNode.getType() !== "autocomplete") {
                deleteAutoCompleteNodes(editor);
                return;
            }
        }
    }

    return false;
};

const insertAIAutoComplete = (editor: LexicalEditor) => {
    deleteAutoCompleteNodes(editor);

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return;
    }

    const anchor = selection.anchor;
    const anchorNode = anchor.getNode();

    if (
        selection.isCollapsed() &&
        $isTextNode(anchorNode) &&
        $isAtNodeEnd(anchor) &&
        anchorNode.getNextSibling() === null
    ) {
        const autoCompleteNode = $createAutoCompleteNode("auto-complete-test");
        anchorNode.insertAfter(autoCompleteNode, false);
        anchorNode.select();
    }
};

const insertAIAutoCompleteTransform = (editor: LexicalEditor) => {
    return editor.registerNodeTransform(RootNode, () =>
        insertAIAutoComplete(editor)
    );
};

export default function AIAutoCompletePlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return mergeRegister(
            insertAIAutoCompleteTransform(editor),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    handleSelectionChange(editor);
                    return false;
                },
                COMMAND_PRIORITY_NORMAL
            ),
            editor.registerCommand(
                KEY_TAB_COMMAND,
                (event: KeyboardEvent) => {
                    event.preventDefault();
                    if (acceptSuggestion(editor)) {
                        return true;
                    }
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor]);
    return null;
}
