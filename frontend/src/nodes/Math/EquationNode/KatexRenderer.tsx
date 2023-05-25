import katex from "katex";
import { useEffect, useRef } from "react";

export default function KatexRenderer({
    equation,
    inline,
}: {
    equation: string;
    inline: boolean;
}) {
    const katexElemRef = useRef(null);

    useEffect(() => {
        const katexElem = katexElemRef.current;

        if (katexElem !== null) {
            katex.render(equation, katexElem, {
                displayMode: !inline,
                errorColor: "#cc0000",
                output: "html",
                strict: "warn",
                throwOnError: false,
                trust: false,
            });
        }
    }, [equation, inline]);

    return (
        <>
            <span role="button" tabIndex={-1} ref={katexElemRef} />
        </>
    );
}
