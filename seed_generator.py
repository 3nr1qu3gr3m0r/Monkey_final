import os
import json
import random
import time

# ==========================================
# 1. TEMÁTICAS CATEGORIZADAS
# ==========================================
TEMATICAS = {
    "Infantil": [
        "fiesta infantil Frozen", "fiesta infantil Super Héroes", "fiesta infantil Dinosaurios",
        "fiesta infantil Peppa Pig", "fiesta infantil Minecraft", "fiesta infantil PAW Patrol",
        "presentación de 3 años", "primera comunión niña", "primera comunión niño"
    ],
    "Boda": [
        "boda clásica", "boda rústica", "boda en jardín", "boda en playa", "boda bohemia",
        "aniversario de bodas", "despedida de soltera"
    ],
    "XV_Anos": [
        "XV años princesa", "XV años viajera", "XV años moderna", "XV años artística"
    ],
    "General": [
        "Halloween", "graduación", "cumpleaños adulto 30 años", "cumpleaños adulto 50 años",
        "fiesta mexicana", "fiesta disco 70s", "fiesta neon", "evento corporativo"
    ]
}

COLORES = ["blanco y dorado", "blanco y plateado", "rosa y oro rose", "azul rey", "negro y dorado", "multicolor neón", "tonos pastel", "temático"]

TAMANIOS = [
    ("íntimo",  15,  40, 0.70),
    ("mediano", 50, 100, 1.00),
    ("grande", 120, 200, 1.45),
    ("masivo", 250, 500, 2.10),
]

NOTAS_OPERATIVAS = [
    "Se requiere acceso 2 horas antes para montaje.",
    "El cliente debe asegurar conexión eléctrica.",
    "Cancelaciones con 48 horas retienen el anticipo.",
    "El servicio concluye a la hora contratada exacta."
]

# ==========================================
# 2. GENERADOR DINÁMICO DE IMÁGENES (LoremFlickr)
# ==========================================
# Mapeamos cada categoría con palabras clave en inglés para obtener mejores resultados
KEYWORDS_IMAGENES = {
    "Audio e Iluminación": "dj,concert,lighting",
    "Mobiliario": "furniture,chairs,event",
    "Decoración": "decor,party,flowers",
    "Alimentos y Bebidas": "catering,buffet,drinks",
    "Repostería y Dulces": "cake,dessert,pastry",
    "Fotografía y Video": "photographer,camera,drone",
    "Entretenimiento": "show,circus,party",
    "Recintos y Salones": "venue,hacienda,garden",
    "Personal y Staff": "waiter,staff,bartender",
    "Recuerdos y Souvenirs": "souvenir,gift,wedding",
    "Transporte y Logística": "limousine,classiccar,transport"
}

def generar_urls_dinamicas(categoria, cantidad=3):
    """
    Genera URLs únicas de LoremFlickr basadas en la categoría.
    El parámetro 'lock' asegura que cada imagen sea diferente pero persistente.
    """
    keywords = KEYWORDS_IMAGENES.get(categoria, "party,event")
    urls = []
    for _ in range(cantidad):
        # Generamos un ID aleatorio del 1 al 10000 para garantizar variedad infinita
        lock_id = random.randint(1, 10000)
        # LoremFlickr format: https://loremflickr.com/width/height/keywords?lock=id
        url = f"https://loremflickr.com/800/600/{keywords}?lock={lock_id}"
        urls.append(url)
    return urls

