interface JwtUserPayload {
    user: {
        id: string;
        email: string;
        password: string;
    };
}

function isJwtUserPayload(decoded: unknown): decoded is JwtUserPayload {
    return typeof decoded === 'object' && decoded !== null && 'user' in decoded;
}

export { JwtUserPayload, isJwtUserPayload };