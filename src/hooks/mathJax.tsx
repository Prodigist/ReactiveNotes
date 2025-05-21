import { e } from "mathjs";
import React from "react";
export function useMathJax(children: React.ReactNode)  {
 // const containerRef = React.useRef(null);
        const containerRef = React.useRef<HTMLDivElement>(null);
        React.useEffect(() => {
            if (!containerRef.current || !window.MathJax) {
                if (!window.MathJax) {
                    console.warn("MathJax not available when RenderWrapper mounted.");
                }
                return;
            }
        
            const container = containerRef.current;
            let mathJaxProcessed = false; // Flag to ensure typesetPromise runs only after processing
            interface MathMatch {
                type: 'math';
                matched: string;
                displayMath?: string;
                inlineMath?: string;
                escapedMath?: string;
                startIndex: number;
                endIndex: number;
            }
            
            interface CodeMatch {
                type: 'code';
                matched: string;
                delimiter: string;
                content: string;
                startIndex: number;
                endIndex: number;
            }
            
            type Match = MathMatch | CodeMatch;
            const processSingleTextNode = (textNode: Text): DocumentFragment | null => {
                let currentText = textNode.nodeValue || '';
                if (!currentText.includes('$')) { // No dollar signs at all, nothing to do
                    return null;
                }
                    // Find all matches of both patterns
                const allMatches: Match[]  = [];
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
        
                // Regex to find $$...$$ (unescaped) or $...$ (unescaped) or escaped \$ or \$\$
                const mathRegex = /(?<!\\)\$\$(.*?)(?<!\\)\$\$|(?<!\\)\$(?!\s)(.*?)(?<!\s)(?<!\\)\$|\\(\$\$|\$)/gs;

                let mathMatch;
                while ((mathMatch = mathRegex.exec(currentText)) !== null) {
                    allMatches.push({
                        type: 'math',
                        matched: mathMatch[0],
                        displayMath: mathMatch[1],
                        inlineMath: mathMatch[2],
                        escapedMath: mathMatch[3],
                        startIndex: mathMatch.index,
                        endIndex: mathMatch.index + mathMatch[0].length
                    });
                }

                const codeBlockRegex = /(`+)((?:(?!\1).)*?)\1/gs;
                let codeMatch;
                while ((codeMatch = codeBlockRegex.exec(currentText)) !== null) {
                    allMatches.push({
                        type: 'code',
                        matched: codeMatch[0],
                        delimiter: codeMatch[1],
                        content: codeMatch[2],
                        startIndex: codeMatch.index,
                        endIndex: codeMatch.index + codeMatch[0].length
                    });
                }
    // Sort all matches by start index
    allMatches.sort((a, b) => a.startIndex - b.startIndex);
    
    // Track active matches (open but not yet closed)
    const activeMatches: Match[]  = [];
    
    // Process text with matches
    for (let i = 0; i < allMatches.length; i++) {
        const current = allMatches[i];
        
        // Add text before this match
        if (current.startIndex > lastIndex) {
            fragment.appendChild(document.createTextNode(
                currentText.substring(lastIndex, current.startIndex)
            ));
        }
        
        // Check if this match is inside any active match
        const isInsideCode = activeMatches.some(m => 
            m.type === 'code' && current.startIndex > m.startIndex && current.endIndex <= m.endIndex
        );
        
        if (isInsideCode) {
            continue;
        }
        
        // Process based on type
        if (current.type === 'code') {
            fragment.appendChild(document.createTextNode(current.matched));
            activeMatches.push(current);
            
            // Remove from active once processed
            setTimeout(() => {
                const index = activeMatches.indexOf(current);
                if (index > -1) activeMatches.splice(index, 1);
            }, 0);
        } else if (current.type === 'math') {
            if (current.displayMath !== undefined) {
                try {
                    const mathNode = window.MathJax.tex2chtml(current.displayMath, { display: true });
                    fragment.appendChild(mathNode);
                } catch (e) {
                    console.error("MathJax display math error:", e);
                    fragment.appendChild(document.createTextNode(current.matched));
                }
            } else if (current.inlineMath !== undefined) {
                try {
                    const mathNode = window.MathJax.tex2chtml(current.inlineMath, { display: false });
                    fragment.appendChild(mathNode);
                } catch (e) {
                    console.error("MathJax inline math error:", e);
                    fragment.appendChild(document.createTextNode(current.matched));
                }
            } else if (current.escapedMath !== undefined) {
                fragment.appendChild(document.createTextNode(current.escapedMath));
            }
        }
        
        lastIndex = current.endIndex;
    }
    
    // Add remaining text
    if (lastIndex < currentText.length) {
        fragment.appendChild(document.createTextNode(
            currentText.substring(lastIndex)
        ));
    }
    
    return fragment;

            };
        
            const processMathInElement = (element: HTMLElement) => {
                const textNodesToReplace: { originalNode: Text, newFragment: DocumentFragment }[] = [];
        
                const walker = document.createTreeWalker(
                    element,
                    NodeFilter.SHOW_TEXT,
                    null
                );
        
                let currentNode;
                while ((currentNode = walker.nextNode())) {
                    if (currentNode instanceof Text) {
                        const newContentFragment = processSingleTextNode(currentNode);
                        if (newContentFragment) {
                            textNodesToReplace.push({ originalNode: currentNode, newFragment: newContentFragment });
                        }
                    }
                }
        
                // Perform DOM replacements after identifying all nodes to avoid issues with the walker
                textNodesToReplace.forEach(({ originalNode, newFragment }) => {
                    originalNode.parentNode?.replaceChild(newFragment, originalNode);
                });
            };
        
            const typesetMath = async () => {
                if (!window.MathJax || !containerRef.current) return;
        
                try {
                    // Ensure MathJax startup is complete (important for initial loads)
                    if (window.MathJax.startup && typeof window.MathJax.startup.promise === 'object') {
                         await window.MathJax.startup.promise;
                    } else if (typeof window.MathJax.startup?.promise === 'function' ) { // older MathJax might have it as a function
                         await window.MathJax.startup.promise();
                    }
        
        
                    processMathInElement(container);
        
                    // Only call typesetPromise if we actually processed some math and if the container still exists
                    if (mathJaxProcessed && containerRef.current && typeof window.MathJax.typesetPromise === 'function') {
                        await window.MathJax.typesetPromise([containerRef.current]);
                        console.log("MathJax typesetting complete for:", containerRef.current);
                    }
                } catch (e) {
                    console.error("Error during MathJax processing or typesetting:", e);
                }
            };
        
            typesetMath();
        
            // Cleanup function
            return () => {
                try {
                    // Clear MathJax's knowledge of this container when the component unmounts
                    // or if the children prop changes, leading to this effect re-running.
                    if (window.MathJax && containerRef.current && typeof window.MathJax.typesetClear === 'function') {
                        window.MathJax.typesetClear([containerRef.current]);
                        console.log("MathJax state cleared for:", containerRef.current);
                    }
                } catch (e) {
                    console.warn("MathJax cleanup error:", e);
                }
            };
        }, [children]); // Re-run if children prop changes, implying new content to process.
        return containerRef;
    }
    export default useMathJax;