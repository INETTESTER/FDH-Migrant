import { check } from 'k6';
import { Counter, Trend, Rate } from 'k6/metrics';

// ===== Custom Metrics =====
const networkErrors = new Counter('network_errors');
const timeoutErrors = new Counter('timeout_errors');
const tlsErrors     = new Counter('tls_errors');
const dnsErrors     = new Counter('dns_errors');
const tcpErrors     = new Counter('tcp_errors');
const wsErrors      = new Counter('ws_errors');
const grpcErrors    = new Counter('grpc_errors');
const clientErrors  = new Counter('client_errors');
const serverErrors  = new Counter('server_errors');
const errorRate     = new Rate('error_rate');
const responseTrend = new Trend('response_time_trend');

// ===== Map error_code → errorType =====
function getErrorType(code) {
    switch (code) {
        // ── Generic ──────────────────────────
        case 1000: return 'GENERIC';                    // error ทั่วไป ไม่เข้าประเภทไหน

        // ── DNS ──────────────────────────────
        case 1010: return 'DNS_NO_SUCH_HOST';           // หา domain ไม่เจอ
        case 1011: return 'DNS_TEMPORARY';              // DNS ล้มชั่วคราว
        case 1012: return 'DNS_BY_POLICY';              // DNS ถูกบล็อกโดย policy
        case 1013: return 'DNS_NO_ANSWER';              // DNS ไม่ตอบกลับ

        // ── TCP ──────────────────────────────
        case 1020: return 'TCP_DIAL';                   // เปิด TCP connection ไม่ได้
        case 1021: return 'TCP_DIAL_TIMEOUT';           // TCP dial หมดเวลา
        case 1022: return 'TCP_RESET';                  // TCP connection ถูก reset กลางคัน

        // ── Blacklist ─────────────────────────
        case 1030: return 'BLACKLIST';                  // IP/host ถูก block
        case 1031: return 'BLACKLIST_CIDR';             // CIDR range ถูก block

        // ── TLS ──────────────────────────────
        case 1050: return 'TLS_GENERIC';                // TLS error ทั่วไป
        case 1051: return 'TLS_CERT_EXPIRED';           // Certificate หมดอายุ
        case 1052: return 'TLS_CERT_UNTRUSTED';         // Certificate ไม่ trusted
        case 1053: return 'TLS_REMOTE_HANDSHAKE';       // Server ปฏิเสธ handshake
        case 1054: return 'TLS_INTERNAL';               // TLS error ภายใน k6
        case 1055: return 'TLS_CERT_HOSTNAME';          // hostname ไม่ตรงกับ cert

        // ── HTTP Request ─────────────────────
        case 1100: return 'HTTP_GENERIC';               // HTTP error ทั่วไป
        case 1101: return 'REQUEST_TIMEOUT';            // k6 รอส่ง request นานเกิน

        // ── HTTP Response ────────────────────
        case 1110: return 'RESPONSE_GENERIC';           // response error ทั่วไป
        case 1111: return 'CONNECTION_RESET';           // connection ถูกตัดกลางคัน
        case 1112: return 'CONNECTION_REFUSED';         // server ปฏิเสธ connection
        case 1120: return 'RESPONSE_HEADER_LARGE';      // response header ใหญ่เกิน
        case 1121: return 'RESPONSE_HEADER_MALFORMED';  // response header format ผิด
        case 1122: return 'RESPONSE_INVALID_STATUS';    // status code ไม่ถูกต้อง
        case 1123: return 'RESPONSE_MISSING_PROTOCOL';  // ไม่มี protocol ใน response
        case 1124: return 'RESPONSE_NO_STATUS';         // ไม่มี status code กลับมา
        case 1200: return 'RESPONSE_TIMEOUT';           // รอ response นานเกิน
        case 1201: return 'RESPONSE_BODY_TIMEOUT';      // รอรับ body นานเกิน
        case 1210: return 'RESPONSE_DECOMPRESS';        // แตก compress ไม่ได้

        // ── Proxy ────────────────────────────
        case 1500: return 'PROXY_GENERIC';              // proxy error ทั่วไป
        case 1501: return 'PROXY_AUTH';                 // proxy authentication ล้มเหลว
        case 1502: return 'PROXY_CONNECT';              // เชื่อมต่อ proxy ไม่ได้

        // ── WebSocket (2xxx) ──────────────────
        case 2000: return 'WS_GENERIC';                 // WebSocket error ทั่วไป
        case 2001: return 'WS_INVALID_HANDSHAKE';       // WebSocket handshake ผิดพลาด
        case 2002: return 'WS_INVALID_MESSAGE';         // message format ผิด
        case 2003: return 'WS_MESSAGE_TOO_BIG';         // message ใหญ่เกินที่กำหนด
        case 2004: return 'WS_UNEXPECTED_CLOSE';        // server ปิด connection โดยไม่แจ้ง

        // ── gRPC (3xxx) ───────────────────────
        case 3000: return 'GRPC_GENERIC';               // gRPC error ทั่วไป
        case 3001: return 'GRPC_METHOD_NOT_FOUND';      // ไม่เจอ method ที่เรียก

        default:   return `UNKNOWN (code=${code})`;     // ไม่รู้จัก error_code นี้
    }
}

