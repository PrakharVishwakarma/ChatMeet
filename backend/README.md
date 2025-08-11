# Omegle Clone - Backend

This is the backend for a real-time video chat application, similar to Omegle. It uses Node.js, Express, and Socket.IO to facilitate WebRTC connections between clients.

## Features

-   **User Management**: Handles user connections, disconnections, and queuing.
-   **Room Management**: Creates and manages private chat rooms for two users.
-   **WebRTC Signaling**: Forwards WebRTC offers, answers, and ICE candidates between peers.
-   **User Matching**: Randomly pairs users from a queue.
-   **Skip Functionality**: Allows users to disconnect from the current chat and find a new partner.
-   **Skip Cooldown**: Prevents recently skipped users from being re-matched.

## Project Structure

```
.
├── src
│   ├── index.ts          # Main entry point, sets up Express and Socket.IO
│   ├── config.ts         # Configuration loader for environment variables
│   └── managers
│       ├── UserManager.ts  # Handles user lifecycle, queueing, and matching
│       └── RoomManager.ts  # Manages chat rooms and WebRTC signaling
├── .env.example        # Example environment variables
├── package.json
└── tsconfig.json
```

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone 
    cd backend
    ```

2.  **Install dependencies:**

    Using Yarn:
    ```bash
    yarn install
    ```

    Or using npm:
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root directory by copying the example file:

    ```bash
    cp .env.example .env
    ```

    Then, edit the `.env` file with your desired configuration. See the [Environment Variables](#environment-variables) section for more details.

### Running the Application

1.  **Build the TypeScript code:**

    ```bash
    yarn build
    ```

2.  **Start the server:**

    ```bash
    yarn dev
    ```

    The server will start on the port specified in your `.env` file (default is `3000`).

## Environment Variables

The following environment variables are used to configure the application.

| Variable           | Description                                                  | Default                      |
| ------------------ | ------------------------------------------------------------ | ---------------------------- |
| `PORT`             | The port the server will listen on.                          | `3000`                       |
| `CORS_ORIGIN`      | The allowed origin for CORS requests (your frontend URL).    | `http://localhost:5173`      |
| `SKIP_COOLDOWN_MS` | The duration in milliseconds to prevent re-matching skipped users. | `300000` (5 minutes)   |

## Socket.IO Events

The server communicates with clients using the following Socket.IO events:

### Server-to-Client Events

| Event                  | Payload              | Description                                                                 |
| ---------------------- | -------------------- | --------------------------------------------------------------------------- |
| `create-offer`         | `{ roomId: string }` | Instructs the client to create and send a WebRTC offer.                     |
| `wait-for-offer`       | `{ roomId: string }` | Instructs the client to wait for a WebRTC offer from the other peer.        |
| `offer`                | `{ sdp, roomId }`    | Forwards a WebRTC offer to the other peer.                                  |
| `answer`               | `{ sdp, roomId }`    | Forwards a WebRTC answer to the other peer.                                 |
| `add-ice-candidate`    | `{ candidate }`      | Forwards an ICE candidate to the other peer.                                |
| `partner-disconnected` |                      | Notifies the client that their chat partner has disconnected.               |
| `lobby`                |                      | Notifies the client that they have been returned to the lobby/queue.        |

### Client-to-Server Events

| Event               | Payload                   | Description                                          |
| ------------------- | ------------------------- | ---------------------------------------------------- |
| `offer`             | `{ sdp, roomId }`         | Sends a WebRTC offer to the server for forwarding.   |
| `answer`            | `{ sdp, roomId }`         | Sends a WebRTC answer to the server for forwarding.  |
| `add-ice-candidate` | `{ candidate, roomId }`   | Sends an ICE candidate to the server for forwarding. |
| `skip`              |                           | Requests to disconnect and find a new partner.       |

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
