import os
import json
import random
import time

# ==========================================
# CONFIGURACIONES Y CONSTANTES GLOBALES
# ==========================================

TEMATICAS = [
    "boda clásica", "boda rústica", "boda en jardín", "boda en playa", "boda bohemia",
    "XV años princesa", "XV años viajera", "XV años moderna", "XV años artística",
    "primera comunión niña", "primera comunión niño", "presentación de 3 años",
    "fiesta infantil Frozen", "fiesta infantil Super Héroes", "fiesta infantil Dinosaurios",
    "fiesta infantil Peppa Pig", "fiesta infantil Minecraft", "fiesta infantil PAW Patrol",
    "fiesta infantil Barbie", "fiesta infantil Spiderman",
    "Halloween terrorífico", "Halloween familiar", "Halloween corporativo",
    "graduación preparatoria", "graduación universitaria",
    "fiesta de adolescentes", "cumpleaños adulto 30 años", "cumpleaños adulto 50 años",
    "aniversario de bodas", "baby shower niña", "baby shower niño",
    "despedida de soltera", "despedida de soltero",
    "fiesta mexicana", "fiesta disco 70s", "fiesta años 80", "fiesta neon",
    "fiesta tropical", "posada navideña", "cena de año nuevo",
    "evento corporativo", "fiesta Star Wars", "fiesta Harry Potter", "fiesta K-Pop",
]

COLORES = [
    "blanco y dorado", "blanco y plateado", "rosa y oro rose", "azul rey y plateado",
    "verde esmeralda y dorado", "negro y dorado", "lila y plata", "rojo y negro",
    "naranja y negro", "azul pastel y blanco", "coral y nude", "multicolor neón",
    "tonos tierra", "turquesa y dorado", "vino y beige", "lavanda y verde sage",
]

# (Nombre, min_personas, max_personas, factor_precio)
TAMANIOS = [
    ("íntimo",  15,  40, 0.70),
    ("mediano", 50, 100, 1.00),
    ("grande", 120, 200, 1.45),
    ("masivo", 250, 500, 2.10),
]

NOTAS_OPERATIVAS = [
    "Se requiere acceso al lugar 2 horas antes del evento para el montaje.",
    "El cliente debe asegurar conexión eléctrica a no más de 10 metros.",
    "Cancelaciones con 48 horas de anticipación retienen el anticipo completo.",
    "El espacio designado debe estar techado en caso de lluvia.",
    "El servicio concluye exactamente a la hora contratada; horas extras sujetas a disponibilidad.",
    "Incluye personal operativo durante todo el evento.",
    "Requiere firma de carta responsiva por daños al equipo.",
    "Alimentos sobrantes (si aplica) se empacan y entregan al anfitrión al finalizar.",
    "Se necesita un lugar de estacionamiento cercano para carga y descarga.",
    "El costo de viáticos fuera del área metropolitana se cotiza por separado."
]

# ==========================================
# CATEGORÍAS Y SUS PROVEEDORES
# ==========================================
CATEGORIAS_SQL = [
    (1, "Audio e Iluminación", "DJ, bocinas, sonido, luces, iluminación para eventos"),
    (2, "Mobiliario", "Mesas, sillas, lounge, salas, muebles para eventos"),
    (3, "Alimentos y Bebidas", "Catering, taquizas, banquetes, pasteles, bebidas, barras"),
    (4, "Fotografía y Video", "Fotógrafos, videógrafos, cabinas de fotos, drones"),
    (5, "Decoración", "Flores, globos, arreglos, centros de mesa, ambientación"),
    (6, "Entretenimiento", "Payasos, magos, animadores, shows, inflables"),
    (7, "Varios", "Servicios o productos que no encajan en otras categorías")
]

