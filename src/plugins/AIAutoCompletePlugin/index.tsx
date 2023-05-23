import {
    $createTextNode,
    $nodesOfType,
    COMMAND_PRIORITY_LOW,
    COMMAND_PRIORITY_NORMAL,
    KEY_TAB_COMMAND,
    LexicalEditor,
    LexicalNode,
    NodeKey,
    RangeSelection,
    SELECTION_CHANGE_COMMAND,
    $isParagraphNode,
} from "lexical";

import {
    $getSelection,
    $isTextNode,
    $isRangeSelection,
    RootNode,
} from "lexical";
import { $isListItemNode } from "@lexical/list";
import { mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $isAtNodeEnd } from "@lexical/selection";
import {
    $createAutoCompleteNode,
    AutoCompleteNode,
} from "../../nodes/AIAutoCompleteNode";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { AutoCompleteModel } from "../../components/MenuBar";

import { AUTOCOMPLETE_ENDPOINT, WAIT_TIME } from "../../constants";

type AutoCompleteResponse = {
    message: string;
};

type Context = {
    previousContext: string;
    nextContext: string;
    currentContext: string;
    modelName: AutoCompleteModel;
};

async function getAutoCompleteSuggestions(
    context: Context
): Promise<AutoCompleteResponse | null> {
    let response;
    try {
        response = await fetch(
            AUTOCOMPLETE_ENDPOINT +
                "?previousContext=" +
                context.previousContext +
                "&nextContext=" +
                context.nextContext +
                "&currentContext=" +
                context.currentContext +
                "&modelName=" +
                context.modelName
        );
    } catch (e) {
        return null;
    }
    if (response.ok) {
        const json = await response.json();
        return json;
    }

    return null;
}

const getAutoCompleteSuggestionsDebounced = (() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return async (context: Context) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        return new Promise((resolve) => {
            timeout = setTimeout(async () => {
                const suggestions = await getAutoCompleteSuggestions(context);
                resolve(suggestions);
            }, WAIT_TIME);
        });
    };
})();

function $isSameSelection(selection: RangeSelection): boolean {
    const currentSelection = $getSelection();
    if (!$isRangeSelection(currentSelection)) {
        return false;
    }

    return (
        selection.isCollapsed() &&
        selection.anchor.offset === currentSelection.anchor.offset
    );
}

function getAdjacentContext(node: LexicalNode) {
    const topLevelParent = node.getTopLevelElement();
    const previousSiblings = topLevelParent.getPreviousSiblings();
    const nextSiblings = topLevelParent.getNextSiblings();

    const previousContext = previousSiblings
        .map((sibling: LexicalNode) => sibling.getTextContent())
        .join("\n");

    const nextContext = nextSiblings
        .map((sibling: LexicalNode) => sibling.getTextContent())
        .join("\n");

    return {
        previousContext,
        nextContext,
    };
}

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

    if (selection.isCollapsed()) {
        const selectedNode = selection.getNodes()[0];
        if (selectedNode.getType() === "autocomplete") {
            selectedNode.getPreviousSibling()?.select();
            return;
        }
    } else {
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

const insertAIAutoComplete = (
    editor: LexicalEditor,
    autoCompleteModel: AutoCompleteModel
) => {
    deleteAutoCompleteNodes(editor);

    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
        return;
    }

    const anchor = selection.anchor;
    const anchorNode = anchor.getNode();
    const anchorParent = anchorNode.getParent();

    if (
        selection.isCollapsed() &&
        $isTextNode(anchorNode) &&
        anchorParent !== null &&
        ($isParagraphNode(anchorParent) ||
            $isListItemNode(anchorParent) ||
            $isQuoteNode(anchorParent) ||
            $isHeadingNode(anchorParent)) &&
        $isAtNodeEnd(anchor) &&
        anchorNode.getNextSibling() === null
    ) {
        // get context
        let { previousContext, nextContext } = getAdjacentContext(anchorNode);
        const currentContext = anchorParent.getTextContent();

        if ($isListItemNode(anchorParent)) {
            previousContext +=
                "\n" +
                anchorParent
                    .getPreviousSiblings()
                    .map((sibling: LexicalNode) => sibling.getTextContent())
                    .join("\n");

            nextContext =
                anchorParent
                    .getNextSiblings()
                    .map((sibling: LexicalNode) => sibling.getTextContent())
                    .join("\n") +
                "\n" +
                nextContext;
        }

        const context = {
            previousContext,
            currentContext,
            nextContext,
            modelName: autoCompleteModel,
        };

        if (currentContext.length > 0) {
            getAutoCompleteSuggestionsDebounced(context)
                .then((suggestions) => {
                    if (suggestions !== null) {
                        const receivedText = (
                            suggestions as AutoCompleteResponse
                        ).message;
                        editor.update(() => {
                            if (!$isSameSelection(selection)) {
                                return;
                            }
                            const autoCompleteNode =
                                $createAutoCompleteNode(receivedText);
                            anchorNode.insertAfter(autoCompleteNode, false);
                            anchorNode.select();
                        });
                    }
                })
                .catch((error) => {
                    console.log(error);
                });
        }
    }
};

const insertAIAutoCompleteTransform = (
    editor: LexicalEditor,
    autoCompleteModel: AutoCompleteModel
) => {
    return editor.registerNodeTransform(RootNode, () =>
        insertAIAutoComplete(editor, autoCompleteModel)
    );
};

export default function AIAutoCompletePlugin({
    autoCompleteModel,
}: {
    autoCompleteModel: AutoCompleteModel;
}) {
    const [editor] = useLexicalComposerContext();

    // trigger function when user presses ctrl+space
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === " ") {
                event.preventDefault();
                editor.update(() => {
                    insertAIAutoComplete(editor, autoCompleteModel);
                });
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [editor, autoCompleteModel]);

    useEffect(() => {
        return mergeRegister(
            insertAIAutoCompleteTransform(editor, autoCompleteModel),
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
    }, [editor, autoCompleteModel]);
    return null;
}
