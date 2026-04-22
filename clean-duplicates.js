const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Configuración de limpieza
 */
const BASE_DIR = '/home/luisgrasso/Documentos/pop-negro/taxiapp';
const IGNORE_DIRS = ['.git', 'node_modules', '.vercel', '_site'];

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
        if (fs.statSync(fullPath).isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            const stats = fs.statSync(fullPath);
            arrayOfFiles.push({
                path: fullPath,
                mtime: stats.mtime,
                hash: getFileHash(fullPath)
            });
        }
    });

    return arrayOfFiles;
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

    Object.keys(hashMap).forEach(hash => {
        const duplicates = hashMap[hash];
        
        if (duplicates.length > 1) {
            // Ordenar por fecha de modificación (el más nuevo primero)
            duplicates.sort((a, b) => b.mtime - a.mtime);
            
            const [keep, ...toDelete] = duplicates;
            
            console.log(`[KEEP] ${keep.path} (Actualizado: ${keep.mtime})`);
            
            toDelete.forEach(file => {
                console.log(`[DELETE] ${file.path}`);
                fs.unlinkSync(file.path);
                deletedCount++;
            });
        }
    });

    console.log(`\n[FINISH] Limpieza completada. Se eliminaron ${deletedCount} archivos duplicados.`);
}

clean();