import os
import json
import random
import time
from datetime import datetime, timedelta

# ==========================================
# 1. CONFIGURACIÓN DE USUARIOS
# ==========================================
NOMBRES_CLIENTES = [
    "Carlos Mendoza", "Valeria Rojas", "Miguel Ángel Soto", "Fernanda Ortiz", 
    "Daniela Castillo", "Héctor Navarro", "Sofía Cervantes", "Alejandro Vega", 
    "Paola Rangel", "Ricardo Montes"
]

RESEÑAS_POSITIVAS = [
    "¡Excelente! Todo llegó a tiempo y la calidad superó mis expectativas. Mis invitados quedaron fascinados.",
    "Muy profesionales. La atención fue increíble y el día del evento no me preocupé por nada. 100% recomendados.",
    "Primerísima calidad. Los acabados son hermosos y justo como se veían en las fotos.",
    "Hicieron que nuestro evento fuera inolvidable. Cuidaron cada detalle. ¡Mil gracias!",
    "Valió cada peso invertido. La puntualidad, la presentación y la amabilidad fueron impecables."
]

def gen_img(keywords, cantidad=2):
    return [f"https://loremflickr.com/800/600/{keywords}?lock={random.randint(1, 10000)}" for _ in range(cantidad)]

# ==========================================
# 2. CATÁLOGO MASIVO (50 PRODUCTOS + 50 SERVICIOS)
# ==========================================

# Formato: (Título, Categoría, Precio Base, Keywords para Imagen)
PRODUCTOS_DATA = [
    # Animación y Batucada (10)
    ("Paquete de Máscaras de Luchador (20pz)", "Decoración", 450, "mask,party"),
    ("Sombreros Texanos Neón para Batucada (15pz)", "Decoración", 600, "hat,neon"),
    ("Lentes LED Luminosos de Colores (50pz)", "Decoración", 750, "led,glasses"),
    ("Corbatas y Moños Luminosos (20pz)", "Decoración", 500, "bowtie,neon"),
    ("Antifaces Venecianos Elegantes (30pz)", "Decoración", 850, "venetian,mask"),
    ("Tubos de Espuma LED para Concierto (50pz)", "Decoración", 650, "glowstick,party"),
    ("Paquete de Mechudos Metálicos (40pz)", "Decoración", 300, "pompons,party"),
    ("Globos Salchicha para Moldear (100pz)", "Decoración", 150, "balloons,colors"),
    ("Diademas de Luces (Orejas y Cuernos) (30pz)", "Decoración", 450, "headband,led"),
    ("Cañones de Confeti Metálico Grandes (10pz)", "Decoración", 800, "confetti,celebration"),
    
    # Decoración Física (10)
    ("Kit Arco de Globos Orgánico (150 globos)", "Decoración", 350, "balloons,arch"),
    ("Centros de Mesa Florales Artificiales (10pz)", "Decoración", 1200, "centerpiece,flowers"),
    ("Letras Gigantes MDF 'LOVE' (Venta)", "Decoración", 2500, "letters,love"),
    ("Cortina de Luces LED Cascada (3x3m)", "Decoración", 400, "fairylights,decor"),
    ("Caminos de Mesa de Lentejuela (10pz)", "Decoración", 850, "tablecloth,sequin"),
    ("Velas Flotantes para Centros de Mesa (50pz)", "Decoración", 250, "candles,water"),
    ("Tanque de Helio Desechable con 30 Globos", "Decoración", 1100, "helium,balloons"),
    ("Pizarra Vintage de Bienvenida con Caballete", "Decoración", 650, "chalkboard,welcome"),
    ("Faroles de Papel Blancos (Linternas) (20pz)", "Decoración", 300, "paperlantern,decor"),
    ("Rollo de Alfombra Roja para Eventos (10m)", "Decoración", 900, "redcarpet,event"),
    
    # Repostería y Dulces (10)
    ("Pastel de Fondant Temático (3 Pisos)", "Repostería y Dulces", 1500, "fondant,cake"),
    ("Caja de Cupcakes Personalizados (24pz)", "Repostería y Dulces", 650, "cupcakes,dessert"),
    ("Galletas de Mantequilla Decoradas (50pz)", "Repostería y Dulces", 700, "cookies,decorated"),
    ("Torre de Macarons Franceses (40pz)", "Repostería y Dulces", 1200, "macarons,tower"),
    ("Fuente de Chocolate con Insumos", "Repostería y Dulces", 1800, "chocolatefountain"),
    ("Kit Dulces a Granel para Mesa de Postres", "Repostería y Dulces", 950, "candytable,sweets"),
    ("Paletas de Hielo Artesanales (50pz)", "Repostería y Dulces", 800, "popsicles,ice"),
    ("Bolsas de Algodón de Azúcar (40pz)", "Repostería y Dulces", 450, "cottoncandy"),
    ("Manzanas Cubiertas de Chamoy y Tamarindo (20pz)", "Repostería y Dulces", 550, "apples,chamoy"),
    ("Muro de Donas Glaseadas con Soporte (30pz)", "Repostería y Dulces", 850, "donuts,wall"),
    
    # Recuerdos y Souvenirs (10)
    ("Termos Personalizados Grabados (20pz)", "Recuerdos y Souvenirs", 1800, "thermos,gift"),
    ("Pantuflas Blancas Bordadas (50 pares)", "Recuerdos y Souvenirs", 1500, "slippers,wedding"),
    ("Mini Suculentas en Maceta (30pz)", "Recuerdos y Souvenirs", 1200, "succulents,wedding"),
    ("Llaveros de Madera Grabados (50pz)", "Recuerdos y Souvenirs", 800, "keychain,wood"),
    ("Abanicos de Bambú y Tela (50pz)", "Recuerdos y Souvenirs", 900, "fans,bamboo"),
    ("Sandalias para Descanso en Pista (40 pares)", "Recuerdos y Souvenirs", 1400, "sandals,party"),
    ("Cajitas de Acrílico con Almendras (50pz)", "Recuerdos y Souvenirs", 600, "almonds,box"),
    ("Botellitas de Mezcal Personalizadas (20pz)", "Recuerdos y Souvenirs", 1600, "mezcal,bottle"),
    ("Jabones Artesanales Aromáticos (40pz)", "Recuerdos y Souvenirs", 750, "soap,handmade"),
    ("Kit Anti-Cruda / Recovery Bags (50pz)", "Recuerdos y Souvenirs", 2200, "survival,kit"),
    
    # Varios y Utilería (10)
    ("Platos Pasteleros Elegantes Desechables (100pz)", "Alimentos y Bebidas", 350, "plates,elegant"),
    ("Copas de Acrílico tipo Cristal (50pz)", "Alimentos y Bebidas", 600, "glasses,acrylic"),
    ("Servilletas de Tela Premium (50pz)", "Decoración", 750, "napkins,cloth"),
    ("Kits de Props y Letreros para Fotos (30pz)", "Fotografía y Video", 250, "photoprops,signs"),
    ("Libro de Firmas de Madera Personalizado", "Decoración", 450, "guestbook,wood"),
    ("Burbujeros Automáticos para Ceremonia (2pz)", "Decoración", 600, "bubbles,machine"),
    ("Bengalas de Humo para Sesión de Fotos (5pz)", "Fotografía y Video", 300, "smokebomb,photo"),
    ("Letreros de Madera 'Sr.' y 'Sra.' para Sillas", "Decoración", 200, "mrandmrs,signs"),
    ("Caja Buzón para Sobres de Dinero", "Decoración", 550, "mailbox,envelope"),
    ("Guirnaldas de Papel Picado Personalizadas (10m)", "Decoración", 180, "papelpicado,mexican")
]

