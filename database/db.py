import sqlite3
from datetime import datetime
import os
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "traffic.db")

def connect_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def create_table():
    connection = connect_db()
    cursor = connection.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS traffic_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            vehicle_count INTEGER,
            congestion TEXT,
            active_signal TEXT,
            north_lane INTEGER,
            east_lane INTEGER,
            south_lane INTEGER,
            west_lane INTEGER,
            green_time INTEGER
        )
    """)
    connection.commit()
    connection.close()

def insert_log(vehicle_count, congestion, active_signal,
               north=0, east=0, south=0, west=0, green_time=30):
    connection = connect_db()
    cursor = connection.cursor()
    cursor.execute("""
        INSERT INTO traffic_logs (
            timestamp, vehicle_count, congestion, active_signal,
            north_lane, east_lane, south_lane, west_lane, green_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        vehicle_count, congestion, active_signal,
        north, east, south, west, green_time
    ))
    connection.commit()
    connection.close()

def get_recent_logs(limit=20):
    connection = connect_db()
    cursor = connection.cursor()
    cursor.execute("""
        SELECT * FROM traffic_logs
        ORDER BY id DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    connection.close()
    return [dict(row) for row in rows]

def get_hourly_stats():
    """Return average vehicle count per hour for the last 12 records."""
    connection = connect_db()
    cursor = connection.cursor()
    cursor.execute("""
        SELECT timestamp, vehicle_count FROM traffic_logs
        ORDER BY id DESC LIMIT 12
    """)
    rows = cursor.fetchall()
    connection.close()
    return [{"time": r["timestamp"][-8:-3], "count": r["vehicle_count"]} for r in reversed(rows)]