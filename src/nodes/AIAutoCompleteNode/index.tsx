import {
    $applyNodeReplacement,
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedTextNode,
    TextNode,
} from "lexical";
import { addClassNamesToElement } from "@lexical/utils";

type SerializedAutoCompleteNode = SerializedTextNode;

export class AutoCompleteNode extends TextNode {
    constructor(text: string, key?: NodeKey) {
        super(text, key);
    }

    static getType(): string {
        return "autocomplete";
    }

    static clone(node: TextNode): TextNode {
        return new AutoCompleteNode(node.__text, node.__key);
    }

    createDOM(config: EditorConfig): HTMLElement {
        const dom = document.createElement("span");
        const text = this.__text;
        dom.textContent = text;
        // @ts-ignore
        addClassNamesToElement(dom, config.theme.text?.autocomplete);
        return dom;
    }

    static importJSON(
        serializedNode: SerializedAutoCompleteNode
    ): AutoCompleteNode {
        const node = $createAutoCompleteNode(serializedNode.text);
        return node;
    }

    exportJSON(): SerializedAutoCompleteNode {
        return {
            ...super.exportJSON(),
            type: "autocomplete",
            version: 1,
        };
    }

    updateDOM(): boolean {
        return false;
    }
}

export function $createAutoCompleteNode(text: string): AutoCompleteNode {
    return $applyNodeReplacement(new AutoCompleteNode(text));
}

export const $isAutoCompleteNode = (
    node: LexicalNode | null | undefined
): node is AutoCompleteNode => {
    return node instanceof AutoCompleteNode;
};
