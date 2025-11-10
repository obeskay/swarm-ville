use super::types::{ClientMessage, ServerMessage, SharedConnectionInfo, UserState};
use futures_util::stream::SplitSink;
use futures_util::SinkExt;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::Mutex;
use tokio_tungstenite::{tungstenite::Message, WebSocketStream};

pub type Sender = Arc<Mutex<SplitSink<WebSocketStream<TcpStream>, Message>>>;
pub type Clients = Arc<Mutex<HashMap<String, (Sender, SharedConnectionInfo)>>>;

pub async fn handle_client_message(
    msg: ClientMessage,
    client_id: &str,
    clients: Clients,
    conn_info: SharedConnectionInfo,
) -> Result<(), String> {
    match msg {
        ClientMessage::JoinSpace {
            space_id,
            user_id,
            name,
            is_agent,
        } => {
            let mut info = conn_info.lock().await;
            info.user_id = user_id.clone();
            info.name = name.clone();
            info.space_id = Some(space_id.clone());
            info.is_agent = is_agent;
            drop(info);

            let space_users = get_space_users(&space_id, &clients).await;

            let join_msg = ServerMessage::UserJoined {
                user: UserState {
                    id: user_id.clone(),
                    name: name.clone(),
                    x: 0.0,
                    y: 0.0,
                    direction: "down".to_string(),
                    is_agent,
                },
            };
            broadcast_to_space(&space_id, join_msg, &clients, Some(client_id)).await;

            let state_msg = ServerMessage::SpaceState {
                space_id: space_id.clone(),
                users: space_users,
            };
            send_to_client(client_id, state_msg, &clients).await;
        }

        ClientMessage::LeaveSpace { space_id } => {
            let info = conn_info.lock().await;
            let user_id = info.user_id.clone();
            drop(info);

            let leave_msg = ServerMessage::UserLeft { user_id };
            broadcast_to_space(&space_id, leave_msg, &clients, Some(client_id)).await;

            let mut info = conn_info.lock().await;
            info.space_id = None;
        }

        ClientMessage::UpdatePosition { x, y, direction } => {
            let mut info = conn_info.lock().await;
            info.x = x;
            info.y = y;
            info.direction = direction.clone();
            let space_id = info.space_id.clone();
            let user_id = info.user_id.clone();
            drop(info);

            if let Some(space_id) = space_id {
                let pos_msg = ServerMessage::PositionUpdate {
                    user_id,
                    x,
                    y,
                    direction,
                };
                broadcast_to_space(&space_id, pos_msg, &clients, Some(client_id)).await;
            }
        }

        ClientMessage::ChatMessage { message } => {
            let info = conn_info.lock().await;
            let space_id = info.space_id.clone();
            let user_id = info.user_id.clone();
            let name = info.name.clone();
            drop(info);

            if let Some(space_id) = space_id {
                let chat_msg = ServerMessage::ChatBroadcast {
                    user_id,
                    name,
                    message,
                };
                broadcast_to_space(&space_id, chat_msg, &clients, None).await;
            }
        }

        ClientMessage::AgentAction {
            action,
            target,
            data,
        } => {
            let info = conn_info.lock().await;
            let space_id = info.space_id.clone();
            let agent_id = info.user_id.clone();
            drop(info);

            if let Some(space_id) = space_id {
                let agent_msg = ServerMessage::AgentBroadcast {
                    agent_id,
                    action,
                    data,
                };
                broadcast_to_space(&space_id, agent_msg, &clients, Some(client_id)).await;
            }
        }
    }

    Ok(())
}

async fn get_space_users(space_id: &str, clients: &Clients) -> Vec<UserState> {
    let clients_lock = clients.lock().await;
    let mut users = Vec::new();

    for (_, (_, info)) in clients_lock.iter() {
        let info_lock = info.lock().await;
        if let Some(user_space_id) = &info_lock.space_id {
            if user_space_id == space_id {
                users.push(UserState {
                    id: info_lock.user_id.clone(),
                    name: info_lock.name.clone(),
                    x: info_lock.x,
                    y: info_lock.y,
                    direction: info_lock.direction.clone(),
                    is_agent: info_lock.is_agent,
                });
            }
        }
    }

    users
}

async fn broadcast_to_space(
    space_id: &str,
    msg: ServerMessage,
    clients: &Clients,
    exclude: Option<&str>,
) {
    let json = serde_json::to_string(&msg).unwrap();
    let ws_msg = Message::Text(json);

    let mut clients_lock = clients.lock().await;
    for (client_id, (sender, info)) in clients_lock.iter_mut() {
        if let Some(exclude_id) = exclude {
            if client_id == exclude_id {
                continue;
            }
        }

        let info_lock = info.lock().await;
        if let Some(user_space_id) = &info_lock.space_id {
            if user_space_id == space_id {
                drop(info_lock);
                // Note: In production, we should handle send errors properly
                // For now, we ignore failures as clients may disconnect
                let mut sender_lock = sender.lock().await;
                let _ = sender_lock.send(ws_msg.clone()).await;
            }
        }
    }
}

async fn send_to_client(client_id: &str, msg: ServerMessage, clients: &Clients) {
    let json = serde_json::to_string(&msg).unwrap();
    let ws_msg = Message::Text(json);

    let clients_lock = clients.lock().await;
    if let Some((sender, _)) = clients_lock.get(client_id) {
        let mut sender_lock = sender.lock().await;
        let _ = sender_lock.send(ws_msg).await;
    }
}
