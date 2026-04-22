const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Configuración de limpieza
 */
const BASE_DIR = path.resolve(__dirname, '..'); // Resuelve a la raíz del proyecto
const IGNORE_DIRS = ['.git', 'node_modules', '.vercel', '_site', 'scripts', 'api', 'assets']; // Ignorar también la carpeta de scripts y otras importantes

/**
 * Calcula el hash MD5 de un archivo para comparar contenido real
 */
function getFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Escaneo recursivo de archivos
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        const relativePath = path.relative(BASE_DIR, fullPath);
        
        // Ignorar directorios si están en la lista IGNORE_DIRS
        if (IGNORE_DIRS.some(ignoredDir => relativePath.startsWith(ignoredDir) || relativePath === ignoredDir)) {
            return;
        }

        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles.push({
                path: fullPath,
                mtime: stats.mtime,
                hash: getFileHash(fullPath)
            });
        }
    });

    return arrayOfFiles;
}

/**
 * Elimina directorios vacíos de forma recursiva.
 * Retorna true si el directorio fue eliminado, false en caso contrario.
 */
function removeEmptyDirs(dir) {
    // Ignorar directorios específicos
    const relativePath = path.relative(BASE_DIR, dir);
    if (IGNORE_DIRS.some(ignoredDir => relativePath.startsWith(ignoredDir) || relativePath === ignoredDir)) {
        return false;
    }

    let files = fs.readdirSync(dir);

    // Procesar subdirectorios primero
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            removeEmptyDirs(fullPath); // Llamada recursiva
        }
    });

    // Después de procesar subdirectorios, verificar si el directorio actual está vacío
    files = fs.readdirSync(dir); // Volver a leer el contenido después de posibles eliminaciones
    if (files.length === 0) {
        fs.rmdirSync(dir);
        console.log(`[DELETE DIR] ${dir}`);
        return true;
    }
    return false;
}

function clean() {
    console.log(`[START] Escaneando duplicados en: ${BASE_DIR}\n`);
    
    const allFiles = getAllFiles(BASE_DIR);
    const hashMap = {};

    // Agrupar archivos por su contenido (hash)
    allFiles.forEach(file => {
        if (!hashMap[file.hash]) hashMap[file.hash] = [];
        hashMap[file.hash].push(file);
    });

    let deletedCount = 0;
    let deletedFilesCount = 0;

        const duplicates = hashMap[hash];
        
        if (duplicates.length > 1) {
            // Ordenar por fecha de modificación (el más nuevo primero)
            duplicates.sort((a, b) => b.mtime - a.mtime);
            
            const [keep, ...toDelete] = duplicates;
            
            console.log(`[KEEP] ${keep.path} (Actualizado: ${keep.mtime})`);
            console.log(`[KEEP FILE] ${keep.path} (Actualizado: ${keep.mtime})`);
            
                console.log(`[DELETE] ${file.path}`);
                console.log(`[DELETE FILE] ${file.path}`);
                fs.unlinkSync(file.path);
            });
        }
    console.log(`\n[FINISH] Limpieza completada. Se eliminaron ${deletedCount} archivos duplicados.`);
    console.log(`\n[INFO] Eliminación de archivos duplicados completada. Se eliminaron ${deletedFilesCount} archivos.`);

    console.log(`\n[START] Escaneando y eliminando directorios vacíos en: ${BASE_DIR}`);
    // Iterar sobre los directorios de primer nivel para evitar eliminar BASE_DIR
        const fullPath = path.join(BASE_DIR, entry);
        if (fs.statSync(fullPath).isDirectory() && !IGNORE_DIRS.includes(entry)) {
            removeEmptyDirs(fullPath);
        }
    });
    console.log(`[FINISH] Limpieza de directorios vacíos completada.`);

    console.log(`\n[FINISH] Limpieza general completada.`);
}

clean();