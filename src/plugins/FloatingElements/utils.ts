import { $isAtNodeEnd } from "@lexical/selection";
import { RangeSelection } from "lexical";

/* this function is used to get the bounding rect of the element 
that is currently selected by the user */
export function getDOMRangeRect(
    nativeSelection: Selection,
    rootElement: HTMLElement
) {
    const domRange = nativeSelection.getRangeAt(0);

    let rect;

    if (nativeSelection.anchorNode === rootElement) {
        let inner = rootElement;
        while (inner.firstElementChild != null) {
            inner = inner.firstElementChild as HTMLElement;
        }
        rect = inner.getBoundingClientRect();
    } else {
        rect = domRange.getBoundingClientRect();
    }

    return rect;
}

/* this function is used to get either the anchor node, 
or the focus node depending on the selection direction.
The selected node element becomes the target for the floating element */
export function getSelectedNode(selection: RangeSelection) {
    const anchor = selection.anchor;
    const focus = selection.focus;
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    if (anchorNode === focusNode) {
        return anchorNode;
    }
    const isBackward = selection.isBackward();
    if (isBackward) {
        return $isAtNodeEnd(focus) ? anchorNode : focusNode;
    } else {
        return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
    }
}

const LINK_EDITOR_VERTICAL_GAP = 10;

export function setFloatingElemPositionForLinkEditor(
    targetRect: DOMRect | null,
    floatingElem: HTMLElement,
    anchorElem: HTMLElement,
    verticalGap = LINK_EDITOR_VERTICAL_GAP
) {
    const scrollerElem = anchorElem.parentElement;
    const editorInputElem = document.getElementsByClassName("editor-input")[0];

    if (targetRect === null || !scrollerElem) {
        // hide the floating element
        floatingElem.style.opacity = "0";
        floatingElem.style.transform = "translate(-1000px, -1000px)";
        return;
    }

    const floatingElemRect = floatingElem.getBoundingClientRect();
    const anchorElemRect = anchorElem.getBoundingClientRect();
    const editorScrollerRect = scrollerElem.getBoundingClientRect();
    const editorInputRect = editorInputElem.getBoundingClientRect();

    // the floating element would be placed at the top center of the target element
    let top = targetRect.top - floatingElemRect.height - verticalGap;
    let left =
        targetRect.left + targetRect.width / 2 - floatingElemRect.width / 2;

    if (top < editorInputRect.top || top < 0) {
        top += floatingElemRect.height + targetRect.height + verticalGap * 2;
    }

    if (left + floatingElemRect.width > editorScrollerRect.right) {
        left = editorScrollerRect.right - floatingElemRect.width;
    }

    if (left < editorScrollerRect.left) {
        left = editorScrollerRect.left;
    }

    // getBoundingClientRect returns the absolute position relative to the viewport
    // but css absolute positioning is relative to the nearest positioned ancestor
    // so we need to subtract the position of the anchor element
    // to get the position relative to the anchor element
    top -= anchorElemRect.top;
    left -= anchorElemRect.left;

    // the floating element starts with css property position: absolute
    // with the top and left set to 0
    // so translating it is same as positioning it
    floatingElem.style.transform = `translate(${left}px, ${top}px)`;
    floatingElem.style.opacity = "1";
}

const FORMAT_TOOLBAR_VERTICAL_GAP = 10;

