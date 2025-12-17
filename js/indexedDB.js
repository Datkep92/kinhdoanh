// IndexedDB Configuration
const DB_NAME = 'BanHangDB';
const DB_VERSION = 8    ; // Tăng lên 4 để cập nhật Schema
// Store names
const STORES = {
    HKDS: 'hkds',
    PRODUCTS: 'products',
    INVOICES: 'invoices',
    CATEGORIES: 'categories',
    SYNC_QUEUE: 'syncQueue',
    LAST_SYNC: 'lastSync',
    PRODUCT_IMAGES: 'productImages' // Thêm store mới
};

// Khởi tạo IndexedDB
function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            reject(new Error('Không thể mở IndexedDB'));
        };
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const transaction = event.currentTarget.transaction;
            
            // 1. HKDS (giữ nguyên)
            if (!db.objectStoreNames.contains(STORES.HKDS)) {
                const hkdStore = db.createObjectStore(STORES.HKDS, { keyPath: 'id' });
                hkdStore.createIndex('phone', 'phone', { unique: true });
                hkdStore.createIndex('name', 'name', { unique: false });
            }
            
            // 2. PRODUCTS (giữ nguyên)
            let productStore;
            if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
                productStore = db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
            } else {
                productStore = transaction.objectStore(STORES.PRODUCTS);
                if (productStore.indexNames.contains('msp_hkd')) {
                    productStore.deleteIndex('msp_hkd');
                }
            }
            
            // Tạo lại index cho product (giữ nguyên)
            if (!productStore.indexNames.contains('hkdId')) productStore.createIndex('hkdId', 'hkdId', { unique: false });
            if (!productStore.indexNames.contains('categoryId')) productStore.createIndex('categoryId', 'categoryId', { unique: false });
            if (!productStore.indexNames.contains('msp')) productStore.createIndex('msp', 'msp', { unique: false });
            if (!productStore.indexNames.contains('hkd_msp')) {
                productStore.createIndex('hkd_msp', ['hkdId', 'msp'], { unique: false });
            }

            // 3. INVOICES (giữ nguyên)
            if (!db.objectStoreNames.contains(STORES.INVOICES)) {
                const invoiceStore = db.createObjectStore(STORES.INVOICES, { keyPath: 'id' });
                invoiceStore.createIndex('hkdId', 'hkdId', { unique: false });
                invoiceStore.createIndex('date', 'date', { unique: false });
                invoiceStore.createIndex('status', 'status', { unique: false });
            }
            
            // 4. CATEGORIES (giữ nguyên)
            if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
                const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
                categoryStore.createIndex('hkdId', 'hkdId', { unique: false });
                categoryStore.createIndex('name', 'name', { unique: false });
            }
            
            // 5. SYNC QUEUE (giữ nguyên)
            if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
                const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
                syncStore.createIndex('type', 'type', { unique: false });
                syncStore.createIndex('status', 'status', { unique: false });
            }
            
            // 6. LAST SYNC (giữ nguyên)
            if (!db.objectStoreNames.contains(STORES.LAST_SYNC)) {
                db.createObjectStore(STORES.LAST_SYNC, { keyPath: 'storeName' });
            }
            
            // 7. PRODUCT IMAGES (THÊM MỚI) - QUAN TRỌNG
            if (!db.objectStoreNames.contains(STORES.PRODUCT_IMAGES)) {
                const imageStore = db.createObjectStore(STORES.PRODUCT_IMAGES, { keyPath: 'productId' }); // productId làm key
                imageStore.createIndex('hkdId', 'hkdId', { unique: false });
                imageStore.createIndex('productId', 'productId', { unique: true }); // Mỗi sản phẩm chỉ có 1 ảnh
                imageStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
        };
    });
}
// Lấy database instance
async function getDB() {
    return await initIndexedDB();
}

// Generic CRUD operations
async function addToStore(storeName, data) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateInStore(storeName, data) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        // Sử dụng .put() để tự động ghi đè nếu trùng ID (KeyPath)
        const request = store.put(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => {
            console.error(`❌ Lỗi IndexedDB tại store [${storeName}]:`, e.target.error);
            reject(e.target.error);
        };
    });
}

async function getFromStore(storeName, key) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllFromStore(storeName, indexName, key) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        let request;
        
        if (indexName && key) {
            const index = store.index(indexName);
            request = index.getAll(key);
        } else {
            request = store.getAll();
        }
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function deleteFromStore(storeName, key) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

// HKD specific operations
async function saveHKD(hkd) {
    return await updateInStore(STORES.HKDS, hkd);
}

async function getHKD(id) {
    return await getFromStore(STORES.HKDS, id);
}

async function getHKDByPhone(phone) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.HKDS], 'readonly');
        const store = transaction.objectStore(STORES.HKDS);
        const index = store.index('phone');
        const request = index.get(phone);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllHKDs() {
    return await getAllFromStore(STORES.HKDS);
}

// Product specific operations
async function saveProduct(product) {
    return await updateInStore(STORES.PRODUCTS, product);
}

