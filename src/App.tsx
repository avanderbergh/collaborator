import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import Editor from "./Editor";
import UserProvider, { User } from "./UserProvider";
import { generateInput } from "./utils/challenge";
import getRandomUserName from "./utils/getRandomUserName";

interface Document {
    body: string;
}

const api = axios.create({
    baseURL: "https://60b9308780400f00177b6434.mockapi.io/yjs-webrtc/v1/",
    headers: { "Content-Type": "application/json" },
});

function App() {
    const currentUser: User = useMemo(() => {
        const id = uuid();
        return {
            id,
            name: getRandomUserName(id),
        };
    }, []);

    const handleFetch = useCallback(async (id) => {
        return {};
    }, []);

    const handleSave = useCallback(async (id, body) => {
        return;
    }, []);

    const [gameId, setGameId] = useState("");

    const handleNewGame = () => {
        setGameId(generateInput(16));
    };

    const [joinGameInput, setJoinGameInput] = useState("");

    const joinGame = () => {
        setGameId(joinGameInput);
        setJoinGameInput("");
    };

    return (
        <UserProvider.Provider value={currentUser}>
            <div className="app">
                <h1>Collaborator</h1>
                <p>Apply the given rules to the code below.</p>
                <button onClick={handleNewGame}>New Game</button>
                <div>
                    <input
                        value={joinGameInput}
                        onChange={({ target }) =>
                            setJoinGameInput(target.value)
                        }
                        type="text"
                    />
                    <button onClick={joinGame}>Join Game</button>
                </div>
                <Editor
                    documentId={gameId}
                    onFetch={handleFetch}
                    onSave={handleSave}
                />
            </div>
        </UserProvider.Provider>
    );
}

export default App;