export function setFloatingElemPositionForTextFormatToolbar(
    targetRect: DOMRect | null,
    floatingElem: HTMLElement,
    anchorElem: HTMLElement,
    verticalGap = FORMAT_TOOLBAR_VERTICAL_GAP
) {
    const scrollerElem = anchorElem.parentElement;
    const editorInputElem = document.getElementsByClassName("editor-input")[0];

    if (targetRect === null || !scrollerElem) {
        floatingElem.style.opacity = "0";
        floatingElem.style.transform = "translate(-1000px, -1000px)";
        return;
    }

    const floatingElemRect = floatingElem.getBoundingClientRect();
    const anchorElemRect = anchorElem.getBoundingClientRect();
    const editorScrollerRect = scrollerElem.getBoundingClientRect();
    const editorInputRect = editorInputElem.getBoundingClientRect();

    // the floating element would be placed at the top center of the target element
    let top = targetRect.top - floatingElemRect.height - verticalGap;
    let left =
        targetRect.left + targetRect.width / 2 - floatingElemRect.width / 2;

    if (top < editorInputRect.top || top < 0) {
        top += floatingElemRect.height + targetRect.height + verticalGap * 2;
    }

    if (left + floatingElemRect.width > editorScrollerRect.right) {
        left = editorScrollerRect.right - floatingElemRect.width;
    }

    if (left < editorScrollerRect.left) {
        left = editorScrollerRect.left;
    }

    top -= anchorElemRect.top;
    left -= anchorElemRect.left;

    floatingElem.style.transform = `translate(${left}px, ${top}px)`;
    floatingElem.style.opacity = "1";
}

const AI_EDITOR_VERTICAL_GAP = 10;

export function setFloatingElemPositionForAIEditor(
    targetRect: DOMRect | null,
    floatingElem: HTMLElement,
    anchorElem: HTMLElement,
    verticalGap = AI_EDITOR_VERTICAL_GAP
) {
    const scrollerElem = anchorElem.parentElement;

    if (targetRect === null || !scrollerElem) {
        floatingElem.style.opacity = "0";
        floatingElem.style.transform = "translate(-1000px, -1000px)";
        return;
    }

    const floatingElemRect = floatingElem.getBoundingClientRect();
    const anchorElemRect = anchorElem.getBoundingClientRect();
    const editorScrollerRect = scrollerElem.getBoundingClientRect();

    // the floating element would be placed at the bottom center of the target element
    let top = targetRect.top + targetRect.height + verticalGap;
    let left =
        targetRect.left + targetRect.width / 2 - floatingElemRect.width / 2;

    if (top + floatingElemRect.height > window.innerHeight) {
        top = targetRect.top - floatingElemRect.height - verticalGap;
    }

    if (left + floatingElemRect.width > editorScrollerRect.right) {
        left = editorScrollerRect.right - floatingElemRect.width;
    }

    if (left < editorScrollerRect.left) {
        left = editorScrollerRect.left;
    }

    top -= anchorElemRect.top;
    left -= anchorElemRect.left;

    floatingElem.style.transform = `translate(${left}px, ${top}px)`;
    floatingElem.style.opacity = "1";
}

