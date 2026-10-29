"""Export raw Surabaya distance readings using read-only MySQL queries."""
import csv
import json
import sys
from datetime import datetime
from pathlib import Path

import pymysql
import yaml

backend = Path(sys.argv[1])
output = Path(sys.argv[2])
output.mkdir(parents=True, exist_ok=True)
config = yaml.safe_load((backend / "configs/surabaya/database.local.yaml").read_text(encoding="utf-8"))
locations = yaml.safe_load((backend / "configs/surabaya/live_sources.yaml").read_text(encoding="utf-8"))["locations"]
manifest = []
for location in locations:
    spec = location["water_level"]
    columns = [spec["id_column"], spec["timestamp_column"], *spec["columns"]]
    quote = lambda name: "`" + name.replace("`", "``") + "`"
    table = quote(location["database"]) + "." + quote(spec["table"])
    connection = pymysql.connect(host=config["host"], port=int(config.get("port", 3306)),
        user=config["username"], password=str(config["password"]), charset="utf8mb4",
        connect_timeout=15, read_timeout=120, write_timeout=15)
    path = output / (location["key"] + ".csv")
    count = 0
    earliest = latest = None
    try:
        with connection.cursor() as cursor:
            cursor.execute("SET SESSION time_zone = '+07:00'")
            cursor.execute("SET SESSION TRANSACTION READ ONLY")
            cursor.execute(f"SELECT MAX({quote(spec['id_column'])}) FROM {table}")
            max_id = cursor.fetchone()[0]
        with path.open("w", encoding="utf-8-sig", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(columns)
            if max_id is not None:
                with connection.cursor(pymysql.cursors.SSCursor) as cursor:
                    cursor.execute("SELECT " + ",".join(map(quote, columns)) + f" FROM {table} WHERE {quote(spec['id_column'])} <= %s ORDER BY {quote(spec['id_column'])}", (max_id,))
                    for row in cursor:
                        writer.writerow(row)
                        count += 1
                        stamp = str(row[1]) if row[1] is not None else None
                        if stamp:
                            earliest = min(earliest, stamp) if earliest else stamp
                            latest = max(latest, stamp) if latest else stamp
                        if count % 100000 == 0:
                            print(location["name"], count, "rows", flush=True)
        manifest.append({"station": location["name"], "source": location["database"] + "." + spec["table"],
            "file": path.name, "columns": columns, "rows": count, "earliest": earliest,
            "latest": latest, "max_id_at_export": max_id, "bytes": path.stat().st_size})
        (output / "manifest.json").write_text(json.dumps({"exported_at": datetime.now().isoformat(),
            "time_zone": "Asia/Jakarta", "values": "Raw source values; zero and missing readings preserved", "stations": manifest}, indent=2), encoding="utf-8")
        print("DONE", location["name"], count, "rows", earliest, latest, flush=True)
    finally:
        connection.close()
