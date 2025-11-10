import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8765 });
const spaces = new Map();

wss.on('connection', (ws) => {
  let userId = null;
  let currentSpace = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case 'join_space':
          userId = msg.user_id;
          currentSpace = msg.space_id;

          if (!spaces.has(currentSpace)) {
            spaces.set(currentSpace, new Map());
          }

          const space = spaces.get(currentSpace);
          space.set(userId, {
            id: userId,
            name: msg.name,
            x: 10,
            y: 10,
            direction: 'down',
            is_agent: msg.is_agent,
            ws,
          });

          broadcast(currentSpace, {
            type: 'user_joined',
            user: {
              id: userId,
              name: msg.name,
              x: 10,
              y: 10,
              direction: 'down',
              is_agent: msg.is_agent,
            },
          }, userId);

          ws.send(JSON.stringify({
            type: 'space_state',
            space_id: currentSpace,
            users: Array.from(space.values()).map(u => ({
              id: u.id,
              name: u.name,
              x: u.x,
              y: u.y,
              direction: u.direction,
              is_agent: u.is_agent,
            })),
          }));
          break;

        case 'update_position':
          if (currentSpace && userId) {
            const space = spaces.get(currentSpace);
            const user = space?.get(userId);
            if (user) {
              user.x = msg.x;
              user.y = msg.y;
              user.direction = msg.direction;

              broadcast(currentSpace, {
                type: 'position_update',
                user_id: userId,
                x: msg.x,
                y: msg.y,
                direction: msg.direction,
              }, userId);
            }
          }
          break;

        case 'chat_message':
          if (currentSpace && userId) {
            const space = spaces.get(currentSpace);
            const user = space?.get(userId);
            broadcast(currentSpace, {
              type: 'chat_broadcast',
              user_id: userId,
              name: user?.name || 'Unknown',
              message: msg.message,
            });
          }
          break;

        case 'leave_space':
          if (currentSpace && userId) {
            const space = spaces.get(currentSpace);
            space?.delete(userId);
            broadcast(currentSpace, {
              type: 'user_left',
              user_id: userId,
            });
          }
          break;
      }
    } catch (e) {
      console.error('Message error:', e);
    }
  });

  ws.on('close', () => {
    if (currentSpace && userId) {
      const space = spaces.get(currentSpace);
      space?.delete(userId);
      broadcast(currentSpace, {
        type: 'user_left',
        user_id: userId,
      });
    }
  });

  function broadcast(spaceId, msg, excludeUserId = null) {
    const space = spaces.get(spaceId);
    if (!space) return;

    space.forEach((user, id) => {
      if (id !== excludeUserId && user.ws.readyState === 1) {
        user.ws.send(JSON.stringify(msg));
      }
    });
  }
});

console.log('WebSocket server running on ws://localhost:8765');
