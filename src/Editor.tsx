import { ProsemirrorDevTools } from "@remirror/dev";
import {
    EditorComponent,
    Remirror,
    ThemeProvider,
    useRemirror,
} from "@remirror/react";
import { distance } from "fastest-levenshtein";
import { useCallback, useEffect, useRef, useState } from "react";
import { prosemirrorNodeToHtml, RemirrorJSON } from "remirror";
import { AnnotationExtension, YjsExtension } from "remirror/extensions";
import "remirror/styles/all.css";
import { useDebouncedCallback } from "use-debounce";
import AnnotationsJSONPrinter from "./AnnotationsJSONPrinter";
import FloatingAnnotations from "./FloatingAnnotations";
import useCurrentUser from "./hooks/useCurrentUser";
import useObservableListener from "./hooks/useObservableListener";
import { useRestProvider } from "./hooks/useRestProvider";
import useWebRtcProvider from "./hooks/useWebRtcProvider";
import { generateOutput, rules } from "./utils/challenge";

interface EditorProps {
    documentId: string;
    onFetch: Function;
    onSave: Function;
}

const TIMEOUT = 3000 + Math.floor(Math.random() * 7000);

const Status = ({ success = false }) => (
    <span className={`status ${success ? "success" : ""}`}>&nbsp;</span>
);

function Editor({ documentId, onFetch, onSave }: EditorProps) {
    const usedFallbackRef = useRef<boolean>(false);
    const currentUser = useCurrentUser();
    // const provider = useWebRtcProvider(currentUser, documentId);
    const provider = useRestProvider(currentUser, documentId);

    const [clientCount, setClientCount] = useState<number>(0);
    const [isSynced, setIsSynced] = useState<boolean>(false);
    const [docState, setDocState] = useState<RemirrorJSON>();

    const [requiredOutput, setRequiredOutput] = useState("");

    const [editsNeeded, setEditsNeeded] = useState(
        distance(documentId, generateOutput(documentId))
    );

    const [showAnswer, setShowAnswer] = useState(false);

    useEffect(() => {
        const r = generateOutput(documentId);
        setRequiredOutput(r);
        setEditsNeeded(distance(documentId, r));
    }, [documentId]);

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setProgress((documentId.length - editsNeeded) / documentId.length);
    }, [editsNeeded, documentId]);

    const handleChange = useCallback(
        ({ state, tr }) => {
            if (tr?.docChanged) {
                const htmlString = prosemirrorNodeToHtml(state.doc);
                const textString = htmlString.replace(/<[^>]+>/g, "");
                // console.log("html", htmlString);
                // console.log("text", textString);
                // console.log("required", requiredOutput);

                setEditsNeeded(distance(textString, requiredOutput));
                setDocState(state.toJSON().doc);
            }
        },
        [setDocState, requiredOutput]
    );

    const handleSave = useCallback(
        (newDocState) => {
            if (isSynced || clientCount === 0) {
                onSave(documentId, JSON.stringify(newDocState));
                const meta = provider.doc.getMap("meta");
                meta.set("lastSaved", Date.now());
            }
        },
        [onSave, documentId, provider.doc, isSynced, clientCount]
    );

    const handleSaveDebounced = useDebouncedCallback(handleSave, TIMEOUT);

    const handlePeersChange = useCallback(
        ({ webrtcPeers }) => {
            setClientCount(webrtcPeers.length);
        },
        [setClientCount]
    );

    useObservableListener("peers", handlePeersChange, provider);

    const handleSynced = useCallback(
        ({ synced }) => {
            setIsSynced(synced);
        },
        [setIsSynced]
    );

    useObservableListener("synced", handleSynced, provider);

    useEffect(() => {
        handleSaveDebounced(docState);
    }, [handleSaveDebounced, docState]);

    const handleYDocUpdate = useCallback(() => {
        handleSaveDebounced.cancel();
    }, [handleSaveDebounced]);

    useObservableListener("update", handleYDocUpdate, provider.doc);

    const createExtensions = useCallback(() => {
        if (!provider) return [];
        provider.connect();
        return [
            new YjsExtension({
                getProvider: () => provider,
            }),
            new AnnotationExtension(),
        ];
    }, [provider]);

    const { manager, getContext } = useRemirror({
        extensions: createExtensions,
    });

    useEffect(() => {
        if (usedFallbackRef.current) return;

        const fetchFallback = async () => {
            if (provider.connected && clientCount === 0) {
                const res = await onFetch(documentId);
                getContext()?.setContent(JSON.parse(res));
            }
            usedFallbackRef.current = true;
        };

        const timeoutId = window.setTimeout(fetchFallback, 1000);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [onFetch, documentId, provider.connected, clientCount, getContext]);

    return documentId ? (
        <ThemeProvider>
            <Remirror manager={manager} onChange={handleChange}>
                <h3>{documentId}</h3>
                <div>
                    {rules.map(({ description }, i) => (
                        <p key={i}>{description}</p>
                    ))}
                </div>
                <p>
                    <b>Edits Needed:</b> {editsNeeded}
                </p>
                <div>
                    <progress max="1" value={progress}>{`${Math.floor(
                        progress * 100
                    )}%`}</progress>
                </div>
                <EditorComponent />
                <FloatingAnnotations />
                <ProsemirrorDevTools />
                <div className="info-box">
                    <p className="info">Connected clients: {clientCount + 1}</p>
                    <p className="info">
                        Synced:{" "}
                        <Status success={isSynced || clientCount === 0} />
                    </p>
                </div>
                <button onClick={() => setShowAnswer((prev) => !prev)}>
                    {showAnswer ? "Hide Answer" : "Show Answer"}
                </button>
                {showAnswer && (
                    <p>
                        <b>Answer:</b> {requiredOutput}
                    </p>
                )}

                <h3>Current annotations</h3>
                <AnnotationsJSONPrinter />
            </Remirror>
        </ThemeProvider>
    ) : (
        <p>Start a new game</p>
    );
}

export default Editor;