# ==========================================
# 3. CATÁLOGOS BASE
# ==========================================
PRODUCTOS_BASE = [
    ("Kit de Globos Temáticos", "Decoración", 350, 50, ["Infantil", "General", "XV_Anos"]),
    ("Paquete de Gorros de Fiesta (50 pz)", "Decoración", 150, 100, ["Infantil", "General"]),
    ("Antifaces Temáticos (20 pz)", "Decoración", 120, 100, ["Infantil", "General", "XV_Anos"]),
    ("Letrero Neón Personalizable (Venta)", "Decoración", 2500, 10, ["Boda", "XV_Anos", "General"]),
    ("Kit de Platos y Vasos Desechables", "Alimentos y Bebidas", 250, 80, ["Infantil", "General"]),
    ("Llaveros Grabados de Recuerdo (50 pz)", "Recuerdos y Souvenirs", 800, 20, ["Boda", "XV_Anos", "Infantil"]),
    ("Suculentas en Maceta Personalizada", "Recuerdos y Souvenirs", 1200, 15, ["Boda", "XV_Anos"]),
    ("Pantuflas para Invitados (50 pares)", "Recuerdos y Souvenirs", 1500, 30, ["Boda", "XV_Anos"]),
    ("Termos Personalizados (20 pz)", "Recuerdos y Souvenirs", 1800, 25, ["Boda", "XV_Anos", "General"]),
    ("Kit Anti-Cruda / Recovery Kit (20 pz)", "Recuerdos y Souvenirs", 950, 30, ["Boda", "XV_Anos", "General"]),
    ("Vela Chispera para Pastel", "Repostería y Dulces", 45, 200, ["Infantil", "Boda", "XV_Anos", "General"]),
    ("Bolsitas para Dulces Vacías (50 pz)", "Repostería y Dulces", 90, 150, ["Infantil"]),
    ("Caja de Cupcakes Decorados (12 pz)", "Repostería y Dulces", 400, 20, ["Infantil", "Boda", "XV_Anos", "General"]),
    ("Pastel de Fondant (30 personas)", "Repostería y Dulces", 1200, 10, ["Infantil", "Boda", "XV_Anos", "General"]),
    ("Kit de Dulces a Granel para Mesa", "Repostería y Dulces", 850, 15, ["Infantil", "Boda", "XV_Anos", "General"])
]

SERVICIOS_BASE = [
    ("Servicio de DJ Profesional", "Audio e Iluminación", 4500, 1, ["Boda", "XV_Anos", "General"]),
    ("Renta de Equipo de Sonido (Bocinas)", "Audio e Iluminación", 1500, 1, ["Infantil", "General"]),
    ("Iluminación Arquitectónica y Pista", "Audio e Iluminación", 3000, 1, ["Boda", "XV_Anos"]),
    ("Renta de Sala Lounge (8 personas)", "Mobiliario", 800, 1, ["Boda", "XV_Anos", "General"]),
    ("Renta de Sillas Tiffany y Mesas", "Mobiliario", 1200, 1, ["Boda", "XV_Anos", "General"]),
    ("Renta de Sillas Plegables y Tablón", "Mobiliario", 400, 1, ["Infantil", "General"]),
    ("Banquete a 3 Tiempos", "Alimentos y Bebidas", 12000, 1, ["Boda", "XV_Anos"]),
    ("Taquiza Tradicional con Guisados", "Alimentos y Bebidas", 4500, 1, ["Infantil", "General", "XV_Anos"]),
    ("Barra Libre de Coctelería", "Alimentos y Bebidas", 6500, 1, ["Boda", "XV_Anos", "General"]),
    ("Cobertura Fotográfica Completa", "Fotografía y Video", 6000, 1, ["Boda", "XV_Anos"]),
    ("Cabina de Fotos 360", "Fotografía y Video", 3500, 1, ["Boda", "XV_Anos", "General"]),
    ("Sesión Fotográfica Familiar", "Fotografía y Video", 2000, 1, ["Infantil", "General"]),
    ("Show de Payaso y Animación", "Entretenimiento", 1800, 1, ["Infantil"]),
    ("Rena de Inflable Gigante", "Entretenimiento", 1200, 1, ["Infantil"]),
    ("Mago Ilusionista", "Entretenimiento", 3500, 1, ["Infantil", "General"]),
    ("Banda de Rock/Versátil en Vivo", "Entretenimiento", 8000, 1, ["General", "Boda"]),
    ("Renta de Jardín para Eventos", "Recintos y Salones", 15000, 1, ["Boda", "XV_Anos", "General"]),
    ("Renta de Salón Infantil con Juegos", "Recintos y Salones", 8000, 1, ["Infantil"]),
    ("Hacienda Colonial (Renta 8 Hrs)", "Recintos y Salones", 25000, 1, ["Boda"]),
    ("Servicio de Meseros Especializados", "Personal y Staff", 2500, 1, ["Boda", "XV_Anos", "General"]),
    ("Seguridad Privada para Eventos", "Personal y Staff", 3000, 1, ["Boda", "XV_Anos", "General"]),
    ("Staff de Limpieza Durante Evento", "Personal y Staff", 1500, 1, ["Boda", "XV_Anos", "General", "Infantil"]),
    ("Renta de Auto Clásico con Chofer", "Transporte y Logística", 4500, 1, ["Boda", "XV_Anos"]),
    ("Transporte Van para Invitados", "Transporte y Logística", 3500, 1, ["Boda", "General", "XV_Anos"])
]

