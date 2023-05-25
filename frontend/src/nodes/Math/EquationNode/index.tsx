import type {
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from "lexical";

import katex from "katex";
import KatexRenderer from "./KatexRenderer";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect } from "react";
import { mergeRegister } from "@lexical/utils";
import { ErrorBoundary } from "react-error-boundary";

import {
    $applyNodeReplacement,
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    $isTextNode,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    DecoratorNode,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
} from "lexical";

type KatexComponentProps = {
    equation: string;
    isInline: boolean;
    nodeKey: NodeKey;
};

export type SerializedEquationNode = Spread<
    {
        equation: string;
        inline: boolean;
    },
    SerializedLexicalNode
>;

function KatexComponent({ equation, isInline, nodeKey }: KatexComponentProps) {
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelection] =
        useLexicalNodeSelection(nodeKey);

    const onDelete = useCallback(
        (payload: KeyboardEvent) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                const event = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);

                if (node === null) {
                    return false;
                }

                const prevSibling = node.getPreviousSibling();
                const nextSibling = node.getNextSibling();

                if (node.getType() === "equation") {
                    if ($isTextNode(prevSibling)) {
                        prevSibling.select();
                    } else if ($isTextNode(nextSibling)) {
                        nextSibling.select(0, 0);
                    } else {
                        node.getParent().select();
                    }

                    node.remove();
                }
            }
            return false;
        },
        [isSelected, nodeKey]
    );

    const onClick = useCallback(
        (event: MouseEvent) => {
            const mathElem = editor.getElementByKey(nodeKey);

            if (
                mathElem !== null &&
                event.target !== null &&
                mathElem.contains(event.target as Node)
            ) {
                if (!event.shiftKey) {
                    clearSelection();
                }
                setSelected(!isSelected);
                return true;
            }

            return false;
        },
        [editor, isSelected, nodeKey, clearSelection, setSelected]
    );

    useEffect(() => {
        return mergeRegister(
            editor.registerCommand(
                CLICK_COMMAND,
                onClick,
                COMMAND_PRIORITY_LOW
            ),
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
    }, [editor, onDelete, onClick]);

    useEffect(() => {
        const mathElem = editor.getElementByKey(nodeKey);
        if (mathElem !== null) {
            mathElem.className = isSelected ? "equation-selected" : "";
        }
    }, [editor, isSelected, nodeKey]);

    return (
        <ErrorBoundary onError={(e) => editor._onError(e)} fallback={null}>
            <KatexRenderer equation={equation} inline={isInline} />
        </ErrorBoundary>
    );
}

export class EquationNode extends DecoratorNode<JSX.Element> {
    __equation;
    __inline;

    static getType(): string {
        return "equation";
    }

    static clone(node: EquationNode): EquationNode {
        return new EquationNode(node.__equation, node.__inline, node.__key);
    }

    constructor(equation: string, inline: boolean, key?: NodeKey) {
        super(key);
        this.__equation = equation;
        this.__inline = inline;
    }

    static importJSON(serializedNode: SerializedEquationNode) {
        const node = $createEquationNode(
            serializedNode.equation,
            serializedNode.inline
        );
        return node;
    }

    exportJSON() {
        return {
            equation: this.getEquation(),
            inline: this.__inline,
            type: "equation",
            version: 1,
        };
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const element = document.createElement(this.__inline ? "span" : "div");
        // EquationNodes should implement `user-action:none` in their CSS to avoid issues with deletion on Android.
        element.className = "editor-equation";
        return element;
    }

    exportDOM() {
        const element = document.createElement(this.__inline ? "span" : "div");
        // Encode the equation as base64 to avoid issues with special characters
        const equation = this.__equation;
        element.setAttribute("data-lexical-equation", equation);
        element.setAttribute("data-lexical-inline", `${this.__inline}`);
        katex.render(this.__equation, element, {
            displayMode: !this.__inline, // true === block display //
            errorColor: "#cc0000",
            output: "html",
            strict: "warn",
            throwOnError: false,
            trust: false,
        });
        return { element };
    }

    static importDOM() {
        return {
            div: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute("data-lexical-equation")) {
                    return null;
                }
                return {
                    conversion: convertEquationElement,
                    priority: 2,
                };
            },
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute("data-lexical-equation")) {
                    return null;
                }
                return {
                    conversion: convertEquationElement,
                    priority: 1,
                };
            },
        };
    }

    updateDOM(prevNode: EquationNode): boolean {
        // If the inline property changes, replace the element
        return this.__inline !== prevNode.__inline;
    }

    getTextContent(): string {
        if (this.__inline) {
            return `$${this.__equation}$`;
        } else {
            return `$$${this.__equation}$$`;
        }
    }

    getEquation(): string {
        return this.__equation;
    }

    setEquation(equation: string): void {
        const writable = this.getWritable();
        writable.__equation = equation;
    }

    setInline(isInline: boolean) {
        const writable = this.getWritable();
        writable.__inline = isInline;
    }

    decorate(): JSX.Element {
        return (
            <KatexComponent
                equation={this.__equation}
                isInline={this.__inline}
                nodeKey={this.__key}
            />
        );
    }
}

function convertEquationElement(domNode: HTMLElement) {
    let equation = domNode.getAttribute("data-lexical-equation");
    const inline = domNode.getAttribute("data-lexical-inline") === "true";
    // Decode the equation from base64
    equation = equation || "";
    if (equation) {
        const node = $createEquationNode(equation, inline);
        return { node };
    }

    return null;
}

export function $createEquationNode(equation = "", inline = false) {
    const equationNode = new EquationNode(equation, inline);
    return $applyNodeReplacement(equationNode);
}

export function $isEquationNode(
    node: EquationNode | LexicalNode | null | undefined
) {
    return node instanceof EquationNode;
}
