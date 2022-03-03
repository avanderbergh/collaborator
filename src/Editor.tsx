import { ProsemirrorDevTools } from "@remirror/dev";
import {
    EditorComponent,
    Remirror,
    ThemeProvider,
    useRemirror,
} from "@remirror/react";
import { useCallback, useState } from "react";
import { prosemirrorNodeToHtml, RemirrorJSON } from "remirror";
import { AnnotationExtension, YjsExtension } from "remirror/extensions";
import "remirror/styles/all.css";

import useCurrentUser from "./hooks/useCurrentUser";
import useObservableListener from "./hooks/useObservableListener";
import { useRestProvider } from "./hooks/useRestProvider";

interface EditorProps {
    documentId: string;
}

const Status = ({ success = false }) => (
    <span className={`status ${success ? "success" : ""}`}>&nbsp;</span>
);

function Editor({ documentId }: EditorProps) {
    const currentUser = useCurrentUser();

    const provider = useRestProvider(currentUser, documentId);

    const [clientCount, setClientCount] = useState<number>(0);
    const [isSynced, setIsSynced] = useState<boolean>(false);
    const [docState, setDocState] = useState<RemirrorJSON>();

    const handleChange = useCallback(
        ({ state, tr }) => {
            if (tr?.docChanged) {
                const htmlString = prosemirrorNodeToHtml(state.doc);

                setDocState(state.toJSON().doc);
            }
        },
        [setDocState]
    );

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

    const { manager } = useRemirror({
        extensions: createExtensions,
    });

    return documentId ? (
        <ThemeProvider>
            <Remirror manager={manager} onChange={handleChange}>
                <h3>{documentId}</h3>

                <EditorComponent />
                <ProsemirrorDevTools />
                <div className="info-box">
                    <p className="info">Connected clients: {clientCount + 1}</p>
                    <p className="info">
                        Synced:{" "}
                        <Status success={isSynced || clientCount === 0} />
                    </p>
                </div>
            </Remirror>
        </ThemeProvider>
    ) : (
        <p>Start a new game</p>
    );
}

export default Editor;
