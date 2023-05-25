import type {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    LexicalCommand,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
} from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
    $applyNodeReplacement,
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    COMMAND_PRIORITY_LOW,
    createCommand,
    DecoratorNode,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
} from "lexical";
import { useCallback, useEffect } from "react";
import HorizontalDividerIcon from "../../assets/icons/HorizontalDividerIcon";

export const INSERT_HORIZONTAL_DIVIDER_COMMAND: LexicalCommand<void> =
    createCommand("INSERT_HORIZONTAL_DIVIDER_COMMAND");

function HorizontalDividerComponent({ nodeKey }: { nodeKey: NodeKey }) {
    const [editor] = useLexicalComposerContext();
    const [isSelected] = useLexicalNodeSelection(nodeKey);

    const onDelete = useCallback(
        (payload: KeyboardEvent) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);
                if (node !== null && $isHorizontalDividerNode(node)) {
                    node.remove();
                }

                // TODO: uncomment this when we have a better way to handle selection
                // setSelected(false);
            }
            return false;
        },
        [isSelected, nodeKey]
    );

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                KEY_DELETE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                KEY_BACKSPACE_COMMAND,
                onDelete,
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, onDelete]);

    useEffect(() => {
        const hrElem = editor.getElementByKey(nodeKey);
        if (hrElem !== null) {
            hrElem.className = isSelected ? "selected" : "";
        }
    }, [editor, isSelected, nodeKey]);

    return (
        <div className="flex items-center mt-7 justify-center text-gray-900">
            <HorizontalDividerIcon />
        </div>
    );
}

export class HorizontalDividerNode extends DecoratorNode<JSX.Element> {
    static getType(): string {
        return "horizontal-divider";
    }

    static clone(node: HorizontalDividerNode): HorizontalDividerNode {
        return new HorizontalDividerNode(node.__key);
    }

    static importJSON(): HorizontalDividerNode {
        return $createHorizontalDividerNode();
    }

    static importDOM(): DOMConversionMap | null {
        return {
            hr: () => ({
                conversion: convertHorizontalDividerElement,
                priority: 0,
            }),
        };
    }

    exportJSON(): SerializedLexicalNode {
        return {
            type: "horizontal-divider",
            version: 1,
        };
    }

    exportDOM(): DOMExportOutput {
        return { element: document.createElement("div") };
    }

    createDOM(): HTMLElement {
        return document.createElement("div");
    }

    getTextContent(): string {
        return "\n";
    }

    isInline() {
        return false;
    }

    updateDOM(): boolean {
        return false;
    }

    decorate(): JSX.Element {
        return <HorizontalDividerComponent nodeKey={this.__key} />;
    }
}

function convertHorizontalDividerElement(): DOMConversionOutput {
    return { node: $createHorizontalDividerNode() };
}

export function $createHorizontalDividerNode(): HorizontalDividerNode {
    return $applyNodeReplacement(new HorizontalDividerNode());
}

export function $isHorizontalDividerNode(
    node: LexicalNode | null | undefined
): node is HorizontalDividerNode {
    return node instanceof HorizontalDividerNode;
}