export function sanitizeUrl(url: string) {
    /** A pattern that matches safe  URLs. */
    const SAFE_URL_PATTERN =
        /^(?:(?:https?|mailto|ftp|tel|file|sms):|[^&:/?#]*(?:[/?#]|$))/gi;

    /** A pattern that matches safe data URLs. */
    const DATA_URL_PATTERN =
        /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+/]+=*$/i;

    url = String(url).trim();

    if (url.match(SAFE_URL_PATTERN) || url.match(DATA_URL_PATTERN)) return url;

    return "https://";
}

const EQUATION_EDITOR_VERTICAL_GAP = 10;

export function setFloatingElemPositionForEquationEditor(
    targetRect: DOMRect | null,
    floatingElem: HTMLElement,
    anchorElem: HTMLElement,
    isInline: boolean,
    verticalGap = EQUATION_EDITOR_VERTICAL_GAP
) {
    const scrollerElem = anchorElem.parentElement;
    const editorInputElem = document.getElementsByClassName("editor-input")[0];

    if (targetRect === null || !scrollerElem) {
        floatingElem.style.opacity = "0";
        floatingElem.style.transform = "translate(-1000px, -1000px)";
        return;
    }

    const floatingElemRect = floatingElem.getBoundingClientRect();
    const anchorElemRect = anchorElem.getBoundingClientRect();
    const editorScrollerRect = scrollerElem.getBoundingClientRect();
    const editorInputRect = editorInputElem.getBoundingClientRect();

    let top;
    let left;
    left = targetRect.left + targetRect.width / 2 - floatingElemRect.width / 2;
    if (isInline) {
        // put the floating element at the bottom of the target element
        top = targetRect.top + targetRect.height + verticalGap;
    } else {
        // put the floating element at the center of the editor
        top =
            targetRect.top +
            targetRect.height / 2 -
            floatingElemRect.height / 2;
    }

    if (top + floatingElemRect.height > window.innerHeight) {
        if (isInline) {
            top = targetRect.top - floatingElemRect.height - verticalGap;
        } else {
            top =
                top -
                (top + floatingElemRect.height - window.innerHeight) -
                verticalGap;
        }
    }

    if (!isInline) {
        if (top < editorInputRect.top) {
            top = editorInputRect.top + verticalGap;
        }
        if (top < 0) {
            top = verticalGap;
        }
    }

    if (left + floatingElemRect.width > editorScrollerRect.right) {
        left = editorScrollerRect.right - floatingElemRect.width;
    }

    if (left < editorScrollerRect.left) {
        left = editorScrollerRect.left;
    }

    top -= anchorElemRect.top;
    left -= anchorElemRect.left;

    floatingElem.style.transform = `translate(${left}px, ${top}px)`;
    floatingElem.style.opacity = "1";
}

const BLOCK_TOLLBAR_HORIZONTAL_OFFSET = 20 + 32; // offset + width of the block toolbar

export function setFloatingElemPositionForBlockToolbar(
    targetRect: DOMRect | null,
    floatingElem: HTMLElement,
    anchorElem: HTMLElement,
    horizontalOffset = BLOCK_TOLLBAR_HORIZONTAL_OFFSET
) {
    const scrollerElem = anchorElem.parentElement;

    if (targetRect === null || !scrollerElem) {
        floatingElem.style.opacity = "0";
        floatingElem.style.transform = "translate(-1000px, -1000px)";
        return;
    }

    const floatingElemRect = floatingElem.getBoundingClientRect();
    const anchorElemRect = anchorElem.getBoundingClientRect();

    // the floating element would be placed to the left of the target selection
    let top =
        targetRect.top + targetRect.height / 2 - floatingElemRect.height / 2;
    let left = targetRect.left - horizontalOffset;

    top -= anchorElemRect.top;
    left -= anchorElemRect.left;

    floatingElem.style.transform = `translate(${left}px, ${top}px)`;
    floatingElem.style.opacity = "1";
}

const CODE_ACTION_MENU_VERTICAL_GAP = 5;
const CODE_ACTION_MENU_HORIZONTAL_OFFSET = 10;

export function setFloatingElemPositionForCodeActionMenu(
    targetRect: DOMRect | null,
    floatingElem: HTMLElement,
    anchorElem: HTMLElement,
    verticalGap = CODE_ACTION_MENU_VERTICAL_GAP,
    horizontalOffset = CODE_ACTION_MENU_HORIZONTAL_OFFSET
) {
    const scrollerElem = anchorElem.parentElement;

    if (targetRect === null || !scrollerElem) {
        floatingElem.style.opacity = "0";
        floatingElem.style.transform = "translate(-1000px, -1000px)";
        return;
    }

    const floatingElemRect = floatingElem.getBoundingClientRect();
    const anchorElemRect = anchorElem.getBoundingClientRect();

    let top = targetRect.top + verticalGap;
    let left = targetRect.right - floatingElemRect.width - horizontalOffset;

    top -= anchorElemRect.top;
    left -= anchorElemRect.left;

    floatingElem.style.transform = `translate(${left}px, ${top}px)`;
    floatingElem.style.opacity = "1";
}