PROVEEDORES_CONFIG = {
    1: {"nombre": "Sonido Dinamita MX", "cat_id": 1, "cat_name": "Audio e Iluminación"},
    2: {"nombre": "Iluminación y Beats Lomas", "cat_id": 1, "cat_name": "Audio e Iluminación"},
    3: {"nombre": "DJ Pro Eventos", "cat_id": 1, "cat_name": "Audio e Iluminación"},
    4: {"nombre": "Mobiliario Elite", "cat_id": 2, "cat_name": "Mobiliario"},
    5: {"nombre": "Sillas y Mesas Premium", "cat_id": 2, "cat_name": "Mobiliario"},
    6: {"nombre": "Lounge Conceptos", "cat_id": 2, "cat_name": "Mobiliario"},
    7: {"nombre": "Banquetes La Mexicana", "cat_id": 3, "cat_name": "Alimentos y Bebidas"},
    8: {"nombre": "Taquizas El Cazo Mágico", "cat_id": 3, "cat_name": "Alimentos y Bebidas"},
    9: {"nombre": "Dulce Bocado Pastelería", "cat_id": 3, "cat_name": "Alimentos y Bebidas"},
    10: {"nombre": "Mixología y Barras Pro", "cat_id": 3, "cat_name": "Alimentos y Bebidas"},
    11: {"nombre": "Lente Creativo Foto", "cat_id": 4, "cat_name": "Fotografía y Video"},
    12: {"nombre": "Memorias en Dron MX", "cat_id": 4, "cat_name": "Fotografía y Video"},
    13: {"nombre": "Cabinas 360 Divertidas", "cat_id": 4, "cat_name": "Fotografía y Video"},
    14: {"nombre": "Florería Eventos Encanto", "cat_id": 5, "cat_name": "Decoración"},
    15: {"nombre": "Globos y Detalles Mágicos", "cat_id": 5, "cat_name": "Decoración"},
    16: {"nombre": "Ambientación Vintage", "cat_id": 5, "cat_name": "Decoración"},
    17: {"nombre": "Centros de Mesa Creativos", "cat_id": 5, "cat_name": "Decoración"},
    18: {"nombre": "Payasos y Risas", "cat_id": 6, "cat_name": "Entretenimiento"},
    19: {"nombre": "Magia Extrema Shows", "cat_id": 6, "cat_name": "Entretenimiento"},
    20: {"nombre": "Inflables y Diversión", "cat_id": 6, "cat_name": "Entretenimiento"}
}

# ==========================================
# GENERACIÓN DE BASES E IMÁGENES
# ==========================================

# Generador auxiliar para crear 40 ítems coherentes por categoría combinando elementos
def generar_bases(nombres, cualidades, precio_inicial, paso_precio):
    bases = []
    idx = 0
    for nombre in nombres:
        for cualidad in cualidades:
            bases.append({
                "titulo": f"{nombre} {cualidad}",
                "descripcion": f"Excelente {nombre.lower()} con características de gama {cualidad.lower()} para asegurar la mejor calidad en tu evento.",
                "precio_base": precio_inicial + (idx * paso_precio),
                "stock_base": random.randint(5, 50)
            })
            idx += 1
    return bases[:40]

BASES = {
    "Audio e Iluminación": generar_bases(
        ["Bocina Activa", "Micrófono Inalámbrico", "Consola de Audio", "Iluminación LED", "Estructura Truss", "Máquina de Humo", "Subwoofer", "Cableado Profesional", "Proyector Laser", "Pantalla de Proyección"],
        ["Básica", "Standard", "Premium", "Elite"], 800, 50
    ),
    "Mobiliario": generar_bases(
        ["Mesa Redonda", "Silla Tiffany", "Sala Lounge", "Periquera", "Mesa Tablón", "Silla Avant Garde", "Mesa Imperial", "Silla Versalles", "Barra Iluminada", "Calentador de Patio"],
        ["Económica", "Clásica", "Moderna", "De Lujo"], 50, 15
    ),
    "Alimentos y Bebidas": generar_bases(
        ["Menú de 3 Tiempos", "Taquiza Tradicional", "Barra de Postres", "Pastel de Fondant", "Barra de Cócteles", "Mesa de Quesos", "Menú Infantil", "Carrito de Snacks", "Fuente de Chocolate", "Banquete Vegano"],
        ["Sencillo", "Completo", "Gourmet", "Signature"], 120, 20
    ),
    "Fotografía y Video": generar_bases(
        ["Sesión Fotográfica", "Cobertura de Video", "Paquete Drone", "Cabina de Fotos 360", "Impresión en Sitio", "Photobook", "Video Resumen", "Sesión Trash the Dress", "Save the Date Video", "Cobertura Completa"],
        ["Digital", "Física", "Full HD", "4K Cinematográfico"], 2500, 250
    ),
    "Decoración": generar_bases(
        ["Centro de Mesa", "Arco de Globos", "Arreglo Floral Principal", "Muro de Flores", "Camino de Pétalos", "Letras Gigantes", "Cortina de Luces", "Decoración de Sillas", "Alfombra Roja", "Techo Decorativo"],
        ["Sencillo", "Elegante", "Abundante", "Espectacular"], 300, 45
    ),
    "Entretenimiento": generar_bases(
        ["Show de Payaso", "Mago Ilusionista", "Animadores de Pista", "Zanqueros", "Robot LED", "Castillo Inflable", "Toro Mecánico", "Pintacaritas", "Show de Fuego", "Banda de Música en Vivo"],
        ["Corto 1 hr", "Estándar 2 hrs", "Extendido 3 hrs", "Jornada Completa"], 1500, 150
    ),
    "Varios": generar_bases(
        ["Coordinación del Evento", "Servicio de Limpieza", "Hostess", "Valet Parking", "Planta de Luz", "Seguridad Privada", "Invitaciones Digitales", "Recuerdos Personalizados", "Transporte de Invitados", "Baños Portátiles"],
        ["Básico", "Estándar", "Avanzado", "VIP"], 1000, 100
    )
}