# ==========================================
# 4. CONFIGURACIÓN BD
# ==========================================
CATEGORIAS_SQL = [
    (1, "Mobiliario", "Mesas, sillas, lounge, salas, muebles para eventos"),
    (2, "Audio e Iluminación", "DJ, bocinas, sonido, luces, iluminación para eventos"),
    (3, "Decoración", "Flores, globos, arreglos, centros de mesa, ambientación"),
    (4, "Alimentos y Bebidas", "Catering, taquizas, banquetes, bebidas, barras"),
    (5, "Fotografía y Video", "Fotógrafos, videógrafos, cabinas de fotos, drones"),
    (6, "Entretenimiento", "Payasos, magos, animadores, shows, inflables"),
    (7, "Recintos y Salones", "Salones, jardines, haciendas, terrazas"),
    (8, "Personal y Staff", "Meseros, hostess, seguridad, limpieza, valet parking"),
    (9, "Repostería y Dulces", "Pasteles, mesas de postres, dulces, cupcakes"),
    (10, "Recuerdos y Souvenirs", "Recuerdos, invitaciones, pantuflas, termos"),
    (11, "Transporte y Logística", "Renta de autos, transporte de invitados, fletes")
]

PROVEEDORES_CONFIG = {
    1: {"nombre": "Sonido Dinamita MX", "tipo": "servicios", "filtro_cat": "Audio e Iluminación"},
    2: {"nombre": "Lounge Conceptos", "tipo": "servicios", "filtro_cat": "Mobiliario"},
    3: {"nombre": "Lente Creativo Foto", "tipo": "servicios", "filtro_cat": "Fotografía y Video"},
    4: {"nombre": "Jardines del Edén", "tipo": "servicios", "filtro_cat": "Recintos y Salones"},
    5: {"nombre": "Staff de Excelencia MX", "tipo": "servicios", "filtro_cat": "Personal y Staff"},
    6: {"nombre": "Choferes VIP", "tipo": "servicios", "filtro_cat": "Transporte y Logística"},
    7: {"nombre": "Detalles y Recuerdos Mágicos", "tipo": "productos", "filtro_cat": "Recuerdos y Souvenirs"},
    8: {"nombre": "Dulce Bocado Pastelería", "tipo": "productos", "filtro_cat": "Repostería y Dulces"},
    9: {"nombre": "Banquetes La Mexicana", "tipo": "ambos", "filtro_cat": "Alimentos y Bebidas"},
    10: {"nombre": "Eventos Completos Pro", "tipo": "ambos", "filtro_cat": "All"}
}

def escape_sql(text):
    if not isinstance(text, str):
        return str(text)
    return text.replace("'", "\\'")

def expandir_item(base_item, es_servicio):
    nombre, categoria, precio_base, stock_base, tipos_compatibles = base_item
    
    tipo_elegido = random.choice(tipos_compatibles)
    tematica = random.choice(TEMATICAS[tipo_elegido])
    color = random.choice(COLORES)
    tam_nombre, tam_min, tam_max, tam_factor = random.choice(TAMANIOS)
    
    precio_final = round(precio_base * tam_factor * random.uniform(0.85, 1.25), 2)
    cualidad = random.choice(["Premium", "Clásico", "Económico", "Deluxe"])
    titulo = f"{nombre} {cualidad} - {tematica.title()}"
    
    if es_servicio:
        descripcion = f"Servicio profesional de {nombre.lower()}. Ideal para tu {tematica}. Capacidad para {tam_min} a {tam_max} personas. Logística garantizada."
        stock = 1
        datos_agenda = {"duracion_horas": random.choice([2, 4, 5, 8]), "notas": random.choice(NOTAS_OPERATIVAS)}
    else:
        descripcion = f"Excelente {nombre.lower()} con diseño para {tematica}. Colores: {color}. Artículo de alta calidad."
        stock = random.randint(10, stock_base * 3)
        datos_agenda = None
        
    # Generamos de 2 a 4 URLs únicas para este producto específico basadas en su categoría
    num_imagenes = random.randint(2, 4)
    imagenes_json = generar_urls_dinamicas(categoria, num_imagenes)
        
    return {
        "titulo": escape_sql(titulo),
        "descripcion": escape_sql(descripcion),
        "precio": precio_final,
        "stock": stock,
        "imagenes": json.dumps(imagenes_json, ensure_ascii=False).replace("'", "\\'"),
        "datos_agenda": json.dumps(datos_agenda, ensure_ascii=False).replace("'", "\\'") if datos_agenda else None,
        "categoria": escape_sql(categoria)
    }

