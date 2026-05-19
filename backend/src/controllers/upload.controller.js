const cloudinary = require('../config/cloudinary');

const uploadImage = async (req, res) => {
    try {
        // Multer dejará el archivo en req.file
        if (!req.file) {
            return res.status(400).json({ message: "No se proporcionó ninguna imagen" });
        }

        // Creamos un "tubo" (stream) hacia Cloudinary
        const uploadStream = cloudinary.uploader.upload_stream(
            { 
                folder: 'monkeymarket_productos', // Carpeta que se creará en tu Cloudinary
                format: 'webp', // Opcional: convierte la imagen a webp para que cargue ultra rápido
            },
            (error, result) => {
                if (error) {
                    console.error("Error en Cloudinary:", error);
                    return res.status(500).json({ message: "Error al subir la imagen a la nube" });
                }
                
                // Si todo sale bien, devolvemos la URL segura
                res.status(200).json({ 
                    message: "Imagen subida con éxito",
                    url: result.secure_url 
                });
            }
        );

        // Vertemos el archivo desde la memoria RAM hacia el tubo de Cloudinary
        uploadStream.end(req.file.buffer);

    } catch (error) {
        console.error("Error en el controlador de subida:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

module.exports = {
    uploadImage
};