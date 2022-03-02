import { useMemo } from "react";
import { Doc } from "yjs";
import RestProvider from "../RestProvider";
import useYjsAwareness, { User } from "./useYjsAwareness";

export const useRestProvider = (user: User, documentId: string) => {
    const ydoc = useMemo(() => new Doc({ guid: documentId }), [documentId]);
    const awareness = useYjsAwareness(user, ydoc);

    return useMemo(() => {
        return new RestProvider(ydoc, { awareness });
    }, [awareness, ydoc]);
};
