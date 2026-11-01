//! Serves the tithi web app. HOST and PORT override the default 127.0.0.1:8080.

#[tokio::main]
async fn main() {
    let host = std::env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = format!("{host}:{port}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|e| panic!("cannot listen on {addr}: {e}"));
    println!("tithi web app on http://{addr}");
    axum::serve(listener, tithi_web::app()).await.expect("server stopped");
}
