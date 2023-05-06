import {
    $applyNodeReplacement,
    EditorConfig,
    LexicalNode,
    NodeKey,
    TextNode,
} from "lexical";
import { addClassNamesToElement } from "@lexical/utils";

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

    updateDOM(): boolean {
        return false;
    }
}

export function $createAutoCompleteNode(text: string, key?: NodeKey) {
    return $applyNodeReplacement(new AutoCompleteNode(text, key));
}

export const $isAutoCompleteNode = (
    node: LexicalNode | null | undefined
): node is AutoCompleteNode => {
    return node instanceof AutoCompleteNode;
};
