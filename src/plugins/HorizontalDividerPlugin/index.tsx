import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
    $createHorizontalDividerNode,
    INSERT_HORIZONTAL_DIVIDER_COMMAND,
} from "../../nodes/HorizontalDividerNode";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
    $getSelection,
    $isParagraphNode,
    $isRangeSelection,
    COMMAND_PRIORITY_EDITOR,
} from "lexical";
import { useEffect } from "react";

export function HorizontalDividerPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        return editor.registerCommand(
            INSERT_HORIZONTAL_DIVIDER_COMMAND,
            () => {
                const selection = $getSelection();

                if (!$isRangeSelection(selection)) {
                    return false;
                }

                const focusNode = selection.focus.getNode();

                if (focusNode !== null) {
                    const horizontalDividerNode =
                        $createHorizontalDividerNode();
                    $insertNodeToNearestRoot(horizontalDividerNode);

                    // remove new paragraph
                    const nextSibling = horizontalDividerNode.getNextSibling();
                    if (
                        nextSibling !== null &&
                        $isParagraphNode(nextSibling) &&
                        nextSibling.getTextContent() === ""
                    ) {
                        nextSibling.remove();
                    }
                }

                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );
    }, [editor]);

    return null;
}