SERVICIOS_DATA = [
    # Audio e Iluminación (10)
    ("Servicio de DJ Versátil Profesional (5 Hrs)", "Audio e Iluminación", 4500, "dj,party"),
    ("DJ Pro con Pantallas LED y Animador", "Audio e Iluminación", 8000, "dj,ledscreen"),
    ("Renta de Pista de Cristal Iluminada (5x5m)", "Audio e Iluminación", 6500, "dancefloor,glass"),
    ("Renta de Audio Lineal Alta Fidelidad", "Audio e Iluminación", 3500, "speakers,linearray"),
    ("Iluminación Arquitectónica para Jardines", "Audio e Iluminación", 2500, "uplighting,garden"),
    ("Renta de Pista de Madera Vintage Pintada a Mano", "Mobiliario", 5500, "dancefloor,wood"),
    ("Servicio de Karaoke a Domicilio con Pantalla", "Entretenimiento", 2000, "karaoke,screen"),
    ("Renta de Proyector y Pantalla Gigante", "Fotografía y Video", 1500, "projector,screen"),
    ("Pista Infinita LED 3D (4x4m)", "Audio e Iluminación", 8500, "infinity,dancefloor"),
    ("Sonorización Acústica para Ceremonia Religiosa", "Audio e Iluminación", 1800, "ceremony,audio"),
    
    # Fotografía y Video (10)
    ("Cobertura Fotográfica Completa (8 Hrs)", "Fotografía y Video", 6000, "wedding,photographer"),
    ("Video Documental en 4K UHD", "Fotografía y Video", 8500, "videographer,wedding"),
    ("Sesión Fotográfica Casual Pre-Evento", "Fotografía y Video", 2500, "casual,photoshoot"),
    ("Cabina Fotográfica con Impresión Ilimitada", "Fotografía y Video", 3500, "photobooth,print"),
    ("Plataforma Cabina de Fotos 360", "Fotografía y Video", 4500, "360booth,party"),
    ("Cobertura con Dron para Tomas Aéreas", "Fotografía y Video", 3000, "drone,wedding"),
    ("Fotografía Profesional para Bautizos", "Fotografía y Video", 2200, "baptism,photo"),
    ("Creación de Photobook Impreso Premium", "Fotografía y Video", 2800, "photobook,album"),
    ("Video Highlight Trailer para Redes Sociales", "Fotografía y Video", 1500, "video,highlight"),
    ("Renta de Cámaras Polaroid con 50 Cartuchos", "Fotografía y Video", 1800, "polaroid,camera"),
    
    # Entretenimiento (10)
    ("Show Cómico de Payasos y Animación Infantil", "Entretenimiento", 1800, "clown,kids"),
    ("Espectáculo de Magia de Cerca e Ilusionismo", "Entretenimiento", 3500, "magician,tricks"),
    ("Show Robot LED con Disparador de CO2", "Entretenimiento", 5500, "ledrobot,co2"),
    ("Banda Sinaloense en Vivo (2 Hrs)", "Entretenimiento", 9000, "band,music"),
    ("Grupo Versátil con Bailarines", "Entretenimiento", 15000, "liveband,party"),
    ("Mariachi Profesional para Eventos (1 Hr)", "Entretenimiento", 3500, "mariachi,music"),
    ("Zanqueros y Arlequines para Batucada", "Entretenimiento", 2500, "stiltwalker,party"),
    ("Servicio de Pintacaritas y Maquillaje Fantasía", "Entretenimiento", 1200, "facepainting,kids"),
    ("Espectáculo de Fuego y Malabares", "Entretenimiento", 4500, "fireshow,juggling"),
    ("Show de Imitador de Artista Famoso", "Entretenimiento", 3800, "impersonator,show"),
    
    # Alimentos y Bebidas (10)
    ("Banquete Formal a 3 Tiempos (por 50 pax)", "Alimentos y Bebidas", 12500, "banquet,elegant"),
    ("Taquiza Tradicional de Guisados (por 50 pax)", "Alimentos y Bebidas", 4500, "tacos,catering"),
    ("Barra Libre de Coctelería Profesional", "Alimentos y Bebidas", 6500, "cocktails,bar"),
    ("Carrito de Shots Animados para Pista", "Alimentos y Bebidas", 2500, "shots,party"),
    ("Trompo de Pastor al Pastor a Domicilio", "Alimentos y Bebidas", 3500, "tacos,pastor"),
    ("Mesa de Quesos, Carnes Frías y Tapas", "Alimentos y Bebidas", 4000, "charcuterie,cheese"),
    ("Catering Vegano y Menús Alternativos", "Alimentos y Bebidas", 5500, "vegan,catering"),
    ("Barra de Cafés de Especialidad y Crepas", "Alimentos y Bebidas", 3000, "coffee,crepes"),
    ("Menú Infantil (Hamburguesas/Nuggets)", "Alimentos y Bebidas", 2000, "kidsmeal,burger"),
    ("Parrillada Argentina con Cortes Clásicos", "Alimentos y Bebidas", 8500, "bbq,grill"),
    
    # Recintos, Mobiliario y Staff (10)
    ("Renta de Jardín Exclusivo para Eventos", "Recintos y Salones", 15000, "garden,venue"),
    ("Salón Cerrado con Aire Acondicionado", "Recintos y Salones", 18000, "venue,indoor"),
    ("Renta de Carpa Elegante con Plafón", "Mobiliario", 6000, "tent,wedding"),
    ("Salas Lounge Blancas (Capacidad 8 pax)", "Mobiliario", 800, "lounge,furniture"),
    ("Mesas Imperiales de Madera Parota", "Mobiliario", 1200, "woodentable,elegant"),
    ("Sillas Tiffany Originales (10pz)", "Mobiliario", 300, "tiffanychair,wedding"),
    ("Sillas Avant Garde Plegables (10pz)", "Mobiliario", 250, "avantgarde,chair"),
    ("Servicio de Meseros Profesionales (1 Turno)", "Personal y Staff", 800, "waiter,staff"),
    ("Seguridad Privada y Control de Accesos", "Personal y Staff", 1500, "security,event"),
    ("Servicio de Valet Parking Asegurado", "Personal y Staff", 3500, "valet,parking")
]

