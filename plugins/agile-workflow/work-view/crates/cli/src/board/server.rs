//! Localhost HTTP server for `work-view board`.

use std::fmt;
use std::io::{self, Read, Write};
use std::net::{Ipv4Addr, TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::time::Duration;

use super::{assets, feed, open, BoardOptions};

const MAX_REQUEST_HEADER_BYTES: usize = 8192;
const READ_TIMEOUT: Duration = Duration::from_secs(2);

const HEALTHZ: &[u8] = b"ok\n";
const NOT_FOUND: &[u8] = b"not found\n";
const BAD_REQUEST: &[u8] = b"bad request\n";
const INTERNAL_ERROR: &[u8] = b"internal server error\n";

pub(crate) struct BoundBoard {
    pub url: String,
    pub port: u16,
}

pub(crate) enum BoardServerError {
    Bind { start: u16, message: String },
    LocalAddr(io::Error),
    Serve(io::Error),
}

impl fmt::Display for BoardServerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            BoardServerError::Bind { start, message } => {
                write!(
                    f,
                    "could not bind 127.0.0.1:{start} or any higher port: {message}"
                )
            }
            BoardServerError::LocalAddr(e) => write!(f, "could not inspect bound address: {e}"),
            BoardServerError::Serve(e) => write!(f, "server error: {e}"),
        }
    }
}

pub(crate) fn serve_board(
    root: PathBuf,
    opts: BoardOptions,
) -> Result<BoundBoard, BoardServerError> {
    let listener = bind_localhost(opts.port)?;
    let port = listener
        .local_addr()
        .map_err(BoardServerError::LocalAddr)?
        .port();
    let bound = BoundBoard {
        url: format!("http://127.0.0.1:{port}/"),
        port,
    };

    println!(
        "work-view board: serving {} (port {})",
        bound.url, bound.port
    );
    io::stdout().flush().map_err(BoardServerError::Serve)?;
    open::open_after_bind(&bound.url, &opts);

    let mut served = 0usize;
    loop {
        let (stream, _) = listener.accept().map_err(BoardServerError::Serve)?;
        if let Err(e) = handle_connection(stream, &root) {
            eprintln!("work-view board: request error: {e}");
        }

        served = served.saturating_add(1);
        if opts.once && served >= 1 {
            return Ok(bound);
        }
    }
}

fn bind_localhost(start: u16) -> Result<TcpListener, BoardServerError> {
    let mut last_error = String::from("no ports were attempted");
    for port in start..=u16::MAX {
        match TcpListener::bind((Ipv4Addr::LOCALHOST, port)) {
            Ok(listener) => return Ok(listener),
            Err(e) if e.kind() == io::ErrorKind::AddrInUse => {
                last_error = e.to_string();
            }
            Err(e) => {
                return Err(BoardServerError::Bind {
                    start,
                    message: e.to_string(),
                });
            }
        }
    }

    Err(BoardServerError::Bind {
        start,
        message: last_error,
    })
}

fn handle_connection(mut stream: TcpStream, root: &PathBuf) -> io::Result<()> {
    let request = match read_request(&mut stream) {
        Ok(request) => request,
        Err(ReadRequestError::BadRequest) => {
            return write_response(&mut stream, Method::Get, bad_request_response());
        }
        Err(ReadRequestError::Io) => {
            return write_response(&mut stream, Method::Get, internal_error_response());
        }
    };

    let response = route_request(&request, root);
    write_response(&mut stream, request.method, response)
}

#[derive(Clone, Copy)]
enum Method {
    Get,
    Head,
}

struct Request {
    method: Method,
    path: String,
}

enum ReadRequestError {
    BadRequest,
    Io,
}

