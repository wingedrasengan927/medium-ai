import React, {
    Suspense,
    useRef,
    useEffect,
    useCallback,
    useState,
} from "react";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
    $getNodeByKey,
    $getSelection,
    $isNodeSelection,
    $isParagraphNode,
    CLICK_COMMAND,
    COMMAND_PRIORITY_LOW,
    KEY_BACKSPACE_COMMAND,
    KEY_DELETE_COMMAND,
    NodeKey,
} from "lexical";

const imageCache = new Set();

function useSuspenseImage(src: string) {
    if (!imageCache.has(src)) {
        throw new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                imageCache.add(src);
                resolve(null);
            };
        });
    }
}

type LazyImageProps = {
    altText?: string;
    imageRef: React.RefObject<HTMLImageElement>;
    src: string;
    width?: "inherit" | number;
    height?: "inherit" | number;
    maxWidth?: number;
};

function LazyImage({
    altText,
    imageRef,
    src,
    width,
    height,
    maxWidth,
}: LazyImageProps) {
    useSuspenseImage(src);
    return (
        <img
            src={src}
            alt={altText}
            ref={imageRef}
            style={{
                height,
                maxWidth,
                width,
            }}
        />
    );
}

type ImageComponentProps = {
    altText?: string;
    height?: "inherit" | number;
    caption?: string;
    maxWidth?: number;
    nodeKey: NodeKey;
    src: string;
    width?: "inherit" | number;
};

export default function ImageComponent({
    src,
    altText,
    width,
    height,
    maxWidth,
    nodeKey,
    caption,
}: ImageComponentProps) {
    const imageRef = useRef(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const [currentCaption, setCurrentCaption] = useState(caption);
    const [editor] = useLexicalComposerContext();
    const [isSelected, setSelected, clearSelection] =
        useLexicalNodeSelection(nodeKey);

    const onInput = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (e.target instanceof HTMLTextAreaElement) {
                setCurrentCaption(e.target.value);
                editor.update(() => {
                    const node = $getNodeByKey(nodeKey);
                    if (node !== null) {
                        node.setCaption(e.target.value);
                    }
                });
            }
            const textAreaElem = textAreaRef.current;
            if (textAreaElem) {
                textAreaElem.style.height = "auto";
                textAreaElem.style.height = `${textAreaElem.scrollHeight}px`;
            }
        },
        [currentCaption, editor, nodeKey]
    );

    const onDelete = useCallback(
        (payload: KeyboardEvent) => {
            if (isSelected && $isNodeSelection($getSelection())) {
                // don't delete if textarea is in focus
                const textAreaElem = textAreaRef.current;
                if (
                    textAreaElem &&
                    textAreaElem.contains(document.activeElement)
                ) {
                    return false;
                }

                const event = payload;
                event.preventDefault();
                const node = $getNodeByKey(nodeKey);

                if (node === null) {
                    return false;
                }

                const prevSibling = node.getPreviousSibling();
                const nextSibling = node.getNextSibling();

                if (node.getType() === "image") {
                    if ($isParagraphNode(prevSibling)) {
                        prevSibling.select();
                    } else if ($isParagraphNode(nextSibling)) {
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
            const imageElem = editor.getElementByKey(nodeKey);

            if (
                imageElem !== null &&
                imageElem.contains(event.target as HTMLElement)
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
        const imageContainerElem = imageContainerRef.current;
        const textAreaElem = textAreaRef.current;
        if (imageContainerElem === null || textAreaElem === null) {
            return;
        }
        if (!textAreaElem.contains(document.activeElement) && isSelected) {
            imageContainerElem.className = "image-selected";
        } else {
            imageContainerElem.className = "";
        }
    }, [editor, isSelected]);

    return (
        <Suspense fallback={null}>
            <>
                <div ref={imageContainerRef}>
                    <LazyImage
                        src={src}
                        altText={altText}
                        imageRef={imageRef}
                        width={width}
                        height={height}
                        maxWidth={maxWidth}
                    />
                </div>

                <div>
                    <textarea
                        rows={1}
                        ref={textAreaRef}
                        value={currentCaption}
                        onChange={onInput}
                        className="h-auto text-sm font-lato text-gray-600 w-full text-center p-2 pb-0 focus:outline-none overflow-hidden bg-white resize-none"
                        placeholder="Enter a caption (optional)"
                    ></textarea>
                </div>
            </>
        </Suspense>
    );
}