def main():
    OUTPUT_FILE = "monkey_market_seed_loremflickr.sql"
    ITEMS_A_GENERAR_POR_PROV = 500
    total_registros = 0
    start_time = time.time()
    
    print(f"🚀 Generando SQL de manera ultra rápida...")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("SET FOREIGN_KEY_CHECKS = 0;\nSET autocommit = 0;\n\n")
        f.write("INSERT INTO configuracion_global (id, porcentaje_comision) VALUES (1, 10.00);\n")
        
        for cat in CATEGORIAS_SQL:
            f.write(f"INSERT INTO categorias (id, nombre, descripcion, activa) VALUES ({cat[0]}, '{escape_sql(cat[1])}', '{escape_sql(cat[2])}', 1);\n")
            
        f.write("INSERT INTO usuarios (id, rol, nombre, correo, contrasena_hash) VALUES (21, 'admin', 'Super Admin', 'admin@gmail.com', '$2b$10$Ew7PRDD6EJ1gCFL6NuEZo.pHGElcw4VLr7hv87syw1QVTw4KyYpwm');\n")
        f.write("INSERT INTO usuarios (id, rol, nombre, correo, contrasena_hash) VALUES (22, 'cliente', 'Cliente Demo', 'cliente@gmail.com', '$2b$10$Ew7PRDD6EJ1gCFL6NuEZo.pHGElcw4VLr7hv87syw1QVTw4KyYpwm');\n")
        
        for prov_id, prov_data in PROVEEDORES_CONFIG.items():
            correo = f"prov{prov_id}@gmail.com"
            f.write(f"INSERT INTO usuarios (id, rol, nombre, correo, contrasena_hash) VALUES ({prov_id}, 'proveedor', '{escape_sql(prov_data['nombre'])}', '{correo}', '$2b$10$Ew7PRDD6EJ1gCFL6NuEZo.pHGElcw4VLr7hv87syw1QVTw4KyYpwm');\n")
            f.write(f"INSERT INTO billeteras (proveedor_id, saldo_actual) VALUES ({prov_id}, 0.00);\n")
        
        f.write("COMMIT;\n\n")
        
        for prov_id, prov_data in PROVEEDORES_CONFIG.items():
            tipo_prov = prov_data["tipo"]
            filtro = prov_data["filtro_cat"]
            
            if tipo_prov in ["productos", "ambos"]:
                bases_validas = [b for b in PRODUCTOS_BASE if filtro == "All" or b[1] == filtro] or PRODUCTOS_BASE
                for i in range(1, ITEMS_A_GENERAR_POR_PROV + 1):
                    item = expandir_item(random.choice(bases_validas), es_servicio=False)
                    f.write(f"INSERT INTO productos (proveedor_id, titulo, descripcion, precio, stock, imagenes, categoria) VALUES "
                            f"({prov_id}, '{item['titulo']}', '{item['descripcion']}', {item['precio']}, {item['stock']}, '{item['imagenes']}', '{item['categoria']}');\n")
                    total_registros += 1
                    if i % 250 == 0: f.write("COMMIT;\n")
                    
            if tipo_prov in ["servicios", "ambos"]:
                bases_validas = [b for b in SERVICIOS_BASE if filtro == "All" or b[1] == filtro] or SERVICIOS_BASE
                for i in range(1, ITEMS_A_GENERAR_POR_PROV + 1):
                    item = expandir_item(random.choice(bases_validas), es_servicio=True)
                    f.write(f"INSERT INTO servicios (proveedor_id, titulo, descripcion, precio, datos_agenda, imagenes, categoria) VALUES "
                            f"({prov_id}, '{item['titulo']}', '{item['descripcion']}', {item['precio']}, '{item['datos_agenda']}', '{item['imagenes']}', '{item['categoria']}');\n")
                    total_registros += 1
                    if i % 250 == 0: f.write("COMMIT;\n")
                    
        f.write("\nCOMMIT;\nSET FOREIGN_KEY_CHECKS = 1;\nSET autocommit = 1;\n")
        
    print(f"\n✅ ¡Listo! Se generaron {total_registros:,} registros en {time.time() - start_time:.2f} segundos.")

if __name__ == "__main__":
    main()