# ==========================================
# 3. MOTOR DE GENERACIÓN DE DESCRIPCIONES
# ==========================================
def generar_descripcion_detallada(titulo, tipo):
    """Crea párrafos largos y profesionales adaptados dinámicamente al título."""
    if tipo == "producto":
        return (f"Descubre la mejor calidad con nuestro {titulo}. Diseñado meticulosamente para elevar "
                f"el nivel de tu evento, este artículo destaca por sus materiales premium y su durabilidad garantizada. "
                f"Ideal tanto para eventos diurnos como nocturnos, se adapta perfectamente a diversas temáticas. "
                f"El paquete viene perfectamente sellado y revisado bajo estrictos controles de calidad para que no "
                f"tengas ningún contratiempo el día de tu celebración. Además, su diseño ergonómico y visualmente "
                f"atractivo asegura que tus invitados tengan la mejor experiencia posible, convirtiendo un simple detalle "
                f"en un recuerdo inolvidable. Aprovecha este producto estrella que se ha convertido en el favorito de "
                f"los organizadores de eventos más exigentes.")
    else:
        return (f"Contrata profesionalismo absoluto con nuestro {titulo}. Entendemos que tu evento es irrepetible, "
                f"por eso ofrecemos una ejecución impecable desde el primer minuto. Nuestro personal cuenta con años "
                f"de experiencia en la industria y se presenta debidamente uniformado, capacitado y con excelente actitud "
                f"de servicio. Este paquete incluye toda la logística previa, montaje, operación durante las horas "
                f"contratadas y desmontaje rápido y limpio. Trabajamos exclusivamente con equipos y materiales de vanguardia "
                f"para evitar cualquier falla técnica. Nos adaptamos a los tiempos del protocolo de tu fiesta para asegurar "
                f"que fluya con naturalidad. Déjalo en manos de expertos y dedícate únicamente a disfrutar tu gran día.")

