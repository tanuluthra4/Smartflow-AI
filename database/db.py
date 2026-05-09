import sqlite3

def connect_db():
    connection = sqlite3.connect("database/traffic.db")
    return connection

def create_table():

    connection = connect_db()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS traffic_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_count INTEGER,
            congestion TEXT,
            active_signal TEXT
        )
    """)

    connection.commit()
    connection.close()


def insert_log(vehicle_count, congestion, active_signal):

    connection = connect_db()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO traffic_logs (
            vehicle_count,
            congestion,
            active_signal
        )
        VALUES (?, ?, ?)
    """, (vehicle_count, congestion, active_signal))

    connection.commit()
    connection.close()