import type {
    DOMConversionMap,
    DOMExportOutput,
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
} from "lexical";

import { DecoratorNode } from "lexical";
import { Suspense, lazy } from "react";

export type SerializedImageNode = Spread<
    {
        altText?: string;
        height?: number;
        maxWidth?: number;
        src: string;
        width?: number;
        caption?: string;
    },
    SerializedLexicalNode
>;

const ImageComponent = lazy(
    // @ts-ignore
    () => import("./ImageComponent")
);

function convertImageElement(domNode: Node) {
    if (domNode instanceof HTMLImageElement) {
        const { alt: altText, src } = domNode;
        const node = $createImageNode({ altText, src });
        return { node };
    }
    return null;
}

export class ImageNode extends DecoratorNode<JSX.Element> {
    __src: string;
    __altText?: string;
    __width?: "inherit" | number;
    __height?: "inherit" | number;
    __maxWidth?: number;
    __caption?: string;

    static getType(): string {
        return "image";
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(
            node.__src,
            node.__altText,
            node.__maxWidth,
            node.__width,
            node.__height,
            node.__caption,
            node.__key
        );
    }

    exportDOM(): DOMExportOutput {
        const element = document.createElement("img");
        element.setAttribute("src", this.__src);
        element.setAttribute("alt", this.__altText as string);

        return { element };
    }

    static importDOM(): DOMConversionMap {
        return {
            img: (node: Node) => ({
                conversion: convertImageElement,
                priority: 0,
            }),
        };
    }

    constructor(
        src: string,
        altText?: string,
        maxWidth?: number,
        width?: "inherit" | number,
        height?: "inherit" | number,
        caption?: string,
        key?: NodeKey
    ) {
        super(key);
        this.__src = src;
        this.__altText = altText;
        this.__maxWidth = maxWidth;
        this.__width = width || "inherit";
        this.__height = height || "inherit";
        this.__caption = caption;
    }

    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        const { altText, height, width, maxWidth, src, caption } =
            serializedNode;

        const node = $createImageNode({
            altText,
            height,
            maxWidth,
            src,
            width,
            caption,
        });

        return node;
    }

    exportJSON() {
        return {
            altText: this.getAltText(),
            height: this.__height === "inherit" ? 0 : this.__height,
            maxWidth: this.__maxWidth,
            src: this.getSrc(),
            type: "image",
            version: 1,
            width: this.__width === "inherit" ? 0 : this.__width,
            caption: this.__caption,
        };
    }

    setWidthAndHeight(
        width: "inherit" | number,
        height: "inherit" | number
    ): void {
        const writable = this.getWritable();
        writable.__width = width;
        writable.__height = height;
    }

    setCaption(caption: string): void {
        const writable = this.getWritable();
        writable.__caption = caption;
    }

    // View

    createDOM(config: EditorConfig) {
        const div = document.createElement("div");
        const theme = config.theme;
        const className = theme.image;
        if (className !== undefined) {
            div.className = className;
        }
        return div;
    }

    updateDOM(): boolean {
        return false;
    }

    getSrc(): string {
        return this.__src;
    }

    getAltText() {
        return this.__altText;
    }

    getCaption() {
        return this.__caption;
    }

    decorate() {
        return (
            <Suspense fallback={null}>
                <ImageComponent
                    src={this.__src}
                    altText={this.__altText}
                    width={this.__width}
                    height={this.__height}
                    maxWidth={this.__maxWidth}
                    nodeKey={this.getKey()}
                    caption={this.__caption}
                />
            </Suspense>
        );
    }
}

type ImageNodeOptions = {
    altText?: string;
    height?: "inherit" | number;
    maxWidth?: number;
    src: string;
    width?: "inherit" | number;
    caption?: string;
    key?: NodeKey;
};

export function $createImageNode({
    altText,
    height,
    maxWidth,
    src,
    width,
    caption,
    key,
}: ImageNodeOptions) {
    return new ImageNode(src, altText, maxWidth, width, height, caption, key);
}

export function $isImageNode(node: LexicalNode | null | undefined) {
    return node instanceof ImageNode;
}
