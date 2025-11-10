use super::handlers::{handle_client_message, Clients};
use super::types::{ClientMessage, ConnectionInfo, SharedConnectionInfo};
use futures_util::StreamExt;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Mutex;
use tokio_tungstenite::accept_async;
use tokio_tungstenite::tungstenite::Message;

pub struct WebSocketServer {
    addr: SocketAddr,
    clients: Clients,
}

impl WebSocketServer {
    pub fn new(port: u16) -> Self {
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        let clients = Arc::new(Mutex::new(HashMap::new()));

        Self { addr, clients }
    }

    pub async fn start(self) -> Result<(), Box<dyn std::error::Error>> {
        let listener = TcpListener::bind(self.addr).await?;
        println!("WebSocket server listening on {}", self.addr);

        while let Ok((stream, addr)) = listener.accept().await {
            let clients = self.clients.clone();
            tokio::spawn(async move {
                if let Err(e) = handle_connection(stream, addr, clients).await {
                    eprintln!("Connection error: {}", e);
                }
            });
        }

        Ok(())
    }
}

async fn handle_connection(
    stream: TcpStream,
    addr: SocketAddr,
    clients: Clients,
) -> Result<(), Box<dyn std::error::Error>> {
    let ws_stream = accept_async(stream).await?;
    let (sender, mut receiver) = ws_stream.split();

    let client_id = uuid::Uuid::new_v4().to_string();
    let conn_info: SharedConnectionInfo = Arc::new(Mutex::new(ConnectionInfo::default()));

    // Wrap sender in Arc<Mutex<>> for shared access
    let sender = Arc::new(Mutex::new(sender));

    {
        let mut clients_lock = clients.lock().await;
        clients_lock.insert(client_id.clone(), (sender.clone(), conn_info.clone()));
    }

    println!("Client {} connected from {}", client_id, addr);

    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                    if let Err(e) = handle_client_message(
                        client_msg,
                        &client_id,
                        clients.clone(),
                        conn_info.clone(),
                    )
                    .await
                    {
                        eprintln!("Handler error: {}", e);
                    }
                }
            }
            Ok(Message::Close(_)) => break,
            Err(e) => {
                eprintln!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }

    {
        let mut clients_lock = clients.lock().await;
        clients_lock.remove(&client_id);
    }

    println!("Client {} disconnected", client_id);

    Ok(())
}