async function getProductsByHKD(hkdId) {
    return await getAllFromStore(STORES.PRODUCTS, 'hkdId', hkdId);
}

// 1. Sửa hàm hiện tại để dùng categoryId
async function getProductsByCategory(hkdId, categoryId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.PRODUCTS], 'readonly');
        const store = transaction.objectStore(STORES.PRODUCTS);
        
        // Nếu categoryId là string (tên danh mục) - giữ tương thích
        if (typeof categoryId === 'string' && !categoryId.includes('-')) {
            // Giả sử đây là tên danh mục, dùng index cũ
            const index = store.index('category');
            const request = index.getAll([hkdId, categoryId]);
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        } else {
            // Nếu là ID, filter theo categoryId
            const index = store.index('hkdId');
            const request = index.getAll(hkdId);
            
            request.onsuccess = () => {
                const allProducts = request.result || [];
                const filteredProducts = allProducts.filter(product => 
                    product.categoryId === categoryId
                );
                resolve(filteredProducts);
            };
            request.onerror = () => reject(request.error);
        }
    });
}

// 2. Thêm hàm mới rõ ràng hơn
async function getProductsByCategoryId(hkdId, categoryId) {
    return getProductsByCategory(hkdId, categoryId);
}

// 3. Hàm lấy tất cả sản phẩm của HKD
async function getProductsByHKD(hkdId) {
    return getAllFromStore(STORES.PRODUCTS, 'hkdId', hkdId);
}

// Invoice specific operations
async function saveInvoice(invoice) {
    return await updateInStore(STORES.INVOICES, invoice);
}

async function getInvoicesByHKD(hkdId, limit = null) {
    const invoices = await getAllFromStore(STORES.INVOICES, 'hkdId', hkdId);
    
    // Sắp xếp theo thời gian giảm dần
    invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Giới hạn số lượng nếu có
    if (limit) {
        return invoices.slice(0, limit);
    }
    
    return invoices;
}

// Category specific operations
async function saveCategory(category) {
    return await updateInStore(STORES.CATEGORIES, category);
}

async function getCategoriesByHKD(hkdId) {
    return await getAllFromStore(STORES.CATEGORIES, 'hkdId', hkdId);
}

// Sync operations
async function addToSyncQueue(data) {
    const syncItem = {
        ...data,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    return await addToStore(STORES.SYNC_QUEUE, syncItem);
}

async function getPendingSyncItems(type = null) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
        const store = transaction.objectStore(STORES.SYNC_QUEUE);
        const index = store.index('status');
        
        let request;
        if (type) {
            request = index.getAll(['pending', type]);
        } else {
            request = index.getAll('pending');
        }
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

async function updateSyncItemStatus(id, status) {
    const item = await getFromStore(STORES.SYNC_QUEUE, id);
    if (item) {
        item.status = status;
        await updateInStore(STORES.SYNC_QUEUE, item);
    }
}

// Last sync time
async function getLastSyncTime(storeName) {
    const result = await getFromStore(STORES.LAST_SYNC, storeName);
    return result ? result.timestamp : null;
}

async function updateLastSyncTime(storeName) {
    await updateInStore(STORES.LAST_SYNC, {
        storeName: storeName,
        timestamp: new Date().toISOString()
    });
}

// Clear data for HKD (for testing)
async function clearHKDData(hkdId) {
    // Xóa products
    const products = await getProductsByHKD(hkdId);
    for (const product of products) {
        await deleteFromStore(STORES.PRODUCTS, product.id);
    }
    
    // Xóa categories
    const categories = await getCategoriesByHKD(hkdId);
    for (const category of categories) {
        await deleteFromStore(STORES.CATEGORIES, category.id);
    }
    
    // Xóa invoices
    const invoices = await getInvoicesByHKD(hkdId);
    for (const invoice of invoices) {
        await deleteFromStore(STORES.INVOICES, invoice.id);
    }
}

// Kiểm tra nếu IndexedDB được hỗ trợ
function isIndexedDBSupported() {
    return 'indexedDB' in window;
}
// ========== PRODUCT IMAGES OPERATIONS ==========

/**
 * Lưu/update ảnh sản phẩm
 * @param {Object} imageData - Dữ liệu ảnh
 * @returns {Promise<string>} productId
 */
async function saveProductImage(imageData) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.PRODUCT_IMAGES], 'readwrite');
        const store = transaction.objectStore(STORES.PRODUCT_IMAGES);
        
        // Luôn dùng put để ghi đè nếu đã tồn tại
        const request = store.put(imageData);
        
        request.onsuccess = () => {
            console.log(`✅ Đã lưu ảnh cho sản phẩm ${imageData.productId}`);
            resolve(imageData.productId);
        };
        
        request.onerror = (e) => {
            console.error(`❌ Lỗi lưu ảnh sản phẩm ${imageData.productId}:`, e.target.error);
            reject(e.target.error);
        };
    });
}

/**
 * Lấy ảnh của sản phẩm
 * @param {string} productId - ID sản phẩm
 * @returns {Promise<Object|null>} Dữ liệu ảnh
 */
