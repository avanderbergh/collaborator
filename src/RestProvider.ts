import { Doc, applyUpdate, encodeStateAsUpdate } from "yjs";
import { Observable } from "lib0/observable";
import awarenessProtocal from "y-protocols/awareness";

export default class RestProvider extends Observable<string> {
    constructor(
        doc: Doc,
        {
            awareness,
        }: {
            awareness: awarenessProtocal.Awareness | null;
        }
    ) {
        super();
        this.doc = doc;
        this.awareness = awareness;
        doc.on("update", (update: Uint8Array, origin: any) => {
            // ignore updates applied by this provider
            if (origin !== this) {
                // this update was produced either locally or by another provider.
                this.emit("update", [update]);
            }
        });

        this.on("update", (update: Uint8Array) => {
            this.handleUpdate(update);
        });
    }

    doc: Doc;
    awareness: awarenessProtocal.Awareness | null;
    connected = false;
    pollingInterval!: NodeJS.Timer;
    connect() {
        console.log("connecting");
        this.connected = true;
        this.pollingInterval = setInterval(() => {
            fetch(`http://localhost:3001/document/${this.doc.guid}`, {
                mode: "no-cors",
            })
                .then((response) => {
                    console.log(response);
                    return response.arrayBuffer();
                })
                .then((buffer) => {
                    console.log("buffer", buffer);
                });
        }, 5000);
    }
    disconnect() {
        console.log("disconnect");
        this.connected = false;
        clearInterval(this.pollingInterval);
    }

    private handleUpdate(update: Uint8Array) {
        console.log(this);
        applyUpdate(this.doc, update, this);

        const body = encodeStateAsUpdate(this.doc);

        applyUpdate(this.doc, body, this);

        fetch(`http://localhost:3001/document/${this.doc.guid}`, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/octet-stream",
                Accept: "application/json",
            },
            body,
        }).then((response) => {
            console.log(response);
        });
    }
}