fn read_request(stream: &mut TcpStream) -> Result<Request, ReadRequestError> {
    stream
        .set_read_timeout(Some(READ_TIMEOUT))
        .map_err(|_| ReadRequestError::Io)?;

    let mut bytes = Vec::new();
    let mut chunk = [0u8; 512];

    while bytes.len() < MAX_REQUEST_HEADER_BYTES {
        let read = stream.read(&mut chunk).map_err(|_| ReadRequestError::Io)?;
        if read == 0 {
            break;
        }
        bytes.extend(chunk.iter().take(read).copied());
        if header_len(&bytes).is_some() {
            break;
        }
    }

    let header_len = match header_len(&bytes) {
        Some(len) if !bytes.is_empty() => len,
        _ => return Err(ReadRequestError::BadRequest),
    };
    let header_bytes = bytes
        .get(..header_len)
        .ok_or(ReadRequestError::BadRequest)?;
    let text = std::str::from_utf8(header_bytes).map_err(|_| ReadRequestError::BadRequest)?;
    let request_line = text.lines().next().ok_or(ReadRequestError::BadRequest)?;
    if request_line.trim().is_empty() {
        return Err(ReadRequestError::BadRequest);
    }
    let mut parts = request_line.split_whitespace();
    let method = match parts.next() {
        Some("GET") => Method::Get,
        Some("HEAD") => Method::Head,
        Some(_) => return Err(ReadRequestError::BadRequest),
        None => return Err(ReadRequestError::BadRequest),
    };
    let target = parts.next().ok_or(ReadRequestError::BadRequest)?;
    let version = parts.next().ok_or(ReadRequestError::BadRequest)?;
    if parts.next().is_some() || !version.starts_with("HTTP/") {
        return Err(ReadRequestError::BadRequest);
    }

    let path = match target.split('?').next() {
        Some(path) => path,
        None => target,
    };
    if !path.starts_with('/') {
        return Err(ReadRequestError::BadRequest);
    }

    Ok(Request {
        method,
        path: path.to_string(),
    })
}

fn header_len(bytes: &[u8]) -> Option<usize> {
    if let Some(position) = bytes.windows(4).position(|window| window == b"\r\n\r\n") {
        return Some(position.saturating_add(4));
    }
    bytes
        .windows(2)
        .position(|window| window == b"\n\n")
        .map(|position| position.saturating_add(2))
}

struct Response {
    status: u16,
    reason: &'static str,
    content_type: &'static str,
    body: Vec<u8>,
    allow: Option<&'static str>,
}

fn route_request(request: &Request, root: &Path) -> Response {
    match request.path.as_str() {
        "/healthz" => ok_response("text/plain; charset=utf-8", HEALTHZ),
        "/api/substrate" => match feed::build_feed(root) {
            Ok(json) => ok_response("application/json; charset=utf-8", json.into_bytes()),
            Err(e) => {
                eprintln!("work-view board: feed error: {e}");
                internal_error_response()
            }
        },
        path => match assets::asset_for_path(path) {
            Some(asset) => ok_response(asset.content_type, asset.bytes),
            None => not_found_response(),
        },
    }
}

fn ok_response<B: Into<Vec<u8>>>(content_type: &'static str, body: B) -> Response {
    Response {
        status: 200,
        reason: "OK",
        content_type,
        body: body.into(),
        allow: None,
    }
}

fn not_found_response() -> Response {
    Response {
        status: 404,
        reason: "Not Found",
        content_type: "text/plain; charset=utf-8",
        body: NOT_FOUND.to_vec(),
        allow: None,
    }
}

fn bad_request_response() -> Response {
    Response {
        status: 400,
        reason: "Bad Request",
        content_type: "text/plain; charset=utf-8",
        body: BAD_REQUEST.to_vec(),
        allow: None,
    }
}

fn internal_error_response() -> Response {
    Response {
        status: 500,
        reason: "Internal Server Error",
        content_type: "text/plain; charset=utf-8",
        body: INTERNAL_ERROR.to_vec(),
        allow: None,
    }
}

fn write_response(stream: &mut TcpStream, method: Method, response: Response) -> io::Result<()> {
    let mut headers = format!(
        "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\nX-Content-Type-Options: nosniff\r\n",
        response.status,
        response.reason,
        response.content_type,
        response.body.len()
    );
    if let Some(allow) = response.allow {
        headers.push_str("Allow: ");
        headers.push_str(allow);
        headers.push_str("\r\n");
    }
    headers.push_str("\r\n");

    stream.write_all(headers.as_bytes())?;
    if matches!(method, Method::Get) {
        stream.write_all(&response.body)?;
    }
    stream.flush()
}
