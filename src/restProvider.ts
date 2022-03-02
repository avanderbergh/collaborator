import { Doc, applyUpdate } from "yjs";
import { Observable } from "lib0/observable";

export default class RestProvider extends Observable<string> {
    constructor(doc: Doc) {
        super();

        doc.on("update", (update: Uint8Array, origin: any) => {
            // ignore updates applied by this provider
            if (origin !== this) {
                // this update was produced either locally or by another provider.
                this.emit("update", [update]);
            }
        });

        this.doc = doc;
        // listen to an event that fires when a remote update is received
        this.on("update", this.handleUpdate);
    }

    doc: Doc;

    private handleUpdate(update: Uint8Array) {
        applyUpdate(this.doc, update, this);
        console.log(this.doc);
    }
}
