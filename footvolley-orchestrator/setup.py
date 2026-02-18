#!/usr/bin/env python3
"""Create footvolley_ops database, all 9 tables, and seed bracket_spec_sections."""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import mysql.connector
from config.settings import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

BRACKET_SECTIONS = [
    ('pool_play_structure', 'Pool play format, group sizes, and game rules'),
    ('seeding_logic', 'How teams are seeded based on rankings and registration'),
    ('bracket_generation', 'Algorithm for generating tournament brackets'),
    ('winners_bracket', 'Winners bracket progression and matchup rules'),
    ('losers_bracket', 'Losers bracket structure (L1-L6 rounds)'),
    ('grand_finals', 'Grand finals format and reset rules'),
    ('scoring_system', 'Point system, set structure, timeouts'),
    ('tiebreakers', 'Tiebreaker rules for pool play and bracket'),
    ('scheduling', 'Court assignments, time slots, rest periods'),
    ('ranking_updates', 'Post-tournament ranking calculation and updates'),
]


def run():
    # Connect without database first to create it
    conn = mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
    )
    cursor = conn.cursor()

    print(f"Creating database {MYSQL_DATABASE}...")
    cursor.execute(
        f"CREATE DATABASE IF NOT EXISTS {MYSQL_DATABASE} "
        f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    )
    cursor.close()
    conn.close()

    # Reconnect with the database selected
    conn = mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
    )
    cursor = conn.cursor()

    # Read and execute schema
    schema_path = os.path.join(os.path.dirname(__file__), 'db', 'schema.sql')
    with open(schema_path, 'r') as f:
        schema = f.read()

    # Remove comment-only lines and strip
    lines = []
    for line in schema.split('\n'):
        stripped = line.strip()
        if stripped.startswith('--') or not stripped:
            continue
        lines.append(line)
    cleaned = '\n'.join(lines)

    # Split by semicolon and execute each CREATE TABLE
    for statement in cleaned.split(';'):
        stmt = statement.strip()
        if not stmt:
            continue
        # Skip USE and CREATE DATABASE (already handled)
        first_word = stmt.split()[0].upper() if stmt.split() else ''
        if first_word in ('USE', ):
            continue
        if stmt.upper().startswith('CREATE DATABASE'):
            continue
        try:
            cursor.execute(stmt)
            # Extract table name for logging
            if 'CREATE TABLE' in stmt.upper():
                parts = stmt.split('(')[0]
                print(f"  Created: {parts.split()[-1]}")
        except mysql.connector.Error as e:
            print(f"  Warning: {e}")

    conn.commit()
    print("Tables created.")

    # Seed bracket_spec_sections
    print("Seeding bracket_spec_sections...")
    for name, desc in BRACKET_SECTIONS:
        try:
            cursor.execute(
                """INSERT INTO bracket_spec_sections (section_name, description)
                   VALUES (%s, %s)
                   ON DUPLICATE KEY UPDATE description = VALUES(description)""",
                (name, desc)
            )
        except mysql.connector.Error as e:
            print(f"  Warning seeding {name}: {e}")

    conn.commit()

    # Verify
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"\nTables in {MYSQL_DATABASE}: {', '.join(tables)}")
    print(f"Total: {len(tables)} tables")

    cursor.execute("SELECT COUNT(*) FROM bracket_spec_sections")
    count = cursor.fetchone()[0]
    print(f"Bracket spec sections seeded: {count}")

    cursor.close()
    conn.close()
    print("\nSetup complete!")


if __name__ == '__main__':
    run()