def escape_sql(text):
    if not isinstance(text, str): return str(text)
    return text.replace("'", "\\'")

# ==========================================
# 4. SCRIPT PRINCIPAL SQL
# ==========================================
def main():
    OUTPUT_FILE = "monkey_market_seed_100_items.sql"
    total_registros = 0
    
    print("🚀 Generando Base de Datos con 100 Artículos...")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("SET FOREIGN_KEY_CHECKS = 0;\nSET autocommit = 0;\n\n")
        f.write("INSERT INTO configuracion_global (id, porcentaje_comision) VALUES (1, 10.00);\n")
        
        # Categorías
        cats = [
            "Audio e Iluminación", "Mobiliario", "Alimentos y Bebidas", "Fotografía y Video",
            "Decoración", "Entretenimiento", "Recintos y Salones", "Personal y Staff",
            "Repostería y Dulces", "Recuerdos y Souvenirs", "Transporte y Logística"
        ]
        for i, c in enumerate(cats, 1):
            f.write(f"INSERT INTO categorias (id, nombre, descripcion, activa) VALUES ({i}, '{c}', 'Categoría del sistema', 1);\n")
            
        # Usuarios (1 Admin, 5 Provs, 10 Clientes)
        f.write("INSERT INTO usuarios (id, rol, nombre, correo, telefono, contrasena_hash) VALUES (1, 'admin', 'Admin Monkey', 'admin@monkey.com', '5550000001', '$2b$10$Ew7PRDD6EJ1gCFL6NuEZo.pHGElcw4VLr7hv87syw1QVTw4KyYpwm');\n")
        
        for prov_id in range(2, 7):
            f.write(f"INSERT INTO usuarios (id, rol, nombre, correo, telefono, contrasena_hash) VALUES ({prov_id}, 'proveedor', 'Proveedor {prov_id}', 'prov{prov_id}@monkey.com', '555111000{prov_id}', '$2b$10$Ew7PRDD6EJ1gCFL6NuEZo.pHGElcw4VLr7hv87syw1QVTw4KyYpwm');\n")
            f.write(f"INSERT INTO billeteras (proveedor_id, saldo_actual, total_ganado) VALUES ({prov_id}, 0.00, 0.00);\n")
        
        for cli_id in range(7, 17):
            nombre = NOMBRES_CLIENTES[cli_id - 7]
            f.write(f"INSERT INTO usuarios (id, rol, nombre, correo, telefono, contrasena_hash) VALUES ({cli_id}, 'cliente', '{escape_sql(nombre)}', 'cliente{cli_id}@monkey.com', '55522200{cli_id:02d}', '$2b$10$Ew7PRDD6EJ1gCFL6NuEZo.pHGElcw4VLr7hv87syw1QVTw4KyYpwm');\n")
            f.write(f"INSERT INTO direcciones (usuario_id, calle_y_numero, colonia, ciudad, codigo_postal) VALUES ({cli_id}, 'Av. Principal {cli_id}', 'Centro', 'CDMX', '01000');\n")
            
        f.write("COMMIT;\n\n")

        items_db = []
        
        # Insertar 50 Productos
        for i, item in enumerate(PRODUCTOS_DATA, 1):
            prov_asignado = random.randint(2, 6)
            titulo, cat, precio, keys = item
            desc = generar_descripcion_detallada(titulo, "producto")
            imgs = json.dumps(gen_img(keys)).replace(chr(39), chr(92)+chr(39))
            stock = random.randint(10, 100)
            
            f.write(f"INSERT INTO productos (id, proveedor_id, titulo, descripcion, precio, stock, imagenes, categoria) VALUES "
                    f"({i}, {prov_asignado}, '{escape_sql(titulo)}', '{escape_sql(desc)}', {precio}, {stock}, '{imgs}', '{cat}');\n")
            items_db.append({"id": i, "tipo": "producto", "precio": precio, "prov_id": prov_asignado})
            
        # Insertar 50 Servicios
        for i, item in enumerate(SERVICIOS_DATA, 1):
            prov_asignado = random.randint(2, 6)
            titulo, cat, precio, keys = item
            desc = generar_descripcion_detallada(titulo, "servicio")
            imgs = json.dumps(gen_img(keys)).replace(chr(39), chr(92)+chr(39))
            agenda = json.dumps({"duracion_horas": random.choice([2, 5, 8]), "anticipo_porcentaje": 50}).replace(chr(39), chr(92)+chr(39))
            
            f.write(f"INSERT INTO servicios (id, proveedor_id, titulo, descripcion, precio, datos_agenda, imagenes, categoria) VALUES "
                    f"({i}, {prov_asignado}, '{escape_sql(titulo)}', '{escape_sql(desc)}', {precio}, '{agenda}', '{imgs}', '{cat}');\n")
            items_db.append({"id": i, "tipo": "servicio", "precio": precio, "prov_id": prov_asignado})
                
        f.write("COMMIT;\n\n")
        
        # Simular Ventas (Cada uno de los 100 items tendrá entre 1 y 3 ventas garantizadas)
        f.write("-- GENERACIÓN DE VENTAS Y RESEÑAS --\n")
        pedido_id, detalle_id = 1, 1
        billeteras = {2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
        
        for item in items_db:
            compradores = random.sample(range(7, 17), random.randint(1, 3))
            for cli_id in compradores:
                f.write(f"INSERT INTO pedidos (id, cliente_id, monto_total, direccion_envio, estado, fecha_creacion) VALUES "
                        f"({pedido_id}, {cli_id}, {item['precio']}, 'Domicilio Conocido', 'completado', '{datetime.now() - timedelta(days=random.randint(1, 30))}');\n")
                
                col = "producto_id" if item["tipo"] == "producto" else "servicio_id"
                comision = round(item['precio'] * 0.10, 2)
                f.write(f"INSERT INTO detalles_pedido (id, pedido_id, {col}, cantidad, precio_unitario_historico, comision_historica, estado_operativo) VALUES "
                        f"({detalle_id}, {pedido_id}, {item['id']}, 1, {item['precio']}, {comision}, 'entregado');\n")
                
                billeteras[item["prov_id"]] += (item['precio'] - comision)
                calificacion = random.choice([4, 5])
                f.write(f"INSERT INTO valoraciones (detalle_pedido_id, cliente_id, calificacion, comentario) VALUES "
                        f"({detalle_id}, {cli_id}, {calificacion}, '{random.choice(RESEÑAS_POSITIVAS)}');\n")
                
                pedido_id += 1
                detalle_id += 1
                total_registros += 4
                
        f.write("COMMIT;\n\n")
        
        # Actualizar Billeteras
        for prov_id, monto in billeteras.items():
            f.write(f"UPDATE billeteras SET saldo_actual = {monto}, total_ganado = {monto} WHERE proveedor_id = {prov_id};\n")

        f.write("COMMIT;\nSET FOREIGN_KEY_CHECKS = 1;\nSET autocommit = 1;\n")
        
    print(f"✅ ¡Éxito! Base de datos de 100 Artículos generada correctamente.")

if __name__ == "__main__":
    main()