async function getProductImage(productId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.PRODUCT_IMAGES], 'readonly');
        const store = transaction.objectStore(STORES.PRODUCT_IMAGES);
        const request = store.get(productId);
        
        request.onsuccess = () => {
            resolve(request.result || null);
        };
        
        request.onerror = () => {
            console.error(`❌ Lỗi lấy ảnh sản phẩm ${productId}:`, request.error);
            reject(request.error);
        };
    });
}

/**
 * Lấy tất cả ảnh của HKD
 * @param {string} hkdId - ID HKD
 * @returns {Promise<Array>} Danh sách ảnh
 */
async function getProductImagesByHKD(hkdId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.PRODUCT_IMAGES], 'readonly');
        const store = transaction.objectStore(STORES.PRODUCT_IMAGES);
        const index = store.index('hkdId');
        const request = index.getAll(hkdId);
        
        request.onsuccess = () => {
            resolve(request.result || []);
        };
        
        request.onerror = () => {
            console.error(`❌ Lỗi lấy ảnh theo HKD ${hkdId}:`, request.error);
            reject(request.error);
        };
    });
}

/**
 * Xóa ảnh sản phẩm
 * @param {string} productId - ID sản phẩm
 * @returns {Promise<boolean>}
 */
async function deleteProductImage(productId) {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORES.PRODUCT_IMAGES], 'readwrite');
        const store = transaction.objectStore(STORES.PRODUCT_IMAGES);
        const request = store.delete(productId);
        
        request.onsuccess = () => {
            console.log(`✅ Đã xóa ảnh sản phẩm ${productId}`);
            resolve(true);
        };
        
        request.onerror = () => {
            console.error(`❌ Lỗi xóa ảnh sản phẩm ${productId}:`, request.error);
            reject(request.error);
        };
    });
}

/**
 * Lấy số lượng ảnh theo HKD
 * @param {string} hkdId - ID HKD
 * @returns {Promise<number>} Số lượng ảnh
 */
async function getProductImageCount(hkdId) {
    const images = await getProductImagesByHKD(hkdId);
    return images.length;
}

/**
 * Kiểm tra sản phẩm có ảnh hay không
 * @param {string} productId - ID sản phẩm
 * @returns {Promise<boolean>}
 */
async function hasProductImage(productId) {
    const image = await getProductImage(productId);
    return !!image;
}

// Product Image Schema
const PRODUCT_IMAGE_SCHEMA = {
    productId: '',        // ID sản phẩm (key) - REQUIRED
    hkdId: '',            // ID HKD - REQUIRED
    imageData: '',        // Base64 ảnh đã nén (120x120) - REQUIRED
    thumbnail: '',        // Base64 thumbnail nhỏ hơn (60x60) - OPTIONAL
    originalData: '',     // Base64 ảnh gốc (đã crop nhưng chưa nén) - OPTIONAL
    type: 'upload',       // 'upload' | 'camera' | 'url'
    source: '',           // Tên file hoặc URL gốc
    format: 'webp',       // 'webp' | 'jpeg' | 'png'
    size: 0,              // Kích thước ảnh gốc (bytes)
    compressedSize: 0,    // Kích thước sau nén (bytes)
    width: 120,           // Chiều rộng
    height: 120,          // Chiều cao
    createdAt: '',        // ISO string
    updatedAt: '',        // ISO string
    version: 1            // Version schema
};

// Helper để tạo object ảnh chuẩn
function createProductImageObject(productId, hkdId, imageData, options = {}) {
    const timestamp = new Date().toISOString();
    
    return {
        productId: productId,
        hkdId: hkdId,
        imageData: imageData,
        thumbnail: options.thumbnail || '',
        originalData: options.originalData || '',
        type: options.type || 'upload',
        source: options.source || '',
        format: options.format || 'webp',
        size: options.size || 0,
        compressedSize: options.compressedSize || 0,
        width: options.width || 120,
        height: options.height || 120,
        createdAt: timestamp,
        updatedAt: timestamp,
        version: 1
    };
}
// Xuất các hàm
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STORES,
        PRODUCT_IMAGE_SCHEMA,
        createProductImageObject,
        initIndexedDB,
        getDB,
        
        // CRUD chung
        addToStore,
        updateInStore,
        getFromStore,
        getAllFromStore,
        deleteFromStore,
        
        // HKD
        saveHKD,
        getHKD,
        getHKDByPhone,
        getAllHKDs,
        
        // Product
        saveProduct,
        getProductsByHKD,
        getProductsByCategory,
        
        // Invoice
        saveInvoice,
        getInvoicesByHKD,
        
        // Category
        saveCategory,
        getCategoriesByHKD,
        
        // Sync
        addToSyncQueue,
        getPendingSyncItems,
        updateSyncItemStatus,
        getLastSyncTime,
        updateLastSyncTime,
        
        // Product Images (NEW)
        saveProductImage,
        getProductImage,
        getProductImagesByHKD,
        deleteProductImage,
        getProductImageCount,
        hasProductImage,
        
        // Utility
        clearHKDData,
        isIndexedDBSupported
    };
}