// ===== Counter เพิ่มตาม error group =====
function countByGroup(code) {
    if (!code) { networkErrors.add(1); return; }
    if      (code >= 1010 && code <= 1013) dnsErrors.add(1);
    else if (code >= 1020 && code <= 1022) tcpErrors.add(1);
    else if (code >= 1050 && code <= 1055) tlsErrors.add(1);
    else if (code === 1101 || code === 1200 || code === 1201) timeoutErrors.add(1);
    else if (code >= 2000 && code <= 2004) wsErrors.add(1);
    else if (code >= 3000 && code <= 3001) grpcErrors.add(1);
    else networkErrors.add(1);
}

// ===== Main =====
export function error_check(response) {

    // ── guard: response null/undefined ────
    if (!response) {
        console.error(`[SCRIPT ERROR] response is null/undefined | VU=${__VU} ITER=${__ITER}`);
        networkErrors.add(1);
        errorRate.add(1);
        return;
    }

    // ── response time trend ───────────────
    if (response.timings) {
        responseTrend.add(response.timings.duration);
    }

    // ── check ก่อน ─────
    check(response, {
        '200 OK'                    : (r) => r.status === 200,
        '201 Created'               : (r) => r.status === 201,
        '204 No Content'            : (r) => r.status === 204,
        '400 Bad Request'           : (r) => r.status === 400,
        '401 Unauthorized'          : (r) => r.status === 401,
        '403 Forbidden'             : (r) => r.status === 403,
        '404 Not Found'             : (r) => r.status === 404,
        '422 Unprocessable Content' : (r) => r.status === 422,
        '429 Too Many Requests'     : (r) => r.status === 429,
        '500 Internal Server Error' : (r) => r.status === 500,
        '502 Bad Gateway'           : (r) => r.status === 502,
        '503 Service Unavailable'   : (r) => r.status === 503,
        '504 Gateway Timeout'       : (r) => r.status === 504,
    });

    // ── status=0 : Network / Unknown ──────
    if (response.status === 0) {
        const errorType = getErrorType(response.error_code);
        countByGroup(response.error_code);
        errorRate.add(1);
        console.error(
            `[NETWORK ERROR | ${errorType}] ` +
            `VU=${__VU} ITER=${__ITER} | ` +
            `error_code=${response.error_code} | ` +
            `error="${response.error}" | ` +
            `url=${response.url}`
        );

        // ── 5xx : Server Error ────────────────
    } else if (response.status >= 500) {
        serverErrors.add(1);
        errorRate.add(1);
        console.error(
            `[SERVER ERROR] ` +
            `VU=${__VU} ITER=${__ITER} | ` +
            `status=${response.status} | ` +
            `url=${response.url}`
        );

        // ── 4xx : Client Error ────────────────
    } else if (response.status >= 400) {
        clientErrors.add(1);
        errorRate.add(1);
        console.warn(
            `[CLIENT ERROR] ` +
            `VU=${__VU} ITER=${__ITER} | ` +
            `status=${response.status} | ` +
            `url=${response.url}`
        );

        // ── 2xx/3xx : Success ─────────────────
    } else {
        errorRate.add(0);
    }
}