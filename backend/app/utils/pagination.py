import base64
import uuid


def criar_cursor(cliente_id: uuid.UUID) -> str:
    valor = str(cliente_id).encode()
    return base64.urlsafe_b64encode(valor).decode()


def ler_cursor(cursor: str) -> uuid.UUID:
    valor = base64.urlsafe_b64decode(cursor).decode()
    return uuid.UUID(valor)
