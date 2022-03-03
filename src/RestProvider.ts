import { Doc, applyUpdate, encodeStateAsUpdate } from "yjs";
import { Observable } from "lib0/observable";
import awarenessProtocal from "y-protocols/awareness";
import { DebouncedFunc, throttle } from "lodash";

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
    postChanges!: DebouncedFunc<(body: any) => void>;

    connect() {
        console.log("connecting");
        this.connected = true;

        this.pollingInterval = setInterval(async () => {
            const res = await fetch(
                `//${window.location.hostname}:3001/document/${this.doc.guid}`,
                { referrer: "" }
            );
            const buffer = await res.arrayBuffer();
            const update = new Uint8Array(buffer);

            applyUpdate(this.doc, update, this);
        }, 1000);

        this.postChanges = throttle((body) => {
            fetch(
                `//${window.location.hostname}:3001/document/${this.doc.guid}`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/octet-stream",
                        Accept: "application/json",
                    },
                    body,
                }
            )
                .then((response) => response.json())
                .then((result) => {
                    console.log(result);
                });
        }, 1000);
    }
    disconnect() {
        console.log("disconnect");
        this.connected = false;
        clearInterval(this.pollingInterval);
    }

    private handleUpdate(update: Uint8Array) {
        applyUpdate(this.doc, update, this);

        const body = encodeStateAsUpdate(this.doc);

        applyUpdate(this.doc, body, this);

        this.postChanges(body);
    }
}