def generar_urls_reales(categoria, semilla):
    random.seed(semilla)
    # Limpiamos el nombre de la categoría para usarlo como "semilla"
    cat_limpia = categoria.replace(" ", "").replace("í", "i").replace("ó", "o")
    
    # Picsum.photos con seed soporta peticiones masivas sin bloquearte
    return [f"https://picsum.photos/seed/{cat_limpia}_{random.randint(1, 99999)}/800/600" for _ in range(25)]

IMAGENES_POOL = {
    cat: generar_urls_reales(cat, i) 
    for i, cat in enumerate(["Audio e Iluminación", "Mobiliario", "Alimentos y Bebidas", "Fotografía y Video", "Decoración", "Entretenimiento", "Varios"])
}
random.seed() # Restaurar la semilla aleatoria real

# ==========================================
# MOTOR DE EXPANSIÓN Y ESCAPADO
# ==========================================

def escape_sql(text):
    if not isinstance(text, str):
        return str(text)
    return text.replace("'", "\\'")

def expandir(base, categoria, es_servicio):
    tematica = random.choice(TEMATICAS)
    color = random.choice(COLORES)
    tam_nombre, tam_min, tam_max, tam_factor = random.choice(TAMANIOS)
    
    precio_base = float(base["precio_base"])
    varianza = random.uniform(0.88, 1.14)
    precio_final = round(precio_base * tam_factor * varianza, 2)
    
    titulo = base["titulo"]
    if random.random() <= 0.35:
        titulo = f"{titulo} — {tematica.title()}"
        
    descripcion = f"{base['descripcion']} Perfectamente adaptado para {tematica}. Diseño enfocado en tonos {color}. Ideal para un grupo {tam_nombre} (capacidad estimada de {tam_min} a {tam_max} personas)."
    
    if es_servicio:
        stock = 1
    else:
        stock = random.randint(1, base["stock_base"] * 2)
        
   # Selección de imágenes (Ahora el pool ya tiene las URLs completas)
    pool = IMAGENES_POOL[categoria]
    num_imagenes = random.randint(2, 4)
    imagenes_json = random.sample(pool, num_imagenes)
        
    # Datos de agenda (Solo para servicios)
    datos_agenda = None
    if es_servicio:
        datos_agenda = {
            "duracion_horas": random.choice([2, 3, 4, 5, 6, 8, 10, 12]),
            "disponibilidad": random.choice([
                ["viernes", "sabado", "domingo"],
                ["sabado", "domingo"],
                ["lunes","martes","miercoles","jueves","viernes","sabado","domingo"],
                ["jueves","viernes","sabado","domingo"],
            ]),
            "anticipo_porcentaje": random.choice([20, 25, 30, 35, 40, 50]),
            "notas": random.choice(NOTAS_OPERATIVAS)
        }
        
    return {
        "titulo": escape_sql(titulo),
        "descripcion": escape_sql(descripcion),
        "precio": precio_final,
        "stock": stock,
        "imagenes": json.dumps(imagenes_json, ensure_ascii=False).replace("'", "\\'"),
        "datos_agenda": json.dumps(datos_agenda, ensure_ascii=False).replace("'", "\\'") if datos_agenda else None,
        "categoria": escape_sql(categoria)
    }

# ==========================================
# ESCRITURA DEL ARCHIVO SQL
# ==========================================

