"""MySQL connection pool using individual parameters (password has @)."""

import mysql.connector
from mysql.connector import pooling
from config.settings import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

_pool = None


def get_pool():
    """Get or create the connection pool."""
    global _pool
    if _pool is None:
        _pool = pooling.MySQLConnectionPool(
            pool_name="orchestrator",
            pool_size=5,
            host=MYSQL_HOST,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            charset='utf8mb4',
            collation='utf8mb4_unicode_ci',
            autocommit=False,
        )
    return _pool


def get_connection():
    """Get a connection from the pool."""
    return get_pool().get_connection()


class DBContext:
    """Context manager for database connections with auto-commit/rollback."""

    def __init__(self):
        self.conn = None
        self.cursor = None

    def __enter__(self):
        self.conn = get_connection()
        self.cursor = self.conn.cursor(dictionary=True)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.conn.rollback()
        else:
            self.conn.commit()
        self.cursor.close()
        self.conn.close()
        return False

    def execute(self, query, params=None):
        self.cursor.execute(query, params)
        return self.cursor

    def fetchone(self, query, params=None):
        self.cursor.execute(query, params)
        return self.cursor.fetchone()

    def fetchall(self, query, params=None):
        self.cursor.execute(query, params)
        return self.cursor.fetchall()

    def insert(self, query, params=None):
        self.cursor.execute(query, params)
        return self.cursor.lastrowid
