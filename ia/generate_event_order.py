import json
import re
import sys


def parse_count(text):
    digits = re.findall(r"(\d+)", text)
    if digits:
        return int(digits[-1])
    return 10


def build_order(text):
    count = parse_count(text)
    pasteles = max(1, count // 20)
    payasos = 1 if count <= 20 else 2 if count <= 50 else 3
    cucharas = count

    if "pastel" in text.lower() and "show" in text.lower():
        pasteles = max(pasteles, 1)
        payasos = max(payasos, 1)

    return {
        "evento": text,
        "pasteles": pasteles,
        "payasos": payasos,
        "cucharas": cucharas
    }


if __name__ == "__main__":
    raw_text = " ".join(sys.argv[1:]).strip()
    if not raw_text:
        print(json.dumps({"error": "No se recibió texto para procesar."}, ensure_ascii=False))
        sys.exit(1)

    order = build_order(raw_text)
    print(json.dumps(order, ensure_ascii=False))
