import { useMemo } from "react";
import { Doc } from "yjs";
import RestProvider from "../restProvider";

export const useRestProvider = (documentId: string) => {
    const ydoc = useMemo(() => new Doc({ guid: documentId }), [documentId]);

    return useMemo(() => {
        return new RestProvider(ydoc);
    }, [ydoc, documentId]);
};
