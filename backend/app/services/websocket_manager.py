import logging
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket

logger = logging.getLogger("nebula.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps user_email to set of active WebSockets for that user
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_email: str):
        await websocket.accept()
        if user_email not in self.active_connections:
            self.active_connections[user_email] = set()
        self.active_connections[user_email].add(websocket)
        logger.info(f"WebSocket client connected for user: {user_email} (Total connections: {len(self.active_connections[user_email])})")

    def disconnect(self, websocket: WebSocket, user_email: str):
        if user_email in self.active_connections:
            self.active_connections[user_email].discard(websocket)
            if not self.active_connections[user_email]:
                del self.active_connections[user_email]
        logger.info(f"WebSocket client disconnected for user: {user_email}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.warning(f"Error sending message to client: {e}")

    async def broadcast_to_user(self, user_email: str, message: Dict[str, Any]):
        """Broadcast a message to all open tabs/devices for a specific user email."""
        if user_email in self.active_connections:
            dead_connections = set()
            for connection in self.active_connections[user_email]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send to client for {user_email}: {e}")
                    dead_connections.add(connection)
            for dead in dead_connections:
                self.active_connections[user_email].discard(dead)

    async def broadcast_all(self, message: Dict[str, Any]):
        """Broadcast to all connected clients."""
        for user_email in list(self.active_connections.keys()):
            await self.broadcast_to_user(user_email, message)

ws_manager = ConnectionManager()