def main():
    OUTPUT_FILE = "monkey_market_seed.sql"
    TOTAL_PROVEEDORES = 20
    PRODUCTOS_POR_PROV = 1000
    SERVICIOS_POR_PROV = 1000
    
    total_registros = 0
    start_time = time.time()
    
    print(f"🚀 Iniciando generación de datos para MonkeyMarket...")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        # 1. Cabeceras
        f.write("SET FOREIGN_KEY_CHECKS = 0;\n")
        f.write("SET autocommit = 0;\n\n")
        
        # 2. Configuración Global
        f.write("INSERT INTO configuracion_global (id, porcentaje_comision) VALUES (1, 10.00);\n")
        total_registros += 1
        
        # 3. Categorías
        for cat in CATEGORIAS_SQL:
            f.write(f"INSERT INTO categorias (id, nombre, descripcion, activa) VALUES ({cat[0]}, '{escape_sql(cat[1])}', '{escape_sql(cat[2])}', 1);\n")
            total_registros += 1
            
        # 4. Usuarios (Admin, Cliente Demo)
        f.write("INSERT INTO usuarios (id, rol, nombre, correo, telefono, contrasena_hash) VALUES (21, 'admin', 'Super Admin', 'adminmonkeymarket@gmail.com', '5551234567', '$2b$10$Ew7PRDD6EJ1gCFL6NuEZo.pHGElcw4VLr7hv87syw1QVTw4KyYpwm');\n")
        f.write("INSERT INTO usuarios (id, rol, nombre, correo, telefono, contrasena_hash) VALUES (22, 'cliente', 'Cliente Demo', 'clientedemo@gmail.com', '5559876543', '$2b$10$Ew7PRDD6EJ1gCFL6NuEZo.pHGElcw4VLr7hv87syw1QVTw4KyYpwm');\n")
        total_registros += 2
        
        # Proveedores y Billeteras
        for prov_id, prov_data in PROVEEDORES_CONFIG.items():
            correo = f"contacto{prov_data['nombre'].replace(' ', '').lower()}@gmail.com"
            telefono = f"55{random.randint(10000000, 99999999)}"
            f.write(f"INSERT INTO usuarios (id, rol, nombre, correo, telefono, contrasena_hash) VALUES ({prov_id}, 'proveedor', '{escape_sql(prov_data['nombre'])}', '{correo}', '{telefono}', '$2b$10$Ew7PRDD6EJ1gCFL6NuEZo.pHGElcw4VLr7hv87syw1QVTw4KyYpwm');\n")
            f.write(f"INSERT INTO billeteras (proveedor_id, saldo_actual, total_ganado) VALUES ({prov_id}, 0.00, 0.00);\n")
            total_registros += 2
        
        f.write("COMMIT;\n\n")
        
        # 5. Generación masiva: Productos y Servicios por Proveedor
        for prov_id, prov_data in PROVEEDORES_CONFIG.items():
            categoria_nombre = prov_data["cat_name"]
            pool_bases = BASES[categoria_nombre]
            
            # --- PRODUCTOS ---
            for i in range(1, PRODUCTOS_POR_PROV + 1):
                base_seleccionada = random.choice(pool_bases)
                item = expandir(base_seleccionada, categoria_nombre, es_servicio=False)
                
                f.write(f"INSERT INTO productos (proveedor_id, titulo, descripcion, precio, stock, imagenes, categoria, esta_activo) VALUES "
                        f"({prov_id}, '{item['titulo']}', '{item['descripcion']}', {item['precio']}, {item['stock']}, '{item['imagenes']}', '{item['categoria']}', 1);\n")
                total_registros += 1
                
                if i % 500 == 0:
                    f.write("COMMIT;\n")
                    
            # --- SERVICIOS ---
            for i in range(1, SERVICIOS_POR_PROV + 1):
                base_seleccionada = random.choice(pool_bases)
                item = expandir(base_seleccionada, categoria_nombre, es_servicio=True)
                
                f.write(f"INSERT INTO servicios (proveedor_id, titulo, descripcion, precio, datos_agenda, imagenes, categoria, esta_activo) VALUES "
                        f"({prov_id}, '{item['titulo']}', '{item['descripcion']}', {item['precio']}, '{item['datos_agenda']}', '{item['imagenes']}', '{item['categoria']}', 1);\n")
                total_registros += 1
                
                if i % 500 == 0:
                    f.write("COMMIT;\n")
                    
            print(f"Proveedor {prov_id}/20 — {prov_data['nombre']} [{categoria_nombre}] ✅")

        # 6. Cierre
        f.write("\nCOMMIT;\n")
        f.write("SET FOREIGN_KEY_CHECKS = 1;\n")
        f.write("SET autocommit = 1;\n")
        
    end_time = time.time()
    file_size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    
    print("\n" + "="*50)
    print(f"✅ ¡Archivo SQL Generado Exitosamente!")
    print(f"📦 Total de registros: {total_registros:,}")
    print(f"📄 Tamaño del archivo: {file_size_mb:.2f} MB")
    print(f"⏱️ Tiempo de ejecución: {end_time - start_time:.2f} segundos")
    print("="*50)
    print("\nInstrucción de importación:")
    print(f"mysql -u root -p monkey_market < {OUTPUT_FILE}")
    print("\nInstrucción de sincronización ChromaDB:")
    print("curl http://localhost:8000/sync")

if __name__ == "__main__":
    